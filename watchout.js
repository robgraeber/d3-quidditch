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