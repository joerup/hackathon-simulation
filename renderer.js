const canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');

// Set black background
document.body.style.backgroundColor = 'black';
canvas.style.backgroundColor = 'black';

// Polygon class
class Polygon {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.size = Math.random() * 30 + 20;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.1;
    this.sides = Math.floor(Math.random() * 6) + 3; // 3-8 sides
    this.color = `hsl(${Math.random() * 360}, 70%, 60%)`;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    // Wrap around screen edges
    if (this.x < -this.size) this.x = canvas.width + this.size;
    if (this.x > canvas.width + this.size) this.x = -this.size;
    if (this.y < -this.size) this.y = canvas.height + this.size;
    if (this.y > canvas.height + this.size) this.y = -this.size;
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    for (let i = 0; i < this.sides; i++) {
      const angle = (i / this.sides) * Math.PI * 2;
      const x = Math.cos(angle) * this.size;
      const y = Math.sin(angle) * this.size;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();

    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

// Create polygons
const polygons = [];
for (let i = 0; i < 25; i++) {
  polygons.push(new Polygon());
}

function animate() {
  // Clear canvas
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Update and draw polygons
  polygons.forEach(polygon => {
    polygon.update();
    polygon.draw();
  });

  // Draw "Hello" text
  ctx.font = 'bold 120px Arial';
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Hello', canvas.width / 2, canvas.height / 2);

  requestAnimationFrame(animate);
}

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

animate();