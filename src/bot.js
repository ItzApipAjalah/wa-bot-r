const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const config = require('./config.js');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: false,
        executablePath: config.chromePath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=IsolateOrigins',
            '--allow-running-insecure-content',
            '--disable-blink-features=AutomationControlled',
            '--ignore-certificate-errors',
            '--ignore-certificate-errors-spki-list',
            '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            '--window-size=1920,1080',
            '--start-maximized',
            '--disable-notifications',
            '--disable-infobars',
            '--disable-features=ChromeWhatsNewUI',
            '--enable-automation=false',
            '--disable-blink-features',
            '--disable-extensions'
        ],
        defaultViewport: null,
        ignoreHTTPSErrors: true
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code generated. Scan it with WhatsApp!');
});

client.on('ready', async () => {
    console.log('WhatsApp Client is ready!');
});

const channelState = {
    formState: {
        currentLink: null,
    },
    targetNumber: config.targetNumber
};

async function handleGoogleForm(link) {
    try {
        const browser = await client.pupPage.browser();
        const page = await browser.newPage();

        console.log('Opening Google Form...');
        await page.goto(link, {
            waitUntil: 'networkidle0',
            timeout: 60000
        });

        await page.waitForSelector('form', { timeout: 60000 });
        
        console.log(`Form loaded. Processing with ID: ${config.formId}`);

        await page.waitForTimeout(2000);

        await page.evaluate(() => {
            function findEmailCheckbox() {
                const checkboxes = Array.from(document.querySelectorAll('div[role="checkbox"]'));
                for (const checkbox of checkboxes) {
                    const label = checkbox.getAttribute('aria-label');
                    if (label && label.toLowerCase().includes('email')) {
                        return checkbox;
                    }
                }

                const divs = Array.from(document.querySelectorAll('div'));
                for (const div of divs) {
                    if (div.textContent.toLowerCase().includes('email')) {
                        const checkbox = div.querySelector('div[role="checkbox"]');
                        if (checkbox) return checkbox;
                    }
                }

                return null;
            }

            const emailCheckbox = findEmailCheckbox();
            if (emailCheckbox && emailCheckbox.getAttribute('aria-checked') !== 'true') {
                emailCheckbox.click();
            }
        });

        await page.evaluate((predefinedId) => {
            function findIdInput() {
                const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
                for (const input of inputs) {
                    const container = input.closest('div[role="listitem"]');
                    if (container && container.textContent.toLowerCase().includes('id ml server')) {
                        return input;
                    }
                }

                const textboxes = Array.from(document.querySelectorAll('[role="textbox"]'));
                for (const textbox of textboxes) {
                    const container = textbox.closest('div[role="listitem"]');
                    if (container && container.textContent.toLowerCase().includes('id ml server')) {
                        return textbox;
                    }
                }

                return null;
            }

            const idInput = findIdInput();
            if (idInput) {
                idInput.value = predefinedId;
                idInput.dispatchEvent(new Event('input', { bubbles: true }));
                idInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }, config.formId);

        await page.waitForTimeout(1000);

        await page.evaluate(() => {
            function findSubmitButton() {
                const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
                for (const button of buttons) {
                    if (button.textContent.toLowerCase().includes('submit') || 
                        button.textContent.toLowerCase().includes('kirim') ||
                        button.textContent.toLowerCase().includes('send')) {
                        return button;
                    }
                }

                const submitButton = document.querySelector('.freebirdFormviewerViewNavigationSubmitButton');
                if (submitButton) return submitButton;

                return null;
            }

            const submitButton = findSubmitButton();
            if (submitButton) {
                submitButton.click();
                return true;
            }
            return false;
        });

        await page.waitForTimeout(3000);

        const success = await page.evaluate(() => {
            const successText = document.body.innerText.toLowerCase();
            return successText.includes('response has been recorded') || 
                   successText.includes('tanggapan anda telah direkam') ||
                   successText.includes('terima kasih');
        });

        if (success) {
            console.log('Form submitted successfully');
            return true;
        } else {
            console.log('Form may not have been submitted successfully');
            return false;
        }

    } catch (error) {
        console.error('Error processing Google Form:', error);
        return false;
    }
}

client.on('message', async (message) => {
    try {
        const chat = await message.getChat();
        
        console.log('Message received:', {
            from: message.from,
            body: message.body,
            isChannel: chat.isChannel,
            chatName: chat.name,
            chatId: chat.id._serialized
        });

        const isChannel = message.from.includes('@newsletter');

        if (message.body === '!ping') {
            await message.reply('pong');
        }
        
        if (message.body.startsWith('!echo ')) {
            const text = message.body.slice(6);
            await message.reply(text);
        }
        
        if (message.body === '!info') {
            await message.reply(`
                Chat Info:
                Name: ${chat.name}
                Is Channel: ${isChannel}
                Chat ID: ${chat.id._serialized}
            `);
        }

        if (message.body.includes('docs.google.com/forms') || message.body.includes('forms.gle')) {
            if (isChannel) {
                console.log('Form link detected in channel:', chat.name);
                
                const formUrl = message.body.match(/(https?:\/\/(docs\.google\.com\/forms|forms\.gle)[^\s]+)/i)?.[0];
                
                if (formUrl) {
                    channelState.formState.currentLink = formUrl;
                    
                    try {
                        const targetChat = await client.getChatById(channelState.targetNumber);
                        await targetChat.sendMessage(`Processing Google Form from channel "${chat.name}" with ID: ${config.formId}`);
                        
                        const success = await handleGoogleForm(formUrl);
                        
                        if (success) {
                            await targetChat.sendMessage('Form filled successfully. Please check the browser window.');
                        } else {
                            await targetChat.sendMessage('Error processing the form.');
                        }
                        
                    } catch (error) {
                        console.error('Error processing form:', error);
                    }
                } else {
                    console.error('Could not extract form URL from message');
                }
            }
            return;
        }

    } catch (error) {
        console.error('Error handling message:', error);
    }
});

client.on('auth_failure', (error) => {
    console.error('Authentication failed:', error);
});

client.on('disconnected', (reason) => {
    console.log('Client was disconnected:', reason);
    client.initialize();
});

process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await client.destroy();
    process.exit(0);
});

client.initialize(); 