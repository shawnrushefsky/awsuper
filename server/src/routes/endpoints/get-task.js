const log = require('../../utils/logger');
const { messages } = require('../../utils/errors');


function getTaskByID(taskName, task) {
    return async (req, res) => {
        try {
            const retrievedTask = await task.model.findById(req.params.id);

            if (!retrievedTask) {
                return res.status(404).json({ errors: [`No ${taskName} with that name could be found.`] });
            } else {
                return res.status(200).json(retrievedTask);
            }
        } catch (e) {
            log.error(e);
            return res.status(500).json({
                errors: [messages.INTERNAL_ERROR]
            });
        }
    };
}

function queryAllTasks(task) {
    return async (req, res) => {
        try {
            let count;

            if (Object.keys(req.mongoQuery).length === 0) {
                // This is faster for getting the total count of the entire collection
                count = task.model.estimatedDocumentCount();
            } else {
                count = task.model.countDocuments(req.mongoQuery);
            }

            const num_found = await count;

            let query = task.model.find(req.mongoQuery)
                .skip(req.skip)
                .limit(req.limit);

            req.sort && query.sort(req.sort);

            let data = await query;

            return res.status(200).json({ num_found, data });
        } catch (e) {
            log.error(e);
            return res.status(500).json({
                errors: [messages.INTERNAL_ERROR]
            });
        }
    };
}

module.exports = { getTaskByID, queryAllTasks };