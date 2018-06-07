FROM node:10.4.0-stretch

WORKDIR /code

COPY ./package.json .

RUN npm install

COPY . .

CMD [ "sleep", "infinity" ]