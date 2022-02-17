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
};

const zoneData = [{
    world_id: "1",
    zone_id: "2",
    name: "Indar",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "1",
    zone_id: "4",
    name: "Hossin",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "1",
    zone_id: "6",
    name: "Amerish",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "1",
    zone_id: "8",
    name: "Esamir",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "1",
    zone_id: "14",
    name: "Koltyr",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "1",
    zone_id: "344",
    name: "Oshur",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "1",
    zone_id: "361",
    name: "Desolation",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "2",
    name: "Indar",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "4",
    name: "Hossin",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "6",
    name: "Amerish",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "8",
    name: "Esamir",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "14",
    name: "Koltyr",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "344",
    name: "Oshur",
    lockTimestamp: "0",
    hasAlert: "false"
  },
  {
    world_id: "17",
    zone_id: "361",
    name: "Desolation",
    lockTimestamp: "0",
    hasAlert: "false"
  }
];

function getZoneData(world_id, zone_id) {
  for (let i = 0; i < zoneData.length; i++) {
    if (zoneData[i].world_id == world_id && zoneData[i].zone_id == zone_id) {
      return zoneData[i];
    }
  }
}



const worlds = {
  "1": "Connery",
  "17": "Emerald"
};

function getZone(zone_id) {
  return zone_id & 0xFFFF;
}

let characterMap = new Map();

const handleMessage = async function(message) {
  if ((message.world_id !== "1" && message.world_id !== "17") || !zones.hasOwnProperty(getZone(message.zone_id))) {
    return;
  }

  if (message.event_name == 'GainExperience') {
    let characterData = {
      lastSeen: message.timestamp,
      zone_id: getZone(message.zone_id),
      world_id: message.world_id
    };

    characterMap.set(message.character_id, characterData);
  }

  if (message.event_name == 'ContinentLock') {
    for (let i = 0; i < zoneData.length; i++) {
      if (zoneData[i].world_id == message.world_id && zoneData[i].zone_id == getZone(message.zone_id)) {
        zoneData[i].lockTimestamp = message.timestamp;
        zoneData[i].isLocked = true;
        console.log(getTimestamp() + ' zoneData[' + i + '] after ContinentLock: ' + JSON.stringify(zoneData[i]));
        break;
      }
    }
  }

  if (message.event_name == 'FacilityControl') {
    for (let i = 0; i < zoneData.length; i++) {
      if (zoneData[i].world_id == message.world_id && zoneData[i].zone_id == getZone(message.zone_id)) {
        if (+zoneData[i].lockTimestamp < +message.timestamp - 60 && zoneData[i].isLocked) {
          zoneData[i].isLocked = false;
          console.log(getTimestamp() + ' zoneData[' + i + '] after continent unlock detected: ' + JSON.stringify(zoneData[i]));
        }
        break;
      }
    }
  }

  if (message.event_name == 'MetagameEvent') {
    for (let i = 0; i < zoneData.length; i++) {
      if (zoneData[i].world_id == message.world_id && zoneData[i].zone_id == getZone(message.zone_id)) {
        console.log(getTimestamp() + ' received MetaGameEvent: ' + JSON.stringify(message));
        if (message.metagame_event_state == '135') {
          zoneData[i].hasAlert = true;
          zoneData[i].alertEndTimestamp = getAlertEndTimeStamp(message.metagame_event_id, message.timestamp);
        }

        if (message.metagame_event_state == '138') {
          zoneData[i].hasAlert = false;
        }
        console.log(getTimestamp() + ' zoneData[' + i + '] after MetaGameEvent: ' + JSON.stringify(zoneData[i]));
        break;
      }
    }
  }
};

function getAlertEndTimeStamp(metagame_event_id, timestamp) {
  var duration = 0;
  switch (metagame_event_id) {
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
    case "211":
    case "212":
    case "213":
    case "214":
    case "222":
    case "223":
    case "224":
    case "226":
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

function minutesAgoTimestamp(minutes) {
  return Math.floor(Date.now() / 1000) - (+minutes * 60);
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
      let zonePopulationCount = 0;

      let characterTimeoutSeconds = minutesAgoTimestamp(5);
      
      characterMap.forEach(character => {
        if (character.world_id == world && character.zone_id == zone && character.lastSeen >= characterTimeoutSeconds) {
          zonePopulationCount++;
        }

        if (character.lastSeen < characterTimeoutSeconds) {
          characterMap.delete(character.character_id);
        }
      });

      if (zonePopulationCount > 0) {
        let addAlertInfo = shouldAddAlertIcon(getZoneData(world, zone));
        let zoneDetail = {};
        if (addAlertInfo) {
          zoneDetail.hasAlert = true;
          zoneDetail.alertRemainingTime = getRemainingAlertTime(world, zone);
        }
        else {
          zoneDetail.hasAlert = false;
          zoneDetail.alertRemainingTime = '';
        }
        zoneDetail.population = zonePopulationCount;
        zoneDetail.isLocked = getZoneData(world, zone).isLocked;
        zoneStats[zoneName] = zoneDetail;
      }
    });
    worldStats[worldName] = zoneStats;
  });
  return worldStats;
};

function shouldAddAlertIcon(zoneData) {
  if (zoneData.hasAlert && Math.floor(Date.now() / 1000) < zoneData.alertEndTimestamp) {
    return true;
  }
  else {
    return false;
  }
}

function getOutputString(zoneStats) {
  let output = "";
  let keysSorted = Object.keys(zoneStats).sort(function(a, b) { return zoneStats[b].population - zoneStats[a].population });
  keysSorted.forEach(key => {
    if (zoneStats[key].isLocked) {
      output += '🔒 ';
    }
    output += key + ": " + zoneStats[key].population;
    if (zoneStats[key].hasAlert) {
      output += '  (🚨 ' + zoneStats[key].alertRemainingTime + ")";
    }
    output += '\n';
  });
  return output;
}

function getRemainingAlertTime(world_id, zone_id) {
  var response = '';
  let currentTimestamp = Math.floor(Date.now() / 1000);
  let alertEndTimestamp = getZoneData(world_id, zone_id).alertEndTimestamp;
  if (alertEndTimestamp !== 'undefined') {
    var secondsLeft = +alertEndTimestamp - +currentTimestamp;

    let hours = Math.floor(+secondsLeft / 3600);
    secondsLeft = +secondsLeft - (+hours * 3600);
    let minutes = Math.floor(+secondsLeft / 60);
    secondsLeft = +secondsLeft - (+minutes * 60);

    response = '';
    if (+hours > 0) {
      response += hours + 'h ';
    }
    response += minutes + 'm';
  }
  return response;
}

function getNextUnlockContinent(world_id) {
  const checkedZones = ['2', '4', '6', '8', '344'];
  let oldestLockedTimestamp = '9999999999'; //initialize to future timestamp
  let oldestLockedContinentName = '';
  for (let i = 0; i < zoneData.length; i++) {
    if (zoneData[i].world_id == world_id && checkedZones.includes(zoneData[i].zone_id)) {
      if (typeof zoneData[i].isLocked === 'undefined') {
        return 'unknown';
      }
      else if (zoneData[i].isLocked) {
        if (zoneData[i].lockTimestamp < oldestLockedTimestamp) {
          oldestLockedTimestamp = zoneData[i].lockTimestamp;
          oldestLockedContinentName = zoneData[i].name;
        }
      }
    }
  }
  return oldestLockedContinentName;
}

function getTimestamp() {
  const pad = (n, s = 2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
  const d = new Date();

  return `${pad(d.getFullYear(),4)}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function printZoneData() {
  console.log(getTimestamp() + ' - zoneData: ' + JSON.stringify(zoneData));
  return JSON.stringify(zoneData);
}

module.exports = {
  printZoneData,
  getZoneData,
  getZone,
  getAlertEndTimeStamp,
  getRemainingAlertTime,
  getOutputString,
  getNextUnlockContinent,
  handleMessage: async function(message) {
    handleMessage(message);
  },
  getPopulationStats: async function() {
    return getPopulationStats();
  },
  sendZonePopulationStats: async function(message) {
    let resEmbed = new Discord.MessageEmbed();

    let zonePopulationData = await getPopulationStats().then(response => {
      console.log(getTimestamp() + ' PopulationStats: ' + JSON.stringify(response));
      resEmbed.setTitle("Planetside 2 Zone Population");
      resEmbed.addField("Connery", getOutputString(response["Connery"]), true);
      resEmbed.addField("Emerald", getOutputString(response["Emerald"]), true);
      let conneryNextContinent = getNextUnlockContinent('1');
      let emeraldNextContient = getNextUnlockContinent('17');

      if (conneryNextContinent != 'unknown') {
        resEmbed.addField("Connery next continent", getNextUnlockContinent('1'));
      }

      if (emeraldNextContient != 'unknown') {
        resEmbed.addField("Emerald next continent", getNextUnlockContinent('17'));
      }
    }).catch(e => {
      resEmbed.addField('error', e);
    });
    messageHandler.send(message.channel, resEmbed, "PC Online", true);
  }
};
