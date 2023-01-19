const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ebhwkyy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT ( req , res , next ) {

const authHeader = req.headers.authorization
if (!authHeader){
   res.status(401).send({message:'UnAuthorized Access'})
}

const token = authHeader.split(' ')[1]
jwt.verify(token, process.env.ACCESS_TOKEN , function(err, decoded) {
  if (err){
    res.status(403).send({ message: 'Forbidden Access' })
  }
  req.decoded = decoded
  next()
});

}

async function run () {
  try{
        await client.connect()
        const partsCollection = client.db('rockAuto').collection('parts')
        const userCollection = client.db('rockAuto').collection('users')

        app.get('/parts' , async(req,res) => {
           const query = {}
           const cursor = partsCollection.find(query)
           const parts = await cursor.toArray()
           res.send(parts) ;        
        });
 
 //adding parts
 
        app.post('/parts' , async(req,res)=>{
          const parts = req.body
          const result = await partsCollection.insertOne(parts)
          res.send(result)
        }) 

//updating user

        app.put("/user/:email" , async(req,res) => {
          const email = req.params.email
          const user = req.body
          const filter = { email: email };
          const options = { upsert: true };
          const updateDoc = {
            $set:user
          }
          const result = await userCollection.updateOne(filter, updateDoc, options);
          const token = jwt.sign({email:email} , process.env.ACCESS_TOKEN , { expiresIn : '24d'} )
          res.send({result , token})
        }) ;

        app.get("/user",  async (req, res) => {
          const users = await userCollection.find().toArray();
          res.send(users);
        });

        app.put("/user/admin/:email" ,verifyJWT, async(req,res) => {
          const email = req.params.email
          const requester =req.decoded.email
          const reqAccount = await userCollection.findOne({email : requester})

          if (reqAccount.role === 'admin'){
            const filter = { email: email };
            const updateDoc = {
              $set:{role:'admin'}
            }
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result)
          }
          else{
            res.status(403).send({message:'forbidden'})
          }
        }) ;

        app.get('/user/admin/:email' , verifyJWT , async(req,res) => {
          const email = req.params.email
          const user = await userCollection.findOne({ email:email })
          const isAdmin = user.role === 'admin'
          res.send({ admin : isAdmin })
        })
  }
  finally{

  }
  

}
run().catch(console.dir);


app.get("/", (req, res) => {
  res.send("Hello from rockAuto!");
});

app.listen(port, () => {
  console.log(`rockAuto app listening on port ${port}`);
});
