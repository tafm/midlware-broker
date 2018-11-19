FROM node:10.4.0

COPY package.json /var/app/

WORKDIR /var/app/

RUN npm install && npm install supervisor -g