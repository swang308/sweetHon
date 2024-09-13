const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3000;

// LINE API credentials
const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECTRET;

// OpenAI API credentials
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(bodyParser.json());

// Endpoint to handle LINE webhook events
app.post('/webhook', async (req, res) => {
  const events = req.body.events;

  for (const event of events) {
    if (event.type === 'message' && event.message.type === 'text') {
      const userMessage = event.message.text;
      const replyToken = event.replyToken;

      // Get ChatGPT response
      try {
        const chatGptResponse = await getChatGptResponse(userMessage);
        await replyToLine(replyToken, chatGptResponse);
      } catch (error) {
        console.error('Error handling message:', error);
      }
    }
  }

  res.sendStatus(200);
});

// Function to get response from ChatGPT
async function getChatGptResponse(userMessage) {
  try {
    const response = await axios.post('https://api.openai.com/v1/completions', {
      model: 'text-davinci-003',
      prompt: userMessage,
      max_tokens: 150
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].text.trim();
  } catch (error) {
    console.error('Error communicating with OpenAI:', error);
    return 'Sorry, I could not understand that.';
  }
}

// Function to send reply to LINE
async function replyToLine(replyToken, messageText) {
  try {
    await axios.post('https://api.line.me/v2/bot/message/reply', {
      replyToken: replyToken,
      messages: [{ type: 'text', text: messageText }]
    }, {
      headers: {
        'Authorization': `Bearer ${CHANNEL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error replying to LINE:', error);
  }
}

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
