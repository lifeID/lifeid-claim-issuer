/* tslint:disable */
import { Controller, ValidateParam, FieldErrors, ValidateError, TsoaRoute } from 'tsoa';
import { ClaimController } from './controllers/claimController';

const models: TsoaRoute.Models = {
    "ClaimCreateResponse": {
        "properties": {
            "created": { "dataType": "boolean", "required": true },
        },
    },
    "ClaimProperty": {
        "properties": {
            "type": { "dataType": "string", "required": true },
            "value": { "dataType": "string", "required": true },
        },
    },
    "ClaimCreateRequest": {
        "properties": {
            "claim": { "ref": "ClaimProperty", "required": true },
            "subject": { "dataType": "string", "required": true },
            "signature": { "dataType": "string", "required": true },
        },
    },
    "Revocation": {
        "properties": {
            "key": { "dataType": "string", "required": true },
            "type": { "dataType": "string", "required": true },
        },
    },
    "Signature": {
        "properties": {
            "type": { "dataType": "string", "required": true },
            "created": { "dataType": "string", "required": true },
            "creator": { "dataType": "string", "required": true },
            "domain": { "dataType": "string" },
            "nonce": { "dataType": "string", "required": true },
            "signatureValue": { "dataType": "string", "required": true },
            "signatureType": { "dataType": "string", "required": true },
        },
    },
    "VerifiableClaim": {
        "properties": {
            "id": { "dataType": "string", "required": true },
            "type": { "dataType": "array", "array": { "dataType": "string" }, "required": true },
            "name": { "dataType": "string" },
            "issuer": { "dataType": "string", "required": true },
            "issued": { "dataType": "string", "required": true },
            "claim": { "ref": "ClaimProperty", "required": true },
            "expires": { "dataType": "string" },
            "revocation": { "ref": "Revocation" },
            "signature": { "ref": "Signature" },
        },
    },
    "VerifyClaimResponse": {
        "properties": {
            "verifiableClaim": { "ref": "VerifiableClaim", "required": true },
        },
    },
    "VerifyClaimRequest": {
        "properties": {
            "verificationCode": { "dataType": "string", "required": true },
            "value": { "dataType": "string", "required": true },
            "type": { "dataType": "string", "required": true },
        },
    },
};

export function RegisterRoutes(app: any) {
    app.post('/v1/claims/request',
        function(request: any, response: any, next: any) {
            const args = {
                claimRequest: { "in": "body", "name": "claimRequest", "required": true, "ref": "ClaimCreateRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ClaimController();


            const promise = controller.createClaim.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.post('/v1/claims/verify',
        function(request: any, response: any, next: any) {
            const args = {
                claimRequest: { "in": "body", "name": "claimRequest", "required": true, "ref": "VerifyClaimRequest" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ClaimController();


            const promise = controller.verifyClaim.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });
    app.get('/v1/claims/:claimID',
        function(request: any, response: any, next: any) {
            const args = {
                claimID: { "in": "path", "name": "claimID", "required": true, "dataType": "string" },
            };

            let validatedArgs: any[] = [];
            try {
                validatedArgs = getValidatedArgs(args, request);
            } catch (err) {
                return next(err);
            }

            const controller = new ClaimController();


            const promise = controller.getClaim.apply(controller, validatedArgs);
            promiseHandler(controller, promise, response, next);
        });


    function promiseHandler(controllerObj: any, promise: any, response: any, next: any) {
        return Promise.resolve(promise)
            .then((data: any) => {
                let statusCode;
                if (controllerObj instanceof Controller) {
                    const controller = controllerObj as Controller
                    const headers = controller.getHeaders();
                    Object.keys(headers).forEach((name: string) => {
                        response.set(name, headers[name]);
                    });

                    statusCode = controller.getStatus();
                }

                if (data) {
                    response.status(statusCode || 200).json(data);
                } else {
                    response.status(statusCode || 204).end();
                }
            })
            .catch((error: any) => next(error));
    }

    function getValidatedArgs(args: any, request: any): any[] {
        const fieldErrors: FieldErrors = {};
        const values = Object.keys(args).map((key) => {
            const name = args[key].name;
            switch (args[key].in) {
                case 'request':
                    return request;
                case 'query':
                    return ValidateParam(args[key], request.query[name], models, name, fieldErrors);
                case 'path':
                    return ValidateParam(args[key], request.params[name], models, name, fieldErrors);
                case 'header':
                    return ValidateParam(args[key], request.header(name), models, name, fieldErrors);
                case 'body':
                    return ValidateParam(args[key], request.body, models, name, fieldErrors, name + '.');
                case 'body-prop':
                    return ValidateParam(args[key], request.body[name], models, name, fieldErrors, 'body.');
            }
        });
        if (Object.keys(fieldErrors).length > 0) {
            throw new ValidateError(fieldErrors, '');
        }
        return values;
    }
}
