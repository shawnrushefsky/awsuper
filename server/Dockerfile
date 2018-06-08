FROM node:10.4.0-stretch

EXPOSE 4242

WORKDIR /code

COPY ./package.json .

RUN npm install

COPY . .

CMD [ "npm", "start" ]