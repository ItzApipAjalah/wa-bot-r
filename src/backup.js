// // Login function rusak
// // async function loginToGoogle() {
// //     try {
// //         const browser = await client.pupPage.browser();
// //         const context = await browser.createIncognitoBrowserContext();
// //         const page = await context.newPage();

// //         // Inject stealth scripts
// //         await page.evaluateOnNewDocument(() => {
// //             // Override navigator.webdriver
// //             Object.defineProperty(navigator, 'webdriver', {
// //                 get: () => undefined
// //             });

// //             // Override navigator.languages
// //             Object.defineProperty(navigator, 'languages', {
// //                 get: () => ['en-US', 'en']
// //             });

// //             // Override permissions
// //             const originalQuery = window.navigator.permissions.query;
// //             window.navigator.permissions.query = (parameters) => (
// //                 parameters.name === 'notifications' ?
// //                     Promise.resolve({ state: Notification.permission }) :
// //                     originalQuery(parameters)
// //             );

// //             // Add plugins
// //             Object.defineProperty(navigator, 'plugins', {
// //                 get: () => {
// //                     return [
// //                         {
// //                             0: {type: "application/x-google-chrome-pdf"},
// //                             description: "Portable Document Format",
// //                             filename: "internal-pdf-viewer",
// //                             length: 1,
// //                             name: "Chrome PDF Plugin"
// //                         }
// //                     ];
// //                 }
// //             });

// //             // Add Chrome object
// //             window.chrome = {
// //                 runtime: {},
// //                 loadTimes: () => {},
// //                 csi: () => {},
// //                 app: {},
// //             };
// //         });

// //         // Set extra headers
// //         await page.setExtraHTTPHeaders({
// //             'Accept-Language': 'en-US,en;q=0.9',
// //             'Accept-Encoding': 'gzip, deflate, br',
// //             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
// //             'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
// //             'sec-ch-ua-mobile': '?0',
// //             'sec-ch-ua-platform': '"Windows"',
// //             'Upgrade-Insecure-Requests': '1',
// //             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
// //             'Connection': 'keep-alive'
// //         });

// //         // Set viewport
// //         await page.setViewport({
// //             width: 1920,
// //             height: 1080,
// //             deviceScaleFactor: 1,
// //             hasTouch: false,
// //             isLandscape: true,
// //             isMobile: false
// //         });

// //         console.log('Navigating to Google...');
// //         await page.goto('https://accounts.google.com', {
// //             waitUntil: 'networkidle0',
// //             timeout: 60000
// //         });

// //         console.log('Google login page opened. Please login manually.');

// //         // Wait for successful login
// //         await page.waitForNavigation({
// //             waitUntil: 'networkidle0',
// //             timeout: 120000
// //         }).catch(() => console.log('Login completed or timeout reached'));

// //         console.log('Google login process completed');
// //     } catch (error) {
// //         console.error('Error during Google login:', error);
// //     }
// // }

// const qrcode = require('qrcode-terminal');
// const { Client, LocalAuth } = require('whatsapp-web.js');
// const config = require('./config.js');

// // Create a new WhatsApp client with local authentication
// const client = new Client({
//     authStrategy: new LocalAuth(),
//     puppeteer: {
//         headless: false,
//         executablePath: config.chromePath,
//         args: [
//             '--no-sandbox',
//             '--disable-setuid-sandbox',
//             '--disable-dev-shm-usage',
//             '--disable-accelerated-2d-canvas',
//             '--no-first-run',
//             '--no-zygote',
//             '--disable-gpu',
//             '--disable-web-security',
//             '--disable-features=IsolateOrigins',
//             '--allow-running-insecure-content',
//             '--disable-blink-features=AutomationControlled',
//             '--ignore-certificate-errors',
//             '--ignore-certificate-errors-spki-list',
//             '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
//             '--window-size=1920,1080',
//             '--start-maximized',
//             '--disable-notifications',
//             '--disable-infobars',
//             '--disable-features=ChromeWhatsNewUI',
//             '--enable-automation=false',
//             '--disable-blink-features',
//             '--disable-extensions'
//         ],
//         defaultViewport: null,
//         ignoreHTTPSErrors: true
//     }
// });



// // Generate QR code
// client.on('qr', (qr) => {
//     qrcode.generate(qr, { small: true });
//     console.log('QR Code generated. Scan it with WhatsApp!');
// });

// client.on('ready', async () => {
//     console.log('WhatsApp Client is ready!');

// });

// const channelState = {
//     formState: {
//         currentLink: null,
//     },
//     targetNumber: config.targetNumber
// };

// // handleGoogleForm
// async function handleGoogleForm(link) {
//     try {
//         const browser = await client.pupPage.browser();
//         const page = await browser.newPage();

//         console.log('Opening Google Form...');
//         await page.goto(link, {
//             waitUntil: 'networkidle0',
//             timeout: 60000
//         });

//         await page.waitForSelector('form', { timeout: 60000 });
        
//         console.log(`Form loaded. Processing with ID: ${config.formId}`);

//         await page.waitForTimeout(2000);

//         // Fill Email checkbox
//         await page.evaluate(() => {
//             function findEmailCheckbox() {
//                 const checkboxes = Array.from(document.querySelectorAll('div[role="checkbox"]'));
//                 for (const checkbox of checkboxes) {
//                     const label = checkbox.getAttribute('aria-label');
//                     if (label && label.toLowerCase().includes('email')) {
//                         return checkbox;
//                     }
//                 }

//                 const divs = Array.from(document.querySelectorAll('div'));
//                 for (const div of divs) {
//                     if (div.textContent.toLowerCase().includes('email')) {
//                         const checkbox = div.querySelector('div[role="checkbox"]');
//                         if (checkbox) return checkbox;
//                     }
//                 }

//                 return null;
//             }

//             const emailCheckbox = findEmailCheckbox();
//             if (emailCheckbox && emailCheckbox.getAttribute('aria-checked') !== 'true') {
//                 emailCheckbox.click();
//             }
//         });

//         // Fill ID ML Server
//         await page.evaluate((predefinedId) => {
//             function findIdInput() {
//                 const inputs = Array.from(document.querySelectorAll('input[type="text"]'));
//                 for (const input of inputs) {
//                     const container = input.closest('div[role="listitem"]');
//                     if (container && container.textContent.toLowerCase().includes('id ml server')) {
//                         return input;
//                     }
//                 }

//                 const textboxes = Array.from(document.querySelectorAll('[role="textbox"]'));
//                 for (const textbox of textboxes) {
//                     const container = textbox.closest('div[role="listitem"]');
//                     if (container && container.textContent.toLowerCase().includes('id ml server')) {
//                         return textbox;
//                     }
//                 }

//                 return null;
//             }

//             const idInput = findIdInput();
//             if (idInput) {
//                 idInput.value = predefinedId;
//                 idInput.dispatchEvent(new Event('input', { bubbles: true }));
//                 idInput.dispatchEvent(new Event('change', { bubbles: true }));
//             }
//         }, config.formId);

//         // Wait for changes to register
//         await page.waitForTimeout(1000);

//         // Find and click the submit button
//         await page.evaluate(() => {
//             function findSubmitButton() {
//                 // Method 1: Find by role and text content
//                 const buttons = Array.from(document.querySelectorAll('div[role="button"]'));
//                 for (const button of buttons) {
//                     if (button.textContent.toLowerCase().includes('submit') || 
//                         button.textContent.toLowerCase().includes('kirim') ||
//                         button.textContent.toLowerCase().includes('send')) {
//                         return button;
//                     }
//                 }

//                 // Method 2: Find by common submit button classes
//                 const submitButton = document.querySelector('.freebirdFormviewerViewNavigationSubmitButton');
//                 if (submitButton) return submitButton;

//                 return null;
//             }

//             const submitButton = findSubmitButton();
//             if (submitButton) {
//                 submitButton.click();
//                 return true;
//             }
//             return false;
//         });

//         // Wait for submission to complete
//         await page.waitForTimeout(3000);

//         // Check if submission was successful
//         const success = await page.evaluate(() => {
//             // Check for common success indicators
//             const successText = document.body.innerText.toLowerCase();
//             return successText.includes('response has been recorded') || 
//                    successText.includes('tanggapan anda telah direkam') ||
//                    successText.includes('terima kasih');
//         });

//         if (success) {
//             console.log('Form submitted successfully');
//             return true;
//         } else {
//             console.log('Form may not have been submitted successfully');
//             return false;
//         }

//     } catch (error) {
//         console.error('Error processing Google Form:', error);
//         return false;
//     }
// }

// client.on('message', async (message) => {
//     try {
//         const chat = await message.getChat();
        
//         // Log message details for debugging
//         console.log('Message received:', {
//             from: message.from,
//             body: message.body,
//             isChannel: chat.isChannel,
//             chatName: chat.name,
//             chatId: chat.id._serialized
//         });

//         // Check if message is from any channel
//         const isChannel = message.from.includes('@newsletter');

//         // Keep existing command handlers
//         if (message.body === '!ping') {
//             await message.reply('pong');
//         }
        
//         if (message.body.startsWith('!echo ')) {
//             const text = message.body.slice(6);
//             await message.reply(text);
//         }
        
//         if (message.body === '!info') {
//             await message.reply(`
//                 Chat Info:
//                 Name: ${chat.name}
//                 Is Channel: ${isChannel}
//                 Chat ID: ${chat.id._serialized}
//             `);
//         }

//         // Modified Google Form link detection for both URL formats
//         if (message.body.includes('docs.google.com/forms') || message.body.includes('forms.gle')) {
//             if (isChannel) {
//                 console.log('Form link detected in channel:', chat.name);
                
//                 // Extract the form URL from the message
//                 const formUrl = message.body.match(/(https?:\/\/(docs\.google\.com\/forms|forms\.gle)[^\s]+)/i)?.[0];
                
//                 if (formUrl) {
//                     channelState.formState.currentLink = formUrl;
                    
//                     try {
//                         // Send message to specific number
//                         const targetChat = await client.getChatById(channelState.targetNumber);
//                         await targetChat.sendMessage(`Processing Google Form from channel "${chat.name}" with ID: ${config.formId}`);
                        
//                         // Process form immediately
//                         const success = await handleGoogleForm(formUrl);
                        
//                         if (success) {
//                             await targetChat.sendMessage('Form filled successfully. Please check the browser window.');
//                         } else {
//                             await targetChat.sendMessage('Error processing the form.');
//                         }
                        
//                     } catch (error) {
//                         console.error('Error processing form:', error);
//                     }
//                 } else {
//                     console.error('Could not extract form URL from message');
//                 }
//             }
//             return;
//         }

//     } catch (error) {
//         console.error('Error handling message:', error);
//     }
// });

// // Handle errors
// client.on('auth_failure', (error) => {
//     console.error('Authentication failed:', error);
// });

// // Add these event listeners for better error handling

// client.on('disconnected', (reason) => {
//     console.log('Client was disconnected:', reason);
//     // Attempt to reconnect
//     client.initialize();
// });

// process.on('SIGINT', async () => {
//     console.log('Shutting down...');
//     await client.destroy();
//     process.exit(0);
// });

// // Initialize the client
// client.initialize(); 