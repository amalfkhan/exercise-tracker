const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
   useNewUrlParser: true, 
   useUnifiedTopology: true 
});
const Scheme = mongoose.Schema;

const exerciseScheme = new Scheme({
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', exerciseScheme);

const userScheme = new Scheme({
  username: String
});
const User = mongoose.model('User', userScheme); 

app.use(bodyParser.urlencoded({extended: false}));
app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.route('/api/users')
.get((req, res) => {
  User.find({}, (err, data) => {
    if(err) console.error(err);
    res.send(data);
  });
})
.post((req, res) => { //creating a new user
  const newUser = new User({ username: req.body.username });
  newUser.save((err, data) => {
    if(err) console.error(err);
    res.json({
      _id: data._id,
      username: data.username
    });
  });
});

//adding an exercise instance to the user's log
app.post('/api/users/:_id/exercises', (req, res) => {
  const newExercise = new Exercise({
    description: req.body.description,
    duration: req.body.duration,
    date: req.body.date || new Date()
  });

  User.findByIdAndUpdate(
    req.params._id, 
    { $push: { log: newExercise } },
    {new: true},
    (err, data) => {
      if(err) console.error(err);
      res.json({
        username: data.username,
        description: newExercise.description,
        duration: newExercise.duration,
        _id: data._id,
        date: newExercise.date.toString().split(' ').slice(0,4).join(' ')
      });
    }
  );
});

app.get('/api/users/:_id/logs', (req, res) => {
  User.findById(req.params._id, (err, data) => {
    var resObj = {
      _id: data._id,
      username: data.username,
      log: data.log,
      count: data.log.length
    }

    if(req.query.from && req.query.to) {
      const start = new Date(req.query.from);
      const end = new Date(req.query.to);
      const filteredLog = resObj.log.filter(entry => { return entry.date >= start && entry.date <= end });
      resObj.log = filteredLog;
      resObj.count = filteredLog.length;
    }

    if(req.query.limit) {
      const truncatedLog = resObj.log.slice(0, req.query.limit);
      resObj.log = truncatedLog;
      resObj.count = truncatedLog.length;
    }

    res.json(resObj);
  });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
})
