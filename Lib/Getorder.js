module.exports = function (orderId, callback) {
    let data = [];


    let marketBuyIndex = this.user.marketOrders.openBuys.map((e) => {
        return e.id;
    }).indexOf(orderId);

    data = this.user.marketOrders.openBuys[marketBuyIndex];

    callback(null, null, data);
}