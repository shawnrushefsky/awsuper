const jwtlib = require('jsonwebtoken');
const config = require('../../config');

/**
 * Generates a JWT out of your AWS credentials
 */
function generateJWT() {
    let payload = {
        sub: config.aws.accessKeyId,
        region: config.aws.region
    };

    let opts = {
        issuer: 'awsuper',
        noTimestamp: true
    };

    return jwtlib.sign(payload, config.aws.secretAccessKey, opts);
}

/**
 * decodes the JWT back into aws credentials.
 * @param {String} jwt the JWT to decode
 */
function decodeJWT(jwt) {
    const decodedJWT = jwtlib.verify(jwt, config.aws.secretAccessKey);

    let info = {
        accessKeyId: decodedJWT.sub,
        region: decodedJWT.region
    };

    return info;
}

module.exports = {
    generateJWT,
    decodeJWT
};