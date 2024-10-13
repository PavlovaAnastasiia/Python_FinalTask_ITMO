FROM node

WORKDIR /app

COPY package*.json ./

#COPY node_modules ./node_modules
RUN npm install

COPY public ./public
COPY src ./src

#COPY . .

EXPOSE 3000
CMD ["npm", "start"]
