const mongoose = require('mongoose');
let orderSchema = new mongoose.Schema({
    _id:mongoose.Schema.Types.ObjectId,
    orderInfo:{
        orderInvoice : Number,
        orderName : String,
        orderQuantity : Number,
    },
    clientInfo:{
        clientName : String,
        clientNumber : Number,
        clientEmail : String,
        clientAddress : String,
        clientPincode : Number,
    },
    orderStatus:{
        currentStatus : String,
        lastLocation : String,
        trackingID : String,
    }
})

module.exports = mongoose.model('order', orderSchema);
