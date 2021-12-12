const express = require('express')
const app = express()
const cors = require('cors');
const admin = require("firebase-admin");
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET);
const port = process.env.PORT || 5000;

//initilazition firebase token
let serviceAccount = JSON.parse(process.env.FIREBASE_BICYCLE_TOKEN);
 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(cors());
app.use(express.json());

     
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.89jki.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith('Bearer ')) {
      const token = req.headers.authorization.split(' ')[1];

      try {
          const decodedUser = await admin.auth().verifyIdToken(token);
          req.decodedEmail = decodedUser.email;
      }
      catch {

      };

  };
  next();
};

async function run() {
    try {
      await client.connect();
      const database = client.db('my_bicycle');
      const productCollaction = database.collection('bicycle')
      const reviewCollection = database.collection('review');
      const orderCollection = database.collection('order');
      const usersCollection = database.collection('users');
      

    // Get All Product

app.get('/bicycle', async(req, res)=>{
  const AllBicycle = productCollaction.find({});
  const result = await AllBicycle.toArray();
   res.json(result)
 });
 
 //Bicycle added
 app.post('/bicycle', async(req, res)=>{
   const bicycle = req.body;
   const allBicycle = await productCollaction.insertOne(bicycle);
       res.json(allBicycle);
   });
 
   app.get('/bicycle/:id', async(req, res)=>{
    const id = req.params.id;
    const query =  {_id: ObjectId(id)};
    const Bicycle = await productCollaction.findOne(query);
     res.json(Bicycle);
   });
 
 app.put('/bicycle/:id', async(req, res) =>{
   const id = req.params.id;
   const updateName = req.body;
   const productUpdate =  {_id: ObjectId(id)};
   const options = {upsert: true};
   const updateDocs = {
     $set:{
       name: updateName.name
     }
   };
   const update = await productCollaction.updateOne(productUpdate, updateDocs, options);
     res.json(update);
 });
 
 // Delete product
 app.delete('/bicycle/:id', async(req, res) =>{
   const id = req.params.id;
   const query = {_id: ObjectId(id)};
   const result = await productCollaction.deleteOne(query);
   res.json(result);
 });
 
 
  // order management
 
 app.get('/orders',   async(req, res)=>{
   const email = req.query.email;
    const query = {email: email};
    const order = orderCollection.find(query);
    const result = await order.toArray();
    res.json(result);
  });
  
 

 
//POST method
 app.post('/order', async(req,res) =>{
 const order = req.body;
 const allOrder = await orderCollection.insertOne(order);
     res.json(allOrder);
 });

app.get('/allOrder/:email', async (req, res)=>{
  const order = req.body;
  const result = await orderCollection.find(order);
  res.json(result)
})
 
 //delete order
 app.delete('/orders/:id', async(req, res) =>{
   const id = req.params.id;
   const query = {_id: ObjectId(id)};
   const result = await orderCollection.deleteOne(query);
   res.json(result);
 });



 app.get('/bicyclePayment/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id: ObjectId(id)};
  const result = await orderCollection.findOne(query);
  res.json(result);
});
 
 
 // user comment
 
 app.post('/review', async(req,res) =>{
 const review = req.body;
 const allReview = await reviewCollection.insertOne(review);
     res.json(allReview);
 });
 
 app.get('/review', async(req, res)=>{
   const AllReview = reviewCollection.find({});
   const result = await AllReview.toArray();
    res.json(result);
  });
 
 
  //all customer
 app.post('/users', async(req,res) =>{
 const user = req.body;
 const allUser = await usersCollection.insertOne(user);
     res.json(allUser);
 });
 
 
 app.put ('/users', async(req, res)=>{
   const user = req.body;
   const filter = {email: user.email};
   const options = {upsert: true};
   const updataDocs = {$set: user};
   const result = await usersCollection.updateOne(filter, options, updataDocs);
   res.json(result);
 });
 
 
 app.put('/users/admin', verifyToken, async (req, res) => {
  const user = req.body;
  const requester = req.decodedEmail;
  if (requester) {
      const requesterAccount = await usersCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
          const filter = { email: user.email };
          const updateDoc = { $set: { role: 'admin' } };
          const result = await usersCollection.updateOne(filter, updateDoc);
          res.json(result);
      };
  }
  else {
      res.status(403).json({ message: 'you do not have access to make admin' })
  }

});
 
 
 
 app.get('/users/:email', async(req, res) =>{
   const email = req.params.email;
   const query = {email: email};
   const user = await usersCollection.findOne(query);
   let isAdmin = false;
   if(user?.role === 'admin'){
     isAdmin = true;
   };
   res.json({admin:isAdmin});
 });



 app.post("/create-payment-intent", async (req, res) => {
   const paymentsInfo = req.body;
  
const amount = paymentsInfo.price*100;
  // Create a PaymentIntent with the order amount and currency
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateOrderAmount(items),
    currency: "usd",
    amount: amount,
    payment_methods_types: ['card']
  });

  res.send({
    clientSecret: paymentIntent.client_secret,
  });
});
 

app.put('/payment_update/:id'), async(req, res) =>{
  const id = req.params.id;
  const payment = req.body;
  const filter = {_id: ObjectId(id)};
  const updateDoc = {
    $set: { payment: payment }
  };
const result = await orderCollection.updateOne(filter, updateDoc);
res.json(result);
};

    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    };
  }
  run().catch(console.dir);


app.get('/', (req, res) =>{
    console.log('thank you');
    res.send('my server');
});

app.listen(port, ()=>{
    console.log('start my bicycle server', port);
});