const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000
require('dotenv').config();
const app = express();



//middleware
app.use(cors())
app.use(express.json())


//database connect
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.trx5yvh.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        const categories = client.db('recycleMania').collection('categories')
        const productsCollection = client.db('recycleMania').collection('products')

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