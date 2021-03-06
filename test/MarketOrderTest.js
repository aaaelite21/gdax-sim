const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");

const marketSellPerams = {
  product_id: "LTC-USD",
  size: 1,
  type: "market",
};

const marketBuyPerams = {
  product_id: "LTC-USD",
  size: 2,
  type: "market",
};

const badMarketSellPerams = {
  product_id: "LTC-USD",
  size: 101,
  type: "market",
};

const badMarketBuyPerams = {
  product_id: "LTC-USD",
  size: 500,
  type: "market",
};

const testCandleHighToLow = {
  time: "Tue Nov 27 2018 03:44:00 GMT-0500 (Eastern Standard Time)",
  open: 29.35,
  high: 29.41,
  low: 29.28,
  close: 29.3,
  volume: 58.25595405999999,
};
const testCandleLowToHigh = {
  time: "Tue Nov 27 2018 03:45:00 GMT-0500 (Eastern Standard Time)",
  open: 29.25,
  high: 29.38,
  low: 29.22,
  close: 29.26,
  volume: 41.767021490000005,
};
const twoCandleArray = [testCandleHighToLow, testCandleLowToHigh];

const limitSellParams = {
  price: 29.3,
  size: 0.1,
  product_id: "LTC-USD",
};

const limitBuyPerams = {
  price: 29.23,
  size: 0.1,
  product_id: "LTC-USD",
};

describe("#ApiSim Market Orders", () => {
  describe("#sell", () => {
    it("does not add 'funds' value to market sells that use size", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.strictEqual(data.funds, undefined);
      });
    });
    it("saves the market order to the user.marketOrders.openSells array", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.strictEqual(Gdax.user.marketOrders.openSells[0].id, data.id);
      });
    });
    it("runs the callback after", (done) => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, done);
    });
    it("returns the order in the 'data' attribute of the callback", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.strictEqual(Gdax.user.marketOrders.openSells[0], data);
      });
    });
    it("rejects the order if the user lacks the crypto", () => {
      let Gdax = new ApiSim();
      Gdax.sell(badMarketSellPerams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
    it("deducts the value of the order (size) from the crypto balance", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams, (err, res, data) => {
        assert.strictEqual(Gdax.user.cryptoBalance, 99);
      });
    });
  });
  describe("#buy", () => {
    it("adds the funds value to the market order", () => {
      let Gdax = new ApiSim();
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        assert.strictEqual(data.funds, Gdax.user.fiatBalance.toString());
      });
    });
    it("saves the market order to the user.marketOrders.openBuys array", () => {
      let Gdax = new ApiSim();
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        assert.strictEqual(Gdax.user.marketOrders.openBuys[0].id, data.id);
      });
    });
    it("runs the callback after", (done) => {
      let Gdax = new ApiSim();
      Gdax.sell(marketBuyPerams, done);
    });
    it("returns the order in the 'data' attribute of the callback", () => {
      let Gdax = new ApiSim();
      Gdax.buy(marketSellPerams, (err, res, data) => {
        assert.strictEqual(Gdax.user.marketOrders.openBuys[0], data);
      });
    });
    it("rejects the order if the user lacks the fiat", () => {
      let Gdax = new ApiSim(100, 100);
      Gdax.currentPrice = 35;
      Gdax.buy(badMarketBuyPerams, (err, res, data) => {
        assert.strictEqual(data.status, "rejected");
      });
    });
    it("deducts the value of the order (size) from the fiat balance", () => {
      let Gdax = new ApiSim();
      let baseBalance = Gdax.user.fiatBalance;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        assert.strictEqual(
          Gdax.user.fiatBalance,
          baseBalance - marketBuyPerams.size * Gdax.currentPrice,
        );
      });
    });
  });

  describe("#fillOrder", () => {
    let time = "2018-12-06T01:46:01.162000Z";
    it("has the proper adjustmets made to the json object", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 2;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        let order = Gdax.user.orders[0];
        assert.strictEqual(order.settled, true);
        assert.strictEqual(order.status, "done");
        assert.strictEqual(
          order.executed_value,
          (marketSellPerams.size * Gdax.currentPrice).toString(),
        );
        assert.strictEqual(order.filled_size, marketSellPerams.size.toString());
        assert.strictEqual(
          order.fill_fees,
          (
            marketSellPerams.size *
            Gdax.currentPrice *
            Gdax.taker_fee
          ).toString(),
        );
        assert.strictEqual(order.done_reason, "filled");
        assert.strictEqual(order.done_at, Gdax.currentTime);
        assert.strictEqual(order.stp, undefined);
      });
    });
    it("has the proper adjustmets made to the json object", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 2;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        let order = Gdax.user.orders[0];
        assert.strictEqual(order.settled, true);
        assert.strictEqual(order.status, "done");
        assert.strictEqual(
          order.executed_value,
          (marketBuyPerams.size * Gdax.currentPrice).toString(),
        );
        assert.strictEqual(order.filled_size, marketBuyPerams.size.toString());
        assert.strictEqual(
          order.fill_fees,
          (
            marketBuyPerams.size *
            Gdax.currentPrice *
            Gdax.taker_fee
          ).toString(),
        );
        assert.strictEqual(order.done_reason, "filled");
        assert.strictEqual(order.done_at, Gdax.currentTime);
        assert.strictEqual(order.stp, undefined);
      });
    });
    it("adds the (size * price) - fee of a market sell order to the fiat account", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 2;
      let target =
        Gdax.user.fiatBalance +
        marketSellPerams.size * Gdax.currentPrice * (1 - Gdax.taker_fee);
      Gdax.sell(marketSellPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.fiatBalance, target);
      });
    });
    it("adds the (size/price) of a market buy order to the crypto account", () => {
      let Gdax = new ApiSim(1000, 0);
      Gdax.currentPrice = 35;
      let target = Gdax.user.cryptoBalance + marketBuyPerams.size;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.cryptoBalance, target);
      });
    });
    it("subtracts the fee from the fiat account for a market buy", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      let target =
        Gdax.user.fiatBalance -
        marketBuyPerams.size * Gdax.currentPrice * (1 + Gdax.taker_fee);
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(Gdax.user.fiatBalance.toFixed(2), target.toFixed(2));
      });
    });
    it("sell: returns the match first", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret[0].type, "match");
        assert.strictEqual(ret[0].taker_order_id, data.id);
        assert.strictEqual(ret[0].side, data.side);
      });
    });
    it("buy: returns the match first", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret[0].type, "match");
        assert.strictEqual(ret[0].taker_order_id, data.id);
        assert.strictEqual(ret[0].side, data.side);
      });
    });
    it("sell: returns the 'done' last", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret[ret.length - 1].type, "done");
      });
    });
    it("buy: returns the 'done' last", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret[ret.length - 1].type, "done");
      });
    });
    it("sell: the returned 'done' has the proper data", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.sell(marketSellPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        let done = ret[ret.length - 1];
        assert.strictEqual(done.side, "sell");
        assert(done.order_id, data.id);
      });
    });
    it("buy: the returned 'done' has the proper data", () => {
      let Gdax = new ApiSim();
      Gdax.currentPrice = 35;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        let ret = Gdax.fillOrder(data.id, data.size, time);
        let done = ret[ret.length - 1];
        assert.strictEqual(done.side, "buy");
        assert(done.order_id, data.id);
      });
    });
    it("does nothing if the market order is allready completed", () => {
      let Gdax = new ApiSim();
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        Gdax.user.orders[0].status = "done";
        let ret = Gdax.fillOrder(data.id, data.size, time);
        assert.strictEqual(ret.length, 0);
      });
    });
  });

  describe("#backtest", () => {
    it("sell: completes all market orders at each match", () => {
      let Gdax = new ApiSim();
      Gdax.sell(marketSellPerams);
      Gdax.websocketClient.on("message", (message) => {
        assert.strictEqual(
          Gdax.user.orders.map((x) => x.status).indexOf("pending"),
          -1,
        );
      });
      Gdax.backtest(twoCandleArray);
    });
    it("buy: completes all market orders at each match", () => {
      let Gdax = new ApiSim();
      Gdax.buy(marketBuyPerams);
      Gdax.websocketClient.on("message", (message) => {
        assert.strictEqual(
          Gdax.user.orders.map((x) => x.status).indexOf("pending"),
          -1,
        );
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
      Gdax.websocketClient.on("message", (message) => {
        if (message.taker_order_id === order) {
          if (parseFloat(message.price) === Gdax.currentPrice) {
            checked = true;
          }
        }
      });
      Gdax.backtest(twoCandleArray);
      assert(checked);
    });
    it("buy: the price of the market order is the price of the most recent match", () => {
      let Gdax = new ApiSim();
      let order;
      let checked = false;
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        order = data.id;
      });
      Gdax.websocketClient.on("message", (message) => {
        if (message.taker_order_id === order) {
          if (parseFloat(message.price) === Gdax.currentPrice) {
            checked = true;
          }
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
      Gdax.websocketClient.on("message", (message) => {
        if (message.taker_order_id === order) {
          countOfMatch = count;
        }
        if (message.order_id === order) {
          assert.strictEqual(count - 1, countOfMatch);
        }
        count++;
      });
      Gdax.backtest(twoCandleArray);
    });
    it("buy: market info is disbatched", () => {
      let count = 0;
      let tested1 = false;
      let tested2 = false;
      countOfMatch = 0;
      let Gdax = new ApiSim();
      Gdax.buy(marketBuyPerams, (err, res, data) => {
        order = data.id;
      });
      Gdax.websocketClient.on("message", (message) => {
        if (message.taker_order_id === order) {
          tested1 = true;
          countOfMatch = count;
        }
        if (message.order_id === order) {
          tested2 = true;
          assert.strictEqual(count - 1, countOfMatch);
        }
        count++;
      });
      Gdax.backtest(twoCandleArray);
      assert(tested1 === true && tested2 === true);
    });
    it("sell: market order info is disbatched before limit order info", () => {
      let Gdax = new ApiSim();
      let count = 0;
      let limitOrder, marketOrder;
      let tests = 0;

      function placeOrder() {
        Gdax.sell(limitSellParams, (err, res, data) => {
          limitOrder = data;
        });
        Gdax.sell(
          {
            size: 0.1,
            product_id: "LTC-USD",
            type: "market",
          },
          (err, res, data) => {
            marketOrder = data;
          },
        );
      }
      Gdax.websocketClient.on("message", (message) => {
        if (count === 2) {
          placeOrder();
        }
        if (count > 2) {
          if (message.taker_order_id === marketOrder.id) {
            assert.strictEqual(count, 4);
            tests++;
          }
          if (message.maker_order_id === limitOrder.id) {
            assert.strictEqual(count, 8);
            tests++;
          }
        }
        count++;
      });
      Gdax.backtest(twoCandleArray);
      assert.strictEqual(tests, 2);
    });
    it("buy: market order info is disbatched before limit order info", () => {
      let Gdax = new ApiSim();
      let count = 0;
      let limitOrder, marketOrder;
      let tests = 0;

      function placeOrder() {
        Gdax.sell(limitSellParams, (err, res, data) => {
          limitOrder = data;
        });
        Gdax.buy(marketBuyPerams, (err, res, data) => {
          marketOrder = data;
        });
      }

      Gdax.websocketClient.on("message", (message) => {
        if (count === 2) {
          placeOrder();
        }
        if (count > 2) {
          if (message.taker_order_id === marketOrder.id) {
            assert.strictEqual(count, 4);
            tests++;
          }
          if (message.maker_order_id === limitOrder.id) {
            assert.strictEqual(count, 8);
            tests++;
          }
        }
        count++;
      });
      Gdax.backtest(twoCandleArray);
      assert.strictEqual(tests, 2);
    });
  });
});
