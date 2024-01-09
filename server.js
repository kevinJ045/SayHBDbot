const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");



const app = express();
const port = 3000;

require('dotenv').config();


const apiId = parseInt(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;
const stringSession = new StringSession(process.env.TELEGRAM_SESSION);

const mongoUrl = process.env.MONGO_URL;
const dbName = 'eventScheduler_test';
let eventsCollection;

const telegramClient = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});
// Connect to MongoDB
MongoClient.connect(mongoUrl)
.then(async (client) => {
  const db = client.db(dbName);
  eventsCollection = db.collection('events');
  console.log('Connected to MongoDB');

  
  await telegramClient.start();
  checkAndSendMessages();
});

app.use(bodyParser.json());

// Express route to handle incoming event data
app.post('/schedule-event', async (req, res) => {
  const { date, person_address, event, event_message, message_sent = false, annual_send } = req.body;

  // Check if it's an annual event and update the date accordingly
  await eventsCollection.insertOne({ date, person_address, event, event_message, message_sent, annual_send });

  res.status(200).json({ message: 'Event scheduled successfully' });
});

// Function to send an email
function sendEmail(emailAddress, message, event_name) {
  // Replace the following with a real email sending service integration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL,
    to: emailAddress,
    subject: event_name,
    text: message + "\nFrom "+process.env.PERSON_NAME,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

// Function to check and send messages
async function checkAndSendMessages() {
  const today_date = new Date();
  const today = today_date.getFullYear()+'-'+(today_date.getMonth() + 1).toLocaleString('en-US', { minimumIntegerDigits: 2 })+'-'+(today_date.getDate()).toLocaleString('en-US', { minimumIntegerDigits: 2 });
  
  const result = await eventsCollection.find({ date: today }).toArray();

  result.forEach(async (event) => {

    if(event.message_sent && !event.annual_send) return;
    // Check person address and send message accordingly
    if (event.person_address.startsWith('tg:@')) {
      const username = event.person_address.substring(4);
      sendTelegramMessage(username, event.event_message);
    } else if (event.person_address.startsWith('email:')) {
      const emailAddress = event.person_address.substring(6);
      sendEmail(emailAddress, event.event_message, event.event);
    }

    if(event.annual_send){
      let newDate = event.date.split('-').map((year, index) => index == 0 ? (parseInt(year)+1).toString() : year);
      await eventsCollection.updateOne({ _id: event._id }, { $set: { date: newDate } });
    } else {
      await eventsCollection.updateOne({ _id: event._id }, { $set: { message_sent: true } });
    }
  });
  setTimeout(checkAndSendMessages, 60000);
}

// Function to send a message via Telegram
async function sendTelegramMessage(username, message) {
  

  const result = await telegramClient.invoke(
    new Api.users.GetUsers({
      id: [username],
    })
  );

  telegramClient.sendMessage(result[0].id, {
    message
  });
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
