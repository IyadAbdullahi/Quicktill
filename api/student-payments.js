const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");

app.use(bodyParser.json());

module.exports = app;

let studentPaymentDB = new Datastore({
    filename: process.env.APPDATA + "/POS/server/databases/student_payments.db",
    autoload: true
});

studentPaymentDB.ensureIndex({ fieldName: '_id', unique: true });

app.get("/", function(req, res) {
    res.send("Student Payments API");
});

app.get("/all", function(req, res) {
    studentPaymentDB.find({}, function(err, docs) {
        res.send(docs);
    });
});

app.get("/student/:studentId", function(req, res) {
    studentPaymentDB.find({
        student_id: parseInt(req.params.studentId)
    }, function(err, docs) {
        res.send(docs);
    });
});

app.get("/outstanding/:studentId", function(req, res) {
    studentPaymentDB.find({
        student_id: parseInt(req.params.studentId),
        status: "outstanding"
    }, function(err, docs) {
        res.send(docs);
    });
});

app.get("/by-category/:categoryId", function(req, res) {
    studentPaymentDB.find({
        payment_category_id: parseInt(req.params.categoryId)
    }, function(err, docs) {
        res.send(docs);
    });
});

app.post("/payment", function(req, res) {
    let newPayment = req.body;
    newPayment._id = Math.floor(Date.now() / 1000);
    newPayment.date = new Date().toJSON();
    
    studentPaymentDB.insert(newPayment, function(err, payment) {
        if (err) res.status(500).send(err);
        else res.send(payment);
    });
});

app.put("/payment", function(req, res) {
    const paymentId = req.body._id;
    
    if (Number.isInteger(paymentId)) {
        studentPaymentDB.update(
            { _id: paymentId },
            req.body,
            {},
            function(err, numReplaced, payment) {
                if (err) res.status(500).send(err);
                else res.sendStatus(200);
            }
        );
    } else {
        res.status(400).send("Invalid payment ID");
    }
});

app.delete("/payment/:paymentId", function(req, res) {
    studentPaymentDB.remove({
        _id: parseInt(req.params.paymentId)
    }, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

// Get payment summary for a student
app.get("/summary/:studentId", function(req, res) {
    const studentId = parseInt(req.params.studentId);
    
    studentPaymentDB.find({ student_id: studentId }, function(err, payments) {
        if (err) {
            res.status(500).send(err);
            return;
        }
        
        let summary = {
            total_paid: 0,
            total_outstanding: 0,
            compulsory_paid: 0,
            compulsory_outstanding: 0,
            optional_paid: 0,
            optional_outstanding: 0
        };
        
        payments.forEach(payment => {
            if (payment.status === "paid") {
                summary.total_paid += payment.amount_paid || 0;
                if (payment.payment_type === "compulsory") {
                    summary.compulsory_paid += payment.amount_paid || 0;
                } else {
                    summary.optional_paid += payment.amount_paid || 0;
                }
            } else {
                const outstanding = payment.amount - (payment.amount_paid || 0);
                summary.total_outstanding += outstanding;
                if (payment.payment_type === "compulsory") {
                    summary.compulsory_outstanding += outstanding;
                } else {
                    summary.optional_outstanding += outstanding;
                }
            }
        });
        
        res.send(summary);
    });
});

// Get payments by date range
app.get("/by-date", function(req, res) {
    let startDate = new Date(req.query.start);
    let endDate = new Date(req.query.end);
    
    let query = {
        date: { $gte: startDate.toJSON(), $lte: endDate.toJSON() }
    };
    
    if (req.query.student_id && req.query.student_id != 0) {
        query.student_id = parseInt(req.query.student_id);
    }
    
    if (req.query.payment_type && req.query.payment_type !== 'all') {
        query.payment_type = req.query.payment_type;
    }
    
    studentPaymentDB.find(query, function(err, docs) {
        if (docs) res.send(docs);
    });
});