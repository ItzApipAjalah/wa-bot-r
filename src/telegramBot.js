const config = require('./config.js');

const channelState = {
    formState: {
        currentLink: null,
    },
    targetNumber: config.telegramTarget
};

async function loginToTelegram(browser) {
    try {
        const page = await browser.newPage();
        await page.goto('https://web.telegram.org/k/', {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        // Wait for user to login manually
        await page.waitForSelector('.chatlist', { timeout: 300000 }); // 5 minutes timeout for login
        console.log('Successfully logged into Telegram Web');
        return page;
    } catch (error) {
        console.error('Error logging into Telegram:', error);
        throw error;
    }
}

async function handleGoogleForm(link, telegramPage) {
    try {
        const browser = await telegramPage.browser();
        const page = await browser.newPage();

        console.log('Opening Google Form...');
        await page.goto(link, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        await page.waitForSelector('form', { timeout: 60000 });
        
        const formattedId = await page.evaluate((idConfig) => {
            function findIdInputAndDescription() {
                const inputs = Array.from(document.querySelectorAll('input[type="text"], [role="textbox"]'));
                for (const input of inputs) {
                    const container = input.closest('div[role="listitem"]');
                    if (container && container.textContent.toLowerCase().includes('id ml server')) {
                        const description = container.textContent;
                        return { input, description };
                    }
                }
                return null;
            }

            const result = findIdInputAndDescription();
            if (result) {
                const { input, description } = result;
                
                const exampleMatch = description.match(/(?:format|contoh|example)?\s*:?\s*(\d+)([\D]+)(\d+)/i);
                
                if (exampleMatch) {
                    const delimiter = exampleMatch[2];
                    console.log('Detected delimiter:', delimiter);
                    
                    const formattedId = `${idConfig.serverId}${delimiter}${idConfig.zoneId}`;
                    
                    input.value = formattedId;
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    return { success: true, formattedId, delimiter };
                }
            }
            return { success: false };
        }, config.formId);

        console.log('Form ID formatting result:', formattedId);

        // Handle email checkbox and submit as before
        // ... (rest of the form handling code)

        return true;
    } catch (error) {
        console.error('Error processing Google Form:', error);
        return false;
    }
}

async function sendTelegramMessage(page, chatId, message) {
    try {
        // Navigate to specific chat
        await page.goto(`https://web.telegram.org/k/#${chatId}`, {
            waitUntil: 'networkidle0'
        });

        // Wait for message input and send message
        await page.waitForSelector('.input-message-input');
        await page.type('.input-message-input', message);
        await page.keyboard.press('Enter');
    } catch (error) {
        console.error('Error sending Telegram message:', error);
    }
}

async function monitorTelegramChannel(page) {
    try {
        console.log('Starting Telegram message monitor...');
        
        // Wait for messages container to be ready
        await page.waitForSelector('.chats-container ', { timeout: 30000 });
        console.log('Messages container found');

        // Set up mutation observer to detect new messages
        await page.evaluate(() => {
            const messagesContainer = document.querySelector('.chats-container ');
            if (!messagesContainer) return;

            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.addedNodes.length > 0) {
                        window.hasNewMessages = true;
                    }
                });
            });

            observer.observe(messagesContainer, {
                childList: true,
                subtree: true
            });

            window.hasNewMessages = false;
        });

        // Check for new messages periodically
        setInterval(async () => {
            try {
                const hasNew = await page.evaluate(() => {
                    const hasNew = window.hasNewMessages;
                    window.hasNewMessages = false;
                    return hasNew;
                });

                if (hasNew) {
                    console.log('New messages detected, checking content...');
                    await checkForNewMessages(page);
                }
            } catch (error) {
                console.error('Error in message check interval:', error);
            }
        }, config.telegramCheckInterval);
        
    } catch (error) {
        console.error('Error monitoring Telegram messages:', error);
    }
}

async function checkForNewMessages(page) {
    try {
        const messages = await page.evaluate(() => {
            const messages = [];
            
            // Updated selectors for Telegram Web K version
            const messageElements = Array.from(document.querySelectorAll('.message'));
            console.log(`Found ${messageElements.length} messages`);
            
            // Reverse the array to get newest messages first
            messageElements.reverse();
            
            // Only look at the first message that contains a form link
            for (const msg of messageElements) {
                try {
                    // Get link elements directly
                    const links = Array.from(msg.querySelectorAll('a[href*="docs.google.com/forms"], a[href*="forms.gle"]'))
                        .map(a => a.href);
                    
                    if (links.length > 0) {
                        const textElement = msg.querySelector('.text-content');
                        const messageText = textElement ? textElement.textContent : '';
                        console.log(`Found message with form link:`, links);
                        
                        messages.push({
                            text: messageText,
                            links: [links[links.length - 1]] // Only take the last link from the message
                        });
                        break; // Exit after finding the first message with form link
                    }
                } catch (e) {
                    console.error('Error processing message:', e);
                }
            }
            
            return messages;
        });

        // Process only the newest message found
        if (messages.length > 0) {
            const message = messages[0];
            const url = message.links[0];
            console.log('Latest form URL found:', url);
            
            if (!processedUrls.has(url)) {
                console.log('Processing new form URL:', url);
                channelState.formState.currentLink = url;
                const success = await handleGoogleForm(url, page);
                console.log(`Form processing ${success ? 'succeeded' : 'failed'} for URL: ${url}`);
                processedUrls.add(url);
            } else {
                console.log('URL already processed:', url);
            }
        }
    } catch (error) {
        console.error('Error checking for new messages:', error);
    }
}

// Add debug function
async function debugTelegramElements(page) {
    try {
        const debug = await page.evaluate(() => {
            const container = document.querySelector('.chats-container');
            const messages = document.querySelectorAll('.message');
            const links = document.querySelectorAll('a[href*="docs.google.com/forms"], a[href*="forms.gle"]');
            
            return {
                hasContainer: !!container,
                messageCount: messages.length,
                linkCount: links.length,
                containerHTML: container ? container.innerHTML.substring(0, 200) : null,
                firstMessageHTML: messages[0] ? messages[0].innerHTML : null
            };
        });
        
        console.log('Debug Telegram Elements:', debug);
    } catch (error) {
        console.error('Error in debug:', error);
    }
}

// Add a Set to track processed URLs
const processedUrls = new Set();

async function startTelegramBot(browser) {
    try {
        const telegramPage = await loginToTelegram(browser);
        console.log('Logged into Telegram Web');
        
        // Add debug call
        await debugTelegramElements(telegramPage);
        
        await monitorTelegramChannel(telegramPage);
        console.log('Started monitoring Telegram messages');
        
        // Set up periodic debug
        setInterval(() => debugTelegramElements(telegramPage), 10000);
        
        return telegramPage;
    } catch (error) {
        console.error('Error in Telegram bot:', error);
    }
}

module.exports = {
    startTelegramBot
}; 
