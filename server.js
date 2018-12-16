const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const User = require('./models/user');
const Exercise = require('./models/exercises');

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI || 'mongodb://localhost/exercise-track' )

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())




app.post('/api/exercise/new-user', (req, res) => {
  
  var userData = new User(req.body);
  userData.save()
  .then(item => {
    res.json(userData);
  })
  .catch(err => {
    res.status(400).send("unable to save to database");
  });
  
});

app.post('/api/exercise/add', (req, res) => {
  
  var exerciseData = new Exercise(req.body);
  var userId = exerciseData.userId;
  if(!req.body.date) exerciseData.date = new Date();
  
  User.count({_id: userId}, function (err, count) {
    if(count > 0) {
      exerciseData.save()
      .then(item => {
        res.json(exerciseData);
      })
      .catch(err => {
        res.status(400).send("unable to save to database");
      });
      
      
    }
    else {
      res.json("User not found");
    }
  
  });
  
});




app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api/exercise/log/', (req, res) => {

  var {userId} = req.query;
  var {from} = req.query;
  var {to}  = req.query;
  var {limit} = req.query;
  
  var query = {
    userId: userId
  }
  
  if(from) {
    query.date = {$gte: from}
  }
  
  if(to) {
    query.date = {$lte: to}
  }
  
  var exercises = Exercise
  .find(query)
  .limit(Number(limit))
  .exec((err, data) => {
    if(err) res.send(err) 
    if(data.length == 0) res.send("No data found with specificed parameters.");

    res.send(data);
  
  });
  
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
