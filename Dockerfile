FROM node:carbon
WORKDIR /usr/src/app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
RUN yarn run clean && yarn run tsoa swagger && yarn run tsoa routes && yarn run tsc

EXPOSE 3000
ENTRYPOINT ["yarn", "start" ]
