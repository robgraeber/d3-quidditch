// start slingin' some d3 here.
var width = 1400;
var height = 600;
var mouse = {x:0, y:0};
var score = 0;
var levelNum = 0;

var board = d3.select(".gameContainer").append("svg:svg");
board.attr("height",height).attr("width",width);

var socket = io.connect('/');
socket.on("playerInitialize", function(data){
  addPlayer(data);
  console.log("playerInitialize",data);
});
socket.on("snitchInitialize", function(data){
  addSnitch(data);
  console.log("snitchInitialize",data);
});
socket.on("enemyInitialize", function(data){
  for(var key in data){
    console.log("INITIALIZE OTHER PLAYERS",data[key]);
    addEnemyPlayer(data[key]);
  }
});
socket.on("enemyScore", function(data){
  console.log("enemyScore",data);
  removeEntity(board.select("circle.enemy"), "circle.enemy");
  d3.selectAll("circle.enemyPlayer").each(function(d,i){
    if(getFloat(this,"id") === data.id){
      setFloat(this,"points", data.points);
      setFloat(this,"r",data.radius);
    }
  });
});
socket.on("snitchMove", function(data){
  //console.log("snitchMove",data);
  moveSnitch(data);
});
socket.on('enemyMove', function (data) {
  _.each(data, function(item){
    d3.selectAll("circle.enemyPlayer").each(function(d,i){
      if(getFloat(this,"id") === item.id){
        setFloat(this,"mouseX",item.x);
        setFloat(this,"mouseY",item.y);
      }
    });
  });
});
socket.on("snitchEnter", function(data){
  // console.log("snitchEnter",data);
  addSnitch(data);
});
socket.on('enemyEnter', function (data) {
  // console.log("ENEMY PLAYER ENTER",data);
  addEnemyPlayer(data);
});
socket.on('enemyExit', function (data) {
  console.log("ENEMY PLAYER EXIT",data);
  d3.selectAll("circle.enemyPlayer").each(function(d,i){
      var id = getFloat(this,"id");
      if(id === data.id){
        d3.selectAll(".enemy"+id).remove();
        removeEntity(this, "circle.enemyPlayer");
      }
    });
});

d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
var removeEntity = function(item, selectorString){
  if(!(item instanceof d3.selection)){
    item = d3.select(item);
  }

  var badData = item.data();
  var itemData = board.selectAll(selectorString).data();
  itemData.splice(itemData.indexOf(badData[0]),1);
  itemData = board.selectAll(selectorString).data(itemData);
  itemData.exit().remove();
};

var moveSnitch = function(data){
  var enemies = board.selectAll("circle.enemy");

  enemies.transition()
  .duration(500)
  .ease("sin")
  .attr("cx",function(){
    return data.x;
  }).attr("cy", function(){
    return data.y;
  });
};
var addSnitch = function(data){
  data = board.selectAll("circle.enemy").data().concat(data);
  
  board.selectAll("circle.enemy").data(data).enter().append("svg:circle")
  .style("fill", function(data){
    return data.color;
  }).attr("cx",function(data){
    return data.x;
  }).attr("cy", function(data){
    return data.y;
  }).attr("r", function(data){
    return data.radius;
  }).attr("class","enemy");

  board.selectAll("circle.enemy").moveToFront();
};
var addPlayer = function(data){
  data = board.selectAll("circle.player").data().concat(data);
  
  board.selectAll("circle.player").data(data).enter().append("svg:circle")
  .style("fill", function(data){
    setFloat(this, "id", data.id);
    setFloat(this, "points", 0);
    d3.select(".scoreboard").append("div").attr("class", "enemy"+data.id+" score").text("Guest #"+data.id+" (You): ").append("span").text("0");
    return data.color;
  }).attr("cx",function(data){
    return data.x;
  }).attr("cy", function(data){
    return data.y;
  }).attr("r", 0).transition().duration(500).attr("r", function(data){
    return data.radius;
  }).attr("class","player");
};

var addEnemyPlayer = function(data){
  data = board.selectAll("circle.enemyPlayer").data().concat(data);
  
  board.selectAll("circle.enemyPlayer").data(data).enter().append("svg:circle")
  .style("fill", function(data){
    setFloat(this, "id", data.id);
    setFloat(this, "points", data.points);
    d3.select(".score.enemy"+data.id).remove();
    d3.select(".scoreboard").append("div").attr("class", "enemy"+data.id+" score").text("Guest #"+data.id+": ").append("span").text("0");
    return data.color;
  }).attr("cx",function(data){
    return data.x;
  }).attr("cy", function(data){
    return data.y;
  })
  .attr("r", 0).transition().duration(500).attr("r", function(data){
    return data.radius;
  }).attr("class","enemyPlayer");

};

var moveEnemyPlayers = function(){
  var player = board.selectAll("circle.enemyPlayer");

  if(player[0].length <= 0){
    return;
  }
 
  player.attr("cx",function(){
    var dragMultiplier = 1+getFloat(this, "r")/24;
    var x = getFloat(this, "cx");
    var mouseX = getFloat(this, "mouseX");
    return x+(mouseX - x)/dragMultiplier;
  }).attr("cy", function(){
    var dragMultiplier = 1+getFloat(this, "r")/24;
    var y = getFloat(this, "cy");
    var mouseY = getFloat(this, "mouseY");
    return y+(mouseY - y)/dragMultiplier;
  });
};
var movePlayer = function(){
  var player = board.selectAll("circle.player");

  if(player[0].length <= 0){
    return;
  }
  var dragMultiplier = 1+getFloat(player, "r")/24;
  player.attr("cx",function(data){
    var x = getFloat(this, "cx");
    xpos = x;
    return x+(mouse.x - x)/dragMultiplier;
  }).attr("cy", function(data){
    var y = getFloat(this, "cy");
    return y+(mouse.y - y)/dragMultiplier;
  });

  socket.emit("playerMove",{x:mouse.x, y:mouse.y});
};

var collisionCheck = function(){
  var enemies = board.selectAll("circle.enemy"); 
  var player = board.selectAll("circle.player");
  if(player[0].length <= 0){
    return;
  }

  var playerX = getFloat(player, "cx");
  var playerY = getFloat(player, "cy");
  var playerR = getFloat(player, "r");

  _.each(enemies[0],function(enemy){
    var enemyX = getFloat(enemy, "cx");
    var enemyY = getFloat(enemy, "cy");
    var enemyR = getFloat(enemy, "r");
    if(distanceBetween(playerX,playerY,enemyX,enemyY)<playerR+enemyR){
      score++;
      setFloat(player,"points", score);
      var newRadius = getFloat(player, "r") * 0.95;
      newRadius = Math.max(1, newRadius);
      setFloat(player, "r", newRadius);
      removeEntity(enemy, "circle.enemy");  
      socket.emit("playerScore", {points:score, radius: getFloat(player, "r") });
    }
  });
};
var getFloat = function(item, name){
  if(item instanceof d3.selection){
    return parseFloat(item.attr(name)) || 0;
  }else{
    return parseFloat(d3.select(item).attr(name)) || 0;
  }
};
var setFloat = function(item, name, value){
  if(item instanceof d3.selection){
    item.attr(name, value);
  }else{
    return d3.select(item).attr(name, value);
  }
};

var updateLoop = function(){
  movePlayer();
  moveEnemyPlayers();
  collisionCheck();
  updateScore();
};
var updateScore = function(){
  d3.selectAll("circle.player").each(function(d, i){
    var id = getFloat(this, "id");
    var points = getFloat(this, "points");
    d3.select(".enemy"+id+" span").text(points);
  });
  d3.selectAll("circle.enemyPlayer").each(function(d, i){
    var id = getFloat(this, "id");
    var points = getFloat(this, "points");
    d3.select(".enemy"+id+" span").text(points);
  });
};
function inverse(hex) {
  if (hex.length != 7 || hex.indexOf('#') !== 0) {
    return null;
  }
  var r = (255 - parseInt(hex.substring(1, 3), 16)).toString(16);
  var g = (255 - parseInt(hex.substring(3, 5), 16)).toString(16);
  var b = (255 - parseInt(hex.substring(5, 7), 16)).toString(16);
  var inverseColor = "#" + pad(r) + pad(g) + pad(b);

  return inverseColor;
}
function pad(num) {
  if (num.length < 2) {
    return "0" + num;
  } else {
    return num;
  }
}

var distanceBetween = function(x1,y1,x2,y2){
  var a = x1 - x2;
  var b = y1 - y2;
  return Math.sqrt(a*a + b*b);
};

board.on("mousemove", function(){
   mouse.x = d3.mouse(this)[0];
   mouse.y = d3.mouse(this)[1];
  });

setInterval(updateLoop, 1000/60);






var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore: 0
};

var axes = {
  x: d3.scale.linear().domain([0,100]).range([0,gameOptions.width]),
  y: d3.scale.linear().domain([0,100]).range([0,gameOptions.height])
};
var gameBoard = d3.select('.container').append('svg:svg')
                                       .attr('width', gameOptions.width)
                                       .attr('height', gameOptions.height);

var updateScore = function(){
  d3.select('#current-score')
    .text(gameStats.score.toString());
};
var updateBestScore = function(){
  gameStats.bestScore = _.max(gameStats.bestScore, gameStats.score);
  d3.select('#best-score').text(gameStats.bestScore.toString());
};

var Player = function(gameOptions){
  this.gameOptions = gameOptions;
  var path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  var fill = '#ff6600';
  var x = 0;
  var y = 0;
  var angle = 0;
  var r = 5;
  var that = this;
  //adds to svg and setup default position
  this.render = function(to) {
    this.el = to.append('svg:path')
                .attr('d', path)
                .attr('fill', fill);
    this.transform({
      x: this.gameOptions.width * 0.5,
      y: this.gameOptions.height * 0.5
    });

    this.setupDragging();
    // this;
  };
  this.getX = function(){
    return x;
  };
  this.setX = function(num){
    minX = this.gameOptions.padding;
    maxX = this.gameOptions.width - this.gameOptions.padding;
    num = Math.max(minX, num);
    num = Math.min(maxX, num);
    x = num;
  };
  this.getY = function(){
    return y;
  };
  this.setY = function(num){
    minY = this.gameOptions.padding;
    maxY = this.gameOptions.height - this.gameOptions.padding;
    num = Math.max(minY, num);
    num = Math.min(maxY, num);
    y = num;
  };
  this.transform = function(opts){
    angle = opts.angle || angle;
    console.log(opts.x, opts.y);
    this.setX(opts.x || x);
    this.setY(opts.y || y);
    this.el.attr('transform', "translate("+this.getX()+","+this.getY()+")");
      // "rotate("+this.angle+","+this.getX()+","+this.getY()+")"+

    // console.log('transform', "translate("+this.getX()+","+this.getY()+")");
  };
  this.moveAbsolute = function(x,y){
    this.transform({x:x, y:y});
  };

  this.moveRelative = function (dx,dy){
    this.transform({
      x: this.getX()+dx,
      y: this.getY()+dy,
      angle: 360 * (Math.atan2(dy,dx)/(Math.PI*2))
    });
  };

  this.setupDragging = function(){
    var dragMove = function(){
      that.moveRelative(d3.event.dx, d3.event.dy);
    };
    var drag = d3.behavior.drag()
                          .on('drag', dragMove);
    this.el.call(drag);
  };
};
var players = [];
players.push(new Player(gameOptions));
for (var i = 0; i < players.length; i++){
  players[i].render(gameBoard);
}

var createEnemies = function(){
  return _.range(0,gameOptions.nEnemies).map(function(i){
    return{
      id: i,
      x: Math.random()*100,
      y: Math.random()*100,
    };
  });
};
var renderEnemies = function(enemyData){
  var enemies = gameBoard.selectAll('circle.enemy')
                         .data(enemyData);
  enemies.attr('class', 'enemy')
         .attr('cx', function(enemy){ return axes.x(enemy.x);})
         .attr('cy', function(enemy){ return axes.y(enemy.y);})
         .attr('r', 7);
  enemies.enter()
         .append('svg:circle')
         .attr('class', 'enemy')
         .attr('cx', function(enemy){ return axes.x(enemy.x);})
         .attr('cy', function(enemy){ return axes.y(enemy.y);})
         .attr('r', 7);
  
  enemies.exit()
         .remove();
};

