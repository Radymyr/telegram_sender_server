FROM node:20.3.1-alpine

WORKDIR /usr/app

COPY package*.json ./

RUN npm i

COPY . .

CMD [ "npm", "start" ]
