import {verifyRecaptcha} from "./utils";

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  res.send('hello, i am start page');
});

const telegramToken = process.env.TELEGRAM_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

app.post('/submit', async (req, res) => {
  const allowedOrigin = 'https://ubiquitous-octo-engine-aqk9.vercel.app';
  if (req.headers.origin !== allowedOrigin) {
    return res.status(403).send('Запрос заблокирован');
  }

  try {
    const { name, phone, message, chatId, recaptchaToken } = req.body;

    if (!await verifyRecaptcha(recaptchaToken)) {
      return res.status(403).send('Подозрительная активность');
    }

    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: `Имя: ${name}\nТелефон: ${phone}\nСообщение: ${message}`,
      }),
    });

    if (!response.ok) {
      const responseBody = await response.text();
      console.error(
        'Error response from Telegram API:',
        response.status,
        responseBody
      );
      throw new Error('Error sending data to Telegram');
    }
    console.log('start');
    res.status(200).send('Form data submitted successfully.');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
