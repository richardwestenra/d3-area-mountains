(function() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  let t = 0;

  const app = new PIXI.Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true
  });
  document.body.appendChild(app.view);

  const getRandomData = () => new Array(100).fill().map(() => Math.random());

  const data = new Array(10).fill().map(getRandomData);

  const graphics = new PIXI.Graphics();

  const colour = hue => {
    const c = d3.hcl(hue, 50, 50).formatHex();
    return Number('0x' + c.substr(1));
  };

  function drawArea(data, i) {
    const x = d3
      .scaleLinear()
      .domain([0, data.length])
      .range([10, width]);

    const y = d3
      .scaleLinear()
      .domain([0, 1])
      .range([height, height - (height / i)]);

    data.shift();
    data.push(Math.random())
    graphics.beginFill(colour(t + i*10));
    graphics.moveTo(x(0), y(data[0]));
    for (let i = 1; i < data.length; i++) {
      graphics.lineTo(x(i), y(data[i]));
    }
    graphics.lineTo(x(data.length - 1), y(0));
    graphics.lineTo(x(0), y(0));
    graphics.closePath();
    graphics.endFill();
  }

  app.stage.addChild(graphics);

  // Listen for frame updates
  app.ticker.add(() => {
    t += 0.5;
    graphics.clear();
    data.forEach(drawArea);
  });
})();