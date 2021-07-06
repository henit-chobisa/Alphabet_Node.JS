const express = require('express');
const { MongoClient } = require('mongodb');
const Joi = require('joi');
const mongoose = require('mongoose');
const assert =  require('assert');
const { ObjectID } = require('mongodb');
const Order = require('./orderModel');

const uri = "mongodb+srv://HenitChobisa:111.Dinesh@cluster0.o7gh0.mongodb.net/Trikon?retryWrites=true&w=majority";
const app = express();
app.use(express.json());
const client = new MongoClient(uri, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
});



// Generate order to the database

const statusRules = (value, helpers) => {
    if (value === 'Not Yet Dispatched' || value === 'Dispatched' || value === 'Shipped' || value === 'Out for delivery' || value === 'Delivered' || value === 'Returned'){
        return value;
    }
    else {
        throw new Error('of Bad Status, Review! \n Not Yet Dispatched\n Dispatched\n Shipped\n Out for delivery\n Delivered\n Returned')
    }
    
}

const orderSchema = Joi.object({
    trackingID : Joi.number().max(999999999999).min(100000000000).required(),
        orderInfo:{
            orderInvoice : Joi.number().max(999999999999).min(100000000000).required(),
            orderName : Joi.string().required(),
            orderQuantity : Joi.number().min(1).required()
        },
        clientInfo:{
            clientName : Joi.string().required(),
            clientNumber : Joi.number().max(999999999999).min(100000000000).required(),
            clientEmail : Joi.string().email().required(),
            clientAddress : Joi.string().required(),
            clientPincode : Joi.number().max(999999).min(100000).required()
        },
        orderStatus:{
            currentStatus : Joi.string().lowercase().custom(statusRules,'custom validation').required(),
            lastLocation : Joi.string().required()
        }
})



app.post('/api/generateOrder', (req, res) => {

    const result = orderSchema.validate(req.body);

    if(result.error){
        res.status(400).send(result.error.details[0].message);
        return;
    };
    
    const doc =  {
        trackingID : req.body.trackingID,
        orderInfo:{
            orderInvoice : req.body.orderInfo.orderInvoice,
            orderName : req.body.orderInfo.orderName,
            orderQuantity : req.body.orderInfo.orderQuantity,
        },
        clientInfo:{
            clientName : req.body.clientInfo.clientName,
            clientNumber : req.body.clientInfo.clientNumber,
            clientEmail : req.body.clientInfo.clientEmail,
            clientAddress : req.body.clientInfo.clientAddress,
            clientPincode : req.body.clientInfo.clientPincode,
        },
        orderStatus:{
            currentStatus : req.body.orderStatus.currentStatus,
            lastLocation : req.body.orderStatus.lastLocation,
        }
    };
    
    postToDatabase(doc);
    res.json(doc);
    }
);


async function postToDatabase(document){
    await client.connect();
    const database = client.db('Trikon');
    const orders = database.collection('Orders');
    orders.insertOne(document);
};

// Get all data

app.get('/api/getData', async (req,res) => {
    await client.connect();
    const database = client.db("Trikon");
    database.collection('Orders').find({}).toArray((err,results) => {
        if (err){
            console.log(err);
            return;
        }
        res.send(results);
    })
})
 

//getting order information from the tracking ID

app.get("/api/getOrderInfo/:trackingID", async (req, res) => {

    await client.connect();
    const database = client.db('Trikon');

    database.collection('Orders').find({
        trackingID : req.params.trackingID

    }).toArray((err, result) => {

        if (err){
            console.log(err);
            return;
        }
        res.send(result);
    })
});

const trackingIDValidation = Joi.object({
    trackingID : Joi.number().max(999999999999).min(100000000000).required()
})

// Getting current order Status from the tracking ID

app.get("/api/getOrderStatus/:trackingID", async (req, res) => {

    await client.connect();
    const database = client.db('Trikon');

    const result = trackingIDValidation.validate(req.params);

    if(result.error){
        res.status(400).send(result.error.details[0].message);
        return;
    };

    database.collection('Orders').find({
        trackingID : req.params.trackingID

    }).toArray((err, results) => {
        if (err){
            console.log(err);
            return;
        }
        const status = results.find((result) => {
            res.json(result.orderStatus.currentStatus);
        });
    });
});

//update order Status 

app.put("/api/update/:trackingID", async (req, res) => {
    await client.connect();
    const database = client.db('Trikon');
    const result = trackingIDValidation.validate(req.params);

    if(result.error){
        res.status(400).send(result.error.details[0].message);
        return;
    };

    const query = {
        trackingID : req.params.trackingID
    }
    const update = {$set : {
        orderStatus : {
            currentStatus : req.body.orderStatus.currentStatus,
            lastLocation : req.body.orderStatus.lastLocation
        }
    }}
    const options = {};
    const document = database.collection('Orders').find(query).toArray((err, result) => {
        if (err){
            res.status(404).send('Woops, internal error!')
        }
        else{
            database.collection('Orders').updateOne(query,update,options);
            res.send('The order status has been updated');
        }
    })
});


const port = process.env.port || 8082
app.listen(port, () => {console.log(`Listening at port ${port}`)});