var express = require('express');

var app = express();
var server = app.listen(3000);

app.use(express.static('public'))

console.log('Socket Server Running');

var socket = require('socket.io');

var io = socket(server);

const names = ['alpaca', 'bunny']

const clientNames = {}

const usernames = {}
const joinedTeam = {}

const teams = [[], []]
const upIndexes = [0, 0]
const scores = [0, 0]
let currentCorrect = 0;

let gameData = {
  teams,
  usernames,
  teamUp: 0,
  upIndexes,
  names,
  scores,
  joinedTeam,
  lastCorrect: null,
}

io.sockets.on('connection', socket => {
  console.log('New Connection: ' + socket.id)

  clientNames[socket.id] = []

  socket.on('add', name => {
    console.log('Adding: ' + name);

    if (!clientNames[socket.id].includes(name)){
      clientNames[socket.id].push(name);
      names.push(name);
      console.log('Added')
    }
  });

  socket.on('username', user => {
    console.log(user + ' logged in on client ' + socket.id)
    console.log('Exsisting Users: ' + usernames)
    usernames[socket.id] = user
  })

  // socket.on('play', () => {
  //   console.log(names)
  // })

  socket.on('team', team => {

    for (let t = teams.length - 1; t >= 0; t--){
      if (teams[t].includes(socket.id)){
        teams[t].splice(teams[t].indexOf(socket.id), 1)
        console.log(usernames[socket.id] + ' was removed from team ' + (t + 1))
      }
    }

    console.log(usernames[socket.id] + ' joined team ' + (team + 1))
    teams[team].push(socket.id)
    joinedTeam[socket.id] = team

    notready = 0
    for (const id in usernames){
      if (joinedTeam[id] == null){
        console.log(usernames[id] + ' is not ready')
        notready += 1
      }
    }

    if (notready == 0){
      console.log('Starting!')
      io.sockets.emit('starting', gameData)
    }else{
      console.log(notready + ' more players need to join to start the game')
    }
  });

  socket.on('removeTeam', () => {
    delete joinedTeam[socket.id];
    for (let t = teams.length - 1; t >= 0; t--){
      if (teams[t].includes(socket.id)){
        teams[t].splice(teams[t].indexOf(socket.id), 1)
        console.log(usernames[socket.id] + ' was removed from team ' + (t + 1))
      }
    }
  })

  socket.on('disconnect', () => {
    delete usernames[socket.id]
    delete joinedTeam[socket.id]
    for (let t = teams.length - 1; t >= 0; t--){
      if (teams[t].includes(socket.id)){
        teams[t].splice(teams[t].indexOf(socket.id), 1)
      }
    }
    console.log(usernames[socket.id] + ' left client ' + socket.id)
  })

  socket.on('timer', time => {
    socket.broadcast.emit('timer', time)
  })

  socket.on('endTurn', data => {
    data.upIndexes[data.teamUp] = (data.upIndexes[data.teamUp] + 1) % data.teams[data.teamUp].length
    data.teamUp = (data.teamUp + 1) % data.teams.length
    data.lastCorrect = currentCorrect

    console.log('Turn Ended')
    console.log('Name pool is now ' + data.names)
    console.log('Scores are now ' + data.scores)

    gameData = JSON.parse(JSON.stringify(data))
    io.sockets.emit('starting', gameData)
  })

  socket.on('correct', correct => {
    currentCorrect = correct
    socket.broadcast.emit('correct', correct)
  })

  socket.on('done', data => {
    data.upIndexes[data.teamUp] = (data.upIndexes[data.teamUp] + 1) % data.teams[data.teamUp].length
    data.teamUp = (data.teamUp + 1) % data.teams.length
    data.lastCorrect = currentCorrect

    console.log('Done')
    console.log('Scores are now ' + data.scores)

    gameData = JSON.parse(JSON.stringify(data))
    io.sockets.emit('done', gameData)
  })


  // socket.on('remove', name => {
  //   console.log('Removing: ' + name)
  //
  //   if (clientNames[socket.id].contains(name)){
  //     clientNames[socket.id].remove(name)
  //     names.remove(name)
  //     console.log('Removed')
  //   }
  // });
});
