const express = require('express');
const { MongoClient } = require('mongodb');
const Joi = require('joi');
const mongoose = require('mongoose');
const assert =  require('assert');
const { ObjectID } = require('mongodb');
const { collection } = require('./schemas');

const uri = "mongodb+srv://HenitChobisa:111.Dinesh@cluster0.o7gh0.mongodb.net/Trikon?retryWrites=true&w=majority";
const app = express();
app.use(express.json());
const client = new MongoClient(uri, {
    useNewUrlParser : true,
    useUnifiedTopology : true,
});



// Generate order to the database


app.post('/api/generateOrder', (req, res) => {
    
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

// Getting current order Status from the tracking ID

app.get("/api/getOrderStatus/:trackingID", async (req, res) => {

    await client.connect();
    const database = client.db('Trikon');

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
    database.collection('Orders').updateOne(query,update,options);

});


app.listen(3000, () => {console.log('Listening at port 3000')});