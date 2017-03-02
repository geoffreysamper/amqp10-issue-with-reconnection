try simulate reconnection failure with amqp10  on service bus

# how to use
- npm install
- make a copy of default.env and save is as .env
- configure enviremont variables in the .env
- edit file default.env and fill in the values and rename it to .env
- install [cports](http://www.nirsoft.net/utils/cports.html) for windows or tcpkill for linux
- run node.exe index.js

#how to simulate the failure
- run node index.js
- kill connection
- look at the log file (log.log)


