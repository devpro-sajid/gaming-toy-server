const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z2zpf1s.mongodb.net/?retryWrites=true&w=majority`;

// Midddleware
app.use(cors());
app.use(express.json());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const db = client.db("toysDB");
        const toysCollection = db.collection("toys");


        const indexKeys = { toyName: 1 }; // Replace field1 and field2 with your actual field names
        const indexOptions = { name: "toyName" }; // Replace index_name with the desired index name
        const result = await toysCollection.createIndex(indexKeys, indexOptions);
        console.log(result);
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        app.get("/allToys", async (req, res) => {
          const toys = await toysCollection.find({}).limit(20).toArray()
          res.send(toys);
        });

        app.get("/getToysByName/:text", async (req, res) => {
            const text = req.params.text;
            const result = await toysCollection
                .find(
                    { toyName: { $regex: text, $options: "i" } }
                ).toArray().limit(20);
            res.send(result);
        });

        app.get("/allToysByCategory/:cat", async (req, res) => {
            console.log(req.params.category);
            const toys = await toysCollection
              .find({
                category: req.params.cat
              })
              .toArray();
            res.send(toys);
          });

        app.post("/add-toy", async (req, res) => {
            const body = req.body;
            console.log(body);
            const result = await toysCollection.insertOne(body);
            if (result?.insertedId) {
              return res.status(200).send(result);
            } else {
              return res.status(404).send({
                message: "can not insert try again leter",
                status: false,
              });
            }
          });
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Toy server is running')
})

app.listen(port, () => {
    console.log('Toy server is running on port', port)
})