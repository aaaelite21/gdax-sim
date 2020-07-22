module.exports = function (_24HourTimeString) {
  let ret = {};

  ret.hours = parseInt(_24HourTimeString.substring(0, 2));

  ret.minutes = parseInt(_24HourTimeString.substring(2, 4));

  return ret;
};
