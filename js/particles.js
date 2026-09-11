if (localStorage.getItem('revolt_is_down') === 'true') {
    const segments = window.location.pathname.split('/').filter(Boolean);
    const base = window.location.hostname.endsWith('github.io') && segments.length > 0 ? `/${segments[0]}/` : '/';
    if (!window.location.pathname.includes('downtime.html')) window.location.replace(base + 'downtime.html');
}

(function () {
    const canvas = document.getElementById('snow-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    function isSnowEnabled() {
        const setting = localStorage.getItem('snowToggle');
        return setting === null ? true : setting === 'true';
    }

    const particles = [];
    const MAX_PARTICLES = 95;

    class Particle {
        constructor() {
            this.reset(true);
        }

        reset(initial = false) {
            this.x = Math.random() * width;
            this.y = initial ? Math.random() * height : -10;
            this.radius = Math.random() * 3 + 1;
            this.speedY = Math.random() * 1.5 + 0.8;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.opacity = Math.random() * 0.7 + 0.3;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX;

            if (this.y > height + 10 || this.x < -10 || this.x > width + 10) {
                this.reset(false);
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
            ctx.shadowBlur = 4;
            ctx.shadowColor = '#ffffff';
            ctx.fill();
        }
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
        particles.push(new Particle());
    }

    function animate() {
        ctx.clearRect(0, 0, width, height);

        if (isSnowEnabled()) {
            for (let p of particles) {
                p.update();
                p.draw();
            }
        }

        requestAnimationFrame(animate);
    }

    animate();
})();
