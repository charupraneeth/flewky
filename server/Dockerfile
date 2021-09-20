FROM node:14

ENV PORT 1337

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 1337
CMD [ "npm","start"]