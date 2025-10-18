# node alpine version
FROM node:22-alpine

# set working directory
WORKDIR /app

# copy package.json and package-lock.json
COPY package*.json ./

# install dependencies
RUN npm install

# copy the rest of the application code
COPY . .

# expose port 8080
EXPOSE 8080

# start the application
CMD ["node", "index.js"]