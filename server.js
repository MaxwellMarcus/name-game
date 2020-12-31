var express = require('express');

var app = express();
var server = app.listen(process.env.PORT || 3000);

app.use(express.static('public'))

console.log('Socket Server Running');

var socket = require('socket.io');

var io = socket(server);

let names = ['alpaca', 'bunny']
let clientNames = {}
let usernames = {}
let joinedTeam = {}
let teams = [[], []]
let upIndexes = [0, 0]
let scores = [0, 0]
let teamNames = ['blueberries', 'stawberries']
let gameId = ''
let sockets = []

let games = {}
games[''] = {
  teams,
  usernames,
  teamUp: 0,
  upIndexes,
  names,
  scores,
  joinedTeam,
  teamNames,
  gameId,
  sockets,
  lastCorrect: null,
}


io.sockets.on('connection', socket => {
  console.log('New Connection: ' + socket.id)

  let gameData = {}
  let teams = []
  let usernames = []
  let upIndexes = []
  let names = []
  let scores = []
  let joinedTeam = []
  let lastCorrect
  let sockets = []
  let currentCorrect
  clientNames = []

  socket.on('add', name => {
    console.log('Adding: ' + name);

    if (!clientNames.includes(name)){
      clientNames.push(name);
      names.push(name);
      console.log('Added')
    }
  });

  socket.on('username', user => {
    console.log(user + ' logged in on client ' + socket.id)
    if (!Object.values(usernames).includes(user)){
      usernames[socket.id] = user
      console.log(user + ' Successfully joined game ' + gameData.gameId + 'along with users: ' + Object.values(usernames))
      socket.emit('usernameSuccess')
    }else{
      console.log(socket.id + ' was not able to join because a user with that name already exsists')
      socket.emit('usernameFailure')
    }
  })

  socket.on('newGame', data => {
    console.log('Starting new game with game code ' + data.gameId)
    if (!games[data.gameId]){
      gameData = data
      // [teams, usernames, upIndexes, names, scores, joinedTeam, lastCorrect] = gameData;
      teams = gameData.teams
      usernames = gameData.usernames
      upIndexes = gameData.upIndexes
      names = gameData.names
      scores = gameData.scores
      joinedTeam = gameData.joinedTeam
      lastCorrect = gameData.lastCorrect
      sockets = gameData.sockets
      gameData.sockets.push(socket)
      games[gameData.gameId] = gameData
      socket.emit('gameCreated', gameData.teamNames)
    }else{
      socket.emit('gameCreationFailed')
      console.log('Game creation failed because a game has already been created with that id')
    }
  })

  socket.on('joinGame', id => {
    console.log('joining game with game code ' + id)
    if (games[id]){
      gameData = games[id]
      // [teams, usernames, upIndexes, names, scores, joinedTeam, lastCorrect] = gameData;
      teams = gameData.teams
      usernames = gameData.usernames
      upIndexes = gameData.upIndexes
      names = gameData.names
      scores = gameData.scores
      joinedTeam = gameData.joinedTeam
      lastCorrect = gameData.lastCorrect
      sockets = gameData.sockets
      sockets.push(socket)
      socket.emit('gameJoined', gameData.teamNames)
    }else{
      socket.emit('gameJoinFailed')
      console.log('Could not join game because there is no game with that id')
    }
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
      const sockets = gameData.sockets
      delete gameData.sockets
      sockets.forEach(socket => socket.emit('starting', gameData))
      gameData.sockets = sockets
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
    sockets.forEach(socket => socket.emit('timer', time))
  })

  socket.on('endTurn', data => {
    const sockets = gameData.sockets
    data.upIndexes[data.teamUp] = (data.upIndexes[data.teamUp] + 1) % data.teams[data.teamUp].length
    data.teamUp = (data.teamUp + 1) % data.teams.length
    data.lastCorrect = currentCorrect

    console.log('Turn Ended')
    console.log('Name pool is now ' + data.names)
    console.log('Scores are now ' + data.scores)

    gameData = JSON.parse(JSON.stringify(data))
    sockets.forEach(socket => socket.emit('starting', gameData))
    gameData.sockets = sockets
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
    sockets.forEach(socket => socket.emit('done', gameData))
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
