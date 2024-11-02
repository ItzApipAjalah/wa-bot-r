module.exports = {
    // WhatsApp target number
    targetNumber: '6281380568978@c.us',

    // Telegram target chat ID for status messages
    telegramTarget: '5655758808',
    telegramCheckInterval: 3000,    // Check every 3 seconds

    // Form ID configuration
    formId: {
        serverId: '111111111',  // Server ID
        zoneId: '2222'         // Zone ID
    },  
    
    // Chrome path
    chromePath: process.platform === 'win32' 
        ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' 
        : '/usr/bin/google-chrome'
}; 