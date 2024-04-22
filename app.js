const express = require('express');
const session = require('express-session');
const bcrypt = require("bcrypt");
const path = require('path');
const ejs = require('ejs');
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const moment = require('moment');
const app = express();
const port = 3000;

// Ensure environment variables are loaded
require('dotenv').config();

// MongoDB URI
const uri = process.env.uri;

// Global DB object
let dbo;

// Initialize MongoDB connection once
MongoClient.connect(uri, { useUnifiedTopology: true }, function(err, db) {
  if (err) throw err;
  dbo = db.db("AppData");
});

// Express configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// Start the server
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.status(401).json({success: false, message: 'Unauthorized access'});
  }
};

function isAdmin(req, res, next) {
  if (req.session.isAuthenticated && req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({success: false, message: 'Forbidden access'});
  }
}

// Routes
// ... Your routes go here ...

// Catch-all error handler
app.use((error, req, res, next) => {
  console.error(error); // Log error
  res.status(500).json({ success: false, message: 'An internal server error occurred' });
});

app.post('/login', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const bcrypt = require('bcrypt');
  const uri = process.env.uri;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  var email = { email: req.body.email };
  try {
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    const result = await dbo.collection('Users').findOne(email);
    if (result) {
      console.log("user found");
      const passwordMatch = await bcrypt.compare(req.body.password, result.password);
      if (passwordMatch) {
        req.session.isAuthenticated = true;
        req.session.userID = email.email;
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Password does not match' });
      }
    } else {
      res.json({ success: false, message: 'User not found' });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'An error occurred' });
  }
});

app.post('/signup', async function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const bcrypt = require('bcrypt');
  const uri = process.env.uri;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  var email = { email: req.body.email };
  var pswd = { password: req.body.password };

  try {
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    const result = await dbo.collection('Users').findOne(email);
    if (result) {
        res.json({ success: false, message: 'Email already exists' });
    }
    else {
      const hashedPassword = await bcrypt.hash(pswd.password, 10);
      await dbo.collection('Users').insertOne({ ...email, password: hashedPassword,  role: 'user', emailConfirm: false });
      req.session.isAuthenticated = true;
      req.session.userID = email.email;
      res.json({ success: true });
    };
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'An error occurred' });
  } finally {
    await client.close();
  }
});

function isAuthenticated(req, res, next) {
  console.log(req.session);
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.json({success: false});
  }
};

function isAdmin(req, res, next) {
  if (req.session.isAuthenticated && req.session.isAdmin) {
    next();
  } else {
    res.json({success: false, message: 'You are not authorized to access this page'});
    }
}

app.get('/api/checkSession', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // If the middleware passes, the user is authenticated
  res.json({success: true});
});

app.get('/api/checkAdmin', isAdmin, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // If the middleware passes, the user is both authenticated and an admin
  res.json({success: true});
  });

app.get('/api/checkEmailConfirmation', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const email = req.query.email;
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    const result = await req.dbo.collection("Users").findOne({ email: email });
    if (result) {
      console.log("user found");
      res.json({ emailConfirmed: result.emailConfirm });
    } else {
      res.json({ emailConfirmed: false });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "An error occurred during email confirmation" });
  }
});

app.post('/api/updateEmailConfirmation', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const email = req.body.email;
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');
    const result = await req.dbo.collection("Users").findOne({ email: email });
    if (result) {
      console.log("user found");
      await req.db.collection("Users").updateOne({ email: email }, { $set: { emailConfirm: true } });
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "An error occurred during email confirmation" });
  }
});

app.get('/', async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = process.env.uri;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  const userId = req.session.userID;
  try{
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    const today = new Date(); // Set to the beginning of today.
    today.setUTCHours(0, 0, 0, 0); // If your server isn't in UTC, adjust accordingly.
    const events = await dbo.collection('Events')
      .find()
      .toArray();
    const user = await dbo.collection('Users').findOne({ 'email': userId });
    const userPoints = user ? user.rewardPoints : 0;
    const sampleRewards = await dbo.collection('Rewards').find().toArray();

    res.render('index', { 
      events: events, 
      moment: moment, 
      userPoints: userPoints, 
      rewards: sampleRewards 
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { error: 'An error occurred while fetching events.' }); // Render an error page or JSON
  } finally {
    await client.close(); // Ensure the client is closed after operation
  }
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/events', async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = process.env.uri;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  try{
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    const today = new Date(); // Set to the beginning of today.
    today.setUTCHours(0, 0, 0, 0); // If your server isn't in UTC, adjust accordingly.
    const events = await dbo.collection('Events')
      .find()
      .toArray();

    res.render('events', { 
      events: events, 
      moment: moment, 
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { error: 'An error occurred while fetching events.' }); // Render an error page or JSON
  } finally {
    await client.close(); // Ensure the client is closed after operation
  }
});

app.get('/rewards', async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  const uri = process.env.uri;
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });
  const userId = req.session.userID;
  try{
    await client.connect();
    const dbo = client.db('AppData');
    await dbo.command({ ping: 1 });
    const user = await dbo.collection('Users').findOne({ 'email': userId });
    const userPoints = user ? user.rewardPoints : 0;
    const sampleRewards = await dbo.collection('Rewards').find().toArray();
    res.render('rewards', { 
      userPoints: userPoints, 
      rewards: sampleRewards 
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('error', { error: 'An error occurred while fetching events.' }); // Render an error page or JSON
  } finally {
    await client.close(); // Ensure the client is closed after operation
  }
});

app.get('/eventDetails', async (req, res) => {
  const uri = process.env.uri;
  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  // Convert eventId from the query string to integer
  const eventId = parseInt(req.query.id, 10);
  
  try {
    await client.connect();
    const dbo = client.db('AppData');
    // Query the event using the integer 'id' field
    const event = await dbo.collection('Events').findOne({ 'id': eventId });
    console.log(event);
    if (event) {
      res.render('eventDetails', {
        event: event,
        moment: moment,
      });
    } else {
      res.status(404).send('Event not found');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('An error occurred while fetching event details');
  } finally {
    await client.close();
  }
});
