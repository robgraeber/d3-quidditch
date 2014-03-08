var app = require('http').createServer(handler)
  , io = require('socket.io').listen(app)
  , fs = require('fs')

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
  
  for (var i = 0; i < players.length; i++) {
    socket.emit("initialize other players",{id: i});
  };

  for (var i = 0; i < players.length; i++) {
    players[i].emit("enemy player enter",{id: 1});
  };

  socket.on('player move', function (data) {
  });
  players.push(socket);
  socket.on('disconnect', function (socket) {
    if(players.indexOf(socket)!== -1){
      players.splice(players.indexOf(socket),1);
    }

    for (var i = 0; i < players.length; i++) {
      players[i].emit("enemy player exit",{id: 1});
    };

  });
});
