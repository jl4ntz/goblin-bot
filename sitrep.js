const Discord = require('discord.js');
const messageHandler = require('./messageHandler.js');

const zones = {
  "2": "Indar",
  "4": "Hossin",
  "6": "Amerish",
  "8": "Esamir",
  "14": "Koltyr",
  "344": "Oshur",
  "361": "Desolation"
}

const worlds = {
  "1": "Connery",
  "17": "Emerald"
}

function getZone(zone_id) {
  return zone_id & 0xFFFF
}

let characterMap = new Map();

const handleMessage = async function(message) {
  if ((message.world_id !== "1" && message.world_id !== "17") || !zones.hasOwnProperty(getZone(message.zone_id))) {
    return;
  }

  let characterData = {
    lastSeen: message.timestamp,
    zone_id: getZone(message.zone_id),
    world_id: message.world_id
  };

  characterMap.set(message.character_id, characterData);
}

const getPopulationStats = async function() {
  var worldStats = new Object();
  let worldList = ['1', '17'];
  let zoneList = ['2', '4', '6', '8', '14', '344', '361'];

  worldList.forEach(world => {
    let worldName = worlds[world];
    let zoneStats = new Object();
    zoneList.map(zone => {
      let zoneName = zones[zone];
      let zoneCount = 0;

      characterMap.forEach(character => {
        if (character.world_id == world && character.zone_id == zone && character.lastSeen >= fiveMinutesAgo()) {
          zoneCount++;
        }
      })

      if (zoneCount > 0) {
        zoneStats[zoneName] = zoneCount;
      }
    })
    worldStats[worldName] = zoneStats;
  })
  return worldStats;
}

function fiveMinutesAgo() {
  return Math.floor(Date.now() / 1000) - 300;
}

function getOutputString(worldPop) {
  let output = "";
  let keysSorted = Object.keys(worldPop).sort(function(a,b){return worldPop[b]-worldPop[a]})
  keysSorted.forEach(key =>{
    output += key + ": " + worldPop[key] + "\n";
  })
  return output;
}

module.exports = {
  getZone,
  handleMessage: async function(message) {
    handleMessage(message);
  },
  sendZonePopulationStats: async function(message) {
    let resEmbed = new Discord.MessageEmbed();
    
    let zonePopulationData = await getPopulationStats().then(response => {
      resEmbed.setTitle("Planetside 2 Zone Population");
      resEmbed.addField("Connery", getOutputString(response["Connery"]), true);
      resEmbed.addField("Emerald", getOutputString(response["Emerald"]), true);
    }).catch(e => {
      resEmbed.addField('error', e);
    });
    messageHandler.send(message.channel, resEmbed, "PC Online", true);
  }
};