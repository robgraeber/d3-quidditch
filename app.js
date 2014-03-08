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

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});