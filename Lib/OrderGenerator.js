const crypto = require('crypto');


module.exports = function (orderPerams, salt) {
    let order = {};
    let str = JSON.stringify(orderPerams);
    if (salt !== undefined) {
        str += salt;
    }
    order.id = crypto.createHash('sha1').update(str).digest("hex");
    order.type = orderPerams.type === undefined ? "limit" : orderPerams.type;
    order.product_id = orderPerams.product_id;
    order.post_only = orderPerams.post_only === undefined ? false : orderPerams.post_only;
    order.side = orderPerams.side;

    if (orderPerams.price !== undefined) {
        order.price = orderPerams.price.toString()
    }

    if (orderPerams.size !== undefined) {
        order.size = orderPerams.size.toString();
    }

    //always constant
    order.time_in_force = "GTC";
    order.filled_size = "0.00000000";
    order.executed_value = "0.0000000000000000";
    order.fill_fees = "0.0000000000000000";
    order.settled = false;
    order.status = "pending";
    order.created_at = "2016-12-08T20:02:28.53864Z";
    order.stp = "dc";

    return order;
}