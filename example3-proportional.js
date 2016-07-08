var engine = require('./engine');                                               
var Point  = engine.Point;                                                      
var Line   = engine.Line                                                        
var solve  = engine.solve;                                                      

var A = new Point(0,0);                                                         

var b = Math.sqrt(3);                                                           
var B = new Point(b,0);                                                         

var c = Math.sqrt(5);                                                           
var C = new Point(c,0);                                                         

var d = b * b / c;                                                              
var D = new Point(d,0);                                                         

solve(                                                                          
  /* goals         */ [D],                                                             
  /* starting set  */ [A, B, C],                                                       
  /* problem setup */ [new Line(A,B)]                                                  
);
