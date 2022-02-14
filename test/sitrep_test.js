var sitrep = require("./../sitrep")
var assert = require('assert');
const decache = require('decache');

describe('#getZone()', function() {
    it('Should return expected zone_id', function() {
        assert.equal(sitrep.getZone(96076140), 364);
    });
});

describe('#getAlertEndTimeStamp', function() {
    it('Should return the timestamp value of input timestamp plus appropriate duration', function() {
        let timestamp = '1644465857';
        let metagame_event_id = '147';
        assert.equal(sitrep.getAlertEndTimeStamp(metagame_event_id, timestamp), '1644471257');
    });
});

describe('#getZoneData', function() {
    it('should return zone data from given world_id and zone_id', function() {
        assert.equal(sitrep.getZoneData('17', '2').name, 'Indar');
    });
});

describe('#handleMessage()', function() {
    it('Should set zones alert to true when metagame event alert start message is received and back to false when end is received', async function() {
        let startAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"1644465857","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let endAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"138","timestamp":"1644465857","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');

        await sitrep.handleMessage(startAlert.payload);
        assert.equal(sitrep.getZoneData('17', '2').hasAlert, true);
        assert.equal(sitrep.getZoneData('17', '2').alertEndTimestamp, '1644471257');

        await sitrep.handleMessage(endAlert.payload);
        assert.equal(sitrep.getZoneData('17', '2').hasAlert, false);
    });

    it('Should set zone lockTimestamp when ContinentLock message is received', async function() {
        let continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"1644557756","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);

        assert.equal(sitrep.getZoneData('17', '2').isLocked, true);
        assert.equal(sitrep.getZoneData('17', '2').lockTimestamp, '1644557756');
    });

    it('Should set isLocked to false when FacilityControl event arrives after lock timout', async function() {
        let continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"1644557756","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);

        let facilityControl = JSON.parse('{"payload":{"event_name":"FacilityControl","timestamp":"1644557815","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(facilityControl.payload);
        assert.equal(sitrep.getZoneData('17', '2').isLocked, true);
        assert.equal(sitrep.getZoneData('17', '2').lockTimestamp, '1644557756');

        facilityControl = JSON.parse('{"payload":{"event_name":"FacilityControl","timestamp":"1644557817","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(facilityControl.payload);
        assert.equal(sitrep.getZoneData('17', '2').isLocked, false);
    });
});

describe('#getPopulationStats()', function() {
    it('should set hasAlert when hasAlert is true', async function() {
        let startAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"4800150569","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let endAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"138","timestamp":"1644465857","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let addCharacter = JSON.parse('{"payload":{"character_id":"5429228603772128721","event_name":"GainExperience","timestamp":"4800150569","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let expiredAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"1581342432","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');

        await sitrep.handleMessage(addCharacter.payload);
        let populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"]["population"], 1);

        await sitrep.handleMessage(startAlert.payload);
        populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"]["hasAlert"], true);

        await sitrep.handleMessage(endAlert.payload);
        populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"]["population"], 1);

        await sitrep.handleMessage(expiredAlert.payload);
        populationStats = await sitrep.getPopulationStats();
        assert.equal(populationStats["Emerald"]["Indar"]["population"], 1);
    });
});

describe('#getRemainingAlertTime()', function() {
    before(async () => {
        let currentTimestamp = Math.floor(Date.now() / 1000);
        let startTimestamp = +currentTimestamp - (5400 - 3860);
        let startAlert = JSON.parse('{"payload":{"event_name":"MetagameEvent","metagame_event_id":"149","metagame_event_state":"135","timestamp":"' + startTimestamp + '","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        let addCharacter = JSON.parse('{"payload":{"character_id":"5429228603772128721","event_name":"GainExperience","timestamp":"4800150569","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(addCharacter.payload);
        await sitrep.handleMessage(startAlert.payload);
    });

    it('should return the remaining alert time as 1h 4m', function() {
        let result = sitrep.getRemainingAlertTime('17', '2');
        assert.equal(result, '1h 4m');
    });
});


describe('#getOutputString()', function() {
    it('should return output string with alert data when hasAlert is true', function() {
        let zoneStats = JSON.parse('{"Indar":{"hasAlert":false,"alertRemainingTime":"","population":107},"Oshur":{"hasAlert":false,"alertRemainingTime":"","population":24}}');
        assert.equal(sitrep.getOutputString(zoneStats), 'Indar: 107\nOshur: 24\n');

        zoneStats = JSON.parse('{"Indar":{"hasAlert":true,"alertRemainingTime":"4h 20m","population":107},"Oshur":{"hasAlert":false,"alertRemainingTime":"","population":24}}');
        assert.equal(sitrep.getOutputString(zoneStats), 'Indar: 107  (🚨 4h 20m)\nOshur: 24\n');
    });
    
    it('should add 🔒 when continent is locked', function() {
       let zoneStats = JSON.parse('{"Indar":{"hasAlert":true,"alertRemainingTime":"4h 20m","population":107},"Oshur":{"hasAlert":false,"alertRemainingTime":"","population":24,"isLocked":true}}');
       assert.equal(sitrep.getOutputString(zoneStats), 'Indar: 107  (🚨 4h 20m)\n🔒 Oshur: 24\n')
    });
});

describe('#getNextUnlockContinent()', function() {
    beforeEach(async function() {
        decache("./../sitrep");
        sitrep = require("./../sitrep");
    });
    
    it('should return the name of the oldest locked continent', async function() {
        let continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"100","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"101","world_id":"17","zone_id":"4"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"102","world_id":"17","zone_id":"6"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"103","world_id":"17","zone_id":"8"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"104","world_id":"17","zone_id":"344"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        assert.equal(sitrep.getNextUnlockContinent('17'), 'Indar');


        let facilityControl = JSON.parse('{"payload":{"event_name":"FacilityControl","timestamp":"200","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(facilityControl.payload);
        assert.equal(sitrep.getNextUnlockContinent('17'), 'Hossin');
    });

    it('should do something if we dont have all continent data', async function() {
        let continentLock = JSON.parse('{"payload":{"event_name":"FacilityControl","timestamp":"200","world_id":"17","zone_id":"2"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"201","world_id":"17","zone_id":"4"},"service":"event","type":"serviceMessage"}');
        await sitrep.handleMessage(continentLock.payload);
        continentLock = JSON.parse('{"payload":{"event_name":"ContinentLock","timestamp":"202","world_id":"17","zone_id":"6"},"service":"event","type":"serviceMessage"}');
        assert.equal(sitrep.getNextUnlockContinent('17'), 'unknown');
    });
});