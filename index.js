const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
  },
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)

    const db = client.db("toysDB");
    const toysCollection = db.collection("toys");


    const indexKeys = { toyName: 1, category: 1 }; // Replace field1 and field2 with your actual field names
    const indexOptions = { name: "titleCategory" }; // Replace index_name with the desired index name
    const result = await toysCollection.createIndex(indexKeys, indexOptions);
    console.log(result);
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    // All toys
    app.get("/allToys", async (req, res) => {
      const toys = await toysCollection.find({}).limit(20).toArray()
      res.send(toys);
    });

    app.get("/toysSort/:num", async (req, res) => {

      const toys = await toysCollection.find({}).sort({ toyPrice: req.params.num }).limit(20).toArray();
      res.send(toys);
    });
    app.get("/getToysByCat/:text", async (req, res) => {
      const text = req.params.text;
      const result = await toysCollection
        .find({
          $or: [
            { toyName: { $regex: text, $options: "i" } },
            { category: { $regex: text, $options: "i" } },
          ],
        }).limit(20)
        .toArray();
      res.send(result);
    });
    // my toys
    app.get("/myToys", async (req, res) => {
      const toys = await toysCollection.find({ sellerEmail: req.query.email }).limit(20).toArray();
      res.send(toys);
    });
    app.get("/sortMyToys", async (req, res) => {
      const toys = await toysCollection.find({ sellerEmail: req.query.email }).sort({ toyPrice: req.query.num }).limit(20).toArray();
      res.send(toys);
    });
    app.get("/getMyToysByText", async (req, res) => {
      const text = req.query.text;
      const result = await toysCollection
        .find({
          $or: [
            { toyName: { $regex: text, $options: "i" } },
            { category: { $regex: text, $options: "i" } },
          ],
        },
          { sellerEmail: req.query.email }
        ).limit(20)
        .toArray();
      res.send(result);
    });



    // toys cat home
    app.get("/allToysByCategory/:cat", async (req, res) => {
      const toys = await toysCollection
        .find({
          category: req.params.cat
        })
        .toArray();
      res.send(toys);
    });
    // add a toy
    app.post("/add-toy", async (req, res) => {
      const body = req.body;
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
    // update toy
    app.put('/updateToy/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedToy = req.body;

      const toy = {
        $set: {
          toyName: updatedToy.toyName,
          quantity: updatedToy.quantity,
          toyPhoto: updatedToy.toyPhoto,
          sellerName: updatedToy.sellerName,
          sellerEmail: updatedToy.sellerEmail,
          category: updatedToy.category,
          toyPrice: updatedToy.toyPrice,
          rating: updatedToy.rating,
          detailsDes: updatedToy.detailsDes
        }
      }

      const result = await toysCollection.updateOne(filter, toy, options);
      res.send(result);
    })
    // delete toy
    app.delete('/deleteToy/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await toysCollection.deleteOne(query);
      res.send(result);
    })
    // Single Toy
    app.get('/toyDetails/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await toysCollection.findOne(query);
      res.send(result);
    })

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