FROM node:10.4.0-stretch

# Prepare the system to run rabbitmq
RUN apt-get update && apt-get -y upgrade \
    && wget -O - 'https://dl.bintray.com/rabbitmq/Keys/rabbitmq-release-signing-key.asc' | apt-key add - \
    && echo "deb http://dl.bintray.com/rabbitmq/debian stretch erlang" >> /etc/apt/sources.list \
    && apt-get update && apt-get install -y erlang-nox \
    && echo "deb https://dl.bintray.com/rabbitmq/debian stretch main" | tee /etc/apt/sources.list.d/bintray.rabbitmq.list \
    && apt-get update && apt-get install -y rabbitmq-server

# Get the delayed-message-exchange plugin for rabbitmq
WORKDIR /usr/lib/rabbitmq/plugins

RUN apt-get install -y unzip \
    && wget https://dl.bintray.com/rabbitmq/community-plugins/3.7.x/rabbitmq_delayed_message_exchange/rabbitmq_delayed_message_exchange-20171201-3.7.x.zip -O temp.zip \
    && unzip temp.zip \
    && rm temp.zip \
    && rabbitmq-plugins --offline enable rabbitmq_delayed_message_exchange

# Prepare the system to run couchdb
RUN apt-get install -y mongodb

WORKDIR /data/db

EXPOSE 4242

WORKDIR /code

COPY ./package.json .

RUN npm install

COPY . .

CMD service rabbitmq-server start \
    && service mongodb start \
    && npm start