const ApiSim = require("../Lib/ApiSim");
const assert = require("assert");
const params = {
  base_balance: 10,
  quote_balance: 5,
  taker_fee: 0.5,
};

describe("#ApiSim", () => {
  describe("#init", () => {
    it("takes a starting fiat value", () => {
      let sim = new ApiSim(params);
      assert.equal(sim.user.fiatBalance, 5);
    });
    it("takes a starting crypto value", () => {
      let sim = new ApiSim(params);
      assert.equal(sim.user.cryptoBalance, 10);
    });
    it("takes a taker fee value", () => {
      let sim = new ApiSim(params);
      assert.equal(sim.taker_fee, 0.005);
    });
  });
});
