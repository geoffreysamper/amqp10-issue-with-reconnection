require("console-stamp")(console);
//load env'
require('dotenv').config();
var amqp = require('amqp10');
var AMQPClient = require('amqp10').Client;
var Policy = require('amqp10').Policy;
var utils = require("./utils");
var queueName = process.env.QUEUE_NAME || 'queue';

var connectstring = utils.createConnectionString();
var client = new AMQPClient(Policy.ServiceBusQueue);

client.on(AMQPClient.ErrorReceived, function(err){
    console.log('error received on client', err)
});


client.on(AMQPClient.ConnectionOpened, function(err){
    console.log('connection openened');
});

client.on(AMQPClient.ConnectionClosed, function(err){
    console.log('connection closed');
});

client.on('connected', function(err){
    console.log('connected');
});




var connectPromise = client.connect(connectstring);

connectPromise.then(setupSender).catch(err => console.error(err));


function setupSender() {
    console.log('setup sender');
    function startSendingMessages(sender) {
        console.log('sender created');
        setInterval(function () {
            sendMessage(sender);
        }, 10)

    }

    client.createSender('queue').then(startSendingMessages).catch(errorCallback);
}

var messageCount = 0;
function sendMessage(sender) {
    var payload = "abc";
    sender.send(payload).then(function (){
        messageCount ++;

        if (messageCount == 1000){
            console.log('send 1.000 message to the queue');
            messageCount =0;
        }
    }).catch(errorCallback);
}

function errorCallback(err) {
    console.error("error while sending", err);
    console.error("failed sending message,", err);
};




