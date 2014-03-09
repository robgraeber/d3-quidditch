var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')
var _ = require('underscore');

app.listen(2020);

function handler (req, res) {
  console.log("POKE");
  // console.log(__dirname);
  // fs.readFile(__dirname + '/index.html',
  // function (err, data) {
  //   if (err) {
  //     res.writeHead(500);
  //     return res.end('Error loading index.html');
  //   }

  //   res.writeHead(200);
  //   res.end(data);
  // });
}
// {radius: 1234, color:"#asdf", id:35435, points:1235, x:235, y:1245, socket: null};


var players = [];

io.sockets.on('connection', function (socket) {

  var player = setupPlayer(socket);
  var playerObj = {id:player.id, x:player.x, y:player.y, color:player.color, radius:player.radius};
  var enemyObj = {};
  _.each(players, function(item){
    enemyObj[item.id] = {};
    enemyObj[item.id].id = item.id
    enemyObj[item.id].x = item.x;
    enemyObj[item.id].y = item.y;
    enemyObj[item.id].points = item.points;
    enemyObj[item.id].radius = item.radius;
    enemyObj[item.id].color = item.color;
  })

  socket.emit("playerInitialize", playerObj);
  
  _.each(players, function(item){
    socket.emit("enemyInitialize",enemyObj);
  })
  _.each(players, function(item){
    item.socket.emit("enemyEnter", playerObj);
  })
  
  

  socket.on('playerMove', function (data) {
    player.x = data.x;
    player.y = data.y;
  });

  players.push(player);

  socket.on('disconnect', function (socket) {
    for(var i = 0; i<players.length;i++){
      if(players[i] === player){
        players.splice(i, 1);
        break;
      }
    }
    _.each(players, function(item){
      item.socket.emit("enemyExit",{id: player.id})
   })

  });
});

setInterval(function(){
  var enemyMoveData = {};
  _.each(players, function(item){
    enemyMoveData[item.id] = {x:item.x, y:item.y, id: item.id};
  })
  _.each(players,function(item){
    item.socket.emit("enemyMove",enemyMoveData);
  })
},100);

var setupPlayer = function(socket){

  var playerObj = {};
    
    playerObj.radius = 24;
    playerObj.color = '#'+Math.floor(Math.random()*16777215).toString(16);
    playerObj.points = 0;
    playerObj.id = players.length+1;
    playerObj.x = Math.random()*1024;
    playerObj.y = Math.random()*768;
    playerObj.socket = socket;

  return playerObj;
}
