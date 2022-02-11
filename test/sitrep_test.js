var sitrep = require("./../sitrep")
var assert = require('assert');

describe('#getZone()',function(){
    it('Should return expected zone_id', function() {
        assert.equal(sitrep.getZone(96076140),364);
    });
});

describe('#getAlertEndTimeStamp', function(){
   it('Should return the timestamp value of input timestamp plus appropriate duration', function(){
       let timestamp = '1644465857';
       let metagame_event_id = '147';
       assert.equal(sitrep.getAlertEndTimeStamp(metagame_event_id, timestamp), '1644471257');
   });
});

describe('#getZoneData', function(){
    it('should return zone data from given world_id and zone_id', function(){
        assert.equal(sitrep.getZoneData('17','2').name, 'Indar');
    });
});

describe('#handleMessage()', function(){
    it('Should set zones alert to true when metagame event alert start message is received and back to false when end is received', async function(){
        let startAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"1644465857","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let endAlert   = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"138","timestamp":"1644465857","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');

        await sitrep.handleMessage(startAlert.payload);
        assert.equal(sitrep.getZoneData('17','2').hasAlert, true);
        assert.equal(sitrep.getZoneData('17','2').alertEndTimestamp, '1644471257');
        
        await sitrep.handleMessage(endAlert.payload);
        assert.equal(sitrep.getZoneData('17','2').hasAlert, false);
    });
});

describe('#getPopulationStats()', function(){
    it('should add 🚨 to zone name when hasAlert is true', async function(){
        let startAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"4800150569","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let endAlert   = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"138","timestamp":"1644465857","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let addCharacter = JSON.parse('{"payload":{"character_id":"5429228603772128721","event_name":"GainExperience","timestamp":"4800150569","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let expiredAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"1581342432","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        
        await sitrep.handleMessage(addCharacter.payload);
        let populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"],1);
        
        await sitrep.handleMessage(startAlert.payload);
        populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["🚨 Indar"],1);
        
        await sitrep.handleMessage(endAlert.payload);
        populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"],1);
        
        await sitrep.handleMessage(expiredAlert.payload);
        populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"],1);
    });  
});