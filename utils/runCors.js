import Cors from  'cors'

const cors = Cors({
  methods: ['GET', 'POST', 'OPTIONS'],
  origin: '*',
});

export function runCors(req, res) {
  return new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}


