var engine = require('./engine');
var Point  = engine.Point;
var solve  = engine.solve;

solve(
  /* goals         */ [new Point(0,0)],
  /* starting set  */ [new Point(1,0), new Point(-1,0)],
  /* problem setup */ [],
  /* mask          */ ['circle**']
);
