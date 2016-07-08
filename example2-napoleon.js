var engine = require('./engine');
var Point  = engine.Point;
var Circle = engine.Circle;
var solve  = engine.solve;

var center = new Point(0,0);
var radius = new Point(1,0);

// for x in [-1,1] return positive y on unit circle
function getY(x) { return Math.sqrt(1 - x*x); }

var pointA = new Point(-1/2, getY(-1/2));
var pointB = new Point( 1/5, getY( 1/5));

solve(
  /* goals         */ [new Point(0,0)],
  /* starting set  */ [pointA, pointB],
  /* problem setup */ [new Circle(center, radius)],
  /* mask          */ ['circle**']
);
