(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.cytoscapeViewUtilities = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// https://github.com/HarryStevens/geometric#readme Version 2.2.3. Copyright 2020 Harry Stevens.
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.geometric = {})));
}(this, (function (exports) { 'use strict';

  // Converts radians to degrees.
  function angleToDegrees(angle) {
    return angle * 180 / Math.PI;
  }

  function lineAngle(line) {
    return angleToDegrees(Math.atan2(line[1][1] - line[0][1], line[1][0] - line[0][0]));
  }

  // Calculates the distance between the endpoints of a line segment.
  function lineLength(line) {
    return Math.sqrt(Math.pow(line[1][0] - line[0][0], 2) + Math.pow(line[1][1] - line[0][1], 2));
  }

  // Converts degrees to radians.
  function angleToRadians(angle) {
    return angle / 180 * Math.PI;
  }

  function pointTranslate(point, angle, distance) {
    var r = angleToRadians(angle);
    return [point[0] + distance * Math.cos(r), point[1] + distance * Math.sin(r)];
  }

  // The returned interpolator function takes a single argument t, where t is a number ranging from 0 to 1;
  // a value of 0 returns a, while a value of 1 returns b.
  // Intermediate values interpolate from start to end along the line segment.

  function lineInterpolate(line) {
    return function (t) {
      return t === 0 ? line[0] : t === 1 ? line[1] : pointTranslate(line[0], lineAngle(line), lineLength(line) * t);
    };
  }

  // Calculates the midpoint of a line segment.
  function lineMidpoint(line) {
    return [(line[0][0] + line[1][0]) / 2, (line[0][1] + line[1][1]) / 2];
  }

  function pointRotate(point, angle, origin) {
    var r = angleToRadians(angle);

    if (!origin || origin[0] === 0 && origin[1] === 0) {
      return rotate(point, r);
    } else {
      // See: https://math.stackexchange.com/questions/1964905/rotation-around-non-zero-point
      var p0 = point.map(function (c, i) {
        return c - origin[i];
      });
      var rotated = rotate(p0, r);
      return rotated.map(function (c, i) {
        return c + origin[i];
      });
    }

    function rotate(point, angle) {
      // See: https://en.wikipedia.org/wiki/Cartesian_coordinate_system#Rotation
      return [point[0] * Math.cos(angle) - point[1] * Math.sin(angle), point[0] * Math.sin(angle) + point[1] * Math.cos(angle)];
    }
  }

  // Calculates the area of a polygon.
  function polygonArea(vertices) {
    var signed = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
    var a = 0;

    for (var i = 0, l = vertices.length; i < l; i++) {
      var v0 = vertices[i],
          v1 = vertices[i === l - 1 ? 0 : i + 1];
      a += v0[0] * v1[1];
      a -= v1[0] * v0[1];
    }

    return signed ? a / 2 : Math.abs(a / 2);
  }

  // Calculates the bounds of a polygon.
  function polygonBounds(polygon) {
    if (polygon.length < 3) {
      return null;
    }

    var xMin = Infinity,
        xMax = -Infinity,
        yMin = Infinity,
        yMax = -Infinity,
        found = false;

    for (var i = 0, l = polygon.length; i < l; i++) {
      var p = polygon[i],
          x = p[0],
          y = p[1];

      if (x != null && isFinite(x) && y != null && isFinite(y)) {
        found = true;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }

    return found ? [[xMin, yMin], [xMax, yMax]] : null;
  }

  // Calculates the weighted centroid a polygon.
  function polygonCentroid(vertices) {
    var a = 0,
        x = 0,
        y = 0,
        l = vertices.length;

    for (var i = 0; i < l; i++) {
      var s = i === l - 1 ? 0 : i + 1,
          v0 = vertices[i],
          v1 = vertices[s],
          f = v0[0] * v1[1] - v1[0] * v0[1];
      a += f;
      x += (v0[0] + v1[0]) * f;
      y += (v0[1] + v1[1]) * f;
    }

    var d = a * 3;
    return [x / d, y / d];
  }

  // See https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript
  // and https://math.stackexchange.com/questions/274712/calculate-on-which-side-of-a-straight-line-is-a-given-point-located
  function cross(a, b, o) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  // See https://en.wikibooks.org/wiki/Algorithm_Implementation/Geometry/Convex_hull/Monotone_chain#JavaScript

  function polygonHull(points) {
    if (points.length < 3) {
      return null;
    }

    var pointsCopy = points.slice().sort(function (a, b) {
      return a[0] === b[0] ? a[1] - b[1] : a[0] - b[0];
    });
    var lower = [];

    for (var i0 = 0; i0 < pointsCopy.length; i0++) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], pointsCopy[i0]) <= 0) {
        lower.pop();
      }

      lower.push(pointsCopy[i0]);
    }

    var upper = [];

    for (var i1 = pointsCopy.length - 1; i1 >= 0; i1--) {
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], pointsCopy[i1]) <= 0) {
        upper.pop();
      }

      upper.push(pointsCopy[i1]);
    }

    upper.pop();
    lower.pop();
    return lower.concat(upper);
  }

  // Calculates the length of a polygon's perimeter. See https://github.com/d3/d3-polygon/blob/master/src/length.js
  function polygonLength(vertices) {
    if (vertices.length === 0) {
      return 0;
    }

    var i = -1,
        n = vertices.length,
        b = vertices[n - 1],
        xa,
        ya,
        xb = b[0],
        yb = b[1],
        perimeter = 0;

    while (++i < n) {
      xa = xb;
      ya = yb;
      b = vertices[i];
      xb = b[0];
      yb = b[1];
      xa -= xb;
      ya -= yb;
      perimeter += Math.sqrt(xa * xa + ya * ya);
    }

    return perimeter;
  }

  // Calculates the arithmetic mean of a polygon's vertices.
  function polygonMean(vertices) {
    var x = 0,
        y = 0,
        l = vertices.length;

    for (var i = 0; i < l; i++) {
      var v = vertices[i];
      x += v[0];
      y += v[1];
    }

    return [x / l, y / l];
  }

  function polygonTranslate(polygon, angle, distance) {
    var p = [];

    for (var i = 0, l = polygon.length; i < l; i++) {
      p[i] = pointTranslate(polygon[i], angle, distance);
    }

    return p;
  }

  function polygonRegular() {
    var sides = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 3;
    var area = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
    var center = arguments.length > 2 ? arguments[2] : undefined;
    var polygon = [],
        point = [0, 0],
        sum = [0, 0],
        angle = 0;

    for (var i = 0; i < sides; i++) {
      polygon[i] = point;
      sum[0] += point[0];
      sum[1] += point[1];
      point = pointTranslate(point, angle, Math.sqrt(4 * area * Math.tan(Math.PI / sides) / sides)); // https://web.archive.org/web/20180404142713/http://keisan.casio.com/exec/system/1355985985

      angle -= 360 / sides;
    }

    if (center) {
      var line = [[sum[0] / sides, sum[1] / sides], center];
      polygon = polygonTranslate(polygon, lineAngle(line), lineLength(line));
    }

    return polygon;
  }

  function polygonRotate(polygon, angle, origin) {
    var p = [];

    for (var i = 0, l = polygon.length; i < l; i++) {
      p[i] = pointRotate(polygon[i], angle, origin);
    }

    return p;
  }

  // The origin defaults to the polygon's centroid.

  function polygonScale(polygon, scale, origin) {
    if (!origin) {
      origin = polygonCentroid(polygon);
    }

    var p = [];

    for (var i = 0, l = polygon.length; i < l; i++) {
      var v = polygon[i],
          d = lineLength([origin, v]),
          a = lineAngle([origin, v]);
      p[i] = pointTranslate(origin, a, d * scale);
    }

    return p;
  }

  // Determines if lineA intersects lineB. 
  // See: https://stackoverflow.com/questions/9043805/test-if-two-lines-intersect-javascript-function/24392281#24392281
  // Returns a boolean.
  function lineIntersectsLine(lineA, lineB) {
    // First test to see if the lines share an endpoint
    if (sharePoint(lineA, lineB)) return true;
    var a = lineA[0][0],
        b = lineA[0][1],
        c = lineA[1][0],
        d = lineA[1][1],
        p = lineB[0][0],
        q = lineB[0][1],
        r = lineB[1][0],
        s = lineB[1][1],
        det,
        gamma,
        lambda;
    det = (c - a) * (s - q) - (r - p) * (d - b);

    if (det === 0) {
      return false;
    } else {
      lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
      gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
      return 0 < lambda && lambda < 1 && 0 < gamma && gamma < 1;
    }
  }

  function sharePoint(lineA, lineB) {
    var share = false;

    for (var i = 0; i < 2; i++) {
      for (var j = 0; j < 2; j++) {
        if (equal(lineA[i], lineB[j])) {
          share = true;
          break;
        }
      }
    }

    return share;
  }

  function equal(pointA, pointB) {
    return pointA[0] === pointB[0] && pointA[1] === pointB[1];
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  // Closes a polygon if it's not closed already. Does not modify input polygon.
  function close(polygon) {
    return isClosed(polygon) ? polygon : [].concat(_toConsumableArray(polygon), [polygon[0]]);
  } // Tests whether a polygon is closed

  function isClosed(polygon) {
    var first = polygon[0],
        last = polygon[polygon.length - 1];
    return first[0] === last[0] && first[1] === last[1];
  }

  function topPointFirst(line) {
    return line[1][1] > line[0][1] ? line : [line[1], line[0]];
  }

  function pointLeftofLine(point, line) {
    var t = topPointFirst(line);
    return cross(point, t[1], t[0]) < 0;
  }
  function pointRightofLine(point, line) {
    var t = topPointFirst(line);
    return cross(point, t[1], t[0]) > 0;
  }
  function pointOnLine(point, line) {
    var l = lineLength(line);
    return pointWithLine(point, line) && lineLength([line[0], point]) <= l && lineLength([line[1], point]) <= l;
  }
  function pointWithLine(point, line) {
    return cross(point, line[0], line[1]) === 0;
  }

  // Returns a boolean.

  function lineIntersectsPolygon(line, polygon) {
    var intersects = false;
    var closed = close(polygon);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      var v0 = closed[i],
          v1 = closed[i + 1];

      if (lineIntersectsLine(line, [v0, v1]) || pointOnLine(v0, line) && pointOnLine(v1, line)) {
        intersects = true;
        break;
      }
    }

    return intersects;
  }

  // Determines whether a point is inside of a polygon, represented as an array of vertices.
  // From https://github.com/substack/point-in-polygon/blob/master/index.js,
  // based on the ray-casting algorithm from https://web.archive.org/web/20180115151705/https://wrf.ecse.rpi.edu//Research/Short_Notes/pnpoly.html
  // Wikipedia: https://en.wikipedia.org/wiki/Point_in_polygon#Ray_casting_algorithm
  // Returns a boolean.
  function pointInPolygon(point, polygon) {
    var x = point[0],
        y = point[1],
        inside = false;

    for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      var xi = polygon[i][0],
          yi = polygon[i][1],
          xj = polygon[j][0],
          yj = polygon[j][1];

      if (yi > y != yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }

    return inside;
  }

  // Returns a boolean.

  function pointOnPolygon(point, polygon) {
    var on = false;
    var closed = close(polygon);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      if (pointOnLine(point, [closed[i], closed[i + 1]])) {
        on = true;
        break;
      }
    }

    return on;
  }

  // Polygons are represented as an array of vertices, each of which is an array of two numbers,
  // where the first number represents its x-coordinate and the second its y-coordinate.
  // Returns a boolean.

  function polygonInPolygon(polygonA, polygonB) {
    var inside = true;
    var closed = close(polygonA);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      var v0 = closed[i]; // Points test  

      if (!pointInPolygon(v0, polygonB)) {
        inside = false;
        break;
      } // Lines test


      if (lineIntersectsPolygon([v0, closed[i + 1]], polygonB)) {
        inside = false;
        break;
      }
    }

    return inside;
  }

  // Polygons are represented as an array of vertices, each of which is an array of two numbers,
  // where the first number represents its x-coordinate and the second its y-coordinate.
  // Returns a boolean.

  function polygonIntersectsPolygon(polygonA, polygonB) {
    var intersects = false,
        onCount = 0;
    var closed = close(polygonA);

    for (var i = 0, l = closed.length - 1; i < l; i++) {
      var v0 = closed[i],
          v1 = closed[i + 1];

      if (lineIntersectsPolygon([v0, v1], polygonB)) {
        intersects = true;
        break;
      }

      if (pointOnPolygon(v0, polygonB)) {
        ++onCount;
      }

      if (onCount === 2) {
        intersects = true;
        break;
      }
    }

    return intersects;
  }

  // Returns the angle of reflection given an angle of incidence and a surface angle.
  function angleReflect(incidenceAngle, surfaceAngle) {
    var a = surfaceAngle * 2 - incidenceAngle;
    return a >= 360 ? a - 360 : a < 0 ? a + 360 : a;
  }

  exports.lineAngle = lineAngle;
  exports.lineInterpolate = lineInterpolate;
  exports.lineLength = lineLength;
  exports.lineMidpoint = lineMidpoint;
  exports.pointRotate = pointRotate;
  exports.pointTranslate = pointTranslate;
  exports.polygonArea = polygonArea;
  exports.polygonBounds = polygonBounds;
  exports.polygonCentroid = polygonCentroid;
  exports.polygonHull = polygonHull;
  exports.polygonLength = polygonLength;
  exports.polygonMean = polygonMean;
  exports.polygonRegular = polygonRegular;
  exports.polygonRotate = polygonRotate;
  exports.polygonScale = polygonScale;
  exports.polygonTranslate = polygonTranslate;
  exports.lineIntersectsLine = lineIntersectsLine;
  exports.lineIntersectsPolygon = lineIntersectsPolygon;
  exports.pointInPolygon = pointInPolygon;
  exports.pointOnPolygon = pointOnPolygon;
  exports.pointLeftofLine = pointLeftofLine;
  exports.pointRightofLine = pointRightofLine;
  exports.pointOnLine = pointOnLine;
  exports.pointWithLine = pointWithLine;
  exports.polygonInPolygon = polygonInPolygon;
  exports.polygonIntersectsPolygon = polygonIntersectsPolygon;
  exports.angleReflect = angleReflect;
  exports.angleToDegrees = angleToDegrees;
  exports.angleToRadians = angleToRadians;

  Object.defineProperty(exports, '__esModule', { value: true });

})));

},{}],2:[function(require,module,exports){
;
(function () {
  'use strict';

  // registers the extension on a cytoscape lib ref
  var register = function (cytoscape) {

    if (!cytoscape) {
      return;
    } // can't register if cytoscape unspecified

    var options = {
      highlightStyles: [],
      selectStyles: {},
      setVisibilityOnHide: false, // whether to set visibility on hide/show
      setDisplayOnHide: true, // whether to set display on hide/show
      zoomAnimationDuration: 1500, //default duration for zoom animation speed
      neighbor: function (node) { // return desired neighbors of tapheld node
        return false;
      },
      neighborSelectTime: 500, //ms, time to taphold to select desired neighbors
      lassoStyle: {lineColor: "#d67614", lineWidth: 3}
    };

    var undoRedo = require("./undo-redo");
    var viewUtilities = require("./view-utilities");

    cytoscape('core', 'viewUtilities', function (opts) {
      var cy = this;

      function getScratch(eleOrCy) {
        if (!eleOrCy.scratch("_viewUtilities")) {
          eleOrCy.scratch("_viewUtilities", {});
        }

        return eleOrCy.scratch("_viewUtilities");
      }
      
      // If 'get' is given as the param then return the extension instance
      if (opts === 'get') {
        return getScratch(cy).instance;
      }
      
      /**
      * Deep copy or merge objects - replacement for jQuery deep extend
      * Taken from http://youmightnotneedjquery.com/#deep_extend
      * and bug related to deep copy of Arrays is fixed.
      * Usage:Object.extend({}, objA, objB)
      */
      function extendOptions(out) {
        out = out || {};

        for (var i = 1; i < arguments.length; i++) {
          var obj = arguments[i];

          if (!obj)
            continue;

          for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
              if (Array.isArray(obj[key])) {
                out[key] = obj[key].slice();
              } else if (typeof obj[key] === 'object') {
                out[key] = extendOptions(out[key], obj[key]);
              } else {
                out[key] = obj[key];
              }
            }
          }
        }

        return out;
      };

      options = extendOptions({}, options, opts);

      // create a view utilities instance
      var instance = viewUtilities(cy, options);

      if (cy.undoRedo) {
        var ur = cy.undoRedo(null, true);
        undoRedo(cy, ur, instance);
      }

      // set the instance on the scratch pad
      getScratch(cy).instance = instance;

      if (!getScratch(cy).initialized) {
        getScratch(cy).initialized = true;

        var shiftKeyDown = false;
        document.addEventListener('keydown', function(event){
          if(event.key == "Shift") {
            shiftKeyDown = true;
          }
        });
        document.addEventListener('keyup', function(event){
          if(event.key == "Shift") {
            shiftKeyDown = false;
          }
        });
        //Select the desired neighbors after taphold-and-free
        cy.on('taphold', 'node', function(event){
          var target = event.target || event.cyTarget;
          var tapheld = false;
          var neighborhood;
          var timeout = setTimeout(function(){
            if(shiftKeyDown){
              cy.elements().unselect();
              neighborhood = options.neighbor(target);
              if(neighborhood)
                neighborhood.select();
              target.lock();
              tapheld = true;
            }
          }, options.neighborSelectTime - 500);
          cy.on('free', 'node', function(){
            var targetTapheld = event.target || event.cyTarget;
            if(target == targetTapheld && tapheld === true){
              tapheld = false;
              if(neighborhood)
                neighborhood.select();
              target.unlock();
            }
            else{
              clearTimeout(timeout);
            }
          });
          cy.on('drag', 'node', function(){
            var targetDragged = event.target || event.cyTarget;
            if(target == targetDragged && tapheld === false){
              clearTimeout(timeout);
            }
          })
        });
      }

      // return the instance of extension
      return getScratch(cy).instance;
    });

  };

  if (typeof module !== 'undefined' && module.exports) { // expose as a commonjs module
    module.exports = register;
  }

  if (typeof define !== 'undefined' && define.amd) { // expose as an amd/requirejs module
    define('cytoscape-view-utilities', function () {
      return register;
    });
  }

  if (typeof cytoscape !== 'undefined') { // expose to global cytoscape (i.e. window.cytoscape)
    register(cytoscape);
  }

})();

},{"./undo-redo":3,"./view-utilities":4}],3:[function(require,module,exports){
// Registers ur actions related to highlight
function highlightUR(cy, ur, viewUtilities) {
  function getStatus(eles) {
    eles = eles ? eles : cy.elements();
    var classes = viewUtilities.getAllHighlightClasses();
    var r = [];
    for (var i = 0; i < classes.length; i++) {
      r.push(eles.filter(`.${classes[i]}:visible`))
    }
    var selector = classes.map(x => '.' + x).join(',');
    // last element of array is elements which are not highlighted by any style
    r.push(eles.filter(":visible").not(selector));
    
    return r;
  }

  function generalUndo(args) {
    var current = args.current;
    var r = [];
    for (var i = 0; i < args.length - 1; i++) {
      r.push(viewUtilities.highlight(args[i], i));
    }
    // last element is for not highlighted by any style
    r.push(viewUtilities.removeHighlights(args[args.length - 1]));

    r['current'] = current;
    return r;
  }

  function generalRedo(args) {
    var current = args.current;
    var r = [];
    for (var i = 0; i < current.length - 1; i++) {
      r.push(viewUtilities.highlight(current[i], i));
    }
    // last element is for not highlighted by any style
    r.push(viewUtilities.removeHighlights(current[current.length - 1]));

    r['current'] = current;
    return r;
  }

  function generateDoFunc(func) {
    return function (args) {
      var res = getStatus();
      if (args.firstTime)
        viewUtilities[func](args.eles, args.idx);
      else
        generalRedo(args);

      res.current = getStatus();

      return res;
    };
  }

  ur.action("highlightNeighbors", generateDoFunc("highlightNeighbors"), generalUndo);
  ur.action("highlight", generateDoFunc("highlight"), generalUndo);
  ur.action("removeHighlights", generateDoFunc("removeHighlights"), generalUndo);
}

// Registers ur actions related to hide/show
function hideShowUR(cy, ur, viewUtilities) {
  function urShow(eles) {
    return viewUtilities.show(eles);
  }

  function urHide(eles) {
    return viewUtilities.hide(eles);
  }

  function urShowHiddenNeighbors(eles) {
    return viewUtilities.showHiddenNeighbors(eles);
  }

  ur.action("show", urShow, urHide);
  ur.action("hide", urHide, urShow);
  ur.action("showHiddenNeighbors",urShowHiddenNeighbors, urHide);
}

module.exports = function (cy, ur, viewUtilities) {
  highlightUR(cy, ur, viewUtilities);
  hideShowUR(cy, ur, viewUtilities);
};

},{}],4:[function(require,module,exports){
var viewUtilities = function (cy, options) {

  var classNames4Styles = [];
  // give a unique name for each unique style EVER added
  var totStyleCnt = 0;
  var marqueeZoomEnabled = false;
  var shiftKeyDown = false;
  var ctrlKeyDown = false;
  init();
  function init() {
    // add provided styles
    for (var i = 0; i < options.highlightStyles.length; i++) {
      var s = '__highligtighted__' + totStyleCnt;
      classNames4Styles.push(s);
      totStyleCnt++;
      updateCyStyle(i);
    }

    // add styles for selected
    addSelectionStyles();

    document.addEventListener("keydown", function(event) {
      if (event.key != "Control" && event.key != "Shift" && event.key != "Meta") {
        return;
      }
      
      if (event.key == "Control" || event.key == "Meta") {
        ctrlKeyDown = true;
      }
      else if (event.key == "Shift") {
        shiftKeyDown = true;
      }
      if (ctrlKeyDown && shiftKeyDown && !marqueeZoomEnabled) {
        instance.enableMarqueeZoom();
        marqueeZoomEnabled = true;
      }
    }); 

    document.addEventListener("keyup", function(event) {
      if (event.key != "Control" && event.key != "Shift" && event.key != "Meta") {
        return;
      }
      if (event.key == "Shift") {
        shiftKeyDown = false;
      }
      else if (event.key == "Control" || event.key == "Meta") {
        ctrlKeyDown = false;
      }
      if (marqueeZoomEnabled && (!shiftKeyDown || !ctrlKeyDown)) {
        instance.disableMarqueeZoom();
        marqueeZoomEnabled = false;
      }
    }); 

  }

  function addSelectionStyles() {
    if (options.selectStyles.node) {
      cy.style().selector('node:selected').css(options.selectStyles.node).update();
    }
    if (options.selectStyles.edge) {
      cy.style().selector('edge:selected').css(options.selectStyles.edge).update();
    }
  }

  function updateCyStyle(classIdx) {
    var className = classNames4Styles[classIdx];
    var cssNode = options.highlightStyles[classIdx].node;
    var cssEdge = options.highlightStyles[classIdx].edge;
    cy.style().selector('node.' + className).css(cssNode).update();
    cy.style().selector('edge.' + className).css(cssEdge).update();
  }

  // Helper functions for internal usage (not to be exposed)
  function highlight(eles, idx) {
    cy.startBatch();
    for (var i = 0; i < options.highlightStyles.length; i++) {
      eles.removeClass(classNames4Styles[i]);
    }
    eles.addClass(classNames4Styles[idx]);
    eles.unselect();
    cy.endBatch();
  }

  function getWithNeighbors(eles) {
    return eles.add(eles.descendants()).closedNeighborhood();
  }
  // the instance to be returned
  var instance = {};

  // Section hide-show
  // hide given eles
  instance.hide = function (eles) {
    //eles = eles.filter("node")
    eles = eles.filter(":visible");
    eles = eles.union(eles.connectedEdges());

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'hidden');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'none');
    }

    return eles;
  };

  // unhide given eles
  instance.show = function (eles) {
    eles = eles.not(":visible");

    var connectedEdges = eles.connectedEdges(function (edge) {

      if ((edge.source().visible() || eles.contains(edge.source())) && (edge.target().visible() || eles.contains(edge.target()))) {
        return true;
      } else {
        return false;
      }

    });
    eles = eles.union(connectedEdges);

    eles.unselect();

    if (options.setVisibilityOnHide) {
      eles.css('visibility', 'visible');
    }

    if (options.setDisplayOnHide) {
      eles.css('display', 'element');
    }

    return eles;
  };

  // Section highlight
  instance.showHiddenNeighbors = function (eles) {
    return this.show(getWithNeighbors(eles));
  };

  // Highlights eles
  instance.highlight = function (eles, idx = 0) {
    highlight(eles, idx); // Use the helper here
    return eles;
  };

  instance.getHighlightStyles = function () {
    return options.highlightStyles;
  };

  // Highlights eles' neighborhood
  instance.highlightNeighbors = function (eles, idx = 0) {
    return this.highlight(getWithNeighbors(eles), idx);
  };

  // Remove highlights from eles.
  // If eles is not defined considers cy.elements()
  instance.removeHighlights = function (eles) {
    cy.startBatch();
    if (eles == null || eles.length == null) {
      eles = cy.elements();
    }
    for (var i = 0; i < options.highlightStyles.length; i++) {
      eles.removeClass(classNames4Styles[i]);
    }
    cy.endBatch();
    return eles;
  };

  // Indicates if the ele is highlighted
  instance.isHighlighted = function (ele) {
    var isHigh = false;
    for (var i = 0; i < options.highlightStyles.length; i++) {
      if (ele.is('.' + classNames4Styles[i] + ':visible')) {
        isHigh = true;
      }
    }
    return isHigh;
  };

  instance.changeHighlightStyle = function (idx, nodeStyle, edgeStyle) {
    options.highlightStyles[idx].node = nodeStyle;
    options.highlightStyles[idx].edge = edgeStyle;
    updateCyStyle(idx);
    addSelectionStyles();
  };

  instance.addHighlightStyle = function (nodeStyle, edgeStyle) {
    var o = { node: nodeStyle, edge: edgeStyle };
    options.highlightStyles.push(o);
    var s = '__highligtighted__' + totStyleCnt;
    classNames4Styles.push(s);
    totStyleCnt++;
    updateCyStyle(options.highlightStyles.length - 1);
    addSelectionStyles();
  };

  instance.removeHighlightStyle = function (styleIdx) {
    if (styleIdx < 0 || styleIdx > options.highlightStyles.length - 1) {
      return;
    }
    cy.elements().removeClass(classNames4Styles[styleIdx]);
    options.highlightStyles.splice(styleIdx, 1);
    classNames4Styles.splice(styleIdx, 1);
  };

  instance.getAllHighlightClasses = function () {
    var a = [];
    for (var i = 0; i < options.highlightStyles.length; i++) {
      a.push(classNames4Styles[i]);
    }
    return classNames4Styles;
  };

  //Zoom selected Nodes
  instance.zoomToSelected = function (eles) {
    var boundingBox = eles.boundingBox();
    var diff_x = Math.abs(boundingBox.x1 - boundingBox.x2);
    var diff_y = Math.abs(boundingBox.y1 - boundingBox.y2);
    var padding;
    if (diff_x >= 200 || diff_y >= 200) {
      padding = 50;
    }
    else {
      padding = (cy.width() < cy.height()) ?
        ((200 - diff_x) / 2 * cy.width() / 200) : ((200 - diff_y) / 2 * cy.height() / 200);
    }

    cy.animate({
      fit: {
        eles: eles,
        padding: padding
      }
    }, {
      duration: options.zoomAnimationDuration
    });
    return eles;
  };

  //Marquee Zoom
  var tabStartHandler;
  var tabEndHandler;

  instance.enableMarqueeZoom = function (callback) {
    marqueeZoomEnabled = true;
    var rect_start_pos_x, rect_start_pos_y, rect_end_pos_x, rect_end_pos_y;
    //Make the cy unselectable
    cy.autounselectify(true);

    cy.one('tapstart', tabStartHandler = function (event) {
      if (shiftKeyDown == true) {
        rect_start_pos_x = event.position.x;
        rect_start_pos_y = event.position.y;
        rect_end_pos_x = undefined;
      }
    });
    cy.one('tapend', tabEndHandler = function (event) {
      rect_end_pos_x = event.position.x;
      rect_end_pos_y = event.position.y;
      //check whether corners of rectangle is undefined
      //abort marquee zoom if one corner is undefined
      if (rect_start_pos_x == undefined || rect_end_pos_x == undefined) {
        cy.autounselectify(false);
        if (callback) {
          callback();
        }
        return;
      }
      //Reoder rectangle positions
      //Top left of the rectangle (rect_start_pos_x, rect_start_pos_y)
      //right bottom of the rectangle (rect_end_pos_x, rect_end_pos_y)
      if (rect_start_pos_x > rect_end_pos_x) {
        var temp = rect_start_pos_x;
        rect_start_pos_x = rect_end_pos_x;
        rect_end_pos_x = temp;
      }
      if (rect_start_pos_y > rect_end_pos_y) {
        var temp = rect_start_pos_y;
        rect_start_pos_y = rect_end_pos_y;
        rect_end_pos_y = temp;
      }

      //Extend sides of selected rectangle to 200px if less than 100px
      if (rect_end_pos_x - rect_start_pos_x < 200) {
        var extendPx = (200 - (rect_end_pos_x - rect_start_pos_x)) / 2;
        rect_start_pos_x -= extendPx;
        rect_end_pos_x += extendPx;
      }
      if (rect_end_pos_y - rect_start_pos_y < 200) {
        var extendPx = (200 - (rect_end_pos_y - rect_start_pos_y)) / 2;
        rect_start_pos_y -= extendPx;
        rect_end_pos_y += extendPx;
      }

      //Check whether rectangle intersects with bounding box of the graph
      //if not abort marquee zoom
      if ((rect_start_pos_x > cy.elements().boundingBox().x2)
        || (rect_end_pos_x < cy.elements().boundingBox().x1)
        || (rect_start_pos_y > cy.elements().boundingBox().y2)
        || (rect_end_pos_y < cy.elements().boundingBox().y1)) {
        cy.autounselectify(false);
        if (callback) {
          callback();
        }
        return;
      }

      //Calculate zoom level
      var zoomLevel = Math.min(cy.width() / (Math.abs(rect_end_pos_x - rect_start_pos_x)),
        cy.height() / Math.abs(rect_end_pos_y - rect_start_pos_y));

      var diff_x = cy.width() / 2 - (cy.pan().x + zoomLevel * (rect_start_pos_x + rect_end_pos_x) / 2);
      var diff_y = cy.height() / 2 - (cy.pan().y + zoomLevel * (rect_start_pos_y + rect_end_pos_y) / 2);

      cy.animate({
        panBy: { x: diff_x, y: diff_y },
        zoom: zoomLevel,
        duration: options.zoomAnimationDuration,
        complete: function () {
          if (callback) {
            callback();
          }
          cy.autounselectify(false);
        }
      });
    });
  };

  instance.disableMarqueeZoom = function () {
    cy.off('tapstart', tabStartHandler);
    cy.off('tapend', tabEndHandler);
    cy.autounselectify(false);
    marqueeZoomEnabled = false;
  };
 //Lasso Mode
 var geometric = require('geometric');

 instance.changeLassoStyle = function(styleObj)  {
   if(styleObj.lineWidth)
     options.lassoStyle.lineWidth = styleObj.lineWidth;
   if(styleObj.lineColor)
     options.lassoStyle.lineColor = styleObj.lineColor;
 };

 instance.enableLassoMode = function (callback) {
   
   var isClicked = false;
   var tempCanv = document.createElement('canvas');
   tempCanv.id = 'lasso-canvas';
   const container = cy.container();
   container.appendChild(tempCanv);
   
   const width = container.offsetWidth;
   const height = container.offsetHeight;

   tempCanv.width = width;
   tempCanv.height = height;
   tempCanv.setAttribute("style",`z-index: 1000; position: absolute; top: 0; left: 0;`,);
   
   cy.panningEnabled(false);
   cy.zoomingEnabled(false);
   cy.autounselectify(true);
   var points = [];

   tempCanv.onclick = function(event) {
     
     if(isClicked == false)  {
       isClicked = true;
       var context = tempCanv.getContext("2d");
       context.strokeStyle = options.lassoStyle.lineColor;
       context.lineWidth = options.lassoStyle.lineWidth;
       context.lineJoin = "round";
       cy.panningEnabled(false);
       cy.zoomingEnabled(false);
       cy.autounselectify(true);
       var formerX = event.offsetX;
       var formerY = event.offsetY;
       
       points.push([formerX,formerY]);
       tempCanv.onmouseleave = function(e) {
         isClicked = false;
         container.removeChild(tempCanv);
         tempCanv = null;
         cy.panningEnabled(true);
         cy.zoomingEnabled(true);
         cy.autounselectify(false);
         if (callback) {
           callback();
         }
       };
       tempCanv.onmousemove = function(e)  {
         context.beginPath();
         points.push([e.offsetX,e.offsetY]);
         context.moveTo(formerX, formerY);
         context.lineTo(e.offsetX, e.offsetY);
         formerX = e.offsetX;
         formerY = e.offsetY;
         context.stroke();
         context.closePath();
       };
     }
     else{
       var eles = cy.elements();
       points.push(points[0]);
       for(var i = 0; i < eles.length; i++) {
         if(eles[i].isEdge())  {
           
           var p1 = [(eles[i].sourceEndpoint().x)*cy.zoom()+cy.pan().x,(eles[i].sourceEndpoint().y)*cy.zoom()+cy.pan().y];
           var p2 = [(eles[i].targetEndpoint().x)*cy.zoom()+cy.pan().x,(eles[i].targetEndpoint().y)*cy.zoom()+cy.pan().y];

           if(geometric.pointInPolygon(p1,points) && geometric.pointInPolygon(p2,points))  {
             eles[i].select();
           }

         }
         else{
           cy.autounselectify(false);
           var bb = [[eles[i].renderedBoundingBox().x1,eles[i].renderedBoundingBox().y1],
                     [eles[i].renderedBoundingBox().x1,eles[i].renderedBoundingBox().y2],
                     [eles[i].renderedBoundingBox().x2,eles[i].renderedBoundingBox().y2],
                     [eles[i].renderedBoundingBox().x2,eles[i].renderedBoundingBox().y1]];

           if (geometric.polygonIntersectsPolygon(bb,points) || geometric.polygonInPolygon(bb, points) 
           || geometric.polygonInPolygon(points,bb)){
             eles[i].select();
           }
         }
       }
       isClicked = false;
       container.removeChild(tempCanv);
       tempCanv = null;
       
       cy.panningEnabled(true);
       cy.zoomingEnabled(true);
       if (callback) {
         callback();
       }
     }
   };
 };

 instance.disableLassoMode = function () {
   var c = document.getElementById('lasso-canvas');
   if ( c ){
     c.parentElement.removeChild(c);
     c = null;
   }
   cy.panningEnabled(true);
   cy.zoomingEnabled(true);
   cy.autounselectify(false);
 }
  // return the instance
  return instance;
};

module.exports = viewUtilities;

},{"geometric":1}]},{},[2])(2)
});
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZ2VvbWV0cmljL2J1aWxkL2dlb21ldHJpYy5qcyIsInNyYy9pbmRleC5qcyIsInNyYy91bmRvLXJlZG8uanMiLCJzcmMvdmlldy11dGlsaXRpZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeGhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBodHRwczovL2dpdGh1Yi5jb20vSGFycnlTdGV2ZW5zL2dlb21ldHJpYyNyZWFkbWUgVmVyc2lvbiAyLjIuMy4gQ29weXJpZ2h0IDIwMjAgSGFycnkgU3RldmVucy5cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IGZhY3RvcnkoZXhwb3J0cykgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJ10sIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKGdsb2JhbC5nZW9tZXRyaWMgPSB7fSkpKTtcbn0odGhpcywgKGZ1bmN0aW9uIChleHBvcnRzKSB7ICd1c2Ugc3RyaWN0JztcblxuICAvLyBDb252ZXJ0cyByYWRpYW5zIHRvIGRlZ3JlZXMuXG4gIGZ1bmN0aW9uIGFuZ2xlVG9EZWdyZWVzKGFuZ2xlKSB7XG4gICAgcmV0dXJuIGFuZ2xlICogMTgwIC8gTWF0aC5QSTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGxpbmVBbmdsZShsaW5lKSB7XG4gICAgcmV0dXJuIGFuZ2xlVG9EZWdyZWVzKE1hdGguYXRhbjIobGluZVsxXVsxXSAtIGxpbmVbMF1bMV0sIGxpbmVbMV1bMF0gLSBsaW5lWzBdWzBdKSk7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSBkaXN0YW5jZSBiZXR3ZWVuIHRoZSBlbmRwb2ludHMgb2YgYSBsaW5lIHNlZ21lbnQuXG4gIGZ1bmN0aW9uIGxpbmVMZW5ndGgobGluZSkge1xuICAgIHJldHVybiBNYXRoLnNxcnQoTWF0aC5wb3cobGluZVsxXVswXSAtIGxpbmVbMF1bMF0sIDIpICsgTWF0aC5wb3cobGluZVsxXVsxXSAtIGxpbmVbMF1bMV0sIDIpKTtcbiAgfVxuXG4gIC8vIENvbnZlcnRzIGRlZ3JlZXMgdG8gcmFkaWFucy5cbiAgZnVuY3Rpb24gYW5nbGVUb1JhZGlhbnMoYW5nbGUpIHtcbiAgICByZXR1cm4gYW5nbGUgLyAxODAgKiBNYXRoLlBJO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnRUcmFuc2xhdGUocG9pbnQsIGFuZ2xlLCBkaXN0YW5jZSkge1xuICAgIHZhciByID0gYW5nbGVUb1JhZGlhbnMoYW5nbGUpO1xuICAgIHJldHVybiBbcG9pbnRbMF0gKyBkaXN0YW5jZSAqIE1hdGguY29zKHIpLCBwb2ludFsxXSArIGRpc3RhbmNlICogTWF0aC5zaW4ocildO1xuICB9XG5cbiAgLy8gVGhlIHJldHVybmVkIGludGVycG9sYXRvciBmdW5jdGlvbiB0YWtlcyBhIHNpbmdsZSBhcmd1bWVudCB0LCB3aGVyZSB0IGlzIGEgbnVtYmVyIHJhbmdpbmcgZnJvbSAwIHRvIDE7XG4gIC8vIGEgdmFsdWUgb2YgMCByZXR1cm5zIGEsIHdoaWxlIGEgdmFsdWUgb2YgMSByZXR1cm5zIGIuXG4gIC8vIEludGVybWVkaWF0ZSB2YWx1ZXMgaW50ZXJwb2xhdGUgZnJvbSBzdGFydCB0byBlbmQgYWxvbmcgdGhlIGxpbmUgc2VnbWVudC5cblxuICBmdW5jdGlvbiBsaW5lSW50ZXJwb2xhdGUobGluZSkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodCkge1xuICAgICAgcmV0dXJuIHQgPT09IDAgPyBsaW5lWzBdIDogdCA9PT0gMSA/IGxpbmVbMV0gOiBwb2ludFRyYW5zbGF0ZShsaW5lWzBdLCBsaW5lQW5nbGUobGluZSksIGxpbmVMZW5ndGgobGluZSkgKiB0KTtcbiAgICB9O1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgbWlkcG9pbnQgb2YgYSBsaW5lIHNlZ21lbnQuXG4gIGZ1bmN0aW9uIGxpbmVNaWRwb2ludChsaW5lKSB7XG4gICAgcmV0dXJuIFsobGluZVswXVswXSArIGxpbmVbMV1bMF0pIC8gMiwgKGxpbmVbMF1bMV0gKyBsaW5lWzFdWzFdKSAvIDJdO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9pbnRSb3RhdGUocG9pbnQsIGFuZ2xlLCBvcmlnaW4pIHtcbiAgICB2YXIgciA9IGFuZ2xlVG9SYWRpYW5zKGFuZ2xlKTtcblxuICAgIGlmICghb3JpZ2luIHx8IG9yaWdpblswXSA9PT0gMCAmJiBvcmlnaW5bMV0gPT09IDApIHtcbiAgICAgIHJldHVybiByb3RhdGUocG9pbnQsIHIpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTZWU6IGh0dHBzOi8vbWF0aC5zdGFja2V4Y2hhbmdlLmNvbS9xdWVzdGlvbnMvMTk2NDkwNS9yb3RhdGlvbi1hcm91bmQtbm9uLXplcm8tcG9pbnRcbiAgICAgIHZhciBwMCA9IHBvaW50Lm1hcChmdW5jdGlvbiAoYywgaSkge1xuICAgICAgICByZXR1cm4gYyAtIG9yaWdpbltpXTtcbiAgICAgIH0pO1xuICAgICAgdmFyIHJvdGF0ZWQgPSByb3RhdGUocDAsIHIpO1xuICAgICAgcmV0dXJuIHJvdGF0ZWQubWFwKGZ1bmN0aW9uIChjLCBpKSB7XG4gICAgICAgIHJldHVybiBjICsgb3JpZ2luW2ldO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcm90YXRlKHBvaW50LCBhbmdsZSkge1xuICAgICAgLy8gU2VlOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9DYXJ0ZXNpYW5fY29vcmRpbmF0ZV9zeXN0ZW0jUm90YXRpb25cbiAgICAgIHJldHVybiBbcG9pbnRbMF0gKiBNYXRoLmNvcyhhbmdsZSkgLSBwb2ludFsxXSAqIE1hdGguc2luKGFuZ2xlKSwgcG9pbnRbMF0gKiBNYXRoLnNpbihhbmdsZSkgKyBwb2ludFsxXSAqIE1hdGguY29zKGFuZ2xlKV07XG4gICAgfVxuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgYXJlYSBvZiBhIHBvbHlnb24uXG4gIGZ1bmN0aW9uIHBvbHlnb25BcmVhKHZlcnRpY2VzKSB7XG4gICAgdmFyIHNpZ25lZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAxICYmIGFyZ3VtZW50c1sxXSAhPT0gdW5kZWZpbmVkID8gYXJndW1lbnRzWzFdIDogZmFsc2U7XG4gICAgdmFyIGEgPSAwO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSB2ZXJ0aWNlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciB2MCA9IHZlcnRpY2VzW2ldLFxuICAgICAgICAgIHYxID0gdmVydGljZXNbaSA9PT0gbCAtIDEgPyAwIDogaSArIDFdO1xuICAgICAgYSArPSB2MFswXSAqIHYxWzFdO1xuICAgICAgYSAtPSB2MVswXSAqIHYwWzFdO1xuICAgIH1cblxuICAgIHJldHVybiBzaWduZWQgPyBhIC8gMiA6IE1hdGguYWJzKGEgLyAyKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGJvdW5kcyBvZiBhIHBvbHlnb24uXG4gIGZ1bmN0aW9uIHBvbHlnb25Cb3VuZHMocG9seWdvbikge1xuICAgIGlmIChwb2x5Z29uLmxlbmd0aCA8IDMpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHZhciB4TWluID0gSW5maW5pdHksXG4gICAgICAgIHhNYXggPSAtSW5maW5pdHksXG4gICAgICAgIHlNaW4gPSBJbmZpbml0eSxcbiAgICAgICAgeU1heCA9IC1JbmZpbml0eSxcbiAgICAgICAgZm91bmQgPSBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcG9seWdvbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhciBwID0gcG9seWdvbltpXSxcbiAgICAgICAgICB4ID0gcFswXSxcbiAgICAgICAgICB5ID0gcFsxXTtcblxuICAgICAgaWYgKHggIT0gbnVsbCAmJiBpc0Zpbml0ZSh4KSAmJiB5ICE9IG51bGwgJiYgaXNGaW5pdGUoeSkpIHtcbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICBpZiAoeCA8IHhNaW4pIHhNaW4gPSB4O1xuICAgICAgICBpZiAoeCA+IHhNYXgpIHhNYXggPSB4O1xuICAgICAgICBpZiAoeSA8IHlNaW4pIHlNaW4gPSB5O1xuICAgICAgICBpZiAoeSA+IHlNYXgpIHlNYXggPSB5O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBmb3VuZCA/IFtbeE1pbiwgeU1pbl0sIFt4TWF4LCB5TWF4XV0gOiBudWxsO1xuICB9XG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgd2VpZ2h0ZWQgY2VudHJvaWQgYSBwb2x5Z29uLlxuICBmdW5jdGlvbiBwb2x5Z29uQ2VudHJvaWQodmVydGljZXMpIHtcbiAgICB2YXIgYSA9IDAsXG4gICAgICAgIHggPSAwLFxuICAgICAgICB5ID0gMCxcbiAgICAgICAgbCA9IHZlcnRpY2VzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgcyA9IGkgPT09IGwgLSAxID8gMCA6IGkgKyAxLFxuICAgICAgICAgIHYwID0gdmVydGljZXNbaV0sXG4gICAgICAgICAgdjEgPSB2ZXJ0aWNlc1tzXSxcbiAgICAgICAgICBmID0gdjBbMF0gKiB2MVsxXSAtIHYxWzBdICogdjBbMV07XG4gICAgICBhICs9IGY7XG4gICAgICB4ICs9ICh2MFswXSArIHYxWzBdKSAqIGY7XG4gICAgICB5ICs9ICh2MFsxXSArIHYxWzFdKSAqIGY7XG4gICAgfVxuXG4gICAgdmFyIGQgPSBhICogMztcbiAgICByZXR1cm4gW3ggLyBkLCB5IC8gZF07XG4gIH1cblxuICAvLyBTZWUgaHR0cHM6Ly9lbi53aWtpYm9va3Mub3JnL3dpa2kvQWxnb3JpdGhtX0ltcGxlbWVudGF0aW9uL0dlb21ldHJ5L0NvbnZleF9odWxsL01vbm90b25lX2NoYWluI0phdmFTY3JpcHRcbiAgLy8gYW5kIGh0dHBzOi8vbWF0aC5zdGFja2V4Y2hhbmdlLmNvbS9xdWVzdGlvbnMvMjc0NzEyL2NhbGN1bGF0ZS1vbi13aGljaC1zaWRlLW9mLWEtc3RyYWlnaHQtbGluZS1pcy1hLWdpdmVuLXBvaW50LWxvY2F0ZWRcbiAgZnVuY3Rpb24gY3Jvc3MoYSwgYiwgbykge1xuICAgIHJldHVybiAoYVswXSAtIG9bMF0pICogKGJbMV0gLSBvWzFdKSAtIChhWzFdIC0gb1sxXSkgKiAoYlswXSAtIG9bMF0pO1xuICB9XG5cbiAgLy8gU2VlIGh0dHBzOi8vZW4ud2lraWJvb2tzLm9yZy93aWtpL0FsZ29yaXRobV9JbXBsZW1lbnRhdGlvbi9HZW9tZXRyeS9Db252ZXhfaHVsbC9Nb25vdG9uZV9jaGFpbiNKYXZhU2NyaXB0XG5cbiAgZnVuY3Rpb24gcG9seWdvbkh1bGwocG9pbnRzKSB7XG4gICAgaWYgKHBvaW50cy5sZW5ndGggPCAzKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgcG9pbnRzQ29weSA9IHBvaW50cy5zbGljZSgpLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgIHJldHVybiBhWzBdID09PSBiWzBdID8gYVsxXSAtIGJbMV0gOiBhWzBdIC0gYlswXTtcbiAgICB9KTtcbiAgICB2YXIgbG93ZXIgPSBbXTtcblxuICAgIGZvciAodmFyIGkwID0gMDsgaTAgPCBwb2ludHNDb3B5Lmxlbmd0aDsgaTArKykge1xuICAgICAgd2hpbGUgKGxvd2VyLmxlbmd0aCA+PSAyICYmIGNyb3NzKGxvd2VyW2xvd2VyLmxlbmd0aCAtIDJdLCBsb3dlcltsb3dlci5sZW5ndGggLSAxXSwgcG9pbnRzQ29weVtpMF0pIDw9IDApIHtcbiAgICAgICAgbG93ZXIucG9wKCk7XG4gICAgICB9XG5cbiAgICAgIGxvd2VyLnB1c2gocG9pbnRzQ29weVtpMF0pO1xuICAgIH1cblxuICAgIHZhciB1cHBlciA9IFtdO1xuXG4gICAgZm9yICh2YXIgaTEgPSBwb2ludHNDb3B5Lmxlbmd0aCAtIDE7IGkxID49IDA7IGkxLS0pIHtcbiAgICAgIHdoaWxlICh1cHBlci5sZW5ndGggPj0gMiAmJiBjcm9zcyh1cHBlclt1cHBlci5sZW5ndGggLSAyXSwgdXBwZXJbdXBwZXIubGVuZ3RoIC0gMV0sIHBvaW50c0NvcHlbaTFdKSA8PSAwKSB7XG4gICAgICAgIHVwcGVyLnBvcCgpO1xuICAgICAgfVxuXG4gICAgICB1cHBlci5wdXNoKHBvaW50c0NvcHlbaTFdKTtcbiAgICB9XG5cbiAgICB1cHBlci5wb3AoKTtcbiAgICBsb3dlci5wb3AoKTtcbiAgICByZXR1cm4gbG93ZXIuY29uY2F0KHVwcGVyKTtcbiAgfVxuXG4gIC8vIENhbGN1bGF0ZXMgdGhlIGxlbmd0aCBvZiBhIHBvbHlnb24ncyBwZXJpbWV0ZXIuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZDMvZDMtcG9seWdvbi9ibG9iL21hc3Rlci9zcmMvbGVuZ3RoLmpzXG4gIGZ1bmN0aW9uIHBvbHlnb25MZW5ndGgodmVydGljZXMpIHtcbiAgICBpZiAodmVydGljZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gMDtcbiAgICB9XG5cbiAgICB2YXIgaSA9IC0xLFxuICAgICAgICBuID0gdmVydGljZXMubGVuZ3RoLFxuICAgICAgICBiID0gdmVydGljZXNbbiAtIDFdLFxuICAgICAgICB4YSxcbiAgICAgICAgeWEsXG4gICAgICAgIHhiID0gYlswXSxcbiAgICAgICAgeWIgPSBiWzFdLFxuICAgICAgICBwZXJpbWV0ZXIgPSAwO1xuXG4gICAgd2hpbGUgKCsraSA8IG4pIHtcbiAgICAgIHhhID0geGI7XG4gICAgICB5YSA9IHliO1xuICAgICAgYiA9IHZlcnRpY2VzW2ldO1xuICAgICAgeGIgPSBiWzBdO1xuICAgICAgeWIgPSBiWzFdO1xuICAgICAgeGEgLT0geGI7XG4gICAgICB5YSAtPSB5YjtcbiAgICAgIHBlcmltZXRlciArPSBNYXRoLnNxcnQoeGEgKiB4YSArIHlhICogeWEpO1xuICAgIH1cblxuICAgIHJldHVybiBwZXJpbWV0ZXI7XG4gIH1cblxuICAvLyBDYWxjdWxhdGVzIHRoZSBhcml0aG1ldGljIG1lYW4gb2YgYSBwb2x5Z29uJ3MgdmVydGljZXMuXG4gIGZ1bmN0aW9uIHBvbHlnb25NZWFuKHZlcnRpY2VzKSB7XG4gICAgdmFyIHggPSAwLFxuICAgICAgICB5ID0gMCxcbiAgICAgICAgbCA9IHZlcnRpY2VzLmxlbmd0aDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdiA9IHZlcnRpY2VzW2ldO1xuICAgICAgeCArPSB2WzBdO1xuICAgICAgeSArPSB2WzFdO1xuICAgIH1cblxuICAgIHJldHVybiBbeCAvIGwsIHkgLyBsXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBvbHlnb25UcmFuc2xhdGUocG9seWdvbiwgYW5nbGUsIGRpc3RhbmNlKSB7XG4gICAgdmFyIHAgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcG9seWdvbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHBbaV0gPSBwb2ludFRyYW5zbGF0ZShwb2x5Z29uW2ldLCBhbmdsZSwgZGlzdGFuY2UpO1xuICAgIH1cblxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgZnVuY3Rpb24gcG9seWdvblJlZ3VsYXIoKSB7XG4gICAgdmFyIHNpZGVzID0gYXJndW1lbnRzLmxlbmd0aCA+IDAgJiYgYXJndW1lbnRzWzBdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMF0gOiAzO1xuICAgIHZhciBhcmVhID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiAxMDA7XG4gICAgdmFyIGNlbnRlciA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gYXJndW1lbnRzWzJdIDogdW5kZWZpbmVkO1xuICAgIHZhciBwb2x5Z29uID0gW10sXG4gICAgICAgIHBvaW50ID0gWzAsIDBdLFxuICAgICAgICBzdW0gPSBbMCwgMF0sXG4gICAgICAgIGFuZ2xlID0gMDtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2lkZXM7IGkrKykge1xuICAgICAgcG9seWdvbltpXSA9IHBvaW50O1xuICAgICAgc3VtWzBdICs9IHBvaW50WzBdO1xuICAgICAgc3VtWzFdICs9IHBvaW50WzFdO1xuICAgICAgcG9pbnQgPSBwb2ludFRyYW5zbGF0ZShwb2ludCwgYW5nbGUsIE1hdGguc3FydCg0ICogYXJlYSAqIE1hdGgudGFuKE1hdGguUEkgLyBzaWRlcykgLyBzaWRlcykpOyAvLyBodHRwczovL3dlYi5hcmNoaXZlLm9yZy93ZWIvMjAxODA0MDQxNDI3MTMvaHR0cDovL2tlaXNhbi5jYXNpby5jb20vZXhlYy9zeXN0ZW0vMTM1NTk4NTk4NVxuXG4gICAgICBhbmdsZSAtPSAzNjAgLyBzaWRlcztcbiAgICB9XG5cbiAgICBpZiAoY2VudGVyKSB7XG4gICAgICB2YXIgbGluZSA9IFtbc3VtWzBdIC8gc2lkZXMsIHN1bVsxXSAvIHNpZGVzXSwgY2VudGVyXTtcbiAgICAgIHBvbHlnb24gPSBwb2x5Z29uVHJhbnNsYXRlKHBvbHlnb24sIGxpbmVBbmdsZShsaW5lKSwgbGluZUxlbmd0aChsaW5lKSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBvbHlnb247XG4gIH1cblxuICBmdW5jdGlvbiBwb2x5Z29uUm90YXRlKHBvbHlnb24sIGFuZ2xlLCBvcmlnaW4pIHtcbiAgICB2YXIgcCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwb2x5Z29uLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgcFtpXSA9IHBvaW50Um90YXRlKHBvbHlnb25baV0sIGFuZ2xlLCBvcmlnaW4pO1xuICAgIH1cblxuICAgIHJldHVybiBwO1xuICB9XG5cbiAgLy8gVGhlIG9yaWdpbiBkZWZhdWx0cyB0byB0aGUgcG9seWdvbidzIGNlbnRyb2lkLlxuXG4gIGZ1bmN0aW9uIHBvbHlnb25TY2FsZShwb2x5Z29uLCBzY2FsZSwgb3JpZ2luKSB7XG4gICAgaWYgKCFvcmlnaW4pIHtcbiAgICAgIG9yaWdpbiA9IHBvbHlnb25DZW50cm9pZChwb2x5Z29uKTtcbiAgICB9XG5cbiAgICB2YXIgcCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwb2x5Z29uLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHYgPSBwb2x5Z29uW2ldLFxuICAgICAgICAgIGQgPSBsaW5lTGVuZ3RoKFtvcmlnaW4sIHZdKSxcbiAgICAgICAgICBhID0gbGluZUFuZ2xlKFtvcmlnaW4sIHZdKTtcbiAgICAgIHBbaV0gPSBwb2ludFRyYW5zbGF0ZShvcmlnaW4sIGEsIGQgKiBzY2FsZSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHA7XG4gIH1cblxuICAvLyBEZXRlcm1pbmVzIGlmIGxpbmVBIGludGVyc2VjdHMgbGluZUIuIFxuICAvLyBTZWU6IGh0dHBzOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzkwNDM4MDUvdGVzdC1pZi10d28tbGluZXMtaW50ZXJzZWN0LWphdmFzY3JpcHQtZnVuY3Rpb24vMjQzOTIyODEjMjQzOTIyODFcbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG4gIGZ1bmN0aW9uIGxpbmVJbnRlcnNlY3RzTGluZShsaW5lQSwgbGluZUIpIHtcbiAgICAvLyBGaXJzdCB0ZXN0IHRvIHNlZSBpZiB0aGUgbGluZXMgc2hhcmUgYW4gZW5kcG9pbnRcbiAgICBpZiAoc2hhcmVQb2ludChsaW5lQSwgbGluZUIpKSByZXR1cm4gdHJ1ZTtcbiAgICB2YXIgYSA9IGxpbmVBWzBdWzBdLFxuICAgICAgICBiID0gbGluZUFbMF1bMV0sXG4gICAgICAgIGMgPSBsaW5lQVsxXVswXSxcbiAgICAgICAgZCA9IGxpbmVBWzFdWzFdLFxuICAgICAgICBwID0gbGluZUJbMF1bMF0sXG4gICAgICAgIHEgPSBsaW5lQlswXVsxXSxcbiAgICAgICAgciA9IGxpbmVCWzFdWzBdLFxuICAgICAgICBzID0gbGluZUJbMV1bMV0sXG4gICAgICAgIGRldCxcbiAgICAgICAgZ2FtbWEsXG4gICAgICAgIGxhbWJkYTtcbiAgICBkZXQgPSAoYyAtIGEpICogKHMgLSBxKSAtIChyIC0gcCkgKiAoZCAtIGIpO1xuXG4gICAgaWYgKGRldCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICBsYW1iZGEgPSAoKHMgLSBxKSAqIChyIC0gYSkgKyAocCAtIHIpICogKHMgLSBiKSkgLyBkZXQ7XG4gICAgICBnYW1tYSA9ICgoYiAtIGQpICogKHIgLSBhKSArIChjIC0gYSkgKiAocyAtIGIpKSAvIGRldDtcbiAgICAgIHJldHVybiAwIDwgbGFtYmRhICYmIGxhbWJkYSA8IDEgJiYgMCA8IGdhbW1hICYmIGdhbW1hIDwgMTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzaGFyZVBvaW50KGxpbmVBLCBsaW5lQikge1xuICAgIHZhciBzaGFyZSA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAyOyBpKyspIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgMjsgaisrKSB7XG4gICAgICAgIGlmIChlcXVhbChsaW5lQVtpXSwgbGluZUJbal0pKSB7XG4gICAgICAgICAgc2hhcmUgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNoYXJlO1xuICB9XG5cbiAgZnVuY3Rpb24gZXF1YWwocG9pbnRBLCBwb2ludEIpIHtcbiAgICByZXR1cm4gcG9pbnRBWzBdID09PSBwb2ludEJbMF0gJiYgcG9pbnRBWzFdID09PSBwb2ludEJbMV07XG4gIH1cblxuICBmdW5jdGlvbiBfdG9Db25zdW1hYmxlQXJyYXkoYXJyKSB7XG4gICAgcmV0dXJuIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHx8IF9pdGVyYWJsZVRvQXJyYXkoYXJyKSB8fCBfbm9uSXRlcmFibGVTcHJlYWQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgYXJyMiA9IG5ldyBBcnJheShhcnIubGVuZ3RoKTsgaSA8IGFyci5sZW5ndGg7IGkrKykgYXJyMltpXSA9IGFycltpXTtcblxuICAgICAgcmV0dXJuIGFycjI7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gX2l0ZXJhYmxlVG9BcnJheShpdGVyKSB7XG4gICAgaWYgKFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoaXRlcikgfHwgT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGl0ZXIpID09PSBcIltvYmplY3QgQXJndW1lbnRzXVwiKSByZXR1cm4gQXJyYXkuZnJvbShpdGVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIF9ub25JdGVyYWJsZVNwcmVhZCgpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIHNwcmVhZCBub24taXRlcmFibGUgaW5zdGFuY2VcIik7XG4gIH1cblxuICAvLyBDbG9zZXMgYSBwb2x5Z29uIGlmIGl0J3Mgbm90IGNsb3NlZCBhbHJlYWR5LiBEb2VzIG5vdCBtb2RpZnkgaW5wdXQgcG9seWdvbi5cbiAgZnVuY3Rpb24gY2xvc2UocG9seWdvbikge1xuICAgIHJldHVybiBpc0Nsb3NlZChwb2x5Z29uKSA/IHBvbHlnb24gOiBbXS5jb25jYXQoX3RvQ29uc3VtYWJsZUFycmF5KHBvbHlnb24pLCBbcG9seWdvblswXV0pO1xuICB9IC8vIFRlc3RzIHdoZXRoZXIgYSBwb2x5Z29uIGlzIGNsb3NlZFxuXG4gIGZ1bmN0aW9uIGlzQ2xvc2VkKHBvbHlnb24pIHtcbiAgICB2YXIgZmlyc3QgPSBwb2x5Z29uWzBdLFxuICAgICAgICBsYXN0ID0gcG9seWdvbltwb2x5Z29uLmxlbmd0aCAtIDFdO1xuICAgIHJldHVybiBmaXJzdFswXSA9PT0gbGFzdFswXSAmJiBmaXJzdFsxXSA9PT0gbGFzdFsxXTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHRvcFBvaW50Rmlyc3QobGluZSkge1xuICAgIHJldHVybiBsaW5lWzFdWzFdID4gbGluZVswXVsxXSA/IGxpbmUgOiBbbGluZVsxXSwgbGluZVswXV07XG4gIH1cblxuICBmdW5jdGlvbiBwb2ludExlZnRvZkxpbmUocG9pbnQsIGxpbmUpIHtcbiAgICB2YXIgdCA9IHRvcFBvaW50Rmlyc3QobGluZSk7XG4gICAgcmV0dXJuIGNyb3NzKHBvaW50LCB0WzFdLCB0WzBdKSA8IDA7XG4gIH1cbiAgZnVuY3Rpb24gcG9pbnRSaWdodG9mTGluZShwb2ludCwgbGluZSkge1xuICAgIHZhciB0ID0gdG9wUG9pbnRGaXJzdChsaW5lKTtcbiAgICByZXR1cm4gY3Jvc3MocG9pbnQsIHRbMV0sIHRbMF0pID4gMDtcbiAgfVxuICBmdW5jdGlvbiBwb2ludE9uTGluZShwb2ludCwgbGluZSkge1xuICAgIHZhciBsID0gbGluZUxlbmd0aChsaW5lKTtcbiAgICByZXR1cm4gcG9pbnRXaXRoTGluZShwb2ludCwgbGluZSkgJiYgbGluZUxlbmd0aChbbGluZVswXSwgcG9pbnRdKSA8PSBsICYmIGxpbmVMZW5ndGgoW2xpbmVbMV0sIHBvaW50XSkgPD0gbDtcbiAgfVxuICBmdW5jdGlvbiBwb2ludFdpdGhMaW5lKHBvaW50LCBsaW5lKSB7XG4gICAgcmV0dXJuIGNyb3NzKHBvaW50LCBsaW5lWzBdLCBsaW5lWzFdKSA9PT0gMDtcbiAgfVxuXG4gIC8vIFJldHVybnMgYSBib29sZWFuLlxuXG4gIGZ1bmN0aW9uIGxpbmVJbnRlcnNlY3RzUG9seWdvbihsaW5lLCBwb2x5Z29uKSB7XG4gICAgdmFyIGludGVyc2VjdHMgPSBmYWxzZTtcbiAgICB2YXIgY2xvc2VkID0gY2xvc2UocG9seWdvbik7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdjAgPSBjbG9zZWRbaV0sXG4gICAgICAgICAgdjEgPSBjbG9zZWRbaSArIDFdO1xuXG4gICAgICBpZiAobGluZUludGVyc2VjdHNMaW5lKGxpbmUsIFt2MCwgdjFdKSB8fCBwb2ludE9uTGluZSh2MCwgbGluZSkgJiYgcG9pbnRPbkxpbmUodjEsIGxpbmUpKSB7XG4gICAgICAgIGludGVyc2VjdHMgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJzZWN0cztcbiAgfVxuXG4gIC8vIERldGVybWluZXMgd2hldGhlciBhIHBvaW50IGlzIGluc2lkZSBvZiBhIHBvbHlnb24sIHJlcHJlc2VudGVkIGFzIGFuIGFycmF5IG9mIHZlcnRpY2VzLlxuICAvLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9zdWJzdGFjay9wb2ludC1pbi1wb2x5Z29uL2Jsb2IvbWFzdGVyL2luZGV4LmpzLFxuICAvLyBiYXNlZCBvbiB0aGUgcmF5LWNhc3RpbmcgYWxnb3JpdGhtIGZyb20gaHR0cHM6Ly93ZWIuYXJjaGl2ZS5vcmcvd2ViLzIwMTgwMTE1MTUxNzA1L2h0dHBzOi8vd3JmLmVjc2UucnBpLmVkdS8vUmVzZWFyY2gvU2hvcnRfTm90ZXMvcG5wb2x5Lmh0bWxcbiAgLy8gV2lraXBlZGlhOiBodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9Qb2ludF9pbl9wb2x5Z29uI1JheV9jYXN0aW5nX2FsZ29yaXRobVxuICAvLyBSZXR1cm5zIGEgYm9vbGVhbi5cbiAgZnVuY3Rpb24gcG9pbnRJblBvbHlnb24ocG9pbnQsIHBvbHlnb24pIHtcbiAgICB2YXIgeCA9IHBvaW50WzBdLFxuICAgICAgICB5ID0gcG9pbnRbMV0sXG4gICAgICAgIGluc2lkZSA9IGZhbHNlO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGogPSBwb2x5Z29uLmxlbmd0aCAtIDE7IGkgPCBwb2x5Z29uLmxlbmd0aDsgaiA9IGkrKykge1xuICAgICAgdmFyIHhpID0gcG9seWdvbltpXVswXSxcbiAgICAgICAgICB5aSA9IHBvbHlnb25baV1bMV0sXG4gICAgICAgICAgeGogPSBwb2x5Z29uW2pdWzBdLFxuICAgICAgICAgIHlqID0gcG9seWdvbltqXVsxXTtcblxuICAgICAgaWYgKHlpID4geSAhPSB5aiA+IHkgJiYgeCA8ICh4aiAtIHhpKSAqICh5IC0geWkpIC8gKHlqIC0geWkpICsgeGkpIHtcbiAgICAgICAgaW5zaWRlID0gIWluc2lkZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW5zaWRlO1xuICB9XG5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gcG9pbnRPblBvbHlnb24ocG9pbnQsIHBvbHlnb24pIHtcbiAgICB2YXIgb24gPSBmYWxzZTtcbiAgICB2YXIgY2xvc2VkID0gY2xvc2UocG9seWdvbik7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZiAocG9pbnRPbkxpbmUocG9pbnQsIFtjbG9zZWRbaV0sIGNsb3NlZFtpICsgMV1dKSkge1xuICAgICAgICBvbiA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBvbjtcbiAgfVxuXG4gIC8vIFBvbHlnb25zIGFyZSByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiB2ZXJ0aWNlcywgZWFjaCBvZiB3aGljaCBpcyBhbiBhcnJheSBvZiB0d28gbnVtYmVycyxcbiAgLy8gd2hlcmUgdGhlIGZpcnN0IG51bWJlciByZXByZXNlbnRzIGl0cyB4LWNvb3JkaW5hdGUgYW5kIHRoZSBzZWNvbmQgaXRzIHktY29vcmRpbmF0ZS5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gcG9seWdvbkluUG9seWdvbihwb2x5Z29uQSwgcG9seWdvbkIpIHtcbiAgICB2YXIgaW5zaWRlID0gdHJ1ZTtcbiAgICB2YXIgY2xvc2VkID0gY2xvc2UocG9seWdvbkEpO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjbG9zZWQubGVuZ3RoIC0gMTsgaSA8IGw7IGkrKykge1xuICAgICAgdmFyIHYwID0gY2xvc2VkW2ldOyAvLyBQb2ludHMgdGVzdCAgXG5cbiAgICAgIGlmICghcG9pbnRJblBvbHlnb24odjAsIHBvbHlnb25CKSkge1xuICAgICAgICBpbnNpZGUgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IC8vIExpbmVzIHRlc3RcblxuXG4gICAgICBpZiAobGluZUludGVyc2VjdHNQb2x5Z29uKFt2MCwgY2xvc2VkW2kgKyAxXV0sIHBvbHlnb25CKSkge1xuICAgICAgICBpbnNpZGUgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGluc2lkZTtcbiAgfVxuXG4gIC8vIFBvbHlnb25zIGFyZSByZXByZXNlbnRlZCBhcyBhbiBhcnJheSBvZiB2ZXJ0aWNlcywgZWFjaCBvZiB3aGljaCBpcyBhbiBhcnJheSBvZiB0d28gbnVtYmVycyxcbiAgLy8gd2hlcmUgdGhlIGZpcnN0IG51bWJlciByZXByZXNlbnRzIGl0cyB4LWNvb3JkaW5hdGUgYW5kIHRoZSBzZWNvbmQgaXRzIHktY29vcmRpbmF0ZS5cbiAgLy8gUmV0dXJucyBhIGJvb2xlYW4uXG5cbiAgZnVuY3Rpb24gcG9seWdvbkludGVyc2VjdHNQb2x5Z29uKHBvbHlnb25BLCBwb2x5Z29uQikge1xuICAgIHZhciBpbnRlcnNlY3RzID0gZmFsc2UsXG4gICAgICAgIG9uQ291bnQgPSAwO1xuICAgIHZhciBjbG9zZWQgPSBjbG9zZShwb2x5Z29uQSk7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNsb3NlZC5sZW5ndGggLSAxOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YXIgdjAgPSBjbG9zZWRbaV0sXG4gICAgICAgICAgdjEgPSBjbG9zZWRbaSArIDFdO1xuXG4gICAgICBpZiAobGluZUludGVyc2VjdHNQb2x5Z29uKFt2MCwgdjFdLCBwb2x5Z29uQikpIHtcbiAgICAgICAgaW50ZXJzZWN0cyA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAocG9pbnRPblBvbHlnb24odjAsIHBvbHlnb25CKSkge1xuICAgICAgICArK29uQ291bnQ7XG4gICAgICB9XG5cbiAgICAgIGlmIChvbkNvdW50ID09PSAyKSB7XG4gICAgICAgIGludGVyc2VjdHMgPSB0cnVlO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW50ZXJzZWN0cztcbiAgfVxuXG4gIC8vIFJldHVybnMgdGhlIGFuZ2xlIG9mIHJlZmxlY3Rpb24gZ2l2ZW4gYW4gYW5nbGUgb2YgaW5jaWRlbmNlIGFuZCBhIHN1cmZhY2UgYW5nbGUuXG4gIGZ1bmN0aW9uIGFuZ2xlUmVmbGVjdChpbmNpZGVuY2VBbmdsZSwgc3VyZmFjZUFuZ2xlKSB7XG4gICAgdmFyIGEgPSBzdXJmYWNlQW5nbGUgKiAyIC0gaW5jaWRlbmNlQW5nbGU7XG4gICAgcmV0dXJuIGEgPj0gMzYwID8gYSAtIDM2MCA6IGEgPCAwID8gYSArIDM2MCA6IGE7XG4gIH1cblxuICBleHBvcnRzLmxpbmVBbmdsZSA9IGxpbmVBbmdsZTtcbiAgZXhwb3J0cy5saW5lSW50ZXJwb2xhdGUgPSBsaW5lSW50ZXJwb2xhdGU7XG4gIGV4cG9ydHMubGluZUxlbmd0aCA9IGxpbmVMZW5ndGg7XG4gIGV4cG9ydHMubGluZU1pZHBvaW50ID0gbGluZU1pZHBvaW50O1xuICBleHBvcnRzLnBvaW50Um90YXRlID0gcG9pbnRSb3RhdGU7XG4gIGV4cG9ydHMucG9pbnRUcmFuc2xhdGUgPSBwb2ludFRyYW5zbGF0ZTtcbiAgZXhwb3J0cy5wb2x5Z29uQXJlYSA9IHBvbHlnb25BcmVhO1xuICBleHBvcnRzLnBvbHlnb25Cb3VuZHMgPSBwb2x5Z29uQm91bmRzO1xuICBleHBvcnRzLnBvbHlnb25DZW50cm9pZCA9IHBvbHlnb25DZW50cm9pZDtcbiAgZXhwb3J0cy5wb2x5Z29uSHVsbCA9IHBvbHlnb25IdWxsO1xuICBleHBvcnRzLnBvbHlnb25MZW5ndGggPSBwb2x5Z29uTGVuZ3RoO1xuICBleHBvcnRzLnBvbHlnb25NZWFuID0gcG9seWdvbk1lYW47XG4gIGV4cG9ydHMucG9seWdvblJlZ3VsYXIgPSBwb2x5Z29uUmVndWxhcjtcbiAgZXhwb3J0cy5wb2x5Z29uUm90YXRlID0gcG9seWdvblJvdGF0ZTtcbiAgZXhwb3J0cy5wb2x5Z29uU2NhbGUgPSBwb2x5Z29uU2NhbGU7XG4gIGV4cG9ydHMucG9seWdvblRyYW5zbGF0ZSA9IHBvbHlnb25UcmFuc2xhdGU7XG4gIGV4cG9ydHMubGluZUludGVyc2VjdHNMaW5lID0gbGluZUludGVyc2VjdHNMaW5lO1xuICBleHBvcnRzLmxpbmVJbnRlcnNlY3RzUG9seWdvbiA9IGxpbmVJbnRlcnNlY3RzUG9seWdvbjtcbiAgZXhwb3J0cy5wb2ludEluUG9seWdvbiA9IHBvaW50SW5Qb2x5Z29uO1xuICBleHBvcnRzLnBvaW50T25Qb2x5Z29uID0gcG9pbnRPblBvbHlnb247XG4gIGV4cG9ydHMucG9pbnRMZWZ0b2ZMaW5lID0gcG9pbnRMZWZ0b2ZMaW5lO1xuICBleHBvcnRzLnBvaW50UmlnaHRvZkxpbmUgPSBwb2ludFJpZ2h0b2ZMaW5lO1xuICBleHBvcnRzLnBvaW50T25MaW5lID0gcG9pbnRPbkxpbmU7XG4gIGV4cG9ydHMucG9pbnRXaXRoTGluZSA9IHBvaW50V2l0aExpbmU7XG4gIGV4cG9ydHMucG9seWdvbkluUG9seWdvbiA9IHBvbHlnb25JblBvbHlnb247XG4gIGV4cG9ydHMucG9seWdvbkludGVyc2VjdHNQb2x5Z29uID0gcG9seWdvbkludGVyc2VjdHNQb2x5Z29uO1xuICBleHBvcnRzLmFuZ2xlUmVmbGVjdCA9IGFuZ2xlUmVmbGVjdDtcbiAgZXhwb3J0cy5hbmdsZVRvRGVncmVlcyA9IGFuZ2xlVG9EZWdyZWVzO1xuICBleHBvcnRzLmFuZ2xlVG9SYWRpYW5zID0gYW5nbGVUb1JhZGlhbnM7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbiIsIjtcclxuKGZ1bmN0aW9uICgpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIHJlZ2lzdGVycyB0aGUgZXh0ZW5zaW9uIG9uIGEgY3l0b3NjYXBlIGxpYiByZWZcclxuICB2YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbiAoY3l0b3NjYXBlKSB7XHJcblxyXG4gICAgaWYgKCFjeXRvc2NhcGUpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfSAvLyBjYW4ndCByZWdpc3RlciBpZiBjeXRvc2NhcGUgdW5zcGVjaWZpZWRcclxuXHJcbiAgICB2YXIgb3B0aW9ucyA9IHtcclxuICAgICAgaGlnaGxpZ2h0U3R5bGVzOiBbXSxcclxuICAgICAgc2VsZWN0U3R5bGVzOiB7fSxcclxuICAgICAgc2V0VmlzaWJpbGl0eU9uSGlkZTogZmFsc2UsIC8vIHdoZXRoZXIgdG8gc2V0IHZpc2liaWxpdHkgb24gaGlkZS9zaG93XHJcbiAgICAgIHNldERpc3BsYXlPbkhpZGU6IHRydWUsIC8vIHdoZXRoZXIgdG8gc2V0IGRpc3BsYXkgb24gaGlkZS9zaG93XHJcbiAgICAgIHpvb21BbmltYXRpb25EdXJhdGlvbjogMTUwMCwgLy9kZWZhdWx0IGR1cmF0aW9uIGZvciB6b29tIGFuaW1hdGlvbiBzcGVlZFxyXG4gICAgICBuZWlnaGJvcjogZnVuY3Rpb24gKG5vZGUpIHsgLy8gcmV0dXJuIGRlc2lyZWQgbmVpZ2hib3JzIG9mIHRhcGhlbGQgbm9kZVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgfSxcclxuICAgICAgbmVpZ2hib3JTZWxlY3RUaW1lOiA1MDAsIC8vbXMsIHRpbWUgdG8gdGFwaG9sZCB0byBzZWxlY3QgZGVzaXJlZCBuZWlnaGJvcnNcclxuICAgICAgbGFzc29TdHlsZToge2xpbmVDb2xvcjogXCIjZDY3NjE0XCIsIGxpbmVXaWR0aDogM31cclxuICAgIH07XHJcblxyXG4gICAgdmFyIHVuZG9SZWRvID0gcmVxdWlyZShcIi4vdW5kby1yZWRvXCIpO1xyXG4gICAgdmFyIHZpZXdVdGlsaXRpZXMgPSByZXF1aXJlKFwiLi92aWV3LXV0aWxpdGllc1wiKTtcclxuXHJcbiAgICBjeXRvc2NhcGUoJ2NvcmUnLCAndmlld1V0aWxpdGllcycsIGZ1bmN0aW9uIChvcHRzKSB7XHJcbiAgICAgIHZhciBjeSA9IHRoaXM7XHJcblxyXG4gICAgICBmdW5jdGlvbiBnZXRTY3JhdGNoKGVsZU9yQ3kpIHtcclxuICAgICAgICBpZiAoIWVsZU9yQ3kuc2NyYXRjaChcIl92aWV3VXRpbGl0aWVzXCIpKSB7XHJcbiAgICAgICAgICBlbGVPckN5LnNjcmF0Y2goXCJfdmlld1V0aWxpdGllc1wiLCB7fSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gZWxlT3JDeS5zY3JhdGNoKFwiX3ZpZXdVdGlsaXRpZXNcIik7XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIC8vIElmICdnZXQnIGlzIGdpdmVuIGFzIHRoZSBwYXJhbSB0aGVuIHJldHVybiB0aGUgZXh0ZW5zaW9uIGluc3RhbmNlXHJcbiAgICAgIGlmIChvcHRzID09PSAnZ2V0Jykge1xyXG4gICAgICAgIHJldHVybiBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZTtcclxuICAgICAgfVxyXG4gICAgICBcclxuICAgICAgLyoqXHJcbiAgICAgICogRGVlcCBjb3B5IG9yIG1lcmdlIG9iamVjdHMgLSByZXBsYWNlbWVudCBmb3IgalF1ZXJ5IGRlZXAgZXh0ZW5kXHJcbiAgICAgICogVGFrZW4gZnJvbSBodHRwOi8veW91bWlnaHRub3RuZWVkanF1ZXJ5LmNvbS8jZGVlcF9leHRlbmRcclxuICAgICAgKiBhbmQgYnVnIHJlbGF0ZWQgdG8gZGVlcCBjb3B5IG9mIEFycmF5cyBpcyBmaXhlZC5cclxuICAgICAgKiBVc2FnZTpPYmplY3QuZXh0ZW5kKHt9LCBvYmpBLCBvYmpCKVxyXG4gICAgICAqL1xyXG4gICAgICBmdW5jdGlvbiBleHRlbmRPcHRpb25zKG91dCkge1xyXG4gICAgICAgIG91dCA9IG91dCB8fCB7fTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZhciBvYmogPSBhcmd1bWVudHNbaV07XHJcblxyXG4gICAgICAgICAgaWYgKCFvYmopXHJcbiAgICAgICAgICAgIGNvbnRpbnVlO1xyXG5cclxuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICAgICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqW2tleV0pKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IG9ialtrZXldLnNsaWNlKCk7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdvYmplY3QnKSB7XHJcbiAgICAgICAgICAgICAgICBvdXRba2V5XSA9IGV4dGVuZE9wdGlvbnMob3V0W2tleV0sIG9ialtrZXldKTtcclxuICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgb3V0W2tleV0gPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBvdXQ7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBvcHRpb25zID0gZXh0ZW5kT3B0aW9ucyh7fSwgb3B0aW9ucywgb3B0cyk7XHJcblxyXG4gICAgICAvLyBjcmVhdGUgYSB2aWV3IHV0aWxpdGllcyBpbnN0YW5jZVxyXG4gICAgICB2YXIgaW5zdGFuY2UgPSB2aWV3VXRpbGl0aWVzKGN5LCBvcHRpb25zKTtcclxuXHJcbiAgICAgIGlmIChjeS51bmRvUmVkbykge1xyXG4gICAgICAgIHZhciB1ciA9IGN5LnVuZG9SZWRvKG51bGwsIHRydWUpO1xyXG4gICAgICAgIHVuZG9SZWRvKGN5LCB1ciwgaW5zdGFuY2UpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBzZXQgdGhlIGluc3RhbmNlIG9uIHRoZSBzY3JhdGNoIHBhZFxyXG4gICAgICBnZXRTY3JhdGNoKGN5KS5pbnN0YW5jZSA9IGluc3RhbmNlO1xyXG5cclxuICAgICAgaWYgKCFnZXRTY3JhdGNoKGN5KS5pbml0aWFsaXplZCkge1xyXG4gICAgICAgIGdldFNjcmF0Y2goY3kpLmluaXRpYWxpemVkID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5dXAnLCBmdW5jdGlvbihldmVudCl7XHJcbiAgICAgICAgICBpZihldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgICAgIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIC8vU2VsZWN0IHRoZSBkZXNpcmVkIG5laWdoYm9ycyBhZnRlciB0YXBob2xkLWFuZC1mcmVlXHJcbiAgICAgICAgY3kub24oJ3RhcGhvbGQnLCAnbm9kZScsIGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgICAgIHZhciB0YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuY3lUYXJnZXQ7XHJcbiAgICAgICAgICB2YXIgdGFwaGVsZCA9IGZhbHNlO1xyXG4gICAgICAgICAgdmFyIG5laWdoYm9yaG9vZDtcclxuICAgICAgICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBpZihzaGlmdEtleURvd24pe1xyXG4gICAgICAgICAgICAgIGN5LmVsZW1lbnRzKCkudW5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICBuZWlnaGJvcmhvb2QgPSBvcHRpb25zLm5laWdoYm9yKHRhcmdldCk7XHJcbiAgICAgICAgICAgICAgaWYobmVpZ2hib3Job29kKVxyXG4gICAgICAgICAgICAgICAgbmVpZ2hib3Job29kLnNlbGVjdCgpO1xyXG4gICAgICAgICAgICAgIHRhcmdldC5sb2NrKCk7XHJcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0sIG9wdGlvbnMubmVpZ2hib3JTZWxlY3RUaW1lIC0gNTAwKTtcclxuICAgICAgICAgIGN5Lm9uKCdmcmVlJywgJ25vZGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICB2YXIgdGFyZ2V0VGFwaGVsZCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5jeVRhcmdldDtcclxuICAgICAgICAgICAgaWYodGFyZ2V0ID09IHRhcmdldFRhcGhlbGQgJiYgdGFwaGVsZCA9PT0gdHJ1ZSl7XHJcbiAgICAgICAgICAgICAgdGFwaGVsZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgIGlmKG5laWdoYm9yaG9vZClcclxuICAgICAgICAgICAgICAgIG5laWdoYm9yaG9vZC5zZWxlY3QoKTtcclxuICAgICAgICAgICAgICB0YXJnZXQudW5sb2NrKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgY3kub24oJ2RyYWcnLCAnbm9kZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIHZhciB0YXJnZXREcmFnZ2VkID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LmN5VGFyZ2V0O1xyXG4gICAgICAgICAgICBpZih0YXJnZXQgPT0gdGFyZ2V0RHJhZ2dlZCAmJiB0YXBoZWxkID09PSBmYWxzZSl7XHJcbiAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgIH0pO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyByZXR1cm4gdGhlIGluc3RhbmNlIG9mIGV4dGVuc2lvblxyXG4gICAgICByZXR1cm4gZ2V0U2NyYXRjaChjeSkuaW5zdGFuY2U7XHJcbiAgICB9KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7IC8vIGV4cG9zZSBhcyBhIGNvbW1vbmpzIG1vZHVsZVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByZWdpc3RlcjtcclxuICB9XHJcblxyXG4gIGlmICh0eXBlb2YgZGVmaW5lICE9PSAndW5kZWZpbmVkJyAmJiBkZWZpbmUuYW1kKSB7IC8vIGV4cG9zZSBhcyBhbiBhbWQvcmVxdWlyZWpzIG1vZHVsZVxyXG4gICAgZGVmaW5lKCdjeXRvc2NhcGUtdmlldy11dGlsaXRpZXMnLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHJldHVybiByZWdpc3RlcjtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBjeXRvc2NhcGUgIT09ICd1bmRlZmluZWQnKSB7IC8vIGV4cG9zZSB0byBnbG9iYWwgY3l0b3NjYXBlIChpLmUuIHdpbmRvdy5jeXRvc2NhcGUpXHJcbiAgICByZWdpc3RlcihjeXRvc2NhcGUpO1xyXG4gIH1cclxuXHJcbn0pKCk7XHJcbiIsIi8vIFJlZ2lzdGVycyB1ciBhY3Rpb25zIHJlbGF0ZWQgdG8gaGlnaGxpZ2h0XHJcbmZ1bmN0aW9uIGhpZ2hsaWdodFVSKGN5LCB1ciwgdmlld1V0aWxpdGllcykge1xyXG4gIGZ1bmN0aW9uIGdldFN0YXR1cyhlbGVzKSB7XHJcbiAgICBlbGVzID0gZWxlcyA/IGVsZXMgOiBjeS5lbGVtZW50cygpO1xyXG4gICAgdmFyIGNsYXNzZXMgPSB2aWV3VXRpbGl0aWVzLmdldEFsbEhpZ2hsaWdodENsYXNzZXMoKTtcclxuICAgIHZhciByID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNsYXNzZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgci5wdXNoKGVsZXMuZmlsdGVyKGAuJHtjbGFzc2VzW2ldfTp2aXNpYmxlYCkpXHJcbiAgICB9XHJcbiAgICB2YXIgc2VsZWN0b3IgPSBjbGFzc2VzLm1hcCh4ID0+ICcuJyArIHgpLmpvaW4oJywnKTtcclxuICAgIC8vIGxhc3QgZWxlbWVudCBvZiBhcnJheSBpcyBlbGVtZW50cyB3aGljaCBhcmUgbm90IGhpZ2hsaWdodGVkIGJ5IGFueSBzdHlsZVxyXG4gICAgci5wdXNoKGVsZXMuZmlsdGVyKFwiOnZpc2libGVcIikubm90KHNlbGVjdG9yKSk7XHJcbiAgICBcclxuICAgIHJldHVybiByO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2VuZXJhbFVuZG8oYXJncykge1xyXG4gICAgdmFyIGN1cnJlbnQgPSBhcmdzLmN1cnJlbnQ7XHJcbiAgICB2YXIgciA9IFtdO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmdzLmxlbmd0aCAtIDE7IGkrKykge1xyXG4gICAgICByLnB1c2godmlld1V0aWxpdGllcy5oaWdobGlnaHQoYXJnc1tpXSwgaSkpO1xyXG4gICAgfVxyXG4gICAgLy8gbGFzdCBlbGVtZW50IGlzIGZvciBub3QgaGlnaGxpZ2h0ZWQgYnkgYW55IHN0eWxlXHJcbiAgICByLnB1c2godmlld1V0aWxpdGllcy5yZW1vdmVIaWdobGlnaHRzKGFyZ3NbYXJncy5sZW5ndGggLSAxXSkpO1xyXG5cclxuICAgIHJbJ2N1cnJlbnQnXSA9IGN1cnJlbnQ7XHJcbiAgICByZXR1cm4gcjtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIGdlbmVyYWxSZWRvKGFyZ3MpIHtcclxuICAgIHZhciBjdXJyZW50ID0gYXJncy5jdXJyZW50O1xyXG4gICAgdmFyIHIgPSBbXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY3VycmVudC5sZW5ndGggLSAxOyBpKyspIHtcclxuICAgICAgci5wdXNoKHZpZXdVdGlsaXRpZXMuaGlnaGxpZ2h0KGN1cnJlbnRbaV0sIGkpKTtcclxuICAgIH1cclxuICAgIC8vIGxhc3QgZWxlbWVudCBpcyBmb3Igbm90IGhpZ2hsaWdodGVkIGJ5IGFueSBzdHlsZVxyXG4gICAgci5wdXNoKHZpZXdVdGlsaXRpZXMucmVtb3ZlSGlnaGxpZ2h0cyhjdXJyZW50W2N1cnJlbnQubGVuZ3RoIC0gMV0pKTtcclxuXHJcbiAgICByWydjdXJyZW50J10gPSBjdXJyZW50O1xyXG4gICAgcmV0dXJuIHI7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBnZW5lcmF0ZURvRnVuYyhmdW5jKSB7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGFyZ3MpIHtcclxuICAgICAgdmFyIHJlcyA9IGdldFN0YXR1cygpO1xyXG4gICAgICBpZiAoYXJncy5maXJzdFRpbWUpXHJcbiAgICAgICAgdmlld1V0aWxpdGllc1tmdW5jXShhcmdzLmVsZXMsIGFyZ3MuaWR4KTtcclxuICAgICAgZWxzZVxyXG4gICAgICAgIGdlbmVyYWxSZWRvKGFyZ3MpO1xyXG5cclxuICAgICAgcmVzLmN1cnJlbnQgPSBnZXRTdGF0dXMoKTtcclxuXHJcbiAgICAgIHJldHVybiByZXM7XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0TmVpZ2hib3JzXCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwiaGlnaGxpZ2h0XCIsIGdlbmVyYXRlRG9GdW5jKFwiaGlnaGxpZ2h0XCIpLCBnZW5lcmFsVW5kbyk7XHJcbiAgdXIuYWN0aW9uKFwicmVtb3ZlSGlnaGxpZ2h0c1wiLCBnZW5lcmF0ZURvRnVuYyhcInJlbW92ZUhpZ2hsaWdodHNcIiksIGdlbmVyYWxVbmRvKTtcclxufVxyXG5cclxuLy8gUmVnaXN0ZXJzIHVyIGFjdGlvbnMgcmVsYXRlZCB0byBoaWRlL3Nob3dcclxuZnVuY3Rpb24gaGlkZVNob3dVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBmdW5jdGlvbiB1clNob3coZWxlcykge1xyXG4gICAgcmV0dXJuIHZpZXdVdGlsaXRpZXMuc2hvdyhlbGVzKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVySGlkZShlbGVzKSB7XHJcbiAgICByZXR1cm4gdmlld1V0aWxpdGllcy5oaWRlKGVsZXMpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdXJTaG93SGlkZGVuTmVpZ2hib3JzKGVsZXMpIHtcclxuICAgIHJldHVybiB2aWV3VXRpbGl0aWVzLnNob3dIaWRkZW5OZWlnaGJvcnMoZWxlcyk7XHJcbiAgfVxyXG5cclxuICB1ci5hY3Rpb24oXCJzaG93XCIsIHVyU2hvdywgdXJIaWRlKTtcclxuICB1ci5hY3Rpb24oXCJoaWRlXCIsIHVySGlkZSwgdXJTaG93KTtcclxuICB1ci5hY3Rpb24oXCJzaG93SGlkZGVuTmVpZ2hib3JzXCIsdXJTaG93SGlkZGVuTmVpZ2hib3JzLCB1ckhpZGUpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjeSwgdXIsIHZpZXdVdGlsaXRpZXMpIHtcclxuICBoaWdobGlnaHRVUihjeSwgdXIsIHZpZXdVdGlsaXRpZXMpO1xyXG4gIGhpZGVTaG93VVIoY3ksIHVyLCB2aWV3VXRpbGl0aWVzKTtcclxufTtcclxuIiwidmFyIHZpZXdVdGlsaXRpZXMgPSBmdW5jdGlvbiAoY3ksIG9wdGlvbnMpIHtcclxuXHJcbiAgdmFyIGNsYXNzTmFtZXM0U3R5bGVzID0gW107XHJcbiAgLy8gZ2l2ZSBhIHVuaXF1ZSBuYW1lIGZvciBlYWNoIHVuaXF1ZSBzdHlsZSBFVkVSIGFkZGVkXHJcbiAgdmFyIHRvdFN0eWxlQ250ID0gMDtcclxuICB2YXIgbWFycXVlZVpvb21FbmFibGVkID0gZmFsc2U7XHJcbiAgdmFyIHNoaWZ0S2V5RG93biA9IGZhbHNlO1xyXG4gIHZhciBjdHJsS2V5RG93biA9IGZhbHNlO1xyXG4gIGluaXQoKTtcclxuICBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgLy8gYWRkIHByb3ZpZGVkIHN0eWxlc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICB2YXIgcyA9ICdfX2hpZ2hsaWd0aWdodGVkX18nICsgdG90U3R5bGVDbnQ7XHJcbiAgICAgIGNsYXNzTmFtZXM0U3R5bGVzLnB1c2gocyk7XHJcbiAgICAgIHRvdFN0eWxlQ250Kys7XHJcbiAgICAgIHVwZGF0ZUN5U3R5bGUoaSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYWRkIHN0eWxlcyBmb3Igc2VsZWN0ZWRcclxuICAgIGFkZFNlbGVjdGlvblN0eWxlcygpO1xyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgIGlmIChldmVudC5rZXkgIT0gXCJDb250cm9sXCIgJiYgZXZlbnQua2V5ICE9IFwiU2hpZnRcIiAmJiBldmVudC5rZXkgIT0gXCJNZXRhXCIpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgXHJcbiAgICAgIGlmIChldmVudC5rZXkgPT0gXCJDb250cm9sXCIgfHwgZXZlbnQua2V5ID09IFwiTWV0YVwiKSB7XHJcbiAgICAgICAgY3RybEtleURvd24gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYgKGV2ZW50LmtleSA9PSBcIlNoaWZ0XCIpIHtcclxuICAgICAgICBzaGlmdEtleURvd24gPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChjdHJsS2V5RG93biAmJiBzaGlmdEtleURvd24gJiYgIW1hcnF1ZWVab29tRW5hYmxlZCkge1xyXG4gICAgICAgIGluc3RhbmNlLmVuYWJsZU1hcnF1ZWVab29tKCk7XHJcbiAgICAgICAgbWFycXVlZVpvb21FbmFibGVkID0gdHJ1ZTtcclxuICAgICAgfVxyXG4gICAgfSk7IFxyXG5cclxuICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXl1cFwiLCBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICBpZiAoZXZlbnQua2V5ICE9IFwiQ29udHJvbFwiICYmIGV2ZW50LmtleSAhPSBcIlNoaWZ0XCIgJiYgZXZlbnQua2V5ICE9IFwiTWV0YVwiKSB7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChldmVudC5rZXkgPT0gXCJTaGlmdFwiKSB7XHJcbiAgICAgICAgc2hpZnRLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSBpZiAoZXZlbnQua2V5ID09IFwiQ29udHJvbFwiIHx8IGV2ZW50LmtleSA9PSBcIk1ldGFcIikge1xyXG4gICAgICAgIGN0cmxLZXlEb3duID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgICAgaWYgKG1hcnF1ZWVab29tRW5hYmxlZCAmJiAoIXNoaWZ0S2V5RG93biB8fCAhY3RybEtleURvd24pKSB7XHJcbiAgICAgICAgaW5zdGFuY2UuZGlzYWJsZU1hcnF1ZWVab29tKCk7XHJcbiAgICAgICAgbWFycXVlZVpvb21FbmFibGVkID0gZmFsc2U7XHJcbiAgICAgIH1cclxuICAgIH0pOyBcclxuXHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBhZGRTZWxlY3Rpb25TdHlsZXMoKSB7XHJcbiAgICBpZiAob3B0aW9ucy5zZWxlY3RTdHlsZXMubm9kZSkge1xyXG4gICAgICBjeS5zdHlsZSgpLnNlbGVjdG9yKCdub2RlOnNlbGVjdGVkJykuY3NzKG9wdGlvbnMuc2VsZWN0U3R5bGVzLm5vZGUpLnVwZGF0ZSgpO1xyXG4gICAgfVxyXG4gICAgaWYgKG9wdGlvbnMuc2VsZWN0U3R5bGVzLmVkZ2UpIHtcclxuICAgICAgY3kuc3R5bGUoKS5zZWxlY3RvcignZWRnZTpzZWxlY3RlZCcpLmNzcyhvcHRpb25zLnNlbGVjdFN0eWxlcy5lZGdlKS51cGRhdGUoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZUN5U3R5bGUoY2xhc3NJZHgpIHtcclxuICAgIHZhciBjbGFzc05hbWUgPSBjbGFzc05hbWVzNFN0eWxlc1tjbGFzc0lkeF07XHJcbiAgICB2YXIgY3NzTm9kZSA9IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzW2NsYXNzSWR4XS5ub2RlO1xyXG4gICAgdmFyIGNzc0VkZ2UgPSBvcHRpb25zLmhpZ2hsaWdodFN0eWxlc1tjbGFzc0lkeF0uZWRnZTtcclxuICAgIGN5LnN0eWxlKCkuc2VsZWN0b3IoJ25vZGUuJyArIGNsYXNzTmFtZSkuY3NzKGNzc05vZGUpLnVwZGF0ZSgpO1xyXG4gICAgY3kuc3R5bGUoKS5zZWxlY3RvcignZWRnZS4nICsgY2xhc3NOYW1lKS5jc3MoY3NzRWRnZSkudXBkYXRlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBIZWxwZXIgZnVuY3Rpb25zIGZvciBpbnRlcm5hbCB1c2FnZSAobm90IHRvIGJlIGV4cG9zZWQpXHJcbiAgZnVuY3Rpb24gaGlnaGxpZ2h0KGVsZXMsIGlkeCkge1xyXG4gICAgY3kuc3RhcnRCYXRjaCgpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBlbGVzLnJlbW92ZUNsYXNzKGNsYXNzTmFtZXM0U3R5bGVzW2ldKTtcclxuICAgIH1cclxuICAgIGVsZXMuYWRkQ2xhc3MoY2xhc3NOYW1lczRTdHlsZXNbaWR4XSk7XHJcbiAgICBlbGVzLnVuc2VsZWN0KCk7XHJcbiAgICBjeS5lbmRCYXRjaCgpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSB7XHJcbiAgICByZXR1cm4gZWxlcy5hZGQoZWxlcy5kZXNjZW5kYW50cygpKS5jbG9zZWROZWlnaGJvcmhvb2QoKTtcclxuICB9XHJcbiAgLy8gdGhlIGluc3RhbmNlIHRvIGJlIHJldHVybmVkXHJcbiAgdmFyIGluc3RhbmNlID0ge307XHJcblxyXG4gIC8vIFNlY3Rpb24gaGlkZS1zaG93XHJcbiAgLy8gaGlkZSBnaXZlbiBlbGVzXHJcbiAgaW5zdGFuY2UuaGlkZSA9IGZ1bmN0aW9uIChlbGVzKSB7XHJcbiAgICAvL2VsZXMgPSBlbGVzLmZpbHRlcihcIm5vZGVcIilcclxuICAgIGVsZXMgPSBlbGVzLmZpbHRlcihcIjp2aXNpYmxlXCIpO1xyXG4gICAgZWxlcyA9IGVsZXMudW5pb24oZWxlcy5jb25uZWN0ZWRFZGdlcygpKTtcclxuXHJcbiAgICBlbGVzLnVuc2VsZWN0KCk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xyXG4gICAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAob3B0aW9ucy5zZXREaXNwbGF5T25IaWRlKSB7XHJcbiAgICAgIGVsZXMuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvLyB1bmhpZGUgZ2l2ZW4gZWxlc1xyXG4gIGluc3RhbmNlLnNob3cgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgZWxlcyA9IGVsZXMubm90KFwiOnZpc2libGVcIik7XHJcblxyXG4gICAgdmFyIGNvbm5lY3RlZEVkZ2VzID0gZWxlcy5jb25uZWN0ZWRFZGdlcyhmdW5jdGlvbiAoZWRnZSkge1xyXG5cclxuICAgICAgaWYgKChlZGdlLnNvdXJjZSgpLnZpc2libGUoKSB8fCBlbGVzLmNvbnRhaW5zKGVkZ2Uuc291cmNlKCkpKSAmJiAoZWRnZS50YXJnZXQoKS52aXNpYmxlKCkgfHwgZWxlcy5jb250YWlucyhlZGdlLnRhcmdldCgpKSkpIHtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIH1cclxuXHJcbiAgICB9KTtcclxuICAgIGVsZXMgPSBlbGVzLnVuaW9uKGNvbm5lY3RlZEVkZ2VzKTtcclxuXHJcbiAgICBlbGVzLnVuc2VsZWN0KCk7XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2V0VmlzaWJpbGl0eU9uSGlkZSkge1xyXG4gICAgICBlbGVzLmNzcygndmlzaWJpbGl0eScsICd2aXNpYmxlJyk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKG9wdGlvbnMuc2V0RGlzcGxheU9uSGlkZSkge1xyXG4gICAgICBlbGVzLmNzcygnZGlzcGxheScsICdlbGVtZW50Jyk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gU2VjdGlvbiBoaWdobGlnaHRcclxuICBpbnN0YW5jZS5zaG93SGlkZGVuTmVpZ2hib3JzID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIHJldHVybiB0aGlzLnNob3coZ2V0V2l0aE5laWdoYm9ycyhlbGVzKSk7XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlnaGxpZ2h0cyBlbGVzXHJcbiAgaW5zdGFuY2UuaGlnaGxpZ2h0ID0gZnVuY3Rpb24gKGVsZXMsIGlkeCA9IDApIHtcclxuICAgIGhpZ2hsaWdodChlbGVzLCBpZHgpOyAvLyBVc2UgdGhlIGhlbHBlciBoZXJlXHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5nZXRIaWdobGlnaHRTdHlsZXMgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICByZXR1cm4gb3B0aW9ucy5oaWdobGlnaHRTdHlsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gSGlnaGxpZ2h0cyBlbGVzJyBuZWlnaGJvcmhvb2RcclxuICBpbnN0YW5jZS5oaWdobGlnaHROZWlnaGJvcnMgPSBmdW5jdGlvbiAoZWxlcywgaWR4ID0gMCkge1xyXG4gICAgcmV0dXJuIHRoaXMuaGlnaGxpZ2h0KGdldFdpdGhOZWlnaGJvcnMoZWxlcyksIGlkeCk7XHJcbiAgfTtcclxuXHJcbiAgLy8gUmVtb3ZlIGhpZ2hsaWdodHMgZnJvbSBlbGVzLlxyXG4gIC8vIElmIGVsZXMgaXMgbm90IGRlZmluZWQgY29uc2lkZXJzIGN5LmVsZW1lbnRzKClcclxuICBpbnN0YW5jZS5yZW1vdmVIaWdobGlnaHRzID0gZnVuY3Rpb24gKGVsZXMpIHtcclxuICAgIGN5LnN0YXJ0QmF0Y2goKTtcclxuICAgIGlmIChlbGVzID09IG51bGwgfHwgZWxlcy5sZW5ndGggPT0gbnVsbCkge1xyXG4gICAgICBlbGVzID0gY3kuZWxlbWVudHMoKTtcclxuICAgIH1cclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgZWxlcy5yZW1vdmVDbGFzcyhjbGFzc05hbWVzNFN0eWxlc1tpXSk7XHJcbiAgICB9XHJcbiAgICBjeS5lbmRCYXRjaCgpO1xyXG4gICAgcmV0dXJuIGVsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy8gSW5kaWNhdGVzIGlmIHRoZSBlbGUgaXMgaGlnaGxpZ2h0ZWRcclxuICBpbnN0YW5jZS5pc0hpZ2hsaWdodGVkID0gZnVuY3Rpb24gKGVsZSkge1xyXG4gICAgdmFyIGlzSGlnaCA9IGZhbHNlO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcHRpb25zLmhpZ2hsaWdodFN0eWxlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICBpZiAoZWxlLmlzKCcuJyArIGNsYXNzTmFtZXM0U3R5bGVzW2ldICsgJzp2aXNpYmxlJykpIHtcclxuICAgICAgICBpc0hpZ2ggPSB0cnVlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gaXNIaWdoO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmNoYW5nZUhpZ2hsaWdodFN0eWxlID0gZnVuY3Rpb24gKGlkeCwgbm9kZVN0eWxlLCBlZGdlU3R5bGUpIHtcclxuICAgIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzW2lkeF0ubm9kZSA9IG5vZGVTdHlsZTtcclxuICAgIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzW2lkeF0uZWRnZSA9IGVkZ2VTdHlsZTtcclxuICAgIHVwZGF0ZUN5U3R5bGUoaWR4KTtcclxuICAgIGFkZFNlbGVjdGlvblN0eWxlcygpO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmFkZEhpZ2hsaWdodFN0eWxlID0gZnVuY3Rpb24gKG5vZGVTdHlsZSwgZWRnZVN0eWxlKSB7XHJcbiAgICB2YXIgbyA9IHsgbm9kZTogbm9kZVN0eWxlLCBlZGdlOiBlZGdlU3R5bGUgfTtcclxuICAgIG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLnB1c2gobyk7XHJcbiAgICB2YXIgcyA9ICdfX2hpZ2hsaWd0aWdodGVkX18nICsgdG90U3R5bGVDbnQ7XHJcbiAgICBjbGFzc05hbWVzNFN0eWxlcy5wdXNoKHMpO1xyXG4gICAgdG90U3R5bGVDbnQrKztcclxuICAgIHVwZGF0ZUN5U3R5bGUob3B0aW9ucy5oaWdobGlnaHRTdHlsZXMubGVuZ3RoIC0gMSk7XHJcbiAgICBhZGRTZWxlY3Rpb25TdHlsZXMoKTtcclxuICB9O1xyXG5cclxuICBpbnN0YW5jZS5yZW1vdmVIaWdobGlnaHRTdHlsZSA9IGZ1bmN0aW9uIChzdHlsZUlkeCkge1xyXG4gICAgaWYgKHN0eWxlSWR4IDwgMCB8fCBzdHlsZUlkeCA+IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aCAtIDEpIHtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgY3kuZWxlbWVudHMoKS5yZW1vdmVDbGFzcyhjbGFzc05hbWVzNFN0eWxlc1tzdHlsZUlkeF0pO1xyXG4gICAgb3B0aW9ucy5oaWdobGlnaHRTdHlsZXMuc3BsaWNlKHN0eWxlSWR4LCAxKTtcclxuICAgIGNsYXNzTmFtZXM0U3R5bGVzLnNwbGljZShzdHlsZUlkeCwgMSk7XHJcbiAgfTtcclxuXHJcbiAgaW5zdGFuY2UuZ2V0QWxsSGlnaGxpZ2h0Q2xhc3NlcyA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gW107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wdGlvbnMuaGlnaGxpZ2h0U3R5bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGEucHVzaChjbGFzc05hbWVzNFN0eWxlc1tpXSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gY2xhc3NOYW1lczRTdHlsZXM7XHJcbiAgfTtcclxuXHJcbiAgLy9ab29tIHNlbGVjdGVkIE5vZGVzXHJcbiAgaW5zdGFuY2Uuem9vbVRvU2VsZWN0ZWQgPSBmdW5jdGlvbiAoZWxlcykge1xyXG4gICAgdmFyIGJvdW5kaW5nQm94ID0gZWxlcy5ib3VuZGluZ0JveCgpO1xyXG4gICAgdmFyIGRpZmZfeCA9IE1hdGguYWJzKGJvdW5kaW5nQm94LngxIC0gYm91bmRpbmdCb3gueDIpO1xyXG4gICAgdmFyIGRpZmZfeSA9IE1hdGguYWJzKGJvdW5kaW5nQm94LnkxIC0gYm91bmRpbmdCb3gueTIpO1xyXG4gICAgdmFyIHBhZGRpbmc7XHJcbiAgICBpZiAoZGlmZl94ID49IDIwMCB8fCBkaWZmX3kgPj0gMjAwKSB7XHJcbiAgICAgIHBhZGRpbmcgPSA1MDtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBwYWRkaW5nID0gKGN5LndpZHRoKCkgPCBjeS5oZWlnaHQoKSkgP1xyXG4gICAgICAgICgoMjAwIC0gZGlmZl94KSAvIDIgKiBjeS53aWR0aCgpIC8gMjAwKSA6ICgoMjAwIC0gZGlmZl95KSAvIDIgKiBjeS5oZWlnaHQoKSAvIDIwMCk7XHJcbiAgICB9XHJcblxyXG4gICAgY3kuYW5pbWF0ZSh7XHJcbiAgICAgIGZpdDoge1xyXG4gICAgICAgIGVsZXM6IGVsZXMsXHJcbiAgICAgICAgcGFkZGluZzogcGFkZGluZ1xyXG4gICAgICB9XHJcbiAgICB9LCB7XHJcbiAgICAgIGR1cmF0aW9uOiBvcHRpb25zLnpvb21BbmltYXRpb25EdXJhdGlvblxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gZWxlcztcclxuICB9O1xyXG5cclxuICAvL01hcnF1ZWUgWm9vbVxyXG4gIHZhciB0YWJTdGFydEhhbmRsZXI7XHJcbiAgdmFyIHRhYkVuZEhhbmRsZXI7XHJcblxyXG4gIGluc3RhbmNlLmVuYWJsZU1hcnF1ZWVab29tID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSB0cnVlO1xyXG4gICAgdmFyIHJlY3Rfc3RhcnRfcG9zX3gsIHJlY3Rfc3RhcnRfcG9zX3ksIHJlY3RfZW5kX3Bvc194LCByZWN0X2VuZF9wb3NfeTtcclxuICAgIC8vTWFrZSB0aGUgY3kgdW5zZWxlY3RhYmxlXHJcbiAgICBjeS5hdXRvdW5zZWxlY3RpZnkodHJ1ZSk7XHJcblxyXG4gICAgY3kub25lKCd0YXBzdGFydCcsIHRhYlN0YXJ0SGFuZGxlciA9IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICBpZiAoc2hpZnRLZXlEb3duID09IHRydWUpIHtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194ID0gZXZlbnQucG9zaXRpb24ueDtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc195ID0gZXZlbnQucG9zaXRpb24ueTtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCA9IHVuZGVmaW5lZDtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjeS5vbmUoJ3RhcGVuZCcsIHRhYkVuZEhhbmRsZXIgPSBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgcmVjdF9lbmRfcG9zX3ggPSBldmVudC5wb3NpdGlvbi54O1xyXG4gICAgICByZWN0X2VuZF9wb3NfeSA9IGV2ZW50LnBvc2l0aW9uLnk7XHJcbiAgICAgIC8vY2hlY2sgd2hldGhlciBjb3JuZXJzIG9mIHJlY3RhbmdsZSBpcyB1bmRlZmluZWRcclxuICAgICAgLy9hYm9ydCBtYXJxdWVlIHpvb20gaWYgb25lIGNvcm5lciBpcyB1bmRlZmluZWRcclxuICAgICAgaWYgKHJlY3Rfc3RhcnRfcG9zX3ggPT0gdW5kZWZpbmVkIHx8IHJlY3RfZW5kX3Bvc194ID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgLy9SZW9kZXIgcmVjdGFuZ2xlIHBvc2l0aW9uc1xyXG4gICAgICAvL1RvcCBsZWZ0IG9mIHRoZSByZWN0YW5nbGUgKHJlY3Rfc3RhcnRfcG9zX3gsIHJlY3Rfc3RhcnRfcG9zX3kpXHJcbiAgICAgIC8vcmlnaHQgYm90dG9tIG9mIHRoZSByZWN0YW5nbGUgKHJlY3RfZW5kX3Bvc194LCByZWN0X2VuZF9wb3NfeSlcclxuICAgICAgaWYgKHJlY3Rfc3RhcnRfcG9zX3ggPiByZWN0X2VuZF9wb3NfeCkge1xyXG4gICAgICAgIHZhciB0ZW1wID0gcmVjdF9zdGFydF9wb3NfeDtcclxuICAgICAgICByZWN0X3N0YXJ0X3Bvc194ID0gcmVjdF9lbmRfcG9zX3g7XHJcbiAgICAgICAgcmVjdF9lbmRfcG9zX3ggPSB0ZW1wO1xyXG4gICAgICB9XHJcbiAgICAgIGlmIChyZWN0X3N0YXJ0X3Bvc195ID4gcmVjdF9lbmRfcG9zX3kpIHtcclxuICAgICAgICB2YXIgdGVtcCA9IHJlY3Rfc3RhcnRfcG9zX3k7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSA9IHJlY3RfZW5kX3Bvc195O1xyXG4gICAgICAgIHJlY3RfZW5kX3Bvc195ID0gdGVtcDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9FeHRlbmQgc2lkZXMgb2Ygc2VsZWN0ZWQgcmVjdGFuZ2xlIHRvIDIwMHB4IGlmIGxlc3MgdGhhbiAxMDBweFxyXG4gICAgICBpZiAocmVjdF9lbmRfcG9zX3ggLSByZWN0X3N0YXJ0X3Bvc194IDwgMjAwKSB7XHJcbiAgICAgICAgdmFyIGV4dGVuZFB4ID0gKDIwMCAtIChyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3gpKSAvIDI7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeCAtPSBleHRlbmRQeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeCArPSBleHRlbmRQeDtcclxuICAgICAgfVxyXG4gICAgICBpZiAocmVjdF9lbmRfcG9zX3kgLSByZWN0X3N0YXJ0X3Bvc195IDwgMjAwKSB7XHJcbiAgICAgICAgdmFyIGV4dGVuZFB4ID0gKDIwMCAtIChyZWN0X2VuZF9wb3NfeSAtIHJlY3Rfc3RhcnRfcG9zX3kpKSAvIDI7XHJcbiAgICAgICAgcmVjdF9zdGFydF9wb3NfeSAtPSBleHRlbmRQeDtcclxuICAgICAgICByZWN0X2VuZF9wb3NfeSArPSBleHRlbmRQeDtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9DaGVjayB3aGV0aGVyIHJlY3RhbmdsZSBpbnRlcnNlY3RzIHdpdGggYm91bmRpbmcgYm94IG9mIHRoZSBncmFwaFxyXG4gICAgICAvL2lmIG5vdCBhYm9ydCBtYXJxdWVlIHpvb21cclxuICAgICAgaWYgKChyZWN0X3N0YXJ0X3Bvc194ID4gY3kuZWxlbWVudHMoKS5ib3VuZGluZ0JveCgpLngyKVxyXG4gICAgICAgIHx8IChyZWN0X2VuZF9wb3NfeCA8IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS54MSlcclxuICAgICAgICB8fCAocmVjdF9zdGFydF9wb3NfeSA+IGN5LmVsZW1lbnRzKCkuYm91bmRpbmdCb3goKS55MilcclxuICAgICAgICB8fCAocmVjdF9lbmRfcG9zX3kgPCBjeS5lbGVtZW50cygpLmJvdW5kaW5nQm94KCkueTEpKSB7XHJcbiAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybjtcclxuICAgICAgfVxyXG5cclxuICAgICAgLy9DYWxjdWxhdGUgem9vbSBsZXZlbFxyXG4gICAgICB2YXIgem9vbUxldmVsID0gTWF0aC5taW4oY3kud2lkdGgoKSAvIChNYXRoLmFicyhyZWN0X2VuZF9wb3NfeCAtIHJlY3Rfc3RhcnRfcG9zX3gpKSxcclxuICAgICAgICBjeS5oZWlnaHQoKSAvIE1hdGguYWJzKHJlY3RfZW5kX3Bvc195IC0gcmVjdF9zdGFydF9wb3NfeSkpO1xyXG5cclxuICAgICAgdmFyIGRpZmZfeCA9IGN5LndpZHRoKCkgLyAyIC0gKGN5LnBhbigpLnggKyB6b29tTGV2ZWwgKiAocmVjdF9zdGFydF9wb3NfeCArIHJlY3RfZW5kX3Bvc194KSAvIDIpO1xyXG4gICAgICB2YXIgZGlmZl95ID0gY3kuaGVpZ2h0KCkgLyAyIC0gKGN5LnBhbigpLnkgKyB6b29tTGV2ZWwgKiAocmVjdF9zdGFydF9wb3NfeSArIHJlY3RfZW5kX3Bvc195KSAvIDIpO1xyXG5cclxuICAgICAgY3kuYW5pbWF0ZSh7XHJcbiAgICAgICAgcGFuQnk6IHsgeDogZGlmZl94LCB5OiBkaWZmX3kgfSxcclxuICAgICAgICB6b29tOiB6b29tTGV2ZWwsXHJcbiAgICAgICAgZHVyYXRpb246IG9wdGlvbnMuem9vbUFuaW1hdGlvbkR1cmF0aW9uLFxyXG4gICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGluc3RhbmNlLmRpc2FibGVNYXJxdWVlWm9vbSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIGN5Lm9mZigndGFwc3RhcnQnLCB0YWJTdGFydEhhbmRsZXIpO1xyXG4gICAgY3kub2ZmKCd0YXBlbmQnLCB0YWJFbmRIYW5kbGVyKTtcclxuICAgIGN5LmF1dG91bnNlbGVjdGlmeShmYWxzZSk7XHJcbiAgICBtYXJxdWVlWm9vbUVuYWJsZWQgPSBmYWxzZTtcclxuICB9O1xyXG4gLy9MYXNzbyBNb2RlXHJcbiB2YXIgZ2VvbWV0cmljID0gcmVxdWlyZSgnZ2VvbWV0cmljJyk7XHJcblxyXG4gaW5zdGFuY2UuY2hhbmdlTGFzc29TdHlsZSA9IGZ1bmN0aW9uKHN0eWxlT2JqKSAge1xyXG4gICBpZihzdHlsZU9iai5saW5lV2lkdGgpXHJcbiAgICAgb3B0aW9ucy5sYXNzb1N0eWxlLmxpbmVXaWR0aCA9IHN0eWxlT2JqLmxpbmVXaWR0aDtcclxuICAgaWYoc3R5bGVPYmoubGluZUNvbG9yKVxyXG4gICAgIG9wdGlvbnMubGFzc29TdHlsZS5saW5lQ29sb3IgPSBzdHlsZU9iai5saW5lQ29sb3I7XHJcbiB9O1xyXG5cclxuIGluc3RhbmNlLmVuYWJsZUxhc3NvTW9kZSA9IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICBcclxuICAgdmFyIGlzQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICB2YXIgdGVtcENhbnYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdjYW52YXMnKTtcclxuICAgdGVtcENhbnYuaWQgPSAnbGFzc28tY2FudmFzJztcclxuICAgY29uc3QgY29udGFpbmVyID0gY3kuY29udGFpbmVyKCk7XHJcbiAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZCh0ZW1wQ2Fudik7XHJcbiAgIFxyXG4gICBjb25zdCB3aWR0aCA9IGNvbnRhaW5lci5vZmZzZXRXaWR0aDtcclxuICAgY29uc3QgaGVpZ2h0ID0gY29udGFpbmVyLm9mZnNldEhlaWdodDtcclxuXHJcbiAgIHRlbXBDYW52LndpZHRoID0gd2lkdGg7XHJcbiAgIHRlbXBDYW52LmhlaWdodCA9IGhlaWdodDtcclxuICAgdGVtcENhbnYuc2V0QXR0cmlidXRlKFwic3R5bGVcIixgei1pbmRleDogMTAwMDsgcG9zaXRpb246IGFic29sdXRlOyB0b3A6IDA7IGxlZnQ6IDA7YCwpO1xyXG4gICBcclxuICAgY3kucGFubmluZ0VuYWJsZWQoZmFsc2UpO1xyXG4gICBjeS56b29taW5nRW5hYmxlZChmYWxzZSk7XHJcbiAgIGN5LmF1dG91bnNlbGVjdGlmeSh0cnVlKTtcclxuICAgdmFyIHBvaW50cyA9IFtdO1xyXG5cclxuICAgdGVtcENhbnYub25jbGljayA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgXHJcbiAgICAgaWYoaXNDbGlja2VkID09IGZhbHNlKSAge1xyXG4gICAgICAgaXNDbGlja2VkID0gdHJ1ZTtcclxuICAgICAgIHZhciBjb250ZXh0ID0gdGVtcENhbnYuZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgY29udGV4dC5zdHJva2VTdHlsZSA9IG9wdGlvbnMubGFzc29TdHlsZS5saW5lQ29sb3I7XHJcbiAgICAgICBjb250ZXh0LmxpbmVXaWR0aCA9IG9wdGlvbnMubGFzc29TdHlsZS5saW5lV2lkdGg7XHJcbiAgICAgICBjb250ZXh0LmxpbmVKb2luID0gXCJyb3VuZFwiO1xyXG4gICAgICAgY3kucGFubmluZ0VuYWJsZWQoZmFsc2UpO1xyXG4gICAgICAgY3kuem9vbWluZ0VuYWJsZWQoZmFsc2UpO1xyXG4gICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KHRydWUpO1xyXG4gICAgICAgdmFyIGZvcm1lclggPSBldmVudC5vZmZzZXRYO1xyXG4gICAgICAgdmFyIGZvcm1lclkgPSBldmVudC5vZmZzZXRZO1xyXG4gICAgICAgXHJcbiAgICAgICBwb2ludHMucHVzaChbZm9ybWVyWCxmb3JtZXJZXSk7XHJcbiAgICAgICB0ZW1wQ2Fudi5vbm1vdXNlbGVhdmUgPSBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgIGlzQ2xpY2tlZCA9IGZhbHNlO1xyXG4gICAgICAgICBjb250YWluZXIucmVtb3ZlQ2hpbGQodGVtcENhbnYpO1xyXG4gICAgICAgICB0ZW1wQ2FudiA9IG51bGw7XHJcbiAgICAgICAgIGN5LnBhbm5pbmdFbmFibGVkKHRydWUpO1xyXG4gICAgICAgICBjeS56b29taW5nRW5hYmxlZCh0cnVlKTtcclxuICAgICAgICAgY3kuYXV0b3Vuc2VsZWN0aWZ5KGZhbHNlKTtcclxuICAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgfVxyXG4gICAgICAgfTtcclxuICAgICAgIHRlbXBDYW52Lm9ubW91c2Vtb3ZlID0gZnVuY3Rpb24oZSkgIHtcclxuICAgICAgICAgY29udGV4dC5iZWdpblBhdGgoKTtcclxuICAgICAgICAgcG9pbnRzLnB1c2goW2Uub2Zmc2V0WCxlLm9mZnNldFldKTtcclxuICAgICAgICAgY29udGV4dC5tb3ZlVG8oZm9ybWVyWCwgZm9ybWVyWSk7XHJcbiAgICAgICAgIGNvbnRleHQubGluZVRvKGUub2Zmc2V0WCwgZS5vZmZzZXRZKTtcclxuICAgICAgICAgZm9ybWVyWCA9IGUub2Zmc2V0WDtcclxuICAgICAgICAgZm9ybWVyWSA9IGUub2Zmc2V0WTtcclxuICAgICAgICAgY29udGV4dC5zdHJva2UoKTtcclxuICAgICAgICAgY29udGV4dC5jbG9zZVBhdGgoKTtcclxuICAgICAgIH07XHJcbiAgICAgfVxyXG4gICAgIGVsc2V7XHJcbiAgICAgICB2YXIgZWxlcyA9IGN5LmVsZW1lbnRzKCk7XHJcbiAgICAgICBwb2ludHMucHVzaChwb2ludHNbMF0pO1xyXG4gICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGVsZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgaWYoZWxlc1tpXS5pc0VkZ2UoKSkgIHtcclxuICAgICAgICAgICBcclxuICAgICAgICAgICB2YXIgcDEgPSBbKGVsZXNbaV0uc291cmNlRW5kcG9pbnQoKS54KSpjeS56b29tKCkrY3kucGFuKCkueCwoZWxlc1tpXS5zb3VyY2VFbmRwb2ludCgpLnkpKmN5Lnpvb20oKStjeS5wYW4oKS55XTtcclxuICAgICAgICAgICB2YXIgcDIgPSBbKGVsZXNbaV0udGFyZ2V0RW5kcG9pbnQoKS54KSpjeS56b29tKCkrY3kucGFuKCkueCwoZWxlc1tpXS50YXJnZXRFbmRwb2ludCgpLnkpKmN5Lnpvb20oKStjeS5wYW4oKS55XTtcclxuXHJcbiAgICAgICAgICAgaWYoZ2VvbWV0cmljLnBvaW50SW5Qb2x5Z29uKHAxLHBvaW50cykgJiYgZ2VvbWV0cmljLnBvaW50SW5Qb2x5Z29uKHAyLHBvaW50cykpICB7XHJcbiAgICAgICAgICAgICBlbGVzW2ldLnNlbGVjdCgpO1xyXG4gICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgIH1cclxuICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gICAgICAgICAgIHZhciBiYiA9IFtbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDEsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTFdLFxyXG4gICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDEsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTJdLFxyXG4gICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDIsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTJdLFxyXG4gICAgICAgICAgICAgICAgICAgICBbZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueDIsZWxlc1tpXS5yZW5kZXJlZEJvdW5kaW5nQm94KCkueTFdXTtcclxuXHJcbiAgICAgICAgICAgaWYgKGdlb21ldHJpYy5wb2x5Z29uSW50ZXJzZWN0c1BvbHlnb24oYmIscG9pbnRzKSB8fCBnZW9tZXRyaWMucG9seWdvbkluUG9seWdvbihiYiwgcG9pbnRzKSBcclxuICAgICAgICAgICB8fCBnZW9tZXRyaWMucG9seWdvbkluUG9seWdvbihwb2ludHMsYmIpKXtcclxuICAgICAgICAgICAgIGVsZXNbaV0uc2VsZWN0KCk7XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgICB9XHJcbiAgICAgICB9XHJcbiAgICAgICBpc0NsaWNrZWQgPSBmYWxzZTtcclxuICAgICAgIGNvbnRhaW5lci5yZW1vdmVDaGlsZCh0ZW1wQ2Fudik7XHJcbiAgICAgICB0ZW1wQ2FudiA9IG51bGw7XHJcbiAgICAgICBcclxuICAgICAgIGN5LnBhbm5pbmdFbmFibGVkKHRydWUpO1xyXG4gICAgICAgY3kuem9vbWluZ0VuYWJsZWQodHJ1ZSk7XHJcbiAgICAgICBpZiAoY2FsbGJhY2spIHtcclxuICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgIH1cclxuICAgICB9XHJcbiAgIH07XHJcbiB9O1xyXG5cclxuIGluc3RhbmNlLmRpc2FibGVMYXNzb01vZGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgIHZhciBjID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xhc3NvLWNhbnZhcycpO1xyXG4gICBpZiAoIGMgKXtcclxuICAgICBjLnBhcmVudEVsZW1lbnQucmVtb3ZlQ2hpbGQoYyk7XHJcbiAgICAgYyA9IG51bGw7XHJcbiAgIH1cclxuICAgY3kucGFubmluZ0VuYWJsZWQodHJ1ZSk7XHJcbiAgIGN5Lnpvb21pbmdFbmFibGVkKHRydWUpO1xyXG4gICBjeS5hdXRvdW5zZWxlY3RpZnkoZmFsc2UpO1xyXG4gfVxyXG4gIC8vIHJldHVybiB0aGUgaW5zdGFuY2VcclxuICByZXR1cm4gaW5zdGFuY2U7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHZpZXdVdGlsaXRpZXM7XHJcbiJdfQ==
