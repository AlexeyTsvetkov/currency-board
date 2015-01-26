var express = require('express');
var util = require('../util');
var collections = require('../collections');
var router = express.Router();

var quotations = collections.quotations;

function quotationFromParams(params) {
    return {
        year:  parseInt(params.year, 10),
        month: parseInt(params.month, 10),
        day:   parseInt(params.day, 10),
        price: parseInt(params.price, 10),
        from: params.from.toLowerCase(),
        to: params.to.toLowerCase()
    }
}

function formatQuotation(res, quotation) {
    res.format({
        text: function () {
            res.send(util.toText(quotation));
        },
        html: function () {
            res.render('quotation', quotation);
        },
        json: function () {
            res.json(quotation);
        },
        xml: function () {
            var js2xmlparser = require("js2xmlparser");
            res.send(js2xmlparser("quotation", quotation));
        }
    });
}

router.get('/', function (req, res) {
    req.db.collection(quotations).find().toArray(function (err, result) {
        res.format({
            text: function () {
                res.send(util.toText(result));
            },
            html: function () {
                res.render('quotations', {quotations: result});
            },
            json: function () {
                res.json(result);
            },
            xml: function () {
                var js2xmlparser = require("js2xmlparser");
                res.send(js2xmlparser("quotations", result));
            }
        });
    });
});

router.get('/:id', function (req, res) {
    req.db.collection(quotations).findById(req.params.id, function (err, result) {
        if (!result) {
            res.sendStatus(404);
            return;
        }

        formatQuotation(res, result);
    });
});

router.put('/:from/:to/:day/:month/:year/:price', function (req, res) {
    var quotation = quotationFromParams(req.params);
    req.db.collection(quotations).insert(quotation, function (err, result) {
        if (err) {
            res.sendStatus(500);
            return;
        }

        formatQuotation(res, result);
    });
});

router.post('/:from/:to/:day/:month/:year/:price', function (req, res) {
    var quotation = quotationFromParams(req.params);
    req.db.collection(quotations).updateById(req.params.id, quotation, function (err, result) {
        res.sendStatus(result === 1 ? 200 : 404);
    });
});

router.delete('/:id', function (req, res) {
    req.db.collection(quotations).removeById(req.params.id, function (err, result) {
        res.sendStatus(result === 1 ? 200 : 404);
    });
});

module.exports = router;