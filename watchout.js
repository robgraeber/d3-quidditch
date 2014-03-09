// start slingin' some d3 here.
var width = 1024;
var height = 768;
var mouse = {x:0, y:0};
var score = 0;
var highScore = 0;
var levelNum = 0;

var board = d3.select(".gameContainer").append("svg:svg");
board.attr("height",height).attr("width",width);

var socket = io.connect('http://23.239.1.96:2020');
socket.on("playerInitialize", function(data){
  addPlayer(data);
  console.log("INITIALIZE ME",data);
})
socket.on("enemyInitialize", function(data){
  for(var key in data){
    console.log("INITIALIZE OTHER PLAYERS",data[key]);
    addEnemyPlayer(data[key]);
  }
})
socket.on('enemyMove', function (data) {
  console.log(data);
  _.each(data, function(item){
    d3.selectAll("circle.enemyPlayer").each(function(d,i){
      if(getFloat(this,"id") === item.id){
        setFloat(this,"cx",item.x);
        setFloat(this,"cy",item.y);
      }
    })
  })

});
socket.on('enemyEnter', function (data) {
  console.log("ENEMY PLAYER ENTER",data);
  addEnemyPlayer(data);
});
socket.on('enemyExit', function (data) {
  console.log("ENEMY PLAYER EXIT",data);
});

var addEnemies = function (){
  // var color = inverse(board.select("circle.player").style("fill"));
  var currentEnemies = board.selectAll("circle.enemy").data().concat(
    _.map(_.range(2,3), function(num){
      return {radius: num, color: "#FFFF00"};
   })
  );
  setupEnemies(currentEnemies);

}

var setupEnemies = function(data){
  var enemies = board.selectAll("circle.enemy").data(data);
  
  enemies.enter().append("svg:circle")
  .style("fill", function(data){
    return data.color;
  }).attr("cx",function(data){
    return Math.random()*width;
  }).attr("cy", function(data){
    return Math.random()*height;
  }).attr("r", function(data){
    return 4;
  }).attr("class","enemy");

  board.selectAll("circle.player").moveToFront();
}
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};
var removeEntity = function(enemy, selectorString){
  if(!(enemy instanceof d3.selection)){
    enemy = d3.select(enemy);
  }

  var badData = enemy.data();
  var enemyData = board.selectAll(selectorString).data();
  enemyData.splice(enemyData.indexOf(badData[0]),1);
  enemyData = board.selectAll(selectorString).data(enemyData);
  enemyData.exit().remove();
}

var moveEnemies = function(){
  var enemies = board.selectAll("circle.enemy");

  enemies.transition()
  .duration(500)
  .ease("sin")
  .attr("cx",function(data){
    return Math.random()*width;
  }).attr("cy", function(data){
    return Math.random()*height;
  });
}

var addPlayer = function(data){
  data = board.selectAll("circle.player").data().concat(data);
  
  board.selectAll("circle.player").data(data).enter().append("svg:circle")
  .style("fill", function(data){
    return data.color;
  }).attr("cx",function(data){
    return data.x;
  }).attr("cy", function(data){
    return data.y;
  }).attr("r", 0).transition().duration(500).attr("r", function(data){
    return data.radius;
  }).attr("class","player");

}

var addEnemyPlayer = function(data){
  data = board.selectAll("circle.enemyPlayer").data().concat(data);
  
  board.selectAll("circle.enemyPlayer").data(data).enter().append("svg:circle")
  .style("fill", function(data){
    return data.color;
  }).attr("cx",function(data){
    return data.x;
  }).attr("cy", function(data){
    setFloat(this, "id", data.id);
    return data.y;
  })
  .attr("r", 0).transition().duration(500).attr("r", function(data){
    return data.radius;
  }).attr("class","enemyPlayer");

}

var setupLevel = function(){
  levelNum++;
  var color = "#FFFFFF"
  if(levelNum === 1){
    color = "blue"
  }else if(levelNum === 2){
    color = "red";
  }else{
    color = '#'+Math.floor(Math.random()*16777215).toString(16);
  }
  if(levelNum >= 2){
    var bgColor = board.selectAll("circle.player").style("fill");
    d3.select(".gameContainer").style("background-color", bgColor);
    removeEntity(board.select("circle.player"), "circle.player");
  }
  //setupPlayer(color);
  setTimeout(addEnemies, 300);

}
var movePlayer = function(){
  var player = board.selectAll("circle.player");

  if(player[0].length <= 0){
    return;
  }
  player.attr("cx",function(data){
    var x = getFloat(this, "cx");
    xpos = x;
    return x+(mouse.x - x)/(2+((getFloat(this, "r")-data.radius)/15));
  }).attr("cy", function(data){
    var y = getFloat(this, "cy");
    return y+(mouse.y - y)/(2+((getFloat(this, "r")-data.radius)/15));
  });

  var x = getFloat(player, "cx");
  var y = getFloat(player, "cy");
  socket.emit("playerMove",{x:x, y:y});
}

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
      setFloat(player, "r", getFloat(player, "r") * .8);
      removeEntity(enemy, "circle.enemy");  
      addEnemies();
    }
  })
}
var getFloat = function(item, name){
  if(item instanceof d3.selection){
    return parseFloat(item.attr(name));
  }else{
    return parseFloat(d3.select(item).attr(name));
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
  collisionCheck();
  updateScore();
}
var updateScore = function(){
  // d3.select(".high span").text(highScore);
  d3.select(".current span").text(score);
  if(score > highScore){
    highScore = score;
  }
  if(levelNum > 1){
   d3.select(".level").text("Level: "+levelNum);
  }
}
function inverse(hex) {
  if (hex.length != 7 || hex.indexOf('#') != 0) {
    return null;
  }
  var r = (255 - parseInt(hex.substring(1, 3), 16)).toString(16);
  var g = (255 - parseInt(hex.substring(3, 5), 16)).toString(16);
  var b = (255 - parseInt(hex.substring(5, 7), 16)).toString(16);
  var inverse = "#" + pad(r) + pad(g) + pad(b);

  return inverse
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
}

board.on("mousemove", function(){
   mouse.x = d3.mouse(this)[0];
   mouse.y = d3.mouse(this)[1];
  });

setupLevel();
setInterval(moveEnemies, 800);
setInterval(updateLoop, 1000/60);






