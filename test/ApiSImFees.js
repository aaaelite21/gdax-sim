const ApiSim = require('../Lib/ApiSim');
const WebsocketSim = require('../Lib/WebsocketSim');
const UserSim = require('../Lib/UserAccountSim');

const assert = require('assert');
const crypto = require('crypto');
//const TestDay = require('../TestData/27Nov2018LTCUSD.json');

describe('#ApiSim', () => {
    describe('#init', () => {
        it('takes a starting fiat value', () => {
            let sim = new ApiSim(5, 10, 0.5);
            assert.equal(sim.user.fiatBalance, 5);
        });
        it('takes a starting crypto value', () => {
            let sim = new ApiSim(5, 10, 0.5);
            assert.equal(sim.user.cryptoBalance, 10);
        });
        it('takes a taker fee value', () => {
            let sim = new ApiSim(5, 10, 0.5);
            assert.equal(sim.taker_fee, 0.005);
        });
    });
});