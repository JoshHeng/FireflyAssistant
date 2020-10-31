FROM node:14.3.0-alpine3.11
WORKDIR /var/app

ENV DOMAIN http://localhost:3000
ENV MONGOURL -
ENV SECRET -
ENV SECRETKEY -
ENV PORT 3000

COPY package* ./
RUN npm install

COPY config/ ./config/
COPY models/ ./models/
COPY public/ ./public/
COPY routes/ ./routes/
COPY views/ ./views/
COPY app.js ./
COPY firefly-api.js ./

EXPOSE 3000
ENTRYPOINT node app.js --DOMAIN=$DOMAIN --MONGOURL=$MONGOURL --SECRET=$SECRET --SECRETKEY=$SECRETKEY