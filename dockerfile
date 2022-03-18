FROM node:14-alpine 

WORKDIR /app

COPY package.json .

RUN npm i

COPY . ./

ENV PORT=5001

EXPOSE ${PORT}

CMD ["npm", "run", "dev:1"]