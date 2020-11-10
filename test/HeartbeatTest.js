const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");
const TestData = require("./TestData");
/*
{ type: 'heartbeat',
  last_trade_id: 0,
  product_id: 'ETH-USD',
  sequence: 6091333230,
  time: '2019-01-05T22:18:01.908041Z' }
*/
describe("#Heartbeats", () => {
  describe("#Create Heartbeats", () => {
    let Gdax = new ApiSim();
    let pair = "ETH-USDC";
    let time = Date.now();
    let hb = Gdax.createHeartbeat(pair, time);
    assert.strictEqual(hb.type, "heartbeat");
    assert.strictEqual(hb.time, new Date(time).toISOString());
    assert.strictEqual(hb.product_id, pair);
  });
  describe("#Fill in missing minutes with heartbeats (for now)", () => {
    let Gdax = new ApiSim();
    let count = 0,
      tested = false;
    Gdax.websocketClient.on("message", (message) => {
      if (count === 4) {
        assert.strictEqual(message.type, "heartbeat");
        tested = true;
      }
      count++;
    });
    Gdax.backtest(TestData.testCandlesMissingMinute);
    assert(tested);
  });
  describe("#Behavior of limit buy and sells are the same", () => {
    it("completes a buy order when the price crosses down through that price between matches", () => {
      let count = 0;
      let Gdax = new ApiSim();
      let order;
      Gdax.currentPrice = 29.4;
      Gdax.buy(
        {
          price: 29.26,
          size: 0.1,
          product_id: "LTC-USD",
        },
        (err, res, data) => {
          order = data;
        },
      );
      Gdax.websocketClient.on("message", (message) => {
        if (count === 4) {
          assert.strictEqual(message.type, "heartbeat");
        }
        if (count === 5) {
          assert.strictEqual(message.maker_order_id, order.id);
          assert.strictEqual(message.type, "match");
        }
        count++;
      });
      Gdax.backtest(TestData.testCandlesMissingMinute);
    });
  });
});
