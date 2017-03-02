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

client.on(AMQPClient.ErrorReceived, function (err) {
    console.log('error received on client', err)
});


client.on(AMQPClient.ConnectionOpened, function (err) {
    console.log('connection openened');
});

client.on(AMQPClient.ConnectionClosed, function (err) {
    console.log('connection closed');
});

client.on('connected', function (err) {
    console.log('connected');
});




var connectPromise = client.connect(connectstring);

connectPromise.then(setupSender).catch(err => console.error(err));

function startSendingMessages(sender) {
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 1000; j++) {
            sendMessage(sender, i);
        }
    }
}

function setupSender() {
    console.log('setup sender');
    client.createSender('queue').then(startSendingMessages).catch(errorCallback);
}

var messageCount = [];
function sendMessage(sender, loop) {
    messageCount[loop] = messageCount[loop] || { attempted: 0, completed: 0 };

    messageCount[loop].attempted++;
    var payload = `abc`;
    sender.send(payload).then(function () {
        messageCount[loop].completed++;
                if (messageCount[loop].completed % 100 === 0) {
            console.log(` attempted ${messageCount[loop].attempted} and completed ${messageCount[loop].completed} to the queue in loop ${loop}`);
        }

        if (loop == 9 && messageCount[loop].completed == 1000) {
            console.warn('COMPLETED process completed starting in 10');

            setTimeout(function () {
                messageCount = [];
                startSendingMessages(sender);
            }, 10);
        }


    }).catch(errorCallback);
}

function errorCallback(err) {
    console.error("error while sending", err);
    console.error("failed sending message,", err);
};