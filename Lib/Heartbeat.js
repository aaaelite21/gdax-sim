module.exports = {
    create: function (pair, time) {
        let hb = {};
        hb.type = 'heartbeat';
        hb.time = (new Date(time)).toISOString();
        hb.product_id = pair;
        hb.sequence = Math.floor(Math.random() * 1000000000);
        hb.last_trade_id = 0;
        return hb;
    }
}