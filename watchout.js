// start slingin' some d3 here.

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

