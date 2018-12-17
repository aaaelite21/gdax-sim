const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");

const marketSellPerams = {
  product_id: "LTC-USD",
  size: 1,
  type: "market"
};

const badMarketSellPerams = {
  product_id: "LTC-USD",
  size: 101,
  type: "market"
};

const testCandleHighToLow = {
  time: "Tue Nov 27 2018 03:44:00 GMT-0500 (Eastern Standard Time)",
  open: 29.35,
  high: 29.41,
  low: 29.28,
  close: 29.3,
  volume: 58.25595405999999
};
const testCandleLowToHigh = {
  time: "Tue Nov 27 2018 03:45:00 GMT-0500 (Eastern Standard Time)",
  open: 29.25,
  high: 29.38,
  low: 29.24,
  close: 29.26,
  volume: 41.767021490000005
};
const twoCandleArray = [
  testCandleHighToLow,
  testCandleLowToHigh
];

describe("#ApiSim Market Orders", () => {
  describe("#sell", () => {
    it("adds the funds value to the market order", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.equal(data.funds, Gdax.user.cryptoBalance.toString());
      });
    });
    it("saves the market order to the user.marketOrders.openSells array", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.equal(Gdax.user.marketOrders.openSells[0].id, data.id);
      });
    });
    it("runs the callback after", done => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, done);
    });
    it("returns the order in the 'data' attribute of the callback", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.equal(Gdax.user.marketOrders.openSells[0], data);
      });
    });
    it("rejects the order if the user lacks the crypto", () => {
      let Gdax = new ApiSim();
      Gdax.sell(badMarketSellPerams, (err, res, data) => {
        assert.equal(data.status, "rejected");
      });
    });
    it("deducts the value of the order (size * price) from the crypto balance", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.equal(Gdax.user.cryptoBalance, 99);
      });
    });
  });
  describe("#buy", () => {
    //repeat sell
  });

  describe("#fillOrder", () => {
    let time = "2018-12-06T01:46:01.162000Z";

    it("adds the (size * price) - fee of a market sell order to the fiat account", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let target =
        Gdax.user.fiatBalance +
        marketSellPerams.size * Gdax.currentPrice -
        marketSellPerams.size * Gdax.currentPrice * 0.003;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.equal(Gdax.user.fiatBalance, target);
      });
    });
    it("returns an array of messages to disbatch", () => {
      //assert(false);
    });
    it("returns the match first", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.equal(ret[0].type, "match");
        assert.equal(ret[0].taker_order_id, data.id);
      });
    });
    it("returns the 'done' last", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.equal(ret[ret.length - 1].type, "done");
      });
    });
    it("the returned 'done' has the proper data", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        let done = ret[ret.length - 1];
        assert.equal(done.side, "sell");
        assert(done.order_id, data.id);
      });
    });
  });

  describe("#backtest", () => {
    it("sell: completes all market orders at each match", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams);
      Gdax.websocketClient.on('message', (message) => {
        assert.equal(Gdax.user.marketOrders.openSells.length, 0)
      });
      Gdax.backtest(twoCandleArray);
    });
    it("sell: the price of the market order is the price of the most recent match", () => {
      let Gdax = new ApiSim();
      let order;
      let checked = false;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        order = data.id;
      });
      Gdax.websocketClient.on('message', (message) => {
        if (message.taker_order_id === order) {
          checked = true;
        }
      });
      Gdax.backtest(twoCandleArray);
      assert(checked);
    });
    it("sell: market info is disbatched", () => {
      let count = 0;
      countOfMatch = 0;
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        order = data.id;
      });
      Gdax.websocketClient.on('message', (message) => {
        if (message.taker_order_id === order) {
          countOfMatch = count;
        }
        if (message.order_id === order) {
          assert.equal(count - 1, countOfMatch);
        }
        count++;
      });
      Gdax.backtest(twoCandleArray);
    });
    it("sell: market orders are completed before limit orders", () => {});
    it("sell: market orders info is disbatched before limit order info", () => {});
  });
});