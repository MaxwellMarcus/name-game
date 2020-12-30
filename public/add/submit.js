var socket = io.connect(window.location.url);

document.querySelector('#submit').onclick = e => {
  console.log('submitting')
  const name = document.querySelector('#name').value
  socket.emit('add', name);
  document.querySelector('#name').value = ''
};
