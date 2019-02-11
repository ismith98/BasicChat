/**
 * Author: Isaac Smith
 * Version 1/2/19
 * Followed tutorial on learning Node.js by Alex Zanfir:
 * https://www.lynda.com/Node-js-tutorials/Learning-Node-js/612195-2.html
 */

//Serve static files with express.js
//Get the html file links from getbootstrap.com
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var http = require("http").Server(app);
var io = require("socket.io")(http);
var mongoose = require("mongoose");

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

var dbURL = "mongodb://user:user12@ds147354.mlab.com:47354/learning_node";

var Message = mongoose.model("Message", {
    name:String,
    message:String
})
//List of words that will be censored
var badwords = ["fuck", "shit", "bitch", "ass", "nigga"];

String.prototype.replaceAll = function(strReplace, strWith) {
    // See http://stackoverflow.com/a/3561711/556609
    var esc = strReplace.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    var reg = new RegExp(esc, 'ig');
    return this.replace(reg, strWith);
};

app.get("/messages", (req, res) => {
    //Get all of the messages so pass in an empty object
    Message.find({}, (err, messages) => {
        res.send(messages);
    })
})

app.post("/messages", (req, res) => {
    var req_body = req.body;
    badwords.forEach(badword => {
        req_body.message = req_body.message.replaceAll(badword,"####");
    });
    
    console.log(req_body);
    var chat_message = new Message(req_body);
    

    chat_message.save().then( () => {
        //Did someone send a message with a badword in it
        console.log("message saved");
        //Broadcast to all sockets that a new message has been posted
        io.emit("message", req_body);
        res.sendStatus(200); 
    }).catch((err)=>{
        res.sendStatus(500);
        console.log(err);
    })
    


})

app.post("/typing", (req, res) => {
    console.log(req.body);
    io.emit("typing", req.body);
    res.sendStatus(200);
})

io.on("connection", (socket) => {
    /*io.emit("testing", {test: "working"});
    socket.on("testing", (from, msg) => {
        console.log("I recieved a message from ", from, "saying", msg);
    })*/
    socket.on('typing', name => {
        console.log('got typing message for', name)
        socket.broadcast.emit('typing', name);

    })
    console.log("user connected to socket", socket.id);
})

mongoose.connect(dbURL, {useNewUrlParser: true}, (err) => {
    console.log("mongo db connection", err);
})

var server = http.listen(3000, () => {
    console.log("server is created and connected to port: " + server.address().port);
});
