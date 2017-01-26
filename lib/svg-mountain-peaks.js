var SVGMountainPeaks = SVGMountainPeaks || {};
SVGMountainPeaks.coords = {};
SVGMountainPeaks.svg = {};
SVGMountainPeaks.utils = {};


/**
 * SVG Mountain Peaks
 * @namespace SVGMountainPeaks
 * @todo Identify and add optional parameters to JSDocs.
 */

(function() {

  var defaultConfig = {
    stage: {
      width: 600,
      height: 300
    },
    peaks: {
      count: 1,
      detail: 4,
      minY: 200,
      maxY: 300
    },
    valleys: {
      minY: 50
    },
    fill: { }
  };

  this.config = { };
 
  /**
   * Returns a procedurally generated SVG of mountain peaks.
   * @alias create
   * @memberof SVGMountainPeaks
   * @public
   * @param {Object} [config] - A configuration object that defines all aspects of creating the mountain peaks.
   * @returns {Object} - Procedurally generated SVG of 2D mountain peaks.
   */
  this.create = function(config) {
    if (config) {
      this.config = this.utils.mergeDeep(defaultConfig, config);
    } else {
      this.config = defaultConfig;
    }

    var initPeaks = this.config.initPeaks;
    var stage = this.config.stage;
    var peaks = this.config.peaks;
    var fill = this.config.fill;
    var shadow = this.config.shadow;
    var ridge = this.config.ridge;
    var valleys = this.config.valleys;
    var flats = this.config.flats;

    var coords = this.coords.create(stage, initPeaks, peaks, valleys, flats);
    var svg = this.svg.create(coords, stage, valleys, fill, shadow, ridge);    

    return svg;
  };
  
}).apply(SVGMountainPeaks);


/**
 * SVG Mountain Peaks Coordinates
 * @namespace SVGMountainPeaks.coords
 */

(function() {

  /**
   * Returns an array of y-axis points for the mountain peaks.
   * @function definePeaks
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {number} count - The count of tallest mountain peaks.
   * @param {number} valleyMinY - The lowest y-axis point.
   * @param {number} peakMinY - The lowest y-axis point for the tallest peaks.
   * @param {number} peakMaxY - The highest y-axis point for the tallest peaks.
   * @param {boolean} [startWithPeak] - True if the left most point is a peak instead of a valley.
   * @returns {array} Array of y-axis points that define the main geography of the mountain peaks.
   */
  var definePeaks = function(count, valleyMinY, peakMinY, peakMaxY, startWithPeak) {
    var retryLimit = 100;
    var retry;
    var peakY;
    var valleyY;
    var startY = (startWithPeak) ? peakMinY : valleyMinY;
    var points;
    var insertDelta = 1;

    if (startWithPeak) {
      points = [startY, defineValleyY(peakMinY, valleyMinY), startY];
      insertDelta = 2;
    } else {
      points = [startY];
    }

    for (var i = 0; i < count * 2; i = i + 2) {
      do {
        peakY = definePeakY(peakMinY, peakMaxY);
        retry++;
      } while (retry < retryLimit && (peakY > peakMaxY));

      do {
        valleyY =  defineValleyY(peakMinY, valleyMinY);
      } while (valleyY < valleyMinY);

      points.splice(i + insertDelta, 0, peakY);
      points.splice(i + insertDelta + 1, 0, valleyMinY);
    }

    return points;
  };

  /**
   * Return array of random subdivided y-axis points.
   * @function subdividePeaks
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {array} points - An array of y-axis points.
   * @param {number} passes - The number of times to subdivide the points.
   * @param {number} minY - The minimum y-axis limit for the new point.
   * @param {number} maxY - The maximum y-axis limit for the new point.
   * @returns {array} Array of random subdivided y-axis points.
   */
  var subdividePeaks = function(points, passes, minY, maxY) {
    var arr = points.splice(0);

    for (var pass = 0; pass < passes; pass++) {
      for (var i = 0; i < arr.length - 1; i = i + 2) {
        arr.splice(i + 1, 0, subdivide(arr[i], arr[i + 1], passes, minY, maxY));
      }
    }

    return arr;
  };

  /**
   * Return random y-axis position based on two points.
   * @function subdivide
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {number} point1 - First point to subdivide.
   * @param {number} point2 - Second point to subdivide.
   * @param {number} passes - The number of times to subdivide the points.
   * @param {number} minY - The minimum y-axis limit for the new point.
   * @param {number} maxY - The maximum y-axis limit for the new point.
   * @returns Randomly offset Y-axis point.
   */
  var subdivide = function(point1, point2, passes, minY, maxY) {
    var retryLimit = 100;
    var retry = 0;
    var diff;
    var midpoint;
    var lowPoint;
    var spread;
    var delta;

    diff = Math.abs(point1 - point2);
    lowPoint = (point1 < point2) ? point1 : point2;
    midpoint = Math.floor(diff / 2) + lowPoint;
    spread = Math.floor(midpoint / passes);

    do {
      delta = Math.floor(Math.random() * spread);
      retry++;
    } while (retry < retryLimit && (midpoint + delta > maxY || midpoint + delta < minY));

    if (Math.floor(Math.random() * 2) === 1) {
      delta *= -1;
    }

    return midpoint + delta;
  };

  /**
   * Return an array of X and Y coordinate objects.
   * @function mapPointsToObject
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {Object} stage - The stage configuration object.
   * @param {array} points - An array of y-axis points.
   * @returns Array of X and Y coordinate objects.
   */
  var mapPointsToObject = function(stage, points) {
    var NUM_POINTS = points.length;
    var X_INC = stage.width / (NUM_POINTS - 1);

    var coords = [];

    for (var point = 0; point < NUM_POINTS; point++) {
      coords.push({
        x: X_INC * point,
        y: stage.height - points[point]
      });
    }

    return coords;
  };

  /**
   * Returns a randomly generated y-axis point for a tall peak.
   * @function definePeakY
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {number} peakMinY - The minimum y-axis limit for the new point.
   * @param {number} peakMaxY - The maximum y-axis limit for the new point.
   * @returns {number} Randomly generated y-axis point for a tall peak.
   */
  var definePeakY = function(peakMinY, peakMaxY) {
    return Math.floor(Math.random() * (peakMaxY - peakMinY) + peakMinY);
  };

  /**
   * Returns a randomly generated low valley y-axis value.
   * @function defineValleyY
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {number} peakMinY - The minimum y-axis limit for a peak point.
   * @param {number} valleyMinY - The minimum y-axis limit for a valley point.
   * @returns {number} Randomly generated low valley y-axis value.
   */
  var defineValleyY = function(peakMinY, valleyMinY) {
    return Math.floor(Math.random() * (peakMinY - valleyMinY) + valleyMinY);
  };

  /**
   * Returns a coordinates array with leveled y-axis values for a specific width at given positions.
   * @function levelArea
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {array} coords - The coordinates array.
   * @param {number} pos - The x-axis position to start leveling.
   * @param {number} width - The width of the area to be leveled.
   * @param {string} align - The alignment of either left or right.
   * @param {string} name - The name of the leveled area.
   * @returns Coordinate object with a leveled y-axis value for a specific width at a given position.
   * @todo Remove coords as dependency.
   */
  var levelArea = function(coords, pos, width, align, name) {
    var stageWidth = coords[coords.length - 1].x - coords[0].x;  
    var index;
    var desiredX = Math.floor(stageWidth * pos);

    switch(align) {
      case 'right':
      desiredX -= width;
      break;

      case 'center':
      desiredX -= Math.floor(width / 2);
      break;
    }

    for (var i = 0; i < coords.length; i++) {
      if (!index && coords[i].x > desiredX) {
        index = i;
        coords[i].flatName = name;
      } else if (index && coords[i].x - coords[index].x <= width) {
        coords[i].y = coords[index].y;
      }
    }

    return coords;
  };

  /**
   * Returns the coordinates array with flattened areas.
   * @function defineFlats
   * @memberof SVGMountainPeaks.coords
   * @private
   * @param {array} coords - The coordinates array.
   * @param {array} flats - The flats configuration array.
   * @returns {array} The coordinates array with flattened areas.
   * @todo Remove coords as dependency.
   */
  var defineFlats = function(coords, flats) {
    for (var flat of flats) {
      coords = levelArea(coords, flat.pos, flat.width, flat.align, flat.name);
    }
    return coords;
  };

  /**
   * Returns x/y coordinate objects in an array with procedurally generate points. 
   * @alias create
   * @public
   * @memberof SVGMountainPeaks.coords
   * @param {Object} stage - The stage configuration object.
   * @param {array} [initPeaks] - The initial defined peaks, instead of random.
   * @param {Object} peaks - The peaks configuration object.
   * @param {Object} valleys - The valleys configuration object.
   * @param {array} [flats] - the flats configuration object.
   * @returns {array} x/y coordinate objects in an array with procedurally generate points
   */
  this.create = function(stage, initPeaks, peaks, valleys, flats) {
    if (initPeaks && initPeaks.length) {
      points = initPeaks;
    } else {
      points = definePeaks(peaks.count, valleys.minY, peaks.minY, peaks.maxY, peaks.startWithPeak);
    }
    
    points = subdividePeaks(points, peaks.detail, valleys.minY, peaks.maxY);

    var coords = mapPointsToObject(stage, points);

    if (flats) {
      coords = defineFlats(coords, flats);
    }

    return coords;
  }
  
}).apply(SVGMountainPeaks.coords);


/**
 * SVG Mountain Peaks SVG
 * @namespace SVGMountainPeaks.svg
 */

(function() {

  /**
   * Return SVG polygon element of mountain peaks.
   * @function createMountainPoly
   * @memberof SVGMountainPeaks.svg
   * @private
   * @param {Object} svg - 
   * @param {array} coords
   * @param {number} width
   * @param {number} height
   * @param {string} color
   * @param {Object} gradient
   * @returns {Object} SVG polygon element of mountain peaks.
   * @todo Remove SVG parameters as a dependency.
   */
  var createMountainPoly = function(svg, coords, width, height, color, gradient) {
    var points = coords.map((coord) => {
      return `${coord.x},${coord.y}`;
    }).join(' ') + ` ${width},${height} 0,${height}`;

    var poly = document.createElementNS('http://www.w3.org/2000/svg','polygon');

    if (gradient) {
      createGradient(svg, 'mountainGradient', gradient);
      poly.setAttribute('fill', 'url(#mountainGradient)');
    } else {
      poly.setAttribute('fill', color);
    }

    poly.setAttribute('points', points);

    return poly;
  };

  /**
   * Add a stroke to the mountain peak ridgeline.
   * @function createRidgeLine
   * @memberof SVGMountainPeaks.svg
   * @private
   * @param {number} width
   * @param {number} height
   * @param {array} coords
   * @param {string} color
   * @param {number} thickness
   * @returns {Object}
   */
  var createRidgeline = function(width, height, coords, color, thickness) {
    var NUM_POINTS = coords.length;

    var points =  `M ${coords[0].x} ${coords[0].y}`;
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    for (var i = 1; i < NUM_POINTS; i++) {
      points += `L ${coords[i].x} ${coords[i].y}`;
    }

    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', color);
    path.setAttribute('stroke-width', thickness);
    path.setAttribute('d', points);

    return path;
  };
  
  /**
   * Returns gradient definition.
   * @function createGradient
   * @memberof SVGMountainPeaks.svg
   * @private
   * @param {Object} svg
   * @param {string} id
   * @param {Object} gradient
   * @returns {Object}
   * @todo Remove SVG parameters as a dependency.
   * @todo Remove querySelector as a dependency.
   */
  var createGradient = function(svg, id, gradient) {
    var stops = gradient.stops;
    var svgNS = svg.namespaceURI;
    var grad  = document.createElementNS(svgNS, 'linearGradient');

    grad.setAttribute('id', id);
    grad.setAttribute('x1', gradient.x1);
    grad.setAttribute('y1', gradient.y1);
    grad.setAttribute('x2', gradient.x2);
    grad.setAttribute('y2', gradient.y2);

    for (var i=0; i < stops.length; i++){
      var attrs = stops[i];
      var stop = document.createElementNS(svgNS, 'stop');

      for (var attr in attrs){
        if (attrs.hasOwnProperty(attr)) {
          stop.setAttribute(attr, attrs[attr]);
        }
      }

      grad.appendChild(stop);
    }

    var defs = svg.querySelector('defs') || svg.insertBefore( document.createElementNS(svgNS, 'defs'), svg.firstChild);
    return defs.appendChild(grad);
  };

  /**
   * Return filled path with shadows of mountain peaks.
   * @function createShadowPath
   * @memberof SVGMountainPeaks.svg
   * @private
   * @param {Object} svg
   * @param {number} height
   * @param {array} coords
   * @param {number} valleyMinY
   * @param {string} color
   * @param {Object} gradient
   * @returns {Object}
   * @todo Remove SVG parameters as a dependency.
   */
  var createShadowPath = function(svg, height, coords, valleyMinY, color, gradient) {
    var NUM_POINTS = coords.length;
    var START_X_OFFSET = 20;

    var startX = false;
    var endX;
    var lowestY;
    var points = '';
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    for (var i = 1; i < NUM_POINTS; i++) {
      if (startX === false && coords[i].y > coords[i - 1].y) {
        startX = coords[i - 1].x;
        points += `M ${startX} ${coords[i - 1].y}`;
        points += ` ${coords[i].x} ${coords[i].y}`;
        lowestY = height - coords[i].y;
      }
      
      if (startX !== false && coords[i].y <= coords[i - 1].y) {
        if (coords[i].y < lowestY) {
          lowestY = height - coords[i].y;
        }

        endX = startX + START_X_OFFSET;
        points += ` ${endX} ${height - Math.floor(Math.random() * (lowestY - valleyMinY))} Z`;
        startX = false;
      }

      if (startX !== false) {
        points += ` ${coords[i].x} ${coords[i].y}`;

        if (coords[i].y > lowestY) {
          lowestY = height - coords[i].y;
        }

        if (i === NUM_POINTS - 1) {
          points += ` ${startX + START_X_OFFSET} ${height - Math.floor(Math.random() * (lowestY - valleyMinY))} Z`;
          startX = false;
        }
      }
    }

    if (gradient) {
      createGradient(svg, 'shadowGradient', gradient);
      path.setAttribute('fill', 'url(#shadowGradient)');
    } else {
      path.setAttribute('fill', color);
    }

    path.setAttribute('d', points);

    return path;
  };

  /**
   * Create SVG of mountain peaks.
   * @alias create
   * @memberof SVGMountainPeaks.svg
   * @public
   * @param {array} coords
   * @param {Object} stage
   * @param {Object} valleys
   * @param {Object} fill
   * @param {Object} shadow
   * @param {Object} ridge
   * @returns {Object}
   */
  this.create = function(coords, stage, valleys, fill, shadow, ridge) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute('width', stage.width);
    svg.setAttribute('height', stage.height);
    svg.appendChild(createMountainPoly(svg, coords, stage.width, stage.height, fill.color, fill.gradient));

    if (shadow) {
      svg.appendChild(createShadowPath(svg, stage.height, coords, valleys.minY, shadow.color, shadow.gradient));
    }

    if (ridge && ridge.color && ridge.thickness) {
      svg.appendChild(createRidgeline(stage.width, stage.height, coords, ridge.color, ridge.thickness));
    }

    return svg
  }

}).apply(SVGMountainPeaks.svg);


/**
 * SVG Mountain Peaks Utilities
 * @namespace SVGMountainPeaks.utils
 */

(function() {

  /**
   * Utility method for determing if variable is an object.
   * @function isObject
   * @memberof SVGMountainPeaks.utils
   * @param {Object} val - The value to be tested whether an object or not.
   * @returns {boolean} Returns TRUE if the parameter is an object, otherwise FALSE.
   */
  var isObject = function(val) {
    return (val && typeof val === 'object' && !Array.isArray(val) && val !== null);
  };

  /**
   * Perform a deep merge from source onto target.
   * @alias mergeDeep
   * @memberof SVGMountainPeaks.utils
   * @public
   * @param {Object} target
   * @param {Object} source
   * @returns {Object} Returns the results of the merge between the target and source objects.
   */
  this.mergeDeep = function(target, source) {
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      });
    }

    return target;
  };
  
}).apply(SVGMountainPeaks.utils);
