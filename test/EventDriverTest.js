const ApiSim = require("../gdax-sim");
const assert = require("assert");

const marketPerams = {
  product_id: "LTC-USD",
  size: 3,
  type: "market",
};

describe("#On Event", () => {
  describe("#OnBuy", () => {
    it("executes when a any buy order is completed through the api", (done) => {
      let Gdax = new ApiSim();
      Gdax.eventDriver.onBuy = () => {
        done();
      };
      Gdax.currentPrice = 30;
      Gdax.buy(marketPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, Date.now());
      });
    });
    it("it contains the user object's fiat and crypto balances", () => {
      let Gdax = new ApiSim({
        base_balance: 0,
        quote_balance: 100,
      });
      Gdax.eventDriver.onBuy = (fiat, crypto) => {
        assert(fiat < 10 && fiat > 9);
        assert.equal(crypto, 3);
      };
      Gdax.currentPrice = 30;
      Gdax.buy(marketPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, Date.now());
      });
    });
    it("it contains the order that was executed", () => {
      let Gdax = new ApiSim({
        base_balance: 0,
        quote_balance: 100,
      });
      Gdax.eventDriver.onBuy = (fiat, crypto, order) => {
        assert.deepStrictEqual(order, Gdax.user.orders[0]);
      };
      Gdax.currentPrice = 30;
      Gdax.buy(marketPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, Date.now());
      });
    });
  });
  describe("#OnSell", () => {
    it("executes when a any sell order is completed through the api", (done) => {
      let Gdax = new ApiSim({
        base_balance: 5,
        quote_balance: 100,
      });
      Gdax.eventDriver.onSell = () => {
        done();
      };
      Gdax.currentPrice = 30;
      Gdax.sell(marketPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, Date.now());
      });
    });
    it("it contains the user object's fiat and crypto balances", () => {
      let Gdax = new ApiSim({
        base_balance: 100,
        quote_balance: 0,
      });
      Gdax.eventDriver.onSell = (fiat, crypto) => {
        assert(fiat > 89);
        assert.equal(crypto, 97);
      };
      Gdax.currentPrice = 30;
      Gdax.sell(marketPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, Date.now());
      });
    });
  });
});
