const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config()
// const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;


// middleware
const corsConfig = {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
}
app.use(cors(corsConfig))
app.options("", cors(corsConfig))
app.use(express.json());


//******   Verify jwt       */
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unauthorized access' });
    }
    // bearer token
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
    })
}


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.arwkaoj.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
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


        // const usersCollection = client.db("summerSC").collection("users");

        //Our collections here
        // const classCollection = client.db("summerSC").collection("class");
        const addclassCollection = client.db("summerSC").collection("addclass");
        const instractorCollection = client.db("summerSC").collection("instractor");
        const usersCollection = client.db("summerSC").collection("users");


        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' })
            res.send({ token })
        })

        //Users related apis 
        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray()
            res.send(result)
        })

        app.post('/users', async (req, res) => {
            const users = req.body
            const query = { email: users.email }
            const existingUser = await usersCollection.findOne(query)
            if (existingUser) {
                return res.send({ message: 'already exists account' })
            }
            const result = await usersCollection.insertOne(users)
            res.send(result)
        })

 // User admin Id
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc);
            res.send(result)
        })
        // Admin Email check---------------
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })


        // instractor Email check---------------
        app.get('/users/instractor/:email',  async (req, res) => {
            const email = req.params.email;

            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { instractor: user?.role === 'instractor' }
            res.send(result);
        })

    //Instractor add Class-------
    app.post('/addclass', async (req, res) => {
        const body = req.body;
        body.createdAt = new Date()
        const result = await addclassCollection.insertOne(body)
        res.send(result)
        console.log(result)
      })

        app.patch('/users/instractor/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const updateDoc = {
                $set: {
                    role: 'instractor'
                },
            };
            const result = await usersCollection.updateOne(query, updateDoc);
            res.send(result)
        })

        //class related apis 
        app.get('/class', async (req, res) => {
            const result = await addclassCollection.find().toArray();
            res.send(result);
        })
        app.get('/myclass/:email', async(req,res)=>{
            console.log(req.params.email)
            const result = await addclassCollection.find({postedBy:req.params.email})
            // .sort({createdAt: -1})
            .toArray()
            res.send(result);
          })


        //instractor related apis 
        app.get('/instractor', async (req, res) => {
            const result = await instractorCollection.find().toArray();
            res.send(result);
        })


        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Summer camp on School')
})

app.listen(port, () => {
    console.log(`Summer camp on running this year ${port}`);
})