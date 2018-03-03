var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var app = express()
var server = require('http').Server(app)
var io = require('socket.io').listen(server)
var mongoose = require('mongoose')
var Word = require('./Model/word')
var currentWord = "";
const dbMongo = 'mongodb://localhost:27017/bdStory'
const port = 8085

app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
var storyParts = []


app.get('/api/words', (req, res) => {
  Word.find({}, (err, words) => {
    if(err) return res.status(500).send({message: 'Error al buscar ' + err})
    if(!words) return res.status(404).send({message: 'No hay palabras'})
    res.status(200).send({words:words})
  })
})

app.get('/getpalabra', (req, res) => {
  Word.find({}, (err, words) => {
    if(words.length == 0){
      res.send("vacio")
    }
    let number = Math.floor(Math.random() * words.length)
    res.send(words[number].word)
  })
})


app.post('/api/setWord', (req, res) => {
  let word = new Word()
  word.word = req.param('inputWord')
  console.log(word);
  word.save((err, storeWord) => {
    if(err) {
      res.status(500)
      res.send({message: "Error al guardar " + err})
    } else {
      res.status(200)
      res.redirect("/")
      res.end()
    }
  })
})

mongoose.connect(dbMongo, (err, res) => {
  if(err){
    return console.log("Error de coneccion a la base de datos " + err)
  } else {
    console.log("Conexión establecida")
  }
})


io.on('connection', (socket) => {
  socket.emit('story', storyParts);
  socket.emit('new-word', currentWord)
  socket.on('sent-story', (data) => {
    storyParts.push(data)
    io.sockets.emit('story', storyParts)
    Word.find({}, (err, words) => {
      let number = Math.floor(Math.random() * words.length)
      currentWord = words[number].word
      io.emit('new-word', words[number].word)
    })
  })
})

server.listen(port, () => {
  console.log("Corriendo por el puerto " + port);
})
