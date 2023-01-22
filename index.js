const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
        const profileCollection = client.db('rockAuto').collection('profile')
        const reviewCollection = client.db('rockAuto').collection('reviews')
        const orderCollection = client.db('rockAuto').collection('orders')

         //loading all parts
        app.get('/parts' , async(req,res) => {
           const query = {}
           const cursor = partsCollection.find(query)
           const parts = await cursor.toArray()
           res.send(parts) ;        
        });

       //loading single parts

        app.get('/parts/:id' , async( req , res ) => {
          const id = req.params.id
          const query = _id = ObjectId(id)
          const result = await partsCollection.findOne(query)
          res.send(result)

        }) ;

        //deleting parts

        app.delete('/parts/:id' , verifyJWT , async(req,res) => {
          const id = req.params.id
          const filter = { _id: ObjectId(id) }
          const result = await partsCollection.deleteOne(filter)
          res.send(result)
        })
 
       //adding parts
 
        app.post('/parts' , verifyJWT , async(req,res)=>{
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

        //loading user

        app.get("/user",  async (req, res) => {
          const users = await userCollection.find().toArray();
          res.send(users);
        });
        //updating user to admin

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
      
     //loading admin

        app.get('/user/admin/:email' , verifyJWT , async(req,res) => {
          const email = req.params.email
          const user = await userCollection.findOne({ email:email })
          const isAdmin = user.role === 'admin'
          res.send({ admin : isAdmin })
        }) ;

        //deleting an user

        app.delete('/user/:email' , verifyJWT , async( req , res) =>{
          const email = req.params.email
          const filter = {email:email}
          const result = await userCollection.deleteOne(filter)
          res.send(result)
        })

        //adding profile

        app.post('/profile' , verifyJWT , async (req,res) =>{
          const profile = req.body
          const result = await profileCollection.insertOne(profile)
          res.send(result)
        });

        //loading profile

        app.get('/profile/:email' , verifyJWT, async( req ,res ) =>{
          const email = req.params.email
          const result = await profileCollection.findOne({ email:email })
          res.send(result)
        })

        //posting review

        app.post('/review' , verifyJWT , async( req,res ) =>{
          const review = req.body
          const result = await reviewCollection.insertOne(review) ;
          res.send(result) ;
        }) ;

        //loading review

        app.get('/review' , verifyJWT , async(req,res) =>{

          const review = await reviewCollection.find().toArray()
          res.send(review) 

        }) ;

        //posting order 

        app.post('/order' ,  async( req , res ) => {
          const order = req.body
          const result = await orderCollection.insertOne(order)
          res.send(result)
        })

        //loading order

        app.get('/orders' , async(req,res)=>{
          const result = await orderCollection.find().toArray()
          res.send(result)
        })

        //loading single order

        app.get("/orders/:email" , async(req,res)=>{
          const email = req.params.email
          const query ={email : email}
          const result = await orderCollection.find(query).toArray()
          res.send(result)

        })

        app.delete('/orders/:id' , verifyJWT , async(req,res) =>{
           const id = req.params.id
          const query = { _id : ObjectId(id)}
          const result = await orderCollection.deleteOne(query)
          res.send(result)
        } )

       
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
