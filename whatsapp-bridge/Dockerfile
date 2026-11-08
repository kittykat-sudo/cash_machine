FROM --platform=linux/amd64 node:20-alpine

# Install git required for Baileys libsignal-node dependency
RUN apk add --no-cache git

WORKDIR /app

COPY package*.json ./

RUN npm install --no-audit --no-fund

COPY . .

# Create directory for Baileys auth state credentials
RUN mkdir -p /app/auth_info_baileys

EXPOSE 3001

CMD ["node", "server.js"]
