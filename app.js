var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongo = require('mongoskin');
var util = require('./util');

var index = require('./routes/index');
var currency = require('./routes/currency');
var tasks = require('./routes/tasks');

var db = mongo.db("mongodb://localhost:27017/currency", {native_parser:true});
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function( req, res, next) {
    if (!req.accepts('html', 'json', 'text', 'xml')) {
        res.sendStatus(406);
    }

    req.db = db;
    next();
});

app.use('/', index);
app.use('/currency', currency);
app.use('/tasks', tasks);

app.use('/', function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    var error = {
        status: err.status || 500,
        message: err.message || "Server error",
        stack: err.stack
    };

    res.status(error.status);
    res.format({
        text: function () {
            res.send(util.toText(error));
        },
        html: function () {
            res.render('error', error);
        },
        json: function () {
            res.json(error);
        },
        xml: function () {
            var js2xmlparser = require("js2xmlparser");
            res.send(js2xmlparser("error", error));
        }
    });
});

module.exports = app;
