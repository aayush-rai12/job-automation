FROM node:20-slim

RUN apt-get update && apt-get install -y \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

RUN npx playwright install --with-deps chromium

COPY . .

RUN npm run build

EXPOSE 3000

# Xvfb ke saath start karo - virtual display create karega
CMD ["xvfb-run", "--auto-servernum", "--server-args=-screen 0 1366x768x24", "npm", "start"]