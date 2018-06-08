
/**
 * Makes a lowercase mapping of name (and shortname) to the object
 * @param {Array<Object>} objArray An array of objects, where each object has at least {Name}
 */
function mapByName(objArray) {
    let mapping = {};

    for (let obj of objArray) {
        if (obj.Name) {
            mapping[obj.Name.toLowerCase()] = obj;
        }

        if (obj.Shortname) {
            mapping[obj.Shortname.toLowerCase()] = obj;
        }

        if (obj.Hostname) {
            mapping[obj.Hostname.toLowerCase()] = obj;
        }
    }

    return mapping;
}

module.exports = {
    mapByName
};