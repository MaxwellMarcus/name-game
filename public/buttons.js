const socket = io.connect(window.location.href);

let timeInterval;
let up;
let gameData;
let correct = 0;
let word;
let start;
let lastScore;
let team;
let teamNames

document.querySelector('#createGame').onclick = e => {
  document.querySelector('#createJoin').style.display = 'none'
  document.querySelector('#createGameScreen').style.display = 'grid'
}

document.querySelector('#joinGame').onclick = e => {
  document.querySelector('#createJoin').style.display = 'none'
  document.querySelector('#joinGameScreen').style.display = 'grid'
}

document.querySelector('#createButton').onclick = e => {

  const names = []
  const clientNames = {}
  const usernames = {}
  const joinedTeam = {}
  const teams = [[], []]
  const upIndexes = [0, 0]
  const scores = [0, 0]
  const teamNames = [document.querySelector('#team1Name').value, document.querySelector('#team2Name').value]
  const gameId = document.querySelector('#gameCodeInput').value
  const sockets = []
  let currentCorrect = 0;

  gameData = {
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

  socket.emit('newGame', gameData)

}

socket.on('gameCreated', (data) => {
  gameData = data
  teamNames = gameData.teamNames

  document.querySelector('#createGameScreen').style.display = 'none'
  document.querySelector('#userform').style.display = 'grid'
  document.querySelector('#gameCreateWarn').style.display = 'none'
})

socket.on('gameCreationFailed', ()=> {
  document.querySelector('#gameCreateWarn').style.display = 'inline-block'
})

document.querySelector('#joinGameButton').onclick = e => {
  const gameId = document.querySelector('#joinGameInput').value
  socket.emit('joinGame', gameId)
}

socket.on('gameJoined', teams => {
  teamNames = teams

  document.querySelector('#joinGameScreen').style.display = 'none'
  document.querySelector('#userform').style.display = 'grid'
  document.querySelector('#joinWarn').style.display = 'none'
})

socket.on('gameJoinFailed', () => {
  document.querySelector('#joinWarn').style.display = 'inline-block'
})

document.querySelector('#play').onclick = e => {
  const name = document.querySelector('#username').value;
  socket.emit('username', name)
}

socket.on('usernameSuccess', () => {
  document.querySelector('#userform').style.display = 'none'
  document.querySelector('#startMenu').style.display = 'grid'
  document.querySelector('#addMenu').style.display = 'none'
  document.querySelector('#userWarn').style.display = 'none'
})

socket.on('usernameFailure', () => {
  document.querySelector('#userWarn').style.display = 'inline-block'
})

document.querySelector('#add').onclick = e => {
  document.querySelector('#startMenu').style.display = 'none'
  document.querySelector('#addMenu').style.display = 'grid'
}

document.querySelector('#submit').onclick = e => {
  console.log('submitting')
  const name = document.querySelector('#name').value
  socket.emit('add', name);
  document.querySelector('#name').value = ''
}

document.querySelector('#addBack').onclick = e => {
      document.querySelector('#startMenu').style.display = 'grid'
      document.querySelector('#addMenu').style.display = 'none'
    }

document.querySelector('#playGame').onclick = e => {
  document.querySelector('#startMenu').style.display = 'none'
  document.querySelector('#teamSelect').style.display = 'grid'

  document.querySelector('#team1').textContent = 'Team ' + teamNames[0]
  document.querySelector('#team2').textContent = 'Team ' + teamNames[1]

  socket.emit('play')
}

document.querySelector('#team1').onclick = e => {
  socket.emit('team', 0)
  team = 0
  document.querySelector('#waiting').style.display = 'grid'
  document.querySelector('#teamSelect').style.display = 'none'
}

document.querySelector('#team2').onclick = e => {
  socket.emit('team', 1)
  team = 1
  document.querySelector('#waiting').style.display = 'grid'
  document.querySelector('#teamSelect').style.display = 'none'
}

document.querySelector('#teamBack').onclick = e => {
  document.querySelector('#startMenu').style.display = 'grid'
  document.querySelector('#teamSelect').style.display = 'none'

}

document.querySelector('#switchTeam').onclick = e => {
  document.querySelector('#waiting').style.display = 'none'
  document.querySelector('#teamSelect').style.display = 'grid'

  socket.emit('removeTeam')
}

socket.on('starting', (data) => {
  document.querySelector('#waiting').style.display = 'none'
  document.querySelector('#gameGrid').style.display = 'grid'

  const upId = data.teams[data.teamUp][data.upIndexes[data.teamUp]]
  const upNextId = data.teams[(data.teamUp + 1) % data.teams.length][data.upIndexes[data.teamUp]]

  gameData = JSON.parse(JSON.stringify(data))

  if (upId == socket.id){
    up = true
  }else{
    up = false
  }

  if (!up){
    document.querySelector('#up').innerHTML = `${data.usernames[upId]} is up for team ${teamNames[data.teamUp]}`
    document.querySelector('#notUp').style.display = 'inline-block'
    document.querySelector('#upScreen').style.display = 'none'

    document.querySelector('#teamScore').textContent = 'Your Score: ' + data.scores[data.joinedTeam[socket.id]]
    document.querySelector('#otherScore').textContent = 'Team' + teamNames[(team + 1) % teamNames.length] + ' Score: ' + data.scores[(data.joinedTeam[socket.id] + 1) % data.teams.length]
    document.querySelector('#currentScore').textContent = 'Current Round: 0'
    if (data.lastCorrect != null){
      document.querySelector('#lastScore').textContent = 'Last Round: ' + data.lastCorrect
    }
  }else{
    document.querySelector('#up').innerHTML = `You're Up!`
    document.querySelector('#upScreen').style.display = 'inline-block'
    document.querySelector('#notUp').style.display = 'none'
    document.querySelector('#waitingStartTurn').style.display = 'inline-block'
    document.querySelector('#playing').style.display = 'none'
  }
  document.querySelector('#upNext').innerHTML = `${data.usernames[upNextId]} is up next for team ${teamNames[((data.teamUp + 1) % data.teams.length)]}`
})

document.querySelector('#startTurn').onclick = e => {
  correct = 0;
  start = Date.now()

  timeInterval = setInterval(() => {
    var timer = 60000 - (Date.now() - start);

    document.querySelector('#timer').textContent = `Timer: ${Math.floor(timer / 1000)}`

    if (timer <= 0){
      gameData.scores[gameData.teamUp] = correct
      clearInterval(timeInterval)
      gameData.names.push(word)
      socket.emit('endTurn', gameData)
    }

    socket.emit('timer', timer)
  }, 200)

  document.querySelector('#waitingStartTurn').style.display = 'none'
  document.querySelector('#playing').style.display = 'inline-block'

  document.querySelector('#drawnName').textContent = `Name: ${getNewWord()}`
  document.querySelector('#correctCounter').textContent = `Correct: ${correct}`

  if (gameData.names.length == 0){
    document.querySelector('#warning').style.display = 'inline-block'
  }else{
    document.querySelector('#warning').style.display = 'none'
  }
}

document.querySelector('#correct').onclick = e => {
  if (word){
    correct += 1;

    document.querySelector('#drawnName').textContent = `Name: ${getNewWord()}`
    document.querySelector('#correctCounter').textContent = `Correct: ${correct}`

    if (gameData.names.length == 0){
      document.querySelector('#warning').style.display = 'inline-block'
    }else{
      document.querySelector('#warning').style.display = 'none'
    }

    socket.emit('correct', correct)

    if (!word){
      gameData.scores[gameData.teamUp] = correct
      clearInterval(timeInterval)
      socket.emit('done', gameData)
    }
  }
}

socket.on('correct', correct => {
  document.querySelector('#currentScore').textContent = `Correct: ${correct}`
})

document.querySelector('#pass').onclick = e => {
  let old_word = JSON.parse(JSON.stringify(word))
  const newWord = getNewWord()
  if (newWord){
    document.querySelector('#drawnName').textContent = `Name: ${newWord}`
    gameData.names.push(old_word)
  }else{
    word = old_word
  }
}

socket.on('timer', time => {
  document.querySelector('#timer').textContent = `Timer: ${Math.floor(time / 1000)}`
})

socket.on('done', data => {
  document.querySelector('#gameGrid').style.display = 'none'
  document.querySelector('#done').style.display = 'grid'

  document.querySelector('#yourFinalScore').textContent = 'Your Score: ' + data.scores[data.joinedTeam[socket.id]]
  document.querySelector('#otherFinalScore').textContent = 'Opponent Score: ' + data.scores[(data.joinedTeam[socket.id] + 1) % data.teams.length]
})

getNewWord = () => {
  const randomIndex = Math.floor(Math.random() * gameData.names.length)
  word = gameData.names.splice(randomIndex, 1)[0]
  return word
}
