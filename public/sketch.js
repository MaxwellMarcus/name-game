var socket = io.connect(window.location.href)


var canvas = document.querySelector('canvas')
var ctx = canvas.getContext('2d');

const width = canvas.width
const height = canvas.height

ctx.fillStyle = 'blue';
ctx.fillRect(0, 0, 50, 50)
