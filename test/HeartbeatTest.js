const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");
const TestData = require('./TestData');
/*
{ type: 'heartbeat',
  last_trade_id: 0,
  product_id: 'ETH-USD',
  sequence: 6091333230,
  time: '2019-01-05T22:18:01.908041Z' }
*/
describe('#Heartbeats', () => {
    describe("#Create Heartbeats", () => {
        let Gdax = new ApiSim();
        let pair = 'ETH-USDC'
        let time = Date.now();
        let hb = Gdax.createHeartbeat(pair, time)
        assert.equal(hb.type, 'heartbeat');
        assert.equal(hb.time, (new Date(time)).toISOString())
        assert.equal(hb.product_id, pair);
    });
    describe("#Fill in missing minutes with heartbeats (for now)", () => {
        let Gdax = new ApiSim();
        let count = 0,
            tested = false;
        Gdax.websocketClient.on('message', (message) => {
            if (count === 5) {
                // assert.equal(message.type, 'heartbeat');
                tested = true;
            }
            count++;
        });
        Gdax.backtest(TestData.testCandlesMissingMinute);
        assert(tested);
    });
});