const axios = require('axios');

const CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

module.exports = async (req, res) => {
  if (req.method === 'POST') {
    const events = req.body.events;

    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userMessage = event.message.text;
        const replyToken = event.replyToken;

        try {
          const chatGptResponse = await getChatGptResponse(userMessage);
          await replyToLine(replyToken, chatGptResponse);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      }
    }

    return res.status(200).send('OK');
  }

  return res.status(405).send('Method Not Allowed');
};

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
