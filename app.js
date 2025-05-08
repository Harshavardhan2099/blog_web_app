import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import expressLayouts from 'express-ejs-layouts';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();
const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Start MongoDB Memory Server and connect
async function startServer() {
  try {
    // Create an in-memory MongoDB server
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log(`MongoDB Memory Server running at ${mongoUri}`);

    // Connect Mongoose to the in-memory server
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Memory Server');
    
    // Define Mongoose Schema and Model
    const postSchema = new mongoose.Schema({
      title: String,
      content: String,
      createdAt: { type: Date, default: Date.now }
    });

    const Post = mongoose.model('Post', postSchema);

    // Routes
    app.get('/', async (req, res) => {
      const posts = await Post.find().sort({ createdAt: -1 });
      res.render('index', { 
        posts,
        title: 'SuperBlog - Home'
      });
    });

    app.get('/posts/:id', async (req, res) => {
      const post = await Post.findById(req.params.id);
      res.render('post', { 
        post,
        title: post ? post.title : 'Post Not Found'
      });
    });

    app.get('/create', (req, res) => {
      res.render('create', {
        title: 'Create New Post'
      });
    });

    app.post('/create', async (req, res) => {
      try {
        console.log('Form data received:', req.body);
        const { title, content } = req.body;
        
        if (!title || !content) {
          console.error('Missing title or content');
          return res.status(400).send('Title and content are required');
        }
        
        const newPost = new Post({ title, content });
        await newPost.save();
        console.log('Post saved successfully:', newPost);
        res.redirect('/');
      } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).send('Error creating post');
      }
    });

    app.get('/edit/:id', async (req, res) => {
      const post = await Post.findById(req.params.id);
      res.render('edit', { 
        post,
        title: 'Edit Post'
      });
    });

    app.post('/edit/:id', async (req, res) => {
      const { title, content } = req.body;
      await Post.findByIdAndUpdate(req.params.id, { title, content });
      res.redirect('/');
    });

    app.post('/delete/:id', async (req, res) => {
      await Post.findByIdAndDelete(req.params.id);
      res.redirect('/');
    });

    // Start Server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the application
startServer();
