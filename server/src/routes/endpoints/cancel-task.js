const { parsePersistError, errorTypes } = require('../../utils/errors');
const log = require('../../utils/logger');

function cancelTask(task) {
    return async (req, res) => {
        try {
            const cancelledTask = await task.cancel(req.params.id);

            return res.status(200).json(cancelledTask);
        } catch (e) {
            let { errors, errorType } = parsePersistError(e);
            log.error(e);

            if (errorType === errorTypes.CLIENT) {
                return res.status(400).json( { errors });
            } else {
                return res.status(500).json( { errors });
            }
        }
    };
}

module.exports = { cancelTask };