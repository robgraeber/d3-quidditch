
/**
 * Module dependencies.
 */
var _ = require('underscore');
var express = require('express');
var routes = require('./routes');
var io = require('socket.io');
var http = require('http');
var path = require('path');
var app = express();
var width = 1400;
var height = 600;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

io = io.listen(server);

var playerCounter = 0;
var players = [];
var theSnitch = null;
io.sockets.on('connection', function (socket) {

  var player = setupPlayer(socket);
  var playerObj = {id:player.id, x:player.x, y:player.y, color:player.color, radius:player.radius};
  var enemyObj = {};
  _.each(players, function(item){
    enemyObj[item.id] = {};
    enemyObj[item.id].id = item.id;
    enemyObj[item.id].x = item.x;
    enemyObj[item.id].y = item.y;
    enemyObj[item.id].points = item.points;
    enemyObj[item.id].radius = item.radius;
    enemyObj[item.id].color = item.color;
  });

  socket.emit("playerInitialize", playerObj);
  socket.emit("snitchInitialize", theSnitch);
  
  _.each(players, function(item){
    socket.emit("enemyInitialize",enemyObj);
  });
  _.each(players, function(item){
    item.socket.emit("enemyEnter", playerObj);
  });
  
  socket.on('playerScore', function (data) {
    player.radius = data.radius;
    player.points = data.points;
    _.each(players, function(item){
      item.socket.emit("enemyScore", {id:player.id, points:player.points, radius:player.radius});
    });
    setupSnitch();
  });

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
      item.socket.emit("enemyExit",{id: player.id});
   });

  });
});
var updatePlayerPositions = function(){
  var enemyMoveData = {};
  _.each(players, function(item){
    enemyMoveData[item.id] = {x:item.x, y:item.y, id: item.id};
  });
  _.each(players,function(item){
    item.socket.emit("enemyMove",enemyMoveData);
  });
};

var setupPlayer = function(socket){
  var player = {};
    
  player.radius = 24;
  player.color = '#'+(Math.random()*0xFFFFFF<<0).toString(16);
  player.points = 0;
  player.id = ++playerCounter;
  player.x = Math.random()*1024;
  player.y = Math.random()*768;
  player.socket = socket;

  return player;
};
var setupSnitch = function(){
  var snitch = {};
  snitch.x = Math.random()*width;
  snitch.y = Math.random()*height;
  snitch.radius = 4;
  snitch.color = "#FFFF00";
  _.each(players,function(item){
    item.socket.emit("snitchEnter",snitch);
  });
  theSnitch = snitch;
};
var moveSnitch = function(){
  var x = Math.random()*width;
  var y = Math.random()*height;
  _.each(players,function(item){
    item.socket.emit("snitchMove",{x: x, y:y});
  });
};
setupSnitch();
setInterval(updatePlayerPositions,100);
setInterval(moveSnitch,800);