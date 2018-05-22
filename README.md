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
