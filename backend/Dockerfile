FROM node:24-alpine

WORKDIR /app

RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    openssl

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
