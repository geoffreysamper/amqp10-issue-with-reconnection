require("console-stamp")(console);
//load env'
require('dotenv').config();
var amqp = require('amqp10');
var AMQPClient = require('amqp10').Client;
var Policy = require('amqp10').Policy;
var utils = require("./utils");
var queueName = process.env.QUEUE_NAME || 'queue';
var debug = require('debug')('pending');
var format = require('date-format');
let pending = 0;
var connectstring = utils.createConnectionString();
var client = new AMQPClient(Policy.ServiceBusQueue);
var fs = require('fs');
client.on(AMQPClient.ErrorReceived, function (err) {
    console.log('error received on client', err)
});

var interval = 100;
var numOfRecjection = 0;

log(`STARTED interval set to ${interval}`);


client.on(AMQPClient.ConnectionOpened, function (err) {
    log(`connection opened pending message: ${pending}, rejected messages: ${numOfRecjection} `);
    numOfRecjection = 0;
});

client.on(AMQPClient.ConnectionClosed, function (err) {

    log('connection closed pending message: ' + pending);
});

client.on('connected', function (err) {

    log('connected pending message: ' + pending);


});

client.on('attemptReconnecting', function (info) {
    var msg = `In ${info.timeout} wil reconnect and num pending messages: ${pending}\n`;
    log(msg);

});

function log(msg) {
    var time = format.asString('hh:mm:ss.SSS', new Date());
    var message = `[${time}] ${msg}`;
    fs.appendFile('./log.log', message + '\n', function (err) { });
    console.log(msg)
}


var connectPromise = client.connect(connectstring);

connectPromise.then(setupSender).catch(err => console.error(err));

function startSendingMessages(sender) {
    sender.on('senderlink:pendingsends', function (info) {
        pending = info.pending;
        debug('Has pending sends', info.pending);
    });

    var intervalCounter = 0;

    for (let i = 0; i < 10; i++) {
        setInterval(function () {
            for (let j = 0; j < 10; j++) {
                sendMessage(sender, intervalCounter + '_' + i);
            }
            intervalCounter++;
        }, interval)

    }
}

function setupSender() {
    console.log('setup sender');
    client.createSender('queue').then(startSendingMessages).catch(err => console.error(err));
}

var messageCount = [];
function sendMessage(sender, loop) {
    messageCount[loop] = messageCount[loop] || { attempted: 0, completed: 0, error: 0 };
    var stat = messageCount[loop];
    stat.attempted++;
    var payload = `abc`;
    sender.send(payload).then(function () {
        messageCount[loop].completed++;

        if ((stat.error + stat.completed) % 10 === 0) {
            console.log(` attempted ${stat.attempted} and  completed ${stat.completed}, failed ${stat.error} to the queue in loop ${loop}`);
        }


    }).catch(

        function (err) {
            stat.error++;
            if ((stat.error + stat.completed) % 10 === 0) {
                console.log(`ERROR ${stat.attempted} and  completed ${stat.completed}, failed ${stat.error} to the queue in loop ${loop}`);
            }
            numOfRecjection++;
            errorCallback(err, loop);
        });


}

function errorCallback(err, loop) {
    //   console.error("error while sending in loop",  loop||'', err.message);
};