module.exports = function (order) {
    if (order.type === 'market') {
        if (order.size !== undefined) {
            order.funds = this.user.fiatBalance.toString();
            order.fill_fees = (order.size * this.currentPrice * this.taker_fee).toString();
            order.filled_size = order.size.toString();
            order.executed_value = (order.size * this.currentPrice).toString();
        } else if (order.specified_funds !== undefined) {
            order.fill_fees = (parseFloat(order.specified_funds) * this.taker_fee).toString();
            order.filled_size = parseFloat(order.funds / this.currentPrice).toString();
            order.executed_value = order.funds;
        }
        order.created_at = order.created_at;
        order.done_at = this.currentTime;
        order.done_reason = "filled";
        order.status = "done";
        order.settled = true;
        order.stp = undefined;
    } else {
        order.status = 'filled';
    }
    return order;
}