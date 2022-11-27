const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
require('dotenv').config();
const app = express();



//middleware
app.use(cors())
app.use(express.json())


//database connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.trx5yvh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });



//verify jwt token
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('Unauthorized Access');
    }
    const token = authHeader.split(' ')[1];


    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next()
    })
}


async function run() {
    try {
        //all data collection form database
        const categories = client.db('recycleMania').collection('categories')
        const productsCollection = client.db('recycleMania').collection('products')
        const bookingCollection = client.db('recycleMania').collection('bookings')
        const usersCollection = client.db('recycleMania').collection('users')


        //all categories
        app.get('/categories', async (req, res) => {
            const query = {}
            const category = await categories.find(query).toArray()
            res.send(category)
        })

        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const products = await productsCollection.findOne(query)
            res.send(products)
        })

        app.get('/category/:id', async (req, res) => {
            const id = req.params.id;
            const query = { id: id };
            const category = await productsCollection.find(query).toArray();
            res.send(category)
        })

        // booking collection get api specific data with email
        //to load in to the buyer my booking route

        app.get('/bookings', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email
            if (email !== decodedEmail) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const query = { buyerEmail: email };
            const booking = await bookingCollection.find(query).toArray();
            res.send(booking)
        })

        // booking collection post api
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingCollection.insertOne(booking)
            res.send(result)
        })


        //user post with role api

        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user)
            res.send(result);
        })

        //jwt token generate
        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' })
                return res.send({ accessToken: token })
            }
            res.status(403).send({ accessToken: '' })
        })



        //get all buyers api        
        app.get('/buyers', async (req, res) => {
            const role = req.query.role;
            const query = { role: role }
            const users = await usersCollection.find(query).toArray()
            res.send(users);
        })

        //delete single buyer api 
        app.delete('/buyers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })


        //delete single seller api

        app.delete('/sellers/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const result = await usersCollection.deleteOne(filter)
            res.send(result)
        })



        //get all sellers api    
        app.get('/sellers', async (req, res) => {
            const role = req.query.role;
            const query = { role: role }
            const users = await usersCollection.find(query).toArray()
            res.send(users);
        })






        //admin verified api
        app.get('/buyers/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query)
            res.send({ isAdmin: user?.role === 'admin' })
        })

        //make admin api
        app.put('/buyers/admin/:id', verifyJWT, async (req, res) => {

            const decodedEmail = req.decoded.email;
            const filter = { email: decodedEmail }
            const user = await usersCollection.findOne(filter)
            if (user?.role !== 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(query, updatedDoc, options)
            res.send(result)
        })

        //seller add products in products collection

        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productsCollection.insertOne(product)
            res.send(result)
        })





    }
    finally {

    }
}

run().catch(err => console.log(err))


app.get('/', async (req, res) => {
    res.send('Recycle Server is running')
})


app.listen(port, () => {
    console.log(`Recycles Server is running on ${port}`);
})