# LifeID Claim Issuer
[![Codefresh build status]( https://g.codefresh.io/api/badges/pipeline/roblifeid/lifeID%2Flifeid-claim-issuer%2Flifeid-claim-issuer?branch=master&key=eyJhbGciOiJIUzI1NiJ9.NWI0Zjc3MzVhNzEwODMwMDAxZmQzM2U3.vGmpEUu6LRnDQcvbo55ZhBqpSgX3Ru4FCzcHhzOWJmk&type=cf-1)]( https://g.codefresh.io/repositories/lifeID/lifeid-claim-issuer/builds?filter=trigger:build;branch:master;service:5b5ba0ec5904b8080b71a5ca~lifeid-claim-issuer)

# Typescript starter

This is a simple typescript starter. This project should be a work in progress as we refine our typescript config. This project should be used for open source projects and does not assume the user will be using any particular editor(eg. vscode), although editor specific config is include.

## Build

TSC it set to watch, compilation can be invoked using `yarn build`
In VSCode use `shift` + `command` + `b` to start the compiler watch task.

## Testing

Testing is done though `Mocha` and `Chai`
Use `yarn test` to run tests and `yarn test-watch` to run tests on save

## Dependencies

This project uses:

* Typescipt
* Tslint
* Mocha
* Chai
* Prettier
* Tslint Config Prettier(to manage conflicts between tslint and prettier)
