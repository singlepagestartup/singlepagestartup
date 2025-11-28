import { Bot } from "grammy";

const botToken = "YOUR_BOT_TOKEN_HERE";

const recipientChatId = 123456789;

const message = "Hello from your Telegram bot!";

async function sendMessage() {
  try {
    const bot = new Bot(botToken);
    await bot.api.sendMessage(recipientChatId, message);
    console.log("Message sent successfully!");
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

sendMessage();
