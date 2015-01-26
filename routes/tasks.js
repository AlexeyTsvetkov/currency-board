var express = require('express');
var util = require('../util');
var collections = require('../collections');
var router = express.Router();

var tasks = collections.tasks;

function date(date) {
    var split = date.split('-');
    return {
        day: parseInt(split[0], 10),
        month: parseInt(split[1]),
        year: parseInt(split[2]) };
}

function taskFromParams(params) {
    return {
        currency1: params.currency1,
        currency2: params.currency2,
        from: date(params.from),
        to: date(params.to)
    }
}

function formatTask(res, task) {
    res.format({
        text: function () {
            res.send(util.toText(task));
        },
        html: function () {
            res.render('task', task);
        },
        json: function () {
            res.json(task);
        },
        xml: function () {
            var js2xmlparser = require("js2xmlparser");
            res.send(js2xmlparser("task", task));
        }
    });
}

function executeTask(db, task) {
    var req = {
        year: {$gte: task.from.year, $lte: task.to.year},
        month: {$gte: task.from.month, $lte: task.to.month},
        day: {$gte: task.from.day, $lte: task.to.day},
        from: {$eq: task.currency1},
        to: {$eq: task.currency2}
    };

    setTimeout(function() {
        db.collection(collections.quotations).find(req).toArray(function (err, values) {
            if (values.length <= 0) return;

            var sum = 0;
            for (var i = 0; i < values.length; i++) {
                sum += values[i].price;
            }
            var avg = sum/values.length;

            db.collection(tasks).findById(task._id, function (err, newTask) {
                if (newTask.version !== task.version) return;
                newTask.status = 'done';
                newTask.version++;
                newTask.value = avg;
                db.collection(tasks).updateById(task._id, newTask, function (err, result) {});
            });
        });
    }, 2000);
}

router.put('/:currency1/:currency2/:from/:to', function (req, res) {
    var task = taskFromParams(req.params);
    task.status = 'not done';
    task.version = 0;
    task.value = 0;

    req.db.collection(tasks).insert(task, function (err, result) {
        if (err) {
            res.sendStatus(500);
            return;
        }

        executeTask(req.db, task);
        formatTask(res, result);
    });
});

router.post('/:id/:currency1/:currency2/:from/:to', function (req, res) {
    req.db.collection(tasks).findById(req.params.id, function (err, oldTask) {
        if (err) {
            res.sendStatus(404);
            return;
        }

        var newTask = taskFromParams(req.params);
        oldTask.currency1 = newTask.currency1;
        oldTask.currency2 = newTask.currency2;
        oldTask.from = newTask.from;
        oldTask.to = newTask.to;
        oldTask.version++;
        oldTask.status = 'not done';

        req.db.collection(tasks).updateById(req.params.id, oldTask, function (err, result) {
            if (result === 1) {
                executeTask(req.db, task);
                res.sendStatus(200);
            } else res.sendStatus(404);
        });
    });
});

router.delete('/:id', function (req, res) {
    req.db.collection(tasks).findById(req.params.id, function (err, task) {
        if (err) {
            res.sendStatus(404);
            return;
        }

        if (task.status !== 'not done') {
            res.sendStatus(400);
            return;
        }

        task.status = 'cancelled';
        task.version++;
        req.db.collection(tasks).updateById(req.params.id, task, function (err, result) {
            res.sendStatus(result === 1 ? 200 : 404);
        });
    });
});

router.get('/', function (req, res) {
    req.db.collection(tasks).find().toArray(function (err, result) {
        res.format({
            text: function () {
                res.send(util.toText(result));
            },
            html: function () {
                res.render('tasks', {tasks: result});
            },
            json: function () {
                res.json(result);
            },
            xml: function () {
                var js2xmlparser = require("js2xmlparser");
                res.send(js2xmlparser("tasks", result));
            }
        });
    });
});

router.get('/:id', function (req, res) {
    req.db.collection(tasks).findById(req.params.id, function (err, result) {
        if (!result) {
            res.sendStatus(404);
            return;
        }

        formatTask(res, result);
    });
});

module.exports = router;