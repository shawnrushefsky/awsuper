const { decodeJWT } = require('../utils/auth');
const { aws } = require('../../config');

const AUTH_ERROR = 'Expected the Authorization header to take the form `Bearer ${token}`';

async function authMiddleware(req, res, next) {
    const { authorization } = req.headers;

    if (!authorization) {
        // TODO: add comment explaining this blasphemy.
        res.setHeader('WWW-Authenticate', 'Bearer realm="awsuper"');

        return res.status(401).json({ errors: [AUTH_ERROR] });
    }

    try {
        const splitAuth = authorization.split(' ');

        // this means the auth type wasn't provided. return a 400
        if (splitAuth.length === 1 || splitAuth[0] === '') {
            return res.status(400).json({
                errors: [AUTH_ERROR]
            });
        }

        const authType = splitAuth[0].toLowerCase();

        if (authType !== 'bearer') {
            return res.status(400).json({
                errors: [AUTH_ERROR]
            });
        }

        const info = decodeJWT(splitAuth[1]);

        if (info.accessKeyId === aws.accessKeyId && info.region === aws.region) {
            return next();
        } else {
            return res.status(403).json({ errors: ['Invalid auth credentials.'] });
        }
    } catch (e) {
        return res.status(403).json({ errors: ['Invalid auth credentials.'] });
    }
}

module.exports = authMiddleware;