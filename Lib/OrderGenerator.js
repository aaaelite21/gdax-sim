const crypto = require('crypto');


module.exports = function (orderPerams, salt) {
    let order = {};
    let str = JSON.stringify(orderPerams);
    if (salt !== undefined) {
        str += salt;
    }
    //All Orders
    order.id = crypto.createHash('sha1').update(str).digest("hex");
    order.type = orderPerams.type === undefined ? "limit" : orderPerams.type;
    order.product_id = orderPerams.product_id;
    order.post_only = orderPerams.post_only === undefined ? false : orderPerams.post_only;
    order.side = orderPerams.side;
    order.created_at = this.currentTime;
    order.settled = false;
    order.status = "pending";
    order.stp = "dc";
    order.filled_size = "0.00000000";
    order.executed_value = "0.0000000000000000";
    order.fill_fees = "0.0000000000000000";

    if (orderPerams.price !== undefined) {
        order.price = orderPerams.price.toString()
    }

    if (orderPerams.size !== undefined) {
        order.size = orderPerams.size.toString();
    }

    //Limit Orders only
    if (order.type === 'limit') {
        order.time_in_force = "GTC";
    }

    //Market Orders only
    if (order.type === 'market') {
        if (orderPerams.funds === undefined) {
            if (orderPerams.side === 'buy') {
                order.funds = this.user.cryptoBalance.toString();
            }
        } else {
            order.specified_funds = orderPerams.funds.toString();
            order.funds = (orderPerams.funds * (1 - this.taker_fee)).toString();
        }

    }


    return order;
}