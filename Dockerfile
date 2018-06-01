FROM node:carbon
WORKDIR /usr/src/app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
ENV HOSTNAME 35.199.171.131
RUN yarn run clean && yarn run tsoa swagger --host $HOSTNAME && yarn run tsoa routes --host $HOSTNAME && yarn run tsc

EXPOSE 3000
ENTRYPOINT ["yarn", "start" ]
