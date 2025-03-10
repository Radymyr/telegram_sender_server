import Redis from "ioredis";

require('dotenv').config();
const crypto = require('crypto');
import {getUserKey} from "../utils/redis";
import {getLimitTime} from "../utils/time_limit";
import {runCors} from "../utils/runCors";

const redis = new Redis(process.env.REDIS_URL);
const BLOCK_TIME = getLimitTime(1);

const telegramToken = process.env.TELEGRAM_TOKEN;
const telegramApiUrl = `https://api.telegram.org/bot${telegramToken}/sendMessage`;

const url = 'https://telegram-sender-server.vercel.app'
const route = '/success';


export default async function handler(req, res) {
  try {
    await runCors(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method !== "POST") {
      return res.status(405).send("метод не дозволено");
    }

    const userKey = getUserKey(req);
    const submitKey = `submit:${userKey}`; // Только IP для ограничения отправки

    const submitExists = await redis.get(submitKey);
    if (submitExists) {
      const ttl = await redis.ttl(submitKey);
      const minutesLeft = Math.ceil(ttl / 60);
      return res.status(429).json({
        error: `Ви вже надіслали форму. Повторіть спробу через ${minutesLeft} хвилин.`
      });
    }

    const sessionToken = crypto.randomBytes(16).toString('hex'); // Уникальный токен для доступа
    const { name, phone, message, chatId } = req.body;

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
      console.error('Error response from Telegram API:', response.status, responseBody);
      throw new Error('Помилка відправлення даних у Telegram');
    }

    // Записываем ключ для ограничения отправки (только IP)
    await redis.set(submitKey, 'blocked', 'EX', BLOCK_TIME);

    // Записываем ключ для доступа к /success (IP + токен)
    const resultKey = `result:${userKey}:${sessionToken}`;
    await redis.set(resultKey, 'allowed', 'EX', BLOCK_TIME);

    res.status(200).json({
      message: 'Форму успішно відправлено!',
      redirectUrl: `${url}${route}?name=${encodeURIComponent(name)}&token=${sessionToken}`,
      sessionToken: sessionToken
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
}
