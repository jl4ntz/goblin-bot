var got = require('got');
const Discord = require('discord.js');
var messageHandler = require('./messageHandler.js');

async function getPopulationData() {
    let uri = 'http://ps2.fisu.pw/api/population/?world=1,17';
    let response = "";
    try {
        response = await got(uri);
    } catch (err) {
        throw new Error("unable to contact fisu population API");
    }
    
    if(typeof(response.body) == 'undefined') {
        throw new Error("bad response from fisu population API")
    }
    
    let json = JSON.parse(response.body)
    
    if(typeof(json.result) == 'undefined'){
        throw new Error("bad response from fisu population API")
    }
    return json;
}

function getOutputsForServer(playerCounts) {
    let totalNoNS = playerCounts.vs + playerCounts.nc + playerCounts.tr;
    let vsPct = Math.round(playerCounts.vs / totalNoNS * 100);
    let ncPct = Math.round(playerCounts.nc / totalNoNS * 100);
    let trPct = Math.round(playerCounts.tr / totalNoNS * 100);
    let totalPlayers = playerCounts.vs + playerCounts.nc + playerCounts.tr + playerCounts.ns;
    
    let outputs = {
        totalPlayers: totalPlayers,
        vsPct: vsPct,
        vsPlayers: playerCounts.vs,
        ncPct: ncPct,
        ncPlayers: playerCounts.nc,
        trPct: trPct,
        trPlayers: playerCounts.tr,
        nsPlayers: playerCounts.ns
    }
    return outputs;
}

function getPopulationOutputString(outputs) {
    let outputString = "TR: " + outputs.trPlayers + "\t(" + outputs.trPct + "%)\n" +
                       "NC: " + outputs.ncPlayers + "\t(" + outputs.ncPct + "%)\n" +
                       "VS: " + outputs.trPlayers + "\t(" + outputs.vsPct + "%)\n" +
                       "NS: " + outputs.nsPlayers + "\n" +
                       "Total: " + outputs.totalPlayers
    return outputString                        
}

module.exports = {
    showPop: async function(message) {
        let resEmbed = new Discord.MessageEmbed();
        
        let popData = await getPopulationData().then(response => {
            let conneryOutputs = getOutputsForServer(response.result[1][0]);
            let emeraldOutputs = getOutputsForServer(response.result[17][0]);
            
            resEmbed.setTitle("Planetside 2 server population");
            resEmbed.addField("Connery Population", getPopulationOutputString(conneryOutputs), true);
            resEmbed.addField("Emerald Population", getPopulationOutputString(emeraldOutputs), true);
            
        }).catch(e => {
            resEmbed.addField('error', e)
        })
        messageHandler.send(message.channel, resEmbed, "PC Online", true);
    }
}