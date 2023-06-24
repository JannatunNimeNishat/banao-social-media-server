const express = require('express');
const app = express()

const cors = require('cors');

const port = process.env.POST || 5000;
require('dotenv').config()
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.oth2isl.mongodb.net/?retryWrites=true&w=majority`;

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

        //all collections
        const usersCollection = client.db('BanaoSocialMediaDb').collection('users')


        // authentication related apis

        //check the user is already exist or not
        const checkIsExist = async(req,res,next) =>{
            const newUser = req.body;
            const query = {email: newUser.email}
            const isExist =  await usersCollection.findOne(query);
            console.log(isExist);
            if(isExist){
                return res.send({error:true, message:'already has a account with this email please login'})
            }
            next()
        }


        //create new user
        app.post('/signUp',checkIsExist, async (req, res) => {
            const newUser = req.body;

            console.log(newUser);
            const result = await usersCollection.insertOne(newUser)
            console.log(result);
            res.send(result)
        })


           //login user api
        app.post('/signIn', async(req,res)=>{
            const user = req.body;
            const query = {email: user.email}
            const isExist =  await usersCollection.findOne(query);
             if(!isExist){
                return res.send({error:true, message:'no user found with this email please register'})
             }
            
             if(user.password !== isExist.password){
                return res.send({error:true, message:'invalid password'})
                
             }

             res.send({ email: isExist.email})

        }) 

        //get logged in user data
        app.get('/user/:email', async(req,res)=>{
            const userEmail = req.params.email;
            const query = {email: userEmail}
            console.log(userEmail);
            const result = await usersCollection.findOne(query);
            if(!result){
                return res.send({error:true, message:'unauthorized acces'})
            }

            res.send(result)
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('banon social media is running')
})

app.listen(port, () => {
    console.log(`banon social media is running at port: ${port}`);
})



