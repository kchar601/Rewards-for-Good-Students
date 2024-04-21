const express = require('express');
const session = require('express-session');
const { fstat } = require('fs');
const bcrypt = require("bcrypt");
const path = require('path');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const dotenv = require('dotenv').config();
const bodyParser = require('body-parser');
var cookie = require('cookie');
const nodemailer = require('nodemailer');
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,  // set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

const transporter = nodemailer.createTransport({
  host: 'mail.smtp2go.com',
  port: 2525,
  secure: false,
  auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
  }
});

const uri = process.env.MONGO_URI;

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

app.post('/api/checkLogin', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');

    var email = { email: req.body.email };
    const result = await req.db.collection("Users").findOne(email);

    if (result) {
      console.log("user found");
      const passwordMatch = await bcrypt.compare(req.body.password, result.password);

      if (passwordMatch) {
        req.session.isLoggedIn = true;
        console.log(req.session);
        res.json([true]);
      } else {
        res.json([false]);
      }
    } else {
      res.json([false]);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred during login" });
  }
});

app.post('/attemptRegister', async function (req, res) {
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
    const dbo = client.db('Users');
    await dbo.command({ ping: 1 });
    console.log('Pinged your deployment. You successfully connected to MongoDB!');

    const result = await dbo.collection('Users').find({ $or: [user, email] }).toArray();
    if (result.length > 0) {
      if (result.some(doc => doc.email === email.email)) {
        res.json({ success: false, message: 'Email already exists' });
      }
    } 
    else {
      const hashedPassword = await bcrypt.hash(pswd.password, 10);
      await dbo.collection('Users').insertOne({ ...email, password: hashedPassword,  role: 'user', emailConfirm: false });
      res.json({ success: true });
    };
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'An error occurred' });
  } finally {
    await client.close();
  }

  const text = `<h2>Click the link below to confirm your email address</h2>
  <a href="https://imbd.dev/emailConfirmation?user=${user.username}">Confirm Email</a>`;
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.sendinblue.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDINBLUE_USERNAME,
        pass: process.env.SENDINBLUE_PASSWORD,
      },
    });
    
  
    const info = await transporter.sendMail({
      from: 'noreply@kchar.us',
      to: email.email,
      subject: 'Rewards for Good Students Email Confirmation',
      html: text,
    });
  
    console.log("Message sent: " + info.messageId);
  
  } catch (error) {
    console.log(error);
  }
});

function isLoggedIn(req, res, next) {
  if (req.session.isAuthenticated) {
    next();
  } else {
    res.json([false]);
  }
};

function isAdmin(req, res, next) {
  if (req.session.isAuthenticated && req.session.isAdmin) {
    next();
  } else {
    res.json([false]);
  }
}

app.get('/api/checkSession', isLoggedIn, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // If the middleware passes, the user is both authenticated and an admin
  res.json([true]);
});

app.get('/api/checkAdmin', isAdmin, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // If the middleware passes, the user is both authenticated and an admin
  res.json([true]);
});

app.get('/api/checkEmailConfirmation', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const email = req.query.email;
    const result = await req.db.collection("Users").findOne({ email: email });
    if (result) {
      console.log("user found");
      res.json({ emailConfirmed: result.emailConfirm });
    } else {
      res.json({ emailConfirmed: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred during email confirmation" });
  }
});

app.post('/api/updateEmailConfirmation', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    const email = req.body.email;
    const result = await req.db.collection("Users").findOne({ email: email });
    if (result) {
      console.log("user found");
      await req.db.collection("Users").updateOne({ email: email }, { $set: { emailConfirm: true } });
      res.json({ success: true });
    } else {
      res.json({ success: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred during email confirmation" });
  }
});


app.get('/', (req, res) => {
  res.render('index');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/events', (req, res) => {
  res.render('events');
});

app.get('/rewards', (req, res) => {
  res.render('rewards');
});

app.get('/createEvent', isAdmin, (req, res) => {
  res.render('createEvent');
});