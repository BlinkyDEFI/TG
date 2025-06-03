import TelegramBot from 'node-telegram-bot-api';
import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const chatIds = process.env.TELEGRAM_CHAT_IDS?.split(',').map(id => id.trim()) || [];
const app = express();

app.use(bodyParser.json());

// Telegram webhook endpoint
app.post(`/bot${process.env.TELEGRAM_BOT_TOKEN}`, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Telegram webhook error:', error.message);
    res.status(500).send('Error processing Telegram webhook');
  }
});

// Telegram commands
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 Blinky NFT Bot is active!\n\n🌐 Mint Now: [nft.blinkyonsol.com](https://nft.blinkyonsol.com)`, {
    parse_mode: 'Markdown'
  });
});

bot.onText(/\/status/, (msg) => {
  const isMonitored = chatIds.includes(msg.chat.id.toString());
  const status = isMonitored ? '✅ Active' : '❌ Not monitored';
  bot.sendMessage(msg.chat.id, `📊 Bot Status: ${status}\n📢 Monitoring ${chatIds.length} groups`, {
    parse_mode: 'Markdown'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Bot is running');
});

// Array of promotional messages (only the new message)
const promoMessages = [
  `💎 Blinky NFTs are LIVE!  💎  

Only 500 will ever be minted. Each Blinky OG VIP NFT offers real utility, passive LP rewards, exclusive VIP perks and more!  

🌐 *Mint yours:* [nft.blinkyonsol.com](https://nft.blinkyonsol.com)  
🌍 *Visit us:* [blinkyonsol.com](https://blinkyonsol.com)  

_Powered by Blinky NFT Bot 🤖_`
];

// Function to send random promotional message
async function sendRandomPromo() {
  console.log('DEBUG: Starting sendRandomPromo, chatIds:', chatIds);
  const videoUrl = process.env.CELEBRATION_VIDEO_URL || 'https://gateway.irys.xyz/NGY5Uo_lDb4F4PBHoMN8WsYwh0A6n7FMElVJh6P9mL4?ext=mp4';
  const message = promoMessages[0]; // Use the only message
  console.log('DEBUG: Selected message:', message);

  for (const chatId of chatIds) {
    console.log('DEBUG: Sending to chatId:', chatId);
    try {
      await bot.sendVideo(chatId, videoUrl, {
        caption: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛒 Mint Now', url: 'https://nft.blinkyonsol.com' },
              { text: '🌐 Website', url: 'https://blinkyonsol.com' }
            ],
            [
              { text: '💰 Buy Blinky', url: 'https://jup.ag/swap/SOL-B4fuA7wKBagyR1V5BBAhGJu7z2cD16rubZ5HPUNcpump' }
            ]
          ]
        }
      });
      console.log(`✅ Promotional message sent to ${chatId}`);
    } catch (error) {
      console.error('❌ Error sending promotional message to', chatId, ':', error.message);
      // Fallback to text message if video fails
      await bot.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🛒 Mint Now', url: 'https://nft.blinkyonsol.com' },
              { text: '🌐 Website', url: 'https://blinkyonsol.com' }
            ],
            [
              { text: '💰 Buy Blinky', url: 'https://jup.ag/swap/SOL-B4fuA7wKBagyR1V5BBAhGJu7z2cD16rubZ5HPUNcpump' }
            ]
          ]
        }
      });
      console.log(`✅ Fallback text message sent to ${chatId}`);
    }
  }
}

// Schedule promotional messages (3–5 times a day)
function schedulePromos() {
  const minInterval = 4 * 60 * 60 * 1000; // 4 hours
  const maxInterval = 8 * 60 * 60 * 1000; // 8 hours
  const getRandomInterval = () => Math.floor(Math.random() * (maxInterval - minInterval + 1)) + minInterval;

  const scheduleNext = () => {
    const interval = getRandomInterval();
    console.log(`📅 Next promo scheduled in ${Math.round(interval / (60 * 60 * 1000) * 100) / 100} hours`);
    setTimeout(async () => {
      await sendRandomPromo();
      scheduleNext(); // Schedule the next message
    }, interval);
  };

  // Send initial message immediately
  console.log('📢 Sending initial promotional message...');
  sendRandomPromo().then(() => {
    scheduleNext(); // Start scheduling after initial message
  });
}

// Keep-alive function
async function keepAlive() {
  try {
    await axios.get('https://tgbot-1-680u.onrender.com/health');
    console.log('✅ Keep-alive ping sent');
  } catch (error) {
    console.error('❌ Keep-alive ping failed:', error.message);
  }
}

// Schedule keep-alive every 4 minutes
setInterval(keepAlive, 4 * 60 * 1000);

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🤖 Blinky NFT Bot started on port ${PORT}!`);
  console.log(`📢 Monitoring ${chatIds.length} groups`);
  keepAlive(); // Initial ping
  schedulePromos(); // Start promotional message scheduling
});
