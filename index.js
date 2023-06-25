const express = require('express');
const app = express()

const cors = require('cors');

const port = process.env.POST || 5000;
require('dotenv').config()
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
        const postsCollection = client.db('BanaoSocialMediaDb').collection('posts')


        // authentication related apis

        //check the user is already exist or not
        const checkIsExist = async (req, res, next) => {
            const newUser = req.body;
            const query = { email: newUser.email }
            const isExist = await usersCollection.findOne(query);
            console.log(isExist);
            if (isExist) {
                return res.send({ error: true, message: 'already has a account with this email please login' })
            }
            next()
        }


        //create new user
        app.post('/signUp', checkIsExist, async (req, res) => {
            const newUser = req.body;

            // console.log(newUser);
            const result = await usersCollection.insertOne(newUser)
            //console.log(result);
            res.send(result)
        })


        //login user api
        app.post('/signIn', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const isExist = await usersCollection.findOne(query);
            if (!isExist) {
                return res.send({ error: true, message: 'no user found with this email please register' })
            }

            if (user.password !== isExist.password) {
                return res.send({ error: true, message: 'invalid password' })

            }

            res.send({ email: isExist.email })

        })

        //get logged in user data
        app.get('/user/:email', async (req, res) => {
            const userEmail = req.params.email;
            const query = { email: userEmail }
            // console.log(userEmail);
            const result = await usersCollection.findOne(query);
            if (!result) {
                return res.send({ error: true, message: 'unauthorized acces' })
            }

            res.send(result)
        })


        //forget password
        app.put('/forget-password', async (req, res) => {
            const user = req.body;
            console.log(user);
            const userEmail = user.email;
            const userPassword = user.password;
            console.log(userEmail, userPassword);
            const query = { email: userEmail }
            // console.log(userEmail);

            const result = await usersCollection.findOne(query);
            if (!result) {
                return res.send({ error: true, message: 'user not found' })
            }
            const options = { upsert: false }
            const update_post = {
                $set: {
                    //post_image: updated_data.image,
                    password:userPassword
                }
            }
            const update = await usersCollection.updateOne(query, update_post, options)
            console.log(update);
            res.send(update)


        })


        //social post CRUD
        //crate a post 
        app.post('/add-post', async (req, res) => {
            const newPost = req.body;
            //console.log(newPost);
            const result = await postsCollection.insertOne(newPost)
            res.send(result)
        })

        //get all posts by a specific user
        app.get('/user-posts/:email', async (req, res) => {
            const userEmail = req.params.email;

            const allPosts = await postsCollection.find().toArray()
            const specificUserPosts = allPosts.filter(posts => posts.user_email === userEmail)

            res.send(specificUserPosts)



        })

        //delete a post
        app.delete('/delete-post/:id', async (req, res) => {
            const post_id = req.params.id
            //console.log(post_id);
            const query = { _id: new ObjectId(post_id) }
            const result = await postsCollection.deleteOne(query)
            res.send(result)
        })

        //get a post by id
        app.get('/get-a-post/:id', async (req, res) => {
            const post_id = req.params.id
            //console.log(post_id);
            const query = { _id: new ObjectId(post_id) }
            const result = await postsCollection.findOne(query)
            res.send(result)
        })

        //UPDATE a post
        app.put('/update-a-post/:id', async (req, res) => {
            const post_id = req.params.id;
            // console.log(post_id);
            const updated_data = req.body;
            const filter = { _id: new ObjectId(post_id) }
            const options = { upsert: false }
            const update_post = {
                $set: {
                    post_image: updated_data.image,
                    post_description: updated_data.post_description
                }
            }
            //console.log(updated_data.image, updated_data.post_description,update_post);
            const result = await postsCollection.updateOne(filter, update_post, options)
            console.log(result);
            res.send(result)

        })

        //home page apis
        app.get('/all-posts', async (req, res) => {
            const result = await postsCollection.find().toArray()
            //console.log(result);
            res.send(result)

        })

        // add like
        app.put('/add-like/:id', async (req, res) => {
            const post_id = req.params.id;


            //console.log(post_id);
            const result = await postsCollection.findOneAndUpdate(
                { _id: new ObjectId(post_id) },
                { $inc: { total_like: 1 } }
            );
            res.send(result)
        })

        // add comment 
        app.put('/add-comment/:id', async (req, res) => {
            const post_id = req.params.id;
            const comment = req.body;
            const newComment = [];
            newComment.push(comment)

            console.log(post_id, comment);
            const result = await postsCollection.findOneAndUpdate(
                { _id: new ObjectId(post_id) },
                { $set: { total_comments: newComment } }
            );

            console.log(result);
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



