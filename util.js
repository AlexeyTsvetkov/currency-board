var util = {
    toText: function(obj) {
        return JSON.stringify(obj, null, 4).replace(/({|}|:|,)/g, '');
    }
};

module.exports = util;