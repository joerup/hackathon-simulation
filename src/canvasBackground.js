class Polygon {
  constructor(canvas) {
    this.canvas = canvas;
    this.reset();
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.06;
    this.sides = Math.floor(Math.random() * 6) + 3;
    this.color = `hsla(${Math.random() * 360}, 70%, 65%, 0.35)`;
  }

  reset() {
    this.x = Math.random() * this.canvas.width;
    this.y = Math.random() * this.canvas.height;
    this.vx = (Math.random() - 0.5) * 1.8;
    this.vy = (Math.random() - 0.5) * 1.8;
    this.size = Math.random() * 40 + 25;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    if (this.x < -this.size) this.x = this.canvas.width + this.size;
    if (this.x > this.canvas.width + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = this.canvas.height + this.size;
    if (this.y > this.canvas.height + this.size) this.y = -this.size;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.beginPath();

    for (let i = 0; i < this.sides; i += 1) {
      const angle = (i / this.sides) * Math.PI * 2;
      const px = Math.cos(angle) * this.size;
      const py = Math.sin(angle) * this.size;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

export function initCanvasBackground() {
  const canvas = document.createElement("canvas");
  canvas.className = "background-canvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  const polygons = Array.from({ length: 28 }, () => new Polygon(canvas));

  function renderFrame() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    polygons.forEach(polygon => {
      polygon.update();
      polygon.draw(ctx);
    });

    ctx.font = "600 110px Inter, Arial, sans-serif";
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Job Hunt Arena", canvas.width / 2, canvas.height / 2);

    requestAnimationFrame(renderFrame);
  }

  renderFrame();

  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });

  return { canvas, ctx };
}
