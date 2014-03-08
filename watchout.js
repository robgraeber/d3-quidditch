// start slingin' some d3 here.
var width = 640;
var height = 480;
var mouse = {x:0, y:0};
var score =0;
var highScore = 0;
var collisions=0;
var collisionTime = (new Date()).getTime();

var board = d3.select(".gameContainer").append("svg:svg");
board.attr("height",height).attr("width",width);

var addEnemies = function (){
  var currentEnemies = board.selectAll("circle.enemy").data().concat(
    _.map(_.range(10), function(item){
      return {id: item};
   })
  );
  setupEnemies(currentEnemies);
}
var shuffleEnemies = function (){
  var currentEnemies = _.shuffle(board.selectAll("circle.enemy").data());
  setupEnemies(currentEnemies);
};
var setupEnemies = function(data){
  var enemies = board.selectAll("circle.enemy").data(data);
  
  enemies.attr("r", function(data){
    return data.id*2;
  });
  enemies.enter().append("svg:circle")
  .style("fill", function(){
    return '#'+Math.floor(Math.random()*16777215).toString(16);
  })
  .attr("cx",function(data){
    return Math.random()*width;
  }).attr("cy", function(data){
    return Math.random()*height;
  }).attr("r", function(data){
    return data.id*2;
  }).attr("class","enemy");
}
var removeEnemies = function(){
  var enemyData = board.selectAll("circle.enemy").data();
  var enemies = board.selectAll("circle.enemy").data(enemyData.slice(0, Math.floor(enemyData.length/2)));
  enemies.exit().remove();
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
  }).attr("r", function(data){
    return data.id*2;
  });
}
var setupPlayer = function(){
  var player = board.selectAll("circle.player").data([{x:Math.random()*width, y:Math.random()*height, radius:12}]);
  
  player.enter().append("svg:circle")
    .attr("cx",function(data){
    return data.x;
  }).attr("cy", function(data){
    return data.y;
  }).attr("r", function(data){
    return data.radius;
  }).attr("class","player");

}

// x += (mouse.x - x)/2
var movePlayer = function(){
   var player = board.selectAll("circle.player");

    player
    .attr("cx",function(data){
      var x = getFloat(this, "cx");
      return x+(mouse.x - x)/2;
    }).attr("cy", function(data){
      var y = getFloat(this, "cy");
      return y+(mouse.y - y)/2;
    }).attr("r", function(data){
      return data.radius;
    });
}

var collisionCheck = function(){
  var enemies = board.selectAll("circle.enemy"); 
  var player = board.select("circle.player");

  var playerX = getFloat(player, "cx");
  var playerY = getFloat(player, "cy");
  var playerR = getFloat(player, "r");

  _.each(enemies[0],function(item){
    var enemyX = getFloat(item, "cx");
    var enemyY = getFloat(item, "cy");
    var enemyR = getFloat(item, "r");
    if(distanceBetween(playerX,playerY,enemyX,enemyY)<playerR+enemyR){
      var currentTime = (new Date()).getTime();
      if(currentTime - collisionTime > 1000){
        collisionTime = currentTime;
        if(score > highScore){
          highScore = score;
        }
        score = 0;
        collisions++;
      }
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

var updateLoop = function(){
  movePlayer();
  collisionCheck();
  updateScore();
}
var updateScore = function(){
  score++;
  d3.select(".high span").text(highScore);
  d3.select(".current span").text(score);
  d3.select(".collisions span").text(collisions);
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

addEnemies();//setupEnemies();
setupPlayer();
setInterval(moveEnemies, 800);
setInterval(updateLoop, 1000/60);
