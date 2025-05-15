const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');
const express = require('express');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const TOKEN = process.env.TOKEN; // Bot token loaded from .env file
const WEBHOOK_URL = process.env.WEBHOOK_URL; // n8n webhook URL loaded from .env file
const CHANNEL_ID = process.env.CHANNEL_ID; // Channel ID loaded from .env file

const app = express();
app.use(express.json());

// This endpoint will receive responses from n8n
app.post('/n8n-response', async (req, res) => {
  const { channelId, message } = req.body;
  try {
    const channel = await client.channels.fetch(channelId);
    if (channel) {
      await channel.send(message);
      res.status(200).send('Message sent!');
    } else {
      res.status(404).send('Channel not found');
    }
  } catch (error) {
    console.error('Error sending message to Discord:', error);
    res.status(500).send('Error');
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000; // Port loaded from .env file or default to 3000
app.listen(PORT, () => {
  console.log(`Express server listening on port ${PORT}`);
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.id === CHANNEL_ID) {
    try {
      await axios.post(WEBHOOK_URL, {
        content: message.content,
        author: message.author.username,
        authorId: message.author.id,
        channelId: message.channel.id,
        messageId: message.id,
      });
      console.log('Message sent to n8n:', message.content);
    } catch (error) {
      console.error('Error sending message to n8n:', error);
    }
  }
});

client.login(TOKEN);
