const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");

const marketBuyPerams = {
    product_id: 'LTC-USD',
    size: 3,
    type: 'market'
};

describe("#ApiSim getOrder", () => {
    let time = "2018-12-06T01:46:01.162000Z";
    it("calls the callback that it is given", (done) => {
        let Gdax = new ApiSim(100, 0);
        Gdax.currentPrice = 30;
        Gdax.buy(marketBuyPerams, (err, res, firstData) => {
            Gdax.getOrder(firstData.orderId, done);
        });
    });
    it("get the order based on id before it is filled", () => {
        let Gdax = new ApiSim(100, 0);
        Gdax.currentPrice = 30;
        Gdax.buy(marketBuyPerams, (err, res, firstData) => {
            Gdax.getOrder(firstData.id, (err, res, data) => {
                assert.deepEqual(data, firstData)
            });
        });
    });
    it("get the order based on id after it is filled", () => {
        let Gdax = new ApiSim(100, 0);
        Gdax.currentPrice = 30;
        Gdax.buy(marketBuyPerams, (err, res, firstData) => {
            Gdax.fillOrder(firstData.id, firstData.size, time);
            Gdax.getOrder(firstData.id, (err, res, data) => {
                assert.deepEqual(data, firstData)
            });
        });
    });
});