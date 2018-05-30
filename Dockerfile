FROM node:carbon
WORKDIR /usr/src/app
COPY package*.json yarn.lock ./
RUN yarn install
COPY . .
ENV HOSTNAME claim-issuer-dev.lifeid.io
RUN yarn run clean && yarn run tsoa swagger --host $HOSTNAME && yarn run tsoa routes --host $HOSTNAME && yarn run tsc

EXPOSE 3000
ENTRYPOINT ["yarn", "start" ]
