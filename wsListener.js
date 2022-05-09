const handler = require('./sitrep.js');
const WebSocket = require('ws');


let pcRunning = false;

let pcTimeout = 0;

function listen() {
    let experienceEvents = '{"service":"event","action":"subscribe","characters":["all"],"eventNames":["GainExperience"],"worlds":["1","17"]}';
    let metagameEvents= '{"service":"event","action":"subscribe","worlds":["1","17"],"eventNames":["MetagameEvent","ContinentLock","FacilityControl"]}';
    let pcURI = 'wss://push.planetside2.com/streaming?environment=ps2&service-id=s:'+ process.env.serviceID;
    
    if(!pcRunning) {
        let pcClient = new WebSocket(pcURI, {rejectUnauthorized: false});
    
        
        
        pcClient.on('open', function open(){
                console.log('Connected to PC Stream API');
                pcClient.send(experienceEvents);
                pcClient.send(metagameEvents);
                pcRunning = true;
                pcTimeout = 0;
        });
        
        
        pcClient.on('message', function incoming(data){
            let parsed = JSON.parse(data);
            if(parsed.subscription != null) {
                console.log('Subscrition response: ' + data);
            } else if(parsed.payload != null){
                handler.handleMessage(parsed.payload);
            }
        });
        
        pcClient.on('error', function err(error){
            console.log("PC error: "+ error);
            console.log("Closing socket");
        });
        
        pcClient.on('close', function close(){
            console.log("Stream closed.");
            pcRunning = false;
            setTimeout(function() {
                pcTimeout++;
                console.log('reconnecting stream');
                listen();
            }, Math.min(1000 * (2 ** pcTimeout), 15000));
        });
        
    }
}

module.exports = {
    start: function(){
        listen();   
    }
}