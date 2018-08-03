FROM node:10.4.0-stretch

# Prepare the system to run rabbitmq
RUN apt-get update && apt-get -y upgrade \
    && wget -O - 'https://dl.bintray.com/rabbitmq/Keys/rabbitmq-release-signing-key.asc' | apt-key add - \
    && echo "deb http://dl.bintray.com/rabbitmq/debian stretch erlang" >> /etc/apt/sources.list \
    && apt-get update && apt-get install -y erlang-nox \
    && echo "deb https://dl.bintray.com/rabbitmq/debian stretch main" | tee /etc/apt/sources.list.d/bintray.rabbitmq.list \
    && apt-get update && apt-get install -y rabbitmq-server

EXPOSE 4242

WORKDIR /code

COPY ./package.json .

RUN npm install

COPY . .

CMD [ "service", "rabbitmq-server", "start", "&&", "npm", "start" ]