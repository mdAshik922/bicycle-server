const express = require('express');
const app = express();
require('dotenv').config();
const admin = require("firebase-admin");

const ObjectId = require('mongodb').ObjectId;
const cors = require('cors');
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

     
//initilazition firebase token
const serviceAccount = require('./bicycle-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.89jki.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
 if(req.headers?.authorization?.startWith('Bearer ')){
const token = req.headers.authorization.spilt(' ')[1]; 
};
  try{
const decodedUser = await admin.auth().verifyIdToken(token);
  req.decodedEmail = decodedUser.email;
}
  catch{

  }
  next()
};

async function run() {
    try {
      await client.connect();
      const database = client.db('my_bicycle');
      const productCollaction = database.collection('bicycle')
      const reviewCallection = database.collection('review');
      const orderCallection = database.collection('order');
      const userCallection = database.collection('users');


    // Get All Product

app.get('/bicycle', async(req, res)=>{
  const AllByicycle = productCollaction.find({})
  const result = await AllByicycle.toArray()
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
    const Byicycle = productCollaction.findOne(query);
 
     res.json(Byicycle);
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
   }
   const update = await productCollaction.updateOne(productUpdate, updateDocs, options);
     res.json(update);
 });
 
 // delete product
 app.delete('/bicycle/:id', async(req, res) =>{
   const id = req.params.id;
   // console.log(id)
   const query = {_id: ObjectId(id)}
   const result = await productCollaction.deleteOne(query)
   res.json(result);
 });
 
 
  //order manage ment
 
 app.get('/order', verifyToken, async(req, res)=>{
   const email = req.query.email;
   if(req.decodedEmail === email){
    const query = {email: email};
    const order = orderCallection.find(query);
    const result = await order.toArray();
  
    res.json(result);
  }
  
   res.status(401).json({message: 'user not authorized'})
 });
 
 app.post('/order', async(req,res) =>{
 const order = req.body;
 const allOrder = await orderCallection.insertOne(order);
     res.json(allOrder);
 });
 
 //delete order
 app.delete('/order/:id', async(req, res) =>{
   const id = req.params.id;
   // console.log(id)
   const query = {_id: ObjectId(id)}
   const result = await orderCallection.deleteOne(query);
   res.json(result);
 });
 
 
 // user comment
 
 app.post('/review', async(req,res) =>{
 const review = req.body;
 
 const allReview = await reviewCallection.insertOne(review);
 // console.log('message',allMessage)
     res.json(allReview);
 });
 
 app.get('/review', async(req, res)=>{
   const AllReview = reviewCallection.find({});
   const result = await AllReview.toArray();
    res.json(result);
  });
 
 
  //all coustomers
 app.post('/users', async(req,res) =>{
 const user = req.body;
 
 const allUser = await userCallection.insertOne(user);
 
     res.json(allUser);
 });
 
 
 app.put ('/users', async(req, res)=>{
   const user = req.body;
  //  console.log('put', user)
   const filter = {email: user.email};
   const options = {upsert: true};
   const updataDocs = {$set: user};
   const result = await userCallection.updateOne(filter, options, updataDocs);
 ;  res.json(result);
 })
 
 
 app.put('/users/admin', verifyToken, async(req, res)=>{
   const user = req.body;
   const Admin= req.decodedEmail;
   if(Admin){
     const adminAccount = await userCallection.findOne({email: admin});
  if(adminAccount.role === 'admin'){
   const filter = {email: user.email};
   const updataDocs = {$set: {role: 'admin'}};
   const result = await userCallection.updateOne(filter, updataDocs);
   res.json(result);
  }
   }
  else{
    res.status(403).json({message: 'sorry you have not access'});
  }
 });
 
 
 app.get('/users/:email', async(req, res) =>{
   const email = req.params.email;
   const query = {email: email};
   const user = await userCallection.findOne(query);
   let isAdmin = false;
   if(user?.role === 'admin'){
     isAdmin = true;
   }
   res.json({admin:isAdmin});
 });

    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);


app.get('/', (req, res) =>{
    console.log('thank you')
    res.send('my server')
});

app.listen(port, ()=>{
    console.log('start my last server', port)
})