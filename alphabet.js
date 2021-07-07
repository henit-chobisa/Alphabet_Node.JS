const express = require('express');
const { MongoClient } = require('mongodb');
const Joi = require('joi');
const mongoose = require('mongoose');
const assert =  require('assert');
const { ObjectID } = require('mongodb');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require ('jsonwebtoken')
const bodyParser = require('body-parser');
const uri = "mongodb+srv://HenitChobisa:111.Dinesh@cluster0.o7gh0.mongodb.net/Trikon?retryWrites=true&w=majority";
const app = express();

const client = new MongoClient(uri, { useNewUrlParser : true, useUnifiedTopology : true });

app.use(express.json());

// Access and Refresh token arrays

const accessTokenSecret = 'bfwbfwefewjfewhfkweroitj4witji42jtniwitvjwutw094eut0w4u'
const refreshTokenSecret = 'ncruw9u9u2r90nu2n9ru24ur490niu43nut934ntn43tvn3424i34ir2'
const refreshTokens = []

app.post('/api/token', (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.sendStatus(401);
    }

    if (!refreshTokens.includes(token)) {
        return res.sendStatus(403);
    }

    jwt.verify(token, refreshTokenSecret, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        const accessToken = jwt.sign({ username: user.username, role: user.role }, accessTokenSecret, { expiresIn: '20m' });

        res.json({ accessToken });
    });
});

// Authentication Logic

function hashPassword(password){

    // const salt = bcrypt.genSalt(32, (err, salt) => {
    //     if (err) console.log(err);
    //     return salt;
    // })
    // const hash = bcrypt.hashSync(password, salt);

    salt = crypto.randomBytes(16).toString('hex');
    hash = crypto.pbkdf2Sync(password, salt, 
    1000, 64, `sha512`).toString(`hex`);
    return [hash,salt];

};


// Creating the client

async function pushUserInfoToDatabase(document){
    await client.connect();
    const database = client.db('Trikon');
    const users = database.collection('Users');
    users.insertOne(document);
};

// Creating a validation as User

const user = Joi.object({ userName : Joi.string().required(), password : Joi.string().required()});

app.post('/api/signUP', (req, res) => {

    // creating validation and validating the user
    user.validate(req.body);

    // hashing the password 
    const results = hashPassword(req.body.password);

    // creatinf the document and pushing the data to the database
    const doc = { userName : req.body.userName, password : results[0],salt : results[1]};
    pushUserInfoToDatabase(doc);
    res.json(doc);

});

// Logging in the client and creating a JWT for the client to access data

app.post('/api/login', async (req, res) => {
    await client.connect();
    const database = client.db('Trikon');

    // validating the user request
    user.validate(req.body);

    //  Finding the target user in the database 
    database.collection('Users').find({
        userName : req.body.userName
    }).toArray((err, result) => {

        if (err){
            console.log(err);
            return;
        }
        const user = result[0]
        
        // hashing the password for the requester with the same salt so that it can be compared with the password of the user in database
        const validation = crypto.pbkdf2Sync(req.body.password, user.salt, 1000, 64, `sha512`).toString(`hex`);
        
        if (validation == user.password){

            // Password entered is true
            // generating accessToken for the user with userName property
            const accessToken = jwt.sign({ username : user.userName }, accessTokenSecret, { expiresIn: '15m' });
            
            const refreshtoken = jwt.sign({ username: user.userName}, refreshTokenSecret);
            refreshTokens.push(refreshtoken)
            res.json({ accessToken, refreshtoken});
        }
        else {
            res.send('password is incorrect');
        }

    })
});



const authenticateJWT = (req,res,next) => {
    const authHeader = req.headers.authorization;

    if(authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                res.send('You are not an authenticated User, get lost!');
            }
            req.user = user;
            next();
        });
    }
    else {
        res.status(404);
    }
};


app.get('/api/getData', authenticateJWT, async (req,res) => {
    await client.connect();
    const database = client.db("Trikon");
    database.collection('Orders').find({}).toArray((err,results) => {
        if (err){
            console.log(err);
            return;
        }
        res.send(results);
    })
});


const port = process.env.port || 5000
app.listen(port, () => {console.log(`Listening at port ${port}`)});

