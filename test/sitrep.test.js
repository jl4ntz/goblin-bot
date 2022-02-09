var sitrep = require("./../sitrep")
var assert = require('assert');

describe('#getZone()',function(){
    it('Should return expected zone_id', function() {
        assert.equal(sitrep.getZone(96076140),364)
    })
})