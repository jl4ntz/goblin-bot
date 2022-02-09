const handler = require('./sitrep.js');
const WebSocket = require('ws');


let pcRunning = false;

let pcTimeout = 0;

function listen() {
    let experienceEvents = '{"service":"event","action":"subscribe","characters":["all"],"eventNames":["GainExperience"],"worlds":["1","17"]}';
    let pcURI = 'wss://push.planetside2.com/streaming?environment=ps2&service-id=s:'+ process.env.serviceID;
    if(!pcRunning) {
        let pcClient = new WebSocket(pcURI);
        
        pcClient.on('open', function open(){
                console.log('Connected to PC Stream API');
                pcClient.send(experienceEvents);
                pcRunning = true;
        });
        
        
        pcClient.on('message', function incoming(data){
            let parsed = JSON.parse(data);
            if(parsed.payload != null){
                handler.handleMessage(parsed.payload);
            }
        });
        
        pcClient.on('error', function err(error){
            console.log("PC error: "+ error);
            console.log("Closing socket");
            pcClient.close();
        });
        
        pcClient.on('close', function close(){
            pcRunning = false;
            setTimeout(function() {
                pcTimeout++;
                listen();
            }, Math.min(1000 * (2 ** pcTimeout), 300000));
        });
        
    }
}

module.exports = {
    start: function(){
        listen();   
    }
}