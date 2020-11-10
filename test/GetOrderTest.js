const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");

const marketPerams = {
  product_id: "LTC-USD",
  size: 3,
  type: "market",
};

const limitPerams = {
  product_id: "LTC-USD",
  size: 3,
  price: 29.0,
};

describe("#ApiSim getOrder", () => {
  let time = "2018-12-06T01:46:01.162000Z";
  it("calls the callback that it is given", (done) => {
    let Gdax = new ApiSim();
    Gdax.currentPrice = 30;
    Gdax.buy(marketPerams, (err, res, firstData) => {
      Gdax.getOrder(firstData.orderId, done);
    });
  });
  describe("limit sell Orders", () => {
    it("get the order based on id before it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 28;
      Gdax.sell(limitPerams, (err, res, firstData) => {
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
    it("get the order based on id after it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 28;
      Gdax.sell(limitPerams, (err, res, firstData) => {
        Gdax.fillOrder(firstData.id, firstData.size, time);
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
  });
  describe("limit buy Orders", () => {
    it("get the order based on id before it is filled", () => {
      let Gdax = new ApiSim(500);
      Gdax.currentPrice = 30;
      Gdax.buy(limitPerams, (err, res, firstData) => {
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
    it("get the order based on id after it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 30;
      Gdax.buy(limitPerams, (err, res, firstData) => {
        Gdax.fillOrder(firstData.id, firstData.size, time);
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
  });
  describe("Market Sell Orders", () => {
    it("get the order based on id before it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 30;
      Gdax.sell(marketPerams, (err, res, firstData) => {
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
    it("get the order based on id after it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 30;
      Gdax.sell(marketPerams, (err, res, firstData) => {
        Gdax.fillOrder(firstData.id, firstData.size, time);
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
  });
  describe("Market Buy Orders", () => {
    it("get the order based on id before it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 30;
      Gdax.buy(marketPerams, (err, res, firstData) => {
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
    it("get the order based on id after it is filled", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 30;
      Gdax.buy(marketPerams, (err, res, firstData) => {
        Gdax.fillOrder(firstData.id, firstData.size, time);
        Gdax.getOrder(firstData.id, (err, res, data) => {
          assert.deepStrictEqual(data, firstData);
        });
      });
    });
  });
});
