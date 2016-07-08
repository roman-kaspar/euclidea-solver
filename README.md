# Euclidea 3 solver

I like puzzles, and I like geometry. So no wonder I really enjoyed the [Euclidea](https://itunes.apple.com/en/app/id927914361) game.

While solving the geometric problems there, you can see hints for the number of moves for minimal solutions, including the number of minimal moves when solving the problem with straightedge and compass only. So after you successfully solve the puzzle, you can try solving it again in the most efficient way known for given problem. And that's where it became interesting for me from a different perspective as well. For sometimes, I was able to solve the problem, but I missed the straightedge/compass minimal solution.

I also like programming. After I spent some time thinking about the minimal solution for a problem, and was still clueless, I thought I could hack a script that would help me find it. As it can't be that hard to calculate intersections of lines and circles, right? :-)

But as the problems became harder, the solving logic needed to reflect that as well. And what used to be a couple of lines of code, has over time grown into a solving engine for whole class of geometry problems, not only limited to the Euclidea game.

Given initial set of objects (points / lines / circles), you want to come up with constructions using straightedge and compass only that  yield some result (described as a set of points). And with this type of problem, the solving engine here can help.

![image](http://a4.mzstatic.com/us/r30/Purple49/v4/4c/74/3f/4c743fe3-914c-3891-3f5c-dfc2723bc572/screen322x572.jpeg)

## Engine

The engine is written in vanilla JavaScript, so you don't need any build process or tool-chain to get it up and running in node.js.

### Exported objects

There is one cornerstone type: `Point`, and two advanced types: `Line`, and `Circle`. A `Line` is defined by two `Points` that belong to it, and a `Circle` is defined by two `Points` as well: the center and another `Point` on the `Circle`.

The most important function for `Line` and `Circle` is calculating intersections with each other (links to corresponding algorithms on wikipedia are in the source code). With `Point` you can only calculate distance from another `Point`.

Besides the three types described above, the engine library also exports function `solve` that is the entry point to kick off the searching for solution of given problem.

### Arguments of `solve` function

Let's have a look at the arguments the `solve` function takes one by one, let's start with the mandatory ones...

#### Mandatory

The first argument is an array of `Points` we want to construct, i.e. our **goals**. Often times, however, the goal is to create a `Line`, or a `Circle` with some properties. Then you have to be creative :-). For example, when you know what `Line` you are looking for, you can add another `Line` to the initial setup (see below), and set the goal to be the intersection of the `Line` you are trying to construct, and the `Line` you just artificially added to the initial setup. Which means that whenever you manage to construct the `Line` you were looking for, you'll get that intersection `Point` with the artificial `Line`. The same you can do when the goal is to create `Circle` with some properties.

The second argument is again an array of `Points`. This time the array represents **starting set** for object constructions, i.e. we'll be taking pairs of `Points` from this set to create new `Lines` and/or new `Circles`.

The third argument is an array of `Lines` and/or `Circles` that describe the **initial problem setup**. Let's say the goal is to inscribe a `Circle` into given triangle. This initial setup for this problem is the triangle, defined with three `Lines`.

The rest of the arguments of the `solve` function are optional.

#### Optional

The first of optional arguments, and the fourth one in total, is **mask** of the problem solution. Remember that our solution to given problem consists of a sequence of `Line` and `Circle` constructions. So in each step you create either one of the two object types. Providing the mask parameter, you hint the solving algorithm about what the resulting sequence should look like. The mask is in form of array of strings, with the following meanings:

* `"line"`: single `Line` object,
* `"circle"`: single `Circle` object,
* `"*"`: single object (`Line` or `Circle`),
* `"line**"`: any number of `Line` objects (including zero instances),
* `"circle**"`: any number of `Circle` objects (including zero instances),
* `"**"`: any number of objects (`Lines` or `Circles`, including zero instances).

There is one limitation on the "generator" mask parts (the ones with two asterisks, i.e. `"line**"`, `"circle**"`, and `"**"`), and that is that you can specify up to one of them when providing the **mask** argument. It limits the power of the masks you could construct, but simplifies the solving logic a lot.

The default value for the **mask** is `[ "**" ]`, i.e. you search for the minimal solution and you don't care what the solution looks like in advance. 

Note: I added the support for the **mask** argument only after I run into the solve-this-problem-using-compass-only puzzles in Euclidea, so I needed better control over the resulting solution.

The second optional argument is **ignore options** object. It has two (again) optional properties: `min` and `max`. When `min` value (number) is provided, we consider new intersection found useful for future constructions only if its distance from existing `Points` we already consider is at least `min`. When `max` value (number) is provided, we ignore all intersections found that are further than `max` from the origin, i.e. `Point(x = 0, y = 0)`.

Note: I added the **ignore options** argument to speed up the searching algorithm. In the Euclidea game, you can zoom the scene in to some extend, but if two intersections will be close to each other, you probably won't be able to select them anyway. The same goes with intersections too distant from the origin: you can zoom the scene out only to some extend, so the solution won't make use of intersections far, far away.

The last optional argument is **verification set** of `Points`. This is an array similar to mandatory **starting set** (and must be of the same length!), and is used to verify the solution using different set of `Points` than was used for actual finding the solution candidate. When the **verification set** is provided, the solution is claimed correct only if the solution candidate can be replayed using different input set of `Points` while still yielding the desired **goals** `Points`.

Note: this was also added as an after-thought, when I used the engine to find minimal solutions for advanced Euclidea problems. As it turned out that often times the engine found a solution, but that solution worked only for the initial set of `Points`, and failed on another set, i.e. that solution was not general (it was rather a coincidental solution). When you have a combinatorial problem and going though millions of combinations, you'd be surprised how many solutions like that you may find (but still miss the general one you are looking for...)

### Algorithm

And here comes the most important part of this README: the description of how the solving algorithm works.

First of all, we want to find the minimal solution for given problem. For given solution **mask** (defaulting to `[ "**" ]`), I decide what is the **length** of the shortest sequence possible that matches the **mask**. With the fixed **length** of the solution sequence, I generate all possible `line` / `circle` combinations and then let another function find a solution according to that prescribed combination. When all combinations of given **length** are explored without success, I increase the tested solution sequence **length** by 1 (if that still matches the solution **mask**) and start generating the combinations for that **length** (and testing those combinations in turn again). And this I keep doing until the solution is (hopefully) found.

#### Example

So let's say I use the default solution **mask**, which is `[ "**" ]`. The shortest sequence that matches the mask is of length 0, which means the **goals** would already be in the **starting set** of `Points` provided. So we can skip that solution sequence length.

Next one is of length 1. There we have two combinations:

* `line`
* `circle`

So first we try `line` and explore if we can find a solution using just one `Line`. If so, we are done. If not, we try to find a solution using one `Circle` only. Again, if we find the solution, we are done, if not, we are out of combinations for sequences of length 1, so it is time to explore possible sequences of length 2. There we have these four options:

* `line, line`
* `line, circle`
* `circle, line`
* `circle, circle`

And again, we try finding solutions taking the combinations one by one. If there is no 2-step solution, we try sequence of length 3. Then 4, 5, and so on... until we find the solution.

With different solution **mask** provided, the generated combinations are different (so that each of the generated combination matches the **mask**), but the idea is essentially the same.

#### One level down

Now we know what our expected solution looks like (the sequence of `Lines` and `Circles` is given). At the beginning, we have only the **starting set** of `Points` to work with, so we generate the first object according to the sequence by taking two points from our **set**. We make sure the object is new (that we don't construct a `Line` or a `Circle` that we have among our objects already), and if so, we calculate the intersections with other objects we already have. We evaluate the calculated intersection `Points` (again, they need to be new to our working **set** and we may discard some based on **ignore options**), add them to our working **set** of `Points`, and we proceed to generating next new object according to our given solution sequence.

This again is a combinatorial problem, so we need to make sure that when generating an object, we take into account all possible couples of `Points` available in current working **set**, i.e. that we consider all couples of `Points` that could be used for constructing the new object.

When we reach the end in generating the sequence, we simply check if the current working **set** of `Points` contains all the `Points` from the **goals** set. If so, then we have a solution. If not, we need to generate another combination (possible object sequence) and verify that one. And we keep iterating until we have a solution, or we exhaust all our options for given sequence, and it's time to try another one (going one level up again).

Note: when **verification set** is provided, it is not good enough to find all the **goals** `Points` in the current working **set**, but the same constructions steps must yield the **goals** `Points` again when applied on the **verification set** and the same intersection `Points` as in examined solution candidate are used. Only then we are happy and consider the construction sequence to be our solution. If not, we keep searching.

#### Pretty printing

OK, we have a solution! The last step is to make the solution human-readable and thus useful for actual construction. The sequence of `Lines` and/or `Circles` is analyzed, all the intersections that are used for constructing objects later in the sequence are named and everything is then pretty printed.

## Example 1: Midpoint

#### Goal

Construct the midpoint between the given points using only a compass.

#### Idea

As the **starting set**, just provide two `Points` for which you can calculate the midpoint easily. E.g. `[-1,0]` and `[1,0]`, the resulting midpoint is obviously `[0,0]`. There are no initial objects in the scene besides the two points, so pass empty array as the **initial problem setup** parameter. Instruct the algorithm to use circles only (passing the **mask** argument set to `"circle**"`) and let the algorithm find the solution for you.

#### Code

```
var engine = require('./engine');
var Point  = engine.Point;
var solve  = engine.solve;

solve(
  /* goals         */ [new Point(0,0)],
  /* starting set  */ [new Point(1,0), new Point(-1,0)],
  /* problem setup */ [],
  /* mask          */ ['circle**']
);
```

#### Output

```
Solution found!
-----
Initial set of points:
-----
# point1 (x: -1, y: 0)
# point2 (x: 1, y: 0)
-----
Construction:
-----
1: circle1 [point1 ---> point2]
2: circle2 [point2 ---> point1]
   ... point3 = circle1 x circle2 (x: 2.220446049250313e-16 , y: 1.7320508075688774)
   ... point4 = circle1 x circle2 (x: -2.220446049250313e-16 , y: -1.732050807568877)
3: circle3 [point3 ---> point4]
   ... point5 = circle2 x circle3 (x: 3 , y: 2.220446049250313e-16)
4: circle4 [point5 ---> point1]
   ... point6 = circle1 x circle4 (x: -0.5000000000000004 , y: 1.9364916731037083)
5: circle5 [point6 ---> point1]
   ... point7 = circle2 x circle5 (x: 1.4999999999999996 , y: 1.9364916731037085)
6: circle6 [point7 ---> point5]
-----
Goals:
-----
# (x: 0, y: 0) === circle5 x circle6
```

So with 6 circles (which is the minimal known solution) you can construct the midpoint using only a compass.


## Example 2: Napoleon's problem

#### Goal

Construct the center of the given circle using only a compass.

#### Idea

Let's take unit circle (the center of it will then obviously be `[0,0]`). Pick 2 (reasonably "random") points on the circle, instruct the algorithm to use only circles, and make yourself a cup of coffee. Before you finish it, you'll get the solution.

#### Code

```
var engine = require('./engine');
var Point  = engine.Point;
var Circle = engine.Circle;
var solve  = engine.solve;

var center = new Point(0,0);
var radius = new Point(1,0);

// for x in [-1,1] return positive y on unit circle
function getY(x) { return Math.sqrt(1.0 - x*x); }

var pointA = new Point(-1/2, getY(-1/2));
var pointB = new Point( 1/5, getY( 1/5));

solve(
  /* goals         */ [center],
  /* starting set  */ [pointA, pointB],
  /* problem setup */ [new Circle(center, radius)],
  /* mask          */ ['circle**']
);

```

#### Output

```
Solution found!
-----
Initial set of points:
-----
# point1 (x: 0.2, y: 0.9797958971132712)
# point2 (x: -0.5, y: 0.8660254037844386)
-----
Initial construction:
-----
1: circle1 [(x: 0, y: 0) ---> (x: 1, y: 0)]
-----
Construction:
-----
2: circle2 [point1 ---> point2]
   ... point3 = circle1 x circle2 (x: 0.7994112549695427 , y: 0.6007841920590293)
3: circle3 [point3 ---> point1]
   ... point4 = circle1 x circle3 (x: 0.99676363543604 , y: -0.08038815256198717)
4: circle4 [point4 ---> point3]
   ... point5 = circle2 x circle4 (x: 0.397352380466497 , y: 0.2986235524922546)
5: circle5 [point5 ---> point3]
   ... point6 = circle3 x circle5 (x: 0.7018610913724186 , y: -0.10165989164761002)
6: circle6 [point6 ---> point3]
   ... point7 = circle4 x circle6 (x: 0.8992134718389153 , y: -0.7828322362686265)
7: circle7 [point7 ---> point5]
-----
Goals:
-----
# (x: 0, y: 0) === circle6 x circle7
```

Note: this is not the nicest solution for Napoleon's problem, but still it is a solution with 6 circles only, which is the minimal solution known.


## Example 3: Third Proportional

#### Goal

Given ray with endpoint A and with points B and C on the ray: construct a point D on the ray such that the segment AD is the third proportional to the given line segments. I.e. that `|AC| / |AB|  =  |AB| / |AD|`.

#### Idea

Pick some points A, B, and C, calculate the expected position of the point D, and let the algorithm to solve the problem.

#### Code

```
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
```

#### Output

```
Solution found!
-----
Initial set of points:
-----
# point1 (x: 0, y: 0)
# point2 (x: 1.7320508075688772, y: 0)
# point3 (x: 2.23606797749979, y: 0)
-----
Initial construction:
-----
1: line1 [point1 ---> point2]
-----
Construction:
-----
2: circle1 [point3 ---> point1]
3: circle2 [point1 ---> point2]
   ... point4 = circle1 x circle2 (x: 0.6708203932499368 , y: -1.5968719422671314)
4: circle3 [point4 ---> point1]
-----
Goals:
-----
# (x: 1.3416407864998736, y: 0) === line1 x circle3
```

## Your turn now!

Feel free to use the engine to solve your construction problems using straightedge and compass. I hope you'll find the engine useful. Remember though that searching for the solution of your problem is a combinatorial problem at several levels and that the algorithm may need to go through millions of options before finding the solution for you...