const chai = require('chai');
const config = require('../../config');
const jwtlib = require('jsonwebtoken');
const { decodeJWT, generateJWT } = require('../../src/utils/auth');

const { expect } = chai;

describe('Auth Utils', () => {
    describe('generateJWT', () => {
        it('Creates a JWT from your AWS credentials, using your secret key as a secret', () => {
            let jwt = generateJWT();

            const decodedJWT = jwtlib.verify(jwt, config.aws.secretAccessKey);

            expect(decodedJWT.sub).to.equal(config.aws.accessKeyId);
            expect(decodedJWT.region).to.equal(config.aws.region);
        });
    });

    describe('decodeJWT', () => {
        it('Decodes a JWT back into your AWS credentials, using your secret key as a secret', () => {
            let jwt = generateJWT();

            let creds = decodeJWT(jwt);

            expect(creds.accessKeyId).to.equal(config.aws.accessKeyId);
            expect(creds.region).to.equal(config.aws.region);
        });
    });
});
