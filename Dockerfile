FROM node:carbon
WORKDIR /usr/src/app
COPY package*.json ./
RUN yarn install
COPY . .
ENV HOST 35.227.170.224
RUN yarn run clean && yarn run tsoa swagger --host $HOST && yarn run tsoa routes --host $HOST && yarn run tsc

EXPOSE 3000
ENTRYPOINT ["yarn", "start" ]
