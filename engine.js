var REPORT_STEP = 10000;
var PROGRESS = 0;

//

var error = 1e-6;
function sgn(x) { return (x < 0 ? -1 : 1); }

/*
 * POINT
 */

function Point(x, y) {
  this.type = 'point';
  this.x = x;
  this.y = y;
}

Point.prototype.equals = function(p) {
  if (p.type !== 'point') { return false; }
  return (this.dist(p) < error);
};

Point.prototype.dist = function(w) {
  switch (w.type) {
    case 'point':
      var dx = this.x - w.x;
      var dy = this.y - w.y;
      return Math.sqrt(dx*dx + dy*dy);
    default:
      throw new Error('not implemented');
  }
};

Point.prototype.log = function() {
  console.log('Point: x = ' + this.x + ', y = ' + this.y);
};

var POINT_0 = new Point(0,0);

/*
 * LINE
 */

function Line(p1, p2) {
  this.type = 'line';
  this.p1 = p1;
  this.p2 = p2;
  this.v = { x: p2.x - p1.x, y: p2.y - p1.y };
}

Line.prototype.equals = function(l) {
  if (l.type !== 'line') { return false; }
  var coef;
  if (this.v.x === 0 && l.v.x !== 0) { return false; }
  coef = l.v.x / this.v.x;
  if (Math.abs(coef * this.v.y - l.v.y) > error) { return false; }
  var dim = (this.v.x ? 'x' : 'y');
  coef = (l.p1[dim] - this.p1[dim]) / this.v[dim];
  dim = (dim === 'x' ? 'y' : 'x');
  if (Math.abs(this.p1[dim] + coef * this.v[dim] - l.p1[dim]) > error) { return false; }
  return true;
};

Line.prototype.getIntersects = function(what) {
  switch (what.type) {
    case 'line':
      // https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
      var denom = (this.p1.x - this.p2.x) * (what.p1.y - what.p2.y) -
                  (this.p1.y - this.p2.y) * (what.p1.x - what.p2.x);
      if (Math.abs(denom) < error) { return []; }
      var Px = (this.p1.x*this.p2.y - this.p1.y*this.p2.x) * (what.p1.x - what.p2.x) -
               (this.p1.x - this.p2.x) * (what.p1.x*what.p2.y - what.p1.y*what.p2.x);
      var Py = (this.p1.x*this.p2.y - this.p1.y*this.p2.x) * (what.p1.y - what.p2.y) -
               (this.p1.y - this.p2.y) * (what.p1.x*what.p2.y - what.p1.y*what.p2.x);
      return [new Point(Px/denom, Py/denom)];
    case 'circle':
      // http://mathworld.wolfram.com/Circle-LineIntersection.html
      var x1 = this.p1.x - what.c.x;
      var y1 = this.p1.y - what.c.y;
      var x2 = this.p2.x - what.c.x;
      var y2 = this.p2.y - what.c.y;
      var r = what.c.dist(what.p);
      var dx = x2 - x1;
      var dy = y2 - y1;
      var dr2 = dx*dx + dy*dy;
      var D = x1*y2 - x2*y1;
      var disc = r*r*dr2 - D*D;
      if (Math.abs(disc) < error) {
        // tangent
        return [new Point(D*dy/dr2 + what.c.x, -D*dx/dr2 + what.c.y)];
      }
      if (disc < 0) { return []; } // no intersection
      // intersection
      var sqrt_disc = Math.sqrt(disc);
      var sgn_dy = sgn(dy);
      var abs_dy = Math.abs(dy);
      return [
        new Point(
          (D*dy + sgn_dy*dx*sqrt_disc) / dr2  + what.c.x,
          (-D*dx + abs_dy*sqrt_disc) / dr2    + what.c.y
        ),
        new Point(
          (D*dy - sgn_dy*dx*sqrt_disc) / dr2  + what.c.x,
          (-D*dx - abs_dy*sqrt_disc) / dr2    + what.c.y
        )
      ];
    default:
      throw new Error('not implemented');
  }
};

Line.prototype.log = function() {
  console.log('Line:\n  P1: x = ' + this.p1.x + ', y = ' + this.p1.y +
                   '\n  P2: x = ' + this.p2.x + ', y = ' + this.p2.y);
};

/*
 * CIRCLE
 */

function Circle(c, p) {
  this.type = 'circle';
  this.c = c;
  this.p = p;
}

Circle.prototype.equals = function(c) {
  if (c.type !== 'circle') { return false; }
  if (!this.c.equals(c.c)) { return false; }
  return (Math.abs(this.c.dist(this.p) - c.c.dist(c.p)) < error);
};

Circle.prototype.getIntersects = function(what) {
  switch (what.type) {
    case 'line':
      return what.getIntersects(this);
    case 'circle':
      // http://mathworld.wolfram.com/Circle-CircleIntersection.html
      var d = this.c.dist(what.c);
      if (d < error) { return []; }  // same centers
      var R = this.c.dist(this.p);
      var r = what.c.dist(what.p);
      var vect = {
        x: what.c.x - this.c.x,
        y: what.c.y - this.c.y
      };
      var x = (d*d - r*r + R*R) / (2*d);
      var expr = (-d+r-R) * (-d-r+R) * (-d+r+R) * (d+r+R);
      if (Math.abs(expr) < error) { expr = 0; }
      if (expr < 0) { return []; }
      var a = (1/d) * Math.sqrt(expr);
      var theta = Math.atan2(vect.y, vect.x);
      var sin_theta = Math.sin(theta);
      var cos_theta = Math.cos(theta);
      var res1 = new Point(
                            x*cos_theta - (a/2)*sin_theta + this.c.x,
                            x*sin_theta + (a/2)*cos_theta + this.c.y
      );
      var res2 = new Point(
                            x*cos_theta - (-a/2)*sin_theta + this.c.x,
                            x*sin_theta + (-a/2)*cos_theta + this.c.y
      );
      if (res1.dist(res2) < error) { return [res1]; }
      else { return [res1, res2]; }
    default:
      throw new Error('not implemented');
  }
};

Circle.prototype.log = function() {
  console.log('Circle:\n  Center: x = ' + this.c.x + ', y = ' + this.c.y +
                     '\n  Point:  x = ' + this.p.x + ', y = ' + this.p.y);
};

/*
 * SOLVING LOGIC
 */

// decide if "candidate" (line / circle) is NOT in the "existing" array yet
function isNew(candidate, existing) {
  pos = 0;
  while (pos < existing.length) {
    if (existing[pos].equals(candidate)) { return false; }
    pos++;
  }
  return true;
}

// generate next step (line / circle) into the sequence, making sure equivalent
// object is not in the sequence already
function generateStep(what, source, existing, options) {
  switch (what) {
    case 'line':
      var i = source.length - 1, j = 0;
      if (typeof(options.i) === 'number') { i = options.i; }
      if (typeof(options.j) === 'number') { j = options.j; }
      while (i >= 1) {
        while (j < i) {
          var candidate = new Line(source[i], source[j]);
          if (isNew(candidate, existing)) {
            options.i = i;
            options.j = j + 1;
            return candidate;
          }
          j = j + 1;
        }
        i = i - 1;
        j = 0;
      }
      return false;
    case 'circle':
      var i = source.length - 1, j = 0;
      if (typeof(options.i) === 'number') { i = options.i; }
      if (typeof(options.j) === 'number') { j = options.j; }
      while (i >= 0) {
        while (j < source.length) {
          if (i !== j) {
            var candidate = new Circle(source[i], source[j]);
            if (isNew(candidate, existing)) {
              options.i = i;
              options.j = j + 1;
              return candidate;
            }
          }
          j = j + 1;
        }
        i = i - 1;
        j = 0;
      }
      return false;
    default:
      throw new Error('not implemented');
  }
  return false;
}

// for new step (line / circle), collect all intersections with all previous
// steps and extend the current points with the intersections that were not in
// the points collection before, and do not meet the ignore criteria
function getNewIntersects(step, steps, points, ignoreOpts) {
  var i, j, all = [];
  for (i = 0; i < steps.length; i++) { all = all.concat(step.getIntersects(steps[i])); }
  var copy = [];
  for (i = 0; i < points.length; i++) { copy.push(points[i]); }
  var res = [];
  for (i = 0; i < all.length; i++) {
    var cand = all[i];
    if (POINT_0.dist(cand) > ignoreOpts.max) { continue; }
    for (j = 0; j < copy.length; j++) {
      if (cand.dist(copy[j]) < ignoreOpts.min) { break; }
    }
    if (j === copy.length) {
      res.push(cand);
      copy.push(cand);
    }
  }
  return res;
}

// check if we found ALL goals in the points collection already
function findGoal(goals, points) {
  for (var i = 0; i < goals.length; i++) {
    var goal = goals[i];
    for (var j = 0; j < points.length; j++) {
      if (goal.equals(points[j])) { break; }
    }
    if (j === points.length) { return false; }
  }
  return true;
}

// inital lengths of points collection and steps collection as provided on input
var pointsLength0, stepsLength0;

// when we have the solutions (steps / points), find out a nice solution
// description, so one can follow some steps when drawing the solution or verify
// it on different points collection
function analyzeSolution(steps, points, goals) {
  var pts_data = [];
  var pts_used = [];
  var step_data = [];
  var i;

  function getPointIdx(p) {
    for (var j = 0; j < pts_data.length; j++) {
      var cand = pts_data[j];
      if (p.equals(cand.p)) {
        if (cand.used_idx === -1) {
          pts_used.push(cand);
          cand.used_idx = pts_used.length - 1;
          cand.all_idx = j;
        }
        return cand.used_idx;
      }
    }
    return -1;
  }

  function extendPtsData() {
    var last_idx = step_data.length - 1;
    var last = step_data[last_idx].step;
    for (var k = 0; k < last_idx; k++) {
      var s = step_data[k].step;
      var inter = last.getIntersects(s);
      for (var l = 0; l < inter.length; l++) {
        pts_data.push({
          type: 'calc',
          used_idx: -1,
          p: inter[l],
          s1_idx: k,
          s2_idx: last_idx,
          inter_total: inter.length,
          inter_idx: l
        });
      }
    }
  }

  function findGoals() {
    var res = [];
    for (var m = 0; m < goals.length; m++) {
      var g = goals[m];
      for (var n = 0; n < pts_data.length; n++) {
        var _g = pts_data[n];
        if (g.equals(_g.p)) {
          _g.p = g;
          _g.all_idx = n;
          res.push(_g);
          break;
        }
      }
    }
    return res;
  }

  for (i = 0; i < pointsLength0; i++) {
    pts_data.push({
      type: 'init',
      used_idx: -1,
      p: points[i]
    });
  }
  for (i = 0; i < steps.length; i++) {
    var step = steps[i];
    var p1, p2;
    switch (step.type) {
      case 'line':
        p1 = step.p1;
        p2 = step.p2;
        break;
      case 'circle':
        p1 = step.c;
        p2 = step.p;
        break;
      default:
        throw new Error('not implemented');
    }
    step_data.push({
      step: step,
      p1_idx: getPointIdx(p1),
      p2_idx: getPointIdx(p2)
    });
    extendPtsData();
  }

  return {
    steps: step_data,
    points: pts_used,
    goals: findGoals(),
    _all: pts_data
  }
}

// replays solution on verification set, check if get the goals as well.
// if so, consider the solution valid.
function verifySolution(analysis, vSet) {
  var i, j, vPoints = [], vSteps = [];
  for (i = 0; i < vSet.length; i++) { vPoints.push(vSet[i]); }
  for (i = 0; i < analysis.steps.length; i++) {
    var s = analysis.steps[i];
    var type = s.step.type;
    var p1, p2;
    if (s.p1_idx !== -1) { p1 = vPoints[analysis.points[s.p1_idx].all_idx]; }
    else { p1 = (type === 'line' ? s.step.p1 : s.step.c); }
    if (s.p2_idx !== -1) { p2 = vPoints[analysis.points[s.p2_idx].all_idx]; }
    else { p2 = (type === 'line' ? s.step.p2 : s.step.p); }
    if (!p1 || !p2) {
      console.log('    !! solution candidate found, verification failed...');
      return false;
    }
    var ctor = (type === 'line' ? Line : Circle);
    var step = new ctor(p1, p2);
    for (j = 0; j < vSteps.length; j++) {
      vPoints = vPoints.concat(step.getIntersects(vSteps[j]));
    }
    vSteps.push(step);
  }
  for (i = 0; i < analysis.goals.length; i++) {
    var g = analysis.goals[i];
    if (!g.p.equals(vPoints[g.all_idx])) {
      console.log('    !! solution candidate found, verification failed...');
      return false;
    }
  }
  console.log('    !! solution candidate found, and successfully verified.');
  return true;
}

// pretty print solution from analysis
function printSolution(analysis) {

  function printOneStep(step) {
    var type = step.step.type;
    step.name = type;
    if (type === 'line') { step.name += Ln++; }
    else { step.name += Cn++; }
    var _p, p1_str, p2_str;
    if (step.p1_idx !== -1) { p1_str = analysis.points[step.p1_idx].name; }
    else {
      _p = step.step[type === 'line' ? 'p1' : 'c'];
      p1_str = '(x: ' + _p.x + ', y: ' + _p.y + ')';
    }
    if (step.p2_idx !== -1) { p2_str = analysis.points[step.p2_idx].name; }
    else {
      _p = step.step[type === 'line' ? 'p2' : 'p'];
      p2_str = '(x: ' + _p.x + ', y: ' + _p.y + ')';
    }
    console.log(step_no++ + ': ' + step.name + ' [' + p1_str + ' ---> ' + p2_str + ']');
  }

  function printUsedIntersects(idx) {
    for (var j = 0; j < analysis.points.length; j++) {
      var _p = analysis.points[j];
      if (_p.s2_idx === idx) {
        _p.name = 'point' + Pn++;
        console.log('   ... ' + _p.name + ' = ' + analysis.steps[_p.s1_idx].name
          + ' x ' + analysis.steps[idx].name
          + ' (x: ' + _p.p.x + ' , y: ' + _p.p.y + ')');
      }
    }
  }

  var i, step_no = 1, Pn = 1, Ln = 1, Cn = 1;
  console.log('\n\nSolution found!\n-----');
  console.log('Initial set of points:\n-----');
  for (i = 0; i < pointsLength0; i++) {
    var p = analysis.points[i];
    p.name = 'point' + Pn++;
    console.log('# ' + p.name + ' (x: ' + p.p.x + ', y: ' + p.p.y + ')');
  }
  if (stepsLength0) {
    console.log('-----\nInitial construction:\n-----');
    for (i = 0; i < stepsLength0; i++) {
      printOneStep(analysis.steps[i]);
      printUsedIntersects(i);
    }
  }
  console.log('-----\nConstruction:\n-----');
  for (i = stepsLength0; i < analysis.steps.length; i++) {
    printOneStep(analysis.steps[i]);
    printUsedIntersects(i);
  }
  console.log('-----\nGoals:\n-----');
  for (i = 0; i < analysis.goals.length; i++) {
    var _g = analysis.goals[i];
    console.log('# (x: ' + _g.p.x + ', y: ' + _g.p.y + ') === '
      + analysis.steps[_g.s1_idx].name + ' x '
      + analysis.steps[_g.s2_idx].name);
  }
  console.log();
}

// try to find a solution with given sequence of steps (i.e. knowing first step
// should be a line, second step another line and third step a circle)
function solveWithFixedNext(goals, points, steps, next, index, ignoreOpts, vSet) {
  var pointsLength = points.length;
  var stepsLength = steps.length;
  var genOptions = {};
  var newStep;
  if (!next.length) { return false; }
  while (newStep = generateStep(next[index], points, steps, genOptions)) {
    var intersects = getNewIntersects(newStep, steps, points, ignoreOpts);
    steps.push(newStep);
    points = points.concat(intersects);
    if (findGoal(goals, points)) {
      var analysis = analyzeSolution(steps, points, goals);
      if (!vSet || verifySolution(analysis, vSet)) {
        printSolution(analysis);
        return true;
      }
    }
    if (index + 1 < next.length) {
      if (solveWithFixedNext(goals, points, steps, next, index + 1, ignoreOpts, vSet)) {
        return true;
      }
    }
    points.length = pointsLength;
    steps.length = stepsLength;
  }
  if (++PROGRESS % REPORT_STEP === 0) {
    console.log('    * progress:', PROGRESS);
  }
  return false;
}

// make sure the solution mask description is valid
// the mask is in form of array of strings:
// + '*' ... for single line or single circle
// + 'line' ... for single line
// + 'circle' ... for single circle
// + 'line**' ... for 0 -- many lines
// + 'circle**' ... for 0 -- many circles
// + '**' ... for 0 -- many lines or circles
// extra limitation: only one ...** element is allowed
function sanitizeMask(nextMask) {
  var i, wildIdx = -1, asters = 0, onlyLines = false, onlyCircles = false;
  for (i = 0; i < nextMask.length; i++) {
    switch (nextMask[i]) {
      case 'line':
      case 'circle':
        break;
      case '*':
        asters++;
        break;
      case '**':
      case 'line**':
      case 'circle**':
        if (wildIdx === -1) { wildIdx = i; }
        else { throw new Error('only one wildcard (**) allowed in the mask'); }
        if (nextMask[i] === 'line**') { onlyLines = true; }
        if (nextMask[i] === 'circle**') { onlyCircles = true; }
        break;
      default:
        throw new Error('mask element "' + nextMask[i] + '" not supported');
    }
  }
  return {
    asters: asters,
    wildIdx: wildIdx,
    onlyLines: onlyLines,
    onlyCircles: onlyCircles
  };
}

// generate 'line' / 'circle' string array permutations based on provided
// options. generate one permutation each time, keeping the context in updated
// options.
function generatePerm(options) {
  var res = [];
  var mask = 1;
  var i = 0;
  if (options.onlyLines || options.onlyCircles) {
    var what = (options.onlyLines ? 'line' : 'circle');
    for (i = 0; i < options.len; i++) { res.push(what); }
    return {
      pattern: res,
      last: true
    };
  }
  while (i < options.len) {
    res.push(options.val & mask ? 'circle' : 'line');
    mask = mask * 2;
    i++;
  }
  options.val = options.val + 1;
  return {
    pattern: res,
    last: options.val === mask
  };
}

// generate solution pattern from fixed elements ('line' / 'circle' elements),
// single asterix permutation ('*' elements), and double asterix permutation
// ('**' / 'line**' / 'circle**' elements).
function mixPattern(mask, perm1, perm2) {
  var res = [];
  var idx = 0;
  for (var i = 0; i < mask.length; i++) {
    switch (mask[i]) {
      case '*':
        res.push(perm1[idx]);
        idx = idx + 1;
        break;
      case '**':
      case 'line**':
      case 'circle**':
        res = res.concat(perm2);
        break;
      default:
        res.push(mask[i]);
    }
  }
  return res;
}

// main solving function
// goals: array of Points we are looking for
// points: initial set of points for constructing next lines / circles
// steps: initial set of fixed lines and circles
// (optional) nextMask: array of strings representing the solution pattern
// (optional) ignoreOpts: object, if provided, then
//   "min" property (if provided) says that if we find another intersection
//         which is closer than given value to already existing point we have in
//         the list, the new intersection will NOT be added to the list,
//   "max" property (if provided) says that if we find another intersection
//         the distance of which from the point (0,0) is greater than specified
//         value, the new intersection will NOT be added to the list
// (optional) vSet: same type as "points" above; the assumed solution will be
//   verified on this set and will be considered a valid solution only if the
//   construction works on this set, too.
function solve(goals, points, steps, nextMask, ignoreOpts, vSet) {
  pointsLength0 = points.length;
  stepsLength0 = steps.length;
  nextMask = nextMask || [ '**' ];
  ignoreOpts = ignoreOpts || {};
  if (typeof(ignoreOpts.min) !== 'number') { ignoreOpts.min = error; }
  if (ignoreOpts.min < error) { ignoreOpts.min = error; }
  if (typeof(ignoreOpts.max) !== 'number') { ignoreOpts.max = Infinity; }
  var info = sanitizeMask(nextMask);
  console.log('Solution pattern mask:', nextMask);
  var i, pattern, found = false, perm1, perm1Cfg, perm2, perm2Cfg;
  perm1Cfg = {
    val: 0,
    len: info.asters
  };
  if (info.wildIdx !== -1) {
    perm2Cfg = {
      val: 0,
      len: 0,
      onlyLines: info.onlyLines,
      onlyCircles: info.onlyCircles
    };
    console.log('+ length of (**) pattern =', perm2Cfg.len);
    while (!found) {
      perm2 = generatePerm(perm2Cfg);
      perm1Cfg.val = 0;
      while (!found) {
        perm1 = generatePerm(perm1Cfg);
        pattern = mixPattern(nextMask, perm1.pattern, perm2.pattern);
        console.log('  pattern:', pattern);
        PROGRESS = 0;
        found = solveWithFixedNext(goals, points, steps, pattern, 0, ignoreOpts, vSet);
        if (perm1.last) { break; }
      }
      if (found) { break; }
      if (perm2.last) {
        perm2Cfg.val = 0;
        perm2Cfg.len = perm2Cfg.len + 1;
        console.log('+ length of (**) pattern =', perm2Cfg.len);
      }
    }
  } else {
    while (!found) {
      perm1 = generatePerm(perm1Cfg);
      pattern = mixPattern(nextMask, perm1.pattern);
      console.log('  pattern:', pattern);
      PROGRESS = 0;
      found = solveWithFixedNext(goals, points, steps, pattern, 0, ignoreOpts, vSet);
      if (perm1.last) { break; }
    }
    if (!found) { console.log('\n:-(\n'); }
  }
}

module.exports = {
  Point: Point,
  Line: Line,
  Circle: Circle,
  solve: solve
};
