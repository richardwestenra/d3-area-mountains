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
const clearCanvas = context => {
  context.fillStyle = 'white';
  context.rect(0, 0, width, height);
  context.fill();
};

const getNewPosition = (d, bounds, time) => {
  const speed = () => object.velocity[d] * time;
  const newPosition = object.position[d] + speed();
  const boundsExceeded = {
    min: newPosition < bounds[0],
    max: newPosition > bounds[1]
  };
  if (boundsExceeded.min || boundsExceeded.max) {
    object.velocity[d] = -object.velocity[d];
  }
  return object.position[d] += speed();
};

const draw = (time) => {
  const x = getNewPosition('x', [0, width - object.width], time);
  const y = getNewPosition('y', [0, height - object.height], time);
  m_context.drawImage(object.image, x, y);
};

/**
 * Execute a new animation frame and call the next one
 */
const run = timestamp => {
  if (clear) {
    clearCanvas(m_context);
  }
  const timeSinceLastRun = updateClock(timestamp);
  draw(timeSinceLastRun);
  context.drawImage(m_canvas, 0, 0);
  req = requestAnimationFrame(run);
};


/**
 * Add event listeners
 */
const handleEvents = () => {
  // Update/redraw on window resize
  window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    [canvas, m_canvas].forEach(updateCanvasSize);
  });

  // Toggle (play/pause) animation on spacebar
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
};


const createCanvas = () => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  updateCanvasSize(canvas);

  return [canvas, context];
};

const updateCanvasSize = canvas => {
  canvas.width = width;
  canvas.height = height;
};

const addButton = () => {
  const button = document.createElement('button');
  button.innerHTML = 'Clear the canvas';
  button.addEventListener('click', () => {
    clear = !clear;
    button.innerHTML = clear ? 'Don\'t clear the canvas' : 'Clear the canvas';
  });
  document.body.appendChild(button);
};

/**
 * Start animation
 */
const initialise = () => {
  object.image.src = `https://placeimg.com/${object.width}/${object.height}/animals`;
  document.body.appendChild(canvas);
  addButton();
  req = requestAnimationFrame(run);
  handleEvents();
};

// Establish some global mutable values
let req,
  width = window.innerWidth,
  height = window.innerHeight,
  startTime = 0,
  previousTime = 0,
  maxVelocity = 2,
  objSize = Math.round(Math.min(width, height) / 4),
  object = {
    image: new Image(),
    width: objSize,
    height: objSize,
    position: {
      x: Math.random() * (width - objSize),
      y: Math.random() * (height - objSize)
    },
    velocity: {
      x: (Math.random() - 0.5) * maxVelocity,
      y: (Math.random() - 0.5) * maxVelocity
    }
  },
  clear = false;

// The canvas rendered to the page:
const [canvas, context] = createCanvas();
// A virtual canvas for pre-rendering, to improve perf
// (See https://www.html5rocks.com/en/tutorials/canvas/performance/#toc-pre-render)
const [m_canvas, m_context] = createCanvas();

// Initialise
window.onload = initialise;
