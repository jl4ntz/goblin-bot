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

const zoneData = [
    {
      world_id:"1",
      zone_id:"2",
      name:"Indar",
      isLocked:"false",
      hasAlert:"false"
    },
    {
      world_id:"1",
      zone_id:"4",
      name:"Hossin",
      isLocked:"false",
      hasAlert:"false"
    },
    {
      world_id:"1",
      zone_id:"6",
      name:"Amerish",
      isLocked:"false",
      hasAlert:"false"
    },    
    {
      world_id:"1",
      zone_id:"8",
      name:"Esamir",
      isLocked:"false",
      hasAlert:"false"
    },       
    {
      world_id:"1",
      zone_id:"14",
      name:"Koltyr",
      isLocked:"false",
      hasAlert:"false"
    },   
    {
      world_id:"1",
      zone_id:"344",
      name:"Oshur",
      isLocked:"false",
      hasAlert:"false"
    },  
    {
      world_id:"1",
      zone_id:"361",
      name:"Desolation",
      isLocked:false
    },
    {
      world_id:"17",
      zone_id:"2",
      name:"Indar",
      isLocked:"false",
      hasAlert:"false"
    },
    {
      world_id:"17",
      zone_id:"4",
      name:"Hossin",
      isLocked:"false",
      hasAlert:"false"
    },
    {
      world_id:"17",
      zone_id:"6",
      name:"Amerish",
      isLocked:"false",
      hasAlert:"false"
    },    
    {
      world_id:"17",
      zone_id:"8",
      name:"Esamir",
      isLocked:"false",
      hasAlert:"false"
    },       
    {
      world_id:"17",
      zone_id:"14",
      name:"Koltyr",
      isLocked:"false",
      hasAlert:"false"
    },   
    {
      world_id:"17",
      zone_id:"344",
      name:"Oshur",
      isLocked:"false",
      hasAlert:"false"
    },  
    {
      world_id:"17",
      zone_id:"361",
      name:"Desolation",
      isLocked:"false",
      hasAlert:"false"
    }    
];

function getZoneData(world_id, zone_id) {
  for (let i = 0; i < zoneData.length; i++) {
    if(zoneData[i].world_id == world_id && zoneData[i].zone_id == zone_id) {
      return zoneData[i];
    }
  }
}



const worlds = {
  "1": "Connery",
  "17": "Emerald"
}

function getZone(zone_id) {
  return zone_id & 0xFFFF
}

let characterMap = new Map();
let worldZoneMap = new Map();

const handleMessage = async function(message) {
  if ((message.world_id !== "1" && message.world_id !== "17") || !zones.hasOwnProperty(getZone(message.zone_id))) {
    return;
  }
  
  if(message.event_name == 'GainExperience') {
    let characterData = {
      lastSeen: message.timestamp,
      zone_id: getZone(message.zone_id),
      world_id: message.world_id
    };

    characterMap.set(message.character_id, characterData); 
  }
  
  if(message.event_name == 'MetagameEvent') {
    for (let i = 0; i < zoneData.length; i++) {
      if(zoneData[i].world_id == message.world_id && zoneData[i].zone_id == getZone(message.zone_id)) {
        if(message.metagame_event_state == '135') {
          zoneData[i].hasAlert = true;
          zoneData[i].alertEndTimestamp = getAlertEndTimeStamp(message.metagame_event_id, message.timestamp);
        }
        
        if(message.metagame_event_state == '138') {
          zoneData[i].hasAlert = false;
        }
      }
    } 
  }
}

function getAlertEndTimeStamp(metagame_event_id, timestamp) {
  var duration = 0;
  switch(metagame_event_id) {
    //Continent Lock alerts
    case "147":
    case "148":
    case "149":
    case "150":
    case "151":
    case "152":
    case "153":
    case "154":
    case "155":
    case "156":
    case "157":
    case "158":
        duration = 5400;
        break;
    //Unstable Meltdowns
    case "176":
    case "177":
    case "178":
    case "179":
    case "186":
    case "187":
    case "188":
    case "189":
    case "190":
    case "191":
    case "192":
    case "193":
        duration = 2700;
        break;
    //Koltyr Alerts
    case "208":
    case "209":
    case "210":
        duration = 1800;
        break;
    default:
        return 0;
  }
  return +timestamp + duration;
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
        if(shouldAddAlertIcon(getZoneData(world, zone))){
          zoneName += ' 🚨'
        }
        zoneStats[zoneName] = zoneCount;
      }
    })
    worldStats[worldName] = zoneStats;
  })
  return worldStats;
}

function shouldAddAlertIcon(zoneData) {
  if(zoneData.hasAlert && Math.floor(Date.now() / 1000) < zoneData.alertEndTimestamp) {
    return true;
  } else {
    return false;
  }
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
  getZoneData,
  getZone,
  getAlertEndTimeStamp,
  handleMessage: async function(message) {
    handleMessage(message);
  },
  getPopulationStats: async function() {
    return getPopulationStats();
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