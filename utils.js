require('dotenv').config();

/**
 * @function getLimitTime
 * @param {number} n
 * @returns {number}
 * */
export function getLimitTime(n) {
    return  n * 60 * 60 * 1000;
}


export const verifyRecaptcha = async (token) => {
    const secretKey = process.env.RECAPTCHA_SECRET;
    const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

    const res = await fetch(url, { method: 'POST' });
    const data = await res.json();

    return data.success && data.score > 0.5;
};
