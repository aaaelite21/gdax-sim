const parser = require("../Lib/Parse24Time");
const assert = require("assert");

describe("#24HourTimeStringParser", () => {
  it("gets the hours from the first two digits of the string", () => {
    let { hours, minutes } = parser("1100");
    assert.strictEqual(hours, 11);
  });
  it("gets the minutes from the last two digits of the string", () => {
    let { hours, minutes } = parser("1145");
    assert.strictEqual(minutes, 45);
  });
});
