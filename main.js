/**
 * Generate RGB colour strings from HCL (hue/chroma/lightness)
 */
const hcl = (h, c, l) => d3.hcl(h, c, l).toString();

/**
 * Get the last datum from an array
 */
const last = data => data[data.length - 1];

/**
 * Calculate the total elapsed time since the start of the animation
 */
const updateClock = timestamp => {
  if (!startTime) {
    startTime = timestamp;
  }
  const totalElapsedTime = timestamp - startTime;
  const timeSinceLastRun = totalElapsedTime - previousTime;
  previousTime = totalElapsedTime;

  return timeSinceLastRun;
};

/**
 * Reset the canvas area for the next frame
 */
const clearCanvas = () => {
  const hue = areas[0].hue;
  const chroma = 18;
  const lightness = [83, 100];
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, hcl(hue, chroma, lightness[0]));
  gradient.addColorStop(0.5, hcl(hue, chroma, lightness[1]));
  context.fillStyle = gradient;
  context.rect(0, 0, width, height);
  context.fill();
};

/**
 * Create a single area/mountain range section
 * Public methods: update, onResize and onMouseMove
 */
class Area {
  constructor(props) {
    // Establish default values
    this.MAX_Y = 1;
    this.MIN_Y = 0;
    this.WALK_DISTANCE = 0.1;
    this.UPDATE_FREQUENCY = 1000;
    this.TICK_FREQUENCY = 0.1;
    this.HUE = 0;
    this.HUE_CHANGE_RATE = 0.3;
    this.CHROMA = 50;
    this.LIGHTNESS = 60;
    this.BLUR = 1;
    this.PARALLAX = { x: 0.1, y: 0.1 };

    // Override with props
    for (let prop in props) {
      this[prop] = props[prop];
    }

    // Establish mutable values
    this.hue = 0 + this.HUE;
    this.timeSinceLastNewDatum = 0;

    // Calculate values and perform initial setup
    this.calculateDimensions();
    this.setupData();
    this.calculateRanges();
    this.createScales();
    this.populateData();
  }

  calculateDimensions() {
    const { x, y } = this.parallax();
    this.width = width + x * 2;
    this.height = height + y * 2;
  }

  parallax() {
    return {
      x: this.PARALLAX.x * width,
      y: this.PARALLAX.y * height
    };
  }

  calculateRanges() {
    const { x, y } = this.parallax();

    const offset = {
      x: dx => dx + position.x * x,
      y: dy => dy + position.y * y
    };

    this.xRange = [-x, this.width - x].map(offset.x);
    this.yRange = [this.height - y, -y].map(offset.y);
  }

  setupData() {
    const startY = (this.MAX_Y + this.MIN_Y) / 2;
    this.data = [startY];
    this.dataCount = Math.floor(this.width * this.TICK_FREQUENCY);
  }

  createScales() {
    this.x = this.xScale();
    this.y = this.yScale();
    this.area = this.areaScale();
  }

  xScale() {
    return d3
      .scaleLinear()
      .domain([0, this.dataCount - 1])
      .range(this.xRange);
  }

  yScale() {
    return d3
      .scaleLinear()
      .domain([0, 1])
      .range(this.yRange);
  }

  areaScale() {
    return d3
      .area()
      .x((d, i) => this.x(i))
      .y0(this.y(0))
      .y1((d, i) => this.y(d))
      .context(context);
  }

  randomNextDatum(previous) {
    let randomWalk = (Math.random() - 0.5) * this.WALK_DISTANCE * 2;
    const boundsExceeded = {
      max: previous + randomWalk > this.MAX_Y,
      min: previous + randomWalk < this.MIN_Y
    };
    if (boundsExceeded.max || boundsExceeded.min) {
      randomWalk = -randomWalk;
    }
    return previous + randomWalk;
  }

  addNewDatum() {
    const nextDatum = this.randomNextDatum(last(this.data));
    this.data.push(nextDatum);
  }

  populateData() {
    this.addNewDatum();
    if (this.data.length < this.dataCount) {
      this.populateData();
    }
  }

  updateData(timeSinceLastRun) {
    this.timeSinceLastNewDatum += timeSinceLastRun;

    while (this.timeSinceLastNewDatum > this.UPDATE_FREQUENCY) {
      this.timeSinceLastNewDatum -= this.UPDATE_FREQUENCY;
      this.addNewDatum();
      this.data.shift();
    }
  }

  updateXOffset() {
    this.tickDistance = this.width / this.dataCount;
    const offsetFraction = this.timeSinceLastNewDatum / this.UPDATE_FREQUENCY;
    const xOffset = offsetFraction * this.tickDistance;
    this.x.range(this.xRange.map(d => d - xOffset));
  }

  draw() {
    context.beginPath();
    this.area(this.data);
    this.fill();
  }

  fill() {
    const hue = (this.hue += this.HUE_CHANGE_RATE);
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, hcl(hue, this.CHROMA, this.LIGHTNESS - 10));
    gradient.addColorStop(1, hcl(hue, this.CHROMA, this.LIGHTNESS + 10));
    context.fillStyle = gradient;
    context.filter = `blur(${this.BLUR}px)`;
    context.fill();
  }

  onResize() {
    this.calculateDimensions();
    this.setupData();
    this.calculateRanges();
    this.createScales();
    this.populateData();
  }

  onMousemove() {
    this.calculateRanges();
    this.x.range(this.xRange);
    this.y.range(this.yRange);
  }

  update(timeSinceLastRun) {
    this.updateData(timeSinceLastRun);
    this.updateXOffset();
    this.draw();
  }
}

const run = timestamp => {
  clearCanvas();
  const timeSinceLastRun = updateClock(timestamp);
  areas.forEach(a => a.update(timeSinceLastRun));
  req = requestAnimationFrame(run);
};

const AREA_COUNT = 6;
const areaData = Array.from(Array(AREA_COUNT).keys()).reverse();

let width = window.innerWidth,
  height = window.innerHeight,
  startTime = 0,
  previousTime = 0;

const position = {
  x: 0.5,
  y: 0.5
};

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

canvas.width = width;
canvas.height = height;

const areaScaleLinear = range =>
  d3
    .scaleLinear()
    .domain(d3.extent(areaData))
    .range(range);

const scale = {
  maxY: areaScaleLinear([0.4, 0.9]),
  minY: areaScaleLinear([0.15, 0.8]),
  walkDistance: areaScaleLinear([0.03, 0.01]),
  updateFrequency: areaScaleLinear([350, 600]),
  tickFrequency: areaScaleLinear([0.0625, 0.125]),
  hue: areaScaleLinear([2, 12]),
  chroma: areaScaleLinear([45, 20]),
  lightness: areaScaleLinear([30, 80]),
  blur: areaScaleLinear([0.6, 1.1]),
  parallax: d => ({
    x: areaScaleLinear([0.1, 0.01])(d),
    y: areaScaleLinear([0.1, 0.01])(d)
  })
};

const areas = areaData.map(d => {
  return new Area({
    id: d,
    MAX_Y: scale.maxY(d),
    MIN_Y: scale.minY(d),
    WALK_DISTANCE: scale.walkDistance(d),
    UPDATE_FREQUENCY: scale.updateFrequency(d),
    TICK_FREQUENCY: scale.tickFrequency(d),
    HUE: scale.hue(d),
    CHROMA: scale.chroma(d),
    LIGHTNESS: scale.lightness(d),
    BLUR: scale.blur(d),
    PARALLAX: scale.parallax(d)
  });
});

// Update/redraw on window resize
window.addEventListener('resize', () => {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  areas.forEach(a => a.onResize());
});

document.addEventListener('mousemove', e => {
  position.y = e.clientY / height;
  position.x = e.clientX / width;
  areas.forEach(a => a.onMousemove());
});

document.body.appendChild(canvas);

// Start animation playback
let req = requestAnimationFrame(run);

// Toggle play/pause animation on spacebar
document.addEventListener('keydown', e => {
  if (e.keyCode !== 32) {
    return;
  }
  if (req) {
    cancelAnimationFrame(req);
    req = false;
  } else {
    req = requestAnimationFrame(run);
  }
});
