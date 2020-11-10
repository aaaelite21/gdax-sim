const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");

const marketBuyPerams = {
  product_id: "LTC-USD",
  funds: 200,
  type: "market",
};

const marketSellPerams = {
  product_id: "LTC-USD",
  funds: 200,
  type: "market",
};

describe("#ApiSim Market Orders With Funds", () => {
  describe("#buy", () => {
    it("rejects the order if the user lacks the fiat based on order funds", () => {
      let Gdax = new ApiSim(100, 100);
      Gdax.currentPrice = 35;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
  });

  describe("#sell", () => {
    it("rejects the order if the user lacks the crypto based on order funds", () => {
      let Gdax = new ApiSim({
        base_balance: 0,
        quote_balance: 2,
      });
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
  });

  describe("#fillOrder", () => {
    let time = "2018-12-06T01:46:01.162000Z";
    it("produces a match with the proper variables", () => {
      let Gdax = new ApiSim({
        base_balance: 2000,
        quote_balance: 2000,
      });
      Gdax.currentPrice = 20;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        let order = Gdax.user.orders[0];
        let match = Gdax.fillOrder(data.id, data.size, time)[0];
        assert.strictEqual(match.size, order.filled_size);
      });
    });

    it("has the proper adjustmets made to the json object", () => {
      let Gdax = new ApiSim({
        base_balance: 2000,
        quote_balance: 2000,
      });
      Gdax.currentPrice = 20;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        let order = Gdax.user.orders[0];
        assert.strictEqual(order.settled, true);
        assert.strictEqual(order.status, "done");
        assert.strictEqual(
          order.fill_fees,
          (parseFloat(marketBuyPerams.funds) * Gdax.taker_fee).toString(),
        );
        assert.strictEqual(order.done_reason, "filled");
        assert.strictEqual(order.done_at, Gdax.currentTime);
        assert.strictEqual(order.stp, undefined);
        assert.strictEqual(
          order.specified_funds,
          marketBuyPerams.funds.toString(),
        );
        assert.strictEqual(
          order.funds,
          (marketBuyPerams.funds * 0.995).toString(),
        );
        assert.strictEqual(
          order.filled_size,
          (order.funds / Gdax.currentPrice).toString(),
        );
        assert.strictEqual(order.executed_value, order.funds);
      });
    });

    it("deducts the value of the order (funds) from the fiat balance", () => {
      let Gdax = new ApiSim({
        base_balance: 0,
        quote_balance: 500,
      });
      Gdax.currentPrice = 35;
      let baseBalance = Gdax.user.fiatBalance;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(
          Gdax.user.fiatBalance,
          baseBalance - marketBuyPerams.funds,
        );
      });
    });
    it("adds the (funds - fee /price) of a market buy order to the crypto account", () => {
      let Gdax = new ApiSim({
        base_balance: 0,
        quote_balance: 1000,
      });
      Gdax.currentPrice = 35;
      let target =
        Gdax.user.cryptoBalance +
        (marketBuyPerams.funds * 0.995) / Gdax.currentPrice;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.cryptoBalance, target);
      });
    });
    it("deducts the value of the order (funds) from the crypto balance", () => {
      let Gdax = new ApiSim(0, 10);
      Gdax.currentPrice = 35;
      let targetBalance =
        Gdax.user.cryptoBalance - marketBuyPerams.funds / Gdax.currentPrice;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(
          Gdax.user.cryptoBalance.toFixed(2),
          targetBalance.toFixed(2),
        );
      });
    });
    it("adds the (funds - fee) of a order to the fiat account", () => {
      let Gdax = new ApiSim(0, 10);
      Gdax.currentPrice = 35;
      let target = Gdax.user.fiatBalance + marketSellPerams.funds * 0.995;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.fiatBalance, target);
      });
    });
  });

  describe("#backtest", () => {});
});
