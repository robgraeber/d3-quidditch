// start slingin' some d3 here.
var width = 1400;
var height = 600;
var mouse = {x:0, y:0};
var score = 0;
var levelNum = 0;

var board = d3.select(".gameContainer").append("svg:svg");
board.attr("height",height).attr("width",width);

var socket = io.connect('http://23.239.1.96:2016');
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
        removeEntity(this, "circle.enemyPlayer");
        d3.select(".enemy"+id).remove();
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
      setFloat(player, "r", getFloat(player, "r") * 0.95);
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






