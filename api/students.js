const app = require("express")();
const server = require("http").Server(app);
const bodyParser = require("body-parser");
const Datastore = require("nedb");
const async = require("async");

app.use(bodyParser.json());

module.exports = app;

let studentDB = new Datastore({
    filename: process.env.APPDATA + "/POS/server/databases/students.db",
    autoload: true
});

studentDB.ensureIndex({ fieldName: '_id', unique: true });
studentDB.ensureIndex({ fieldName: 'student_id', unique: true });

app.get("/", function(req, res) {
    res.send("Students API");
});

app.get("/student/:studentId", function(req, res) {
    if (!req.params.studentId) {
        res.status(500).send("ID field is required.");
    } else {
        studentDB.findOne({
            _id: parseInt(req.params.studentId)
        }, function(err, student) {
            res.send(student);
        });
    }
});

app.get("/student/by-student-id/:studentId", function(req, res) {
    if (!req.params.studentId) {
        res.status(500).send("Student ID field is required.");
    } else {
        studentDB.findOne({
            student_id: req.params.studentId
        }, function(err, student) {
            res.send(student);
        });
    }
});

app.get("/all", function(req, res) {
    studentDB.find({}, function(err, docs) {
        res.send(docs);
    });
});

app.get("/by-class/:className", function(req, res) {
    studentDB.find({
        class: req.params.className
    }, function(err, docs) {
        res.send(docs);
    });
});

app.post("/student", function(req, res) {
    let newStudent = req.body;
    newStudent._id = Math.floor(Date.now() / 1000);
    
    studentDB.insert(newStudent, function(err, student) {
        if (err) res.status(500).send(err);
        else res.send(student);
    });
});

app.delete("/student/:studentId", function(req, res) {
    studentDB.remove({
        _id: parseInt(req.params.studentId)
    }, function(err, numRemoved) {
        if (err) res.status(500).send(err);
        else res.sendStatus(200);
    });
});

app.put("/student", function(req, res) {
    const studentId = req.body._id;
    
    if (Number.isInteger(studentId)) {
        studentDB.update(
            { _id: studentId },
            req.body,
            {},
            function(err, numReplaced, student) {
                if (err) res.status(500).send(err);
                else res.sendStatus(200);
            }
        );
    } else {
        res.status(400).send("Invalid student ID");
    }
});

// Search students by name or student ID
app.get("/search/:query", function(req, res) {
    const query = req.params.query;
    const regex = new RegExp(query, 'i');
    
    studentDB.find({
        $or: [
            { name: regex },
            { student_id: regex },
            { guardian_name: regex }
        ]
    }, function(err, docs) {
        if (err) res.status(500).send(err);
        else res.send(docs);
    });
});