const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");

app.use(bodyParser.json());

module.exports = app;

let paymentCategoryDB = new Datastore({
    filename: process.env.APPDATA + "/POS/server/databases/payment_categories.db",
    autoload: true
});

paymentCategoryDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function(req, res) {
    res.send("Payment Categories API");
});

app.get("/all", function(req, res) {
    paymentCategoryDB.find({}, function(err, docs) {
        res.send(docs);
    });
});

app.get("/compulsory", function(req, res) {
    paymentCategoryDB.find({ type: "compulsory" }, function(err, docs) {
        res.send(docs);
    });
});

app.get("/optional", function(req, res) {
    paymentCategoryDB.find({ type: "optional" }, function(err, docs) {
        res.send(docs);
    });
});

app.post("/category", function(req, res) {
    let newCategory = req.body;
    newCategory._id = Math.floor(Date.now() / 1000);
    
    paymentCategoryDB.insert(newCategory, function(err, category) {
        if (err) res.status(500).send(err);
        else res.send(category);
    });
});

app.delete("/category/:categoryId", function(req, res) {
    paymentCategoryDB.remove({
        _id: parseInt(req.params.categoryId)
    }, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

app.put("/category", function(req, res) {
    paymentCategoryDB.update({
        _id: parseInt(req.body._id)
    }, req.body, {}, function(err, numReplaced, category) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});