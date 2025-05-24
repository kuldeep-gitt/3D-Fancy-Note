document.addEventListener('DOMContentLoaded', function() {
    // Only add particles to note cards on the main page
    if (!document.getElementById('notes-container')) return;
    
    const noteCards = document.querySelectorAll('.note-card');
    
    noteCards.forEach(card => {
        // Skip protected notes
        if (card.querySelector('.protected-note-content')) return;
        
        const canvas = document.createElement('canvas');
        canvas.className = 'note-particle-bg';
        card.insertBefore(canvas, card.firstChild);
        
        // Set canvas size
        canvas.width = card.offsetWidth;
        canvas.height = card.offsetHeight;
        
        const ctx = canvas.getContext('2d');
        const particles = [];
        const particleCount = Math.floor(canvas.width * canvas.height / 2000);
        
        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 0.5,
                speed: Math.random() * 0.5 + 0.1,
                color: `rgba(255, 255, 255, ${Math.random() * 0.3 + 0.1})`
            });
        }
        
        function animateParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach(p => {
                p.y -= p.speed;
                if (p.y < 0) p.y = canvas.height;
                
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            });
            
            requestAnimationFrame(animateParticles);
        }
        
        animateParticles();
        
        // Handle resize
        window.addEventListener('resize', () => {
            canvas.width = card.offsetWidth;
            canvas.height = card.offsetHeight;
        });
    });
});