const jwtlib = require('jsonwebtoken');
const config = require('../../config');

/**
 * uses the user provided to generate a JWT.
 * The following member fields are added to the jwt:
 *   - id
 *   - isAdmin
 * @param {User} member the member to generate the JWT for
 * @param {String} expiresIn after how long the jwt should expire. Uses https://github.com/zeit/ms
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
 * decodes the JWT into a user
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