import Redis from "ioredis";

const fs = require('fs').promises;
import {getUserKey} from "../utils/redis";
import {runCors} from "../utils/runCors";
import * as path from "node:path";

const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  try {
    await runCors(req, res);

    if (req.method !== "GET") {
      return res.status(405).send("метод не дозволено");
    }

    const userKey = getUserKey(req);
    const sessionToken = req.query.token; // Берем токен из URL
    if (!sessionToken) {
      return res.status(403).send('Токен сесії відсутній');
    }

    const resultKey = `result:${userKey}:${sessionToken}`;
    if (!await redis.get(resultKey)) {
      return res.status(403).send('Доступ заборонено');
    }

    await redis.del(resultKey);

    const filePath = path.join(process.cwd(), 'private', 'result.html');
    const fileContent = await fs.readFile(filePath, 'utf8');
    res.status(200).setHeader('Content-Type', 'text/html').send(fileContent);
  } catch (error) {
    console.error('Error in result.js:', error.message, error.stack); // Подробный лог ошибки
    res.status(500).json({error: 'Internal Server Error'});
  }
}
