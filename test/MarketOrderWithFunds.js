const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");

const marketBuyPerams = {
    product_id: 'LTC-USD',
    funds: 200,
    type: 'market'
};

describe("#ApiSim Market Orders With Funds", () => {
    describe("#buy", () => {
        it("rejects the order if the user lacks the fiat based on order funds", () => {
            let Gdax = new ApiSim(100, 100);
            Gdax.currentPrice = 35;
            Gdax.buy(marketBuyPerams, (err, res, data) => {
                assert.equal(data.status, "rejected");
            });
        });
    });


    describe("#fillOrder", () => {
        let time = "2018-12-06T01:46:01.162000Z";
        it("deducts the value of the order (funds) from the fiat balance", () => {
            let Gdax = new ApiSim(500, 0);
            Gdax.currentPrice = 35
            let baseBalance = Gdax.user.fiatBalance;
            Gdax.buy(marketBuyPerams, (err, res, data) => {
                Gdax.fillOrder(data.id, data.size, time);
                assert.equal(Gdax.user.fiatBalance.toFixed(2), baseBalance - marketBuyPerams.funds);
            });
        });
        it("adds the (funds - fee /price) of a market buy order to the crypto account", () => {
            let Gdax = new ApiSim(1000, 0);
            Gdax.currentPrice = 35;
            let target =
                Gdax.user.cryptoBalance +
                marketBuyPerams.funds * 0.997 / Gdax.currentPrice;
            Gdax.buy(marketBuyPerams, (err, res, data) => {
                Gdax.fillOrder(data.id, data.size, time);
                assert.equal(Gdax.user.cryptoBalance, target);
            });
        });
    });

    describe("#backtest", () => {});
});