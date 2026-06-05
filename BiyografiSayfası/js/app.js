// Smooth Scroll (Lenis)
const lenis = new Lenis({
    duration: 0.8,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
});

function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// Scroll Reveal (Giris animasyonlari)
const sr = ScrollReveal({
    origin: 'bottom',
    distance: '60px',
    duration: 800,
    delay: 200,
    reset: false,
    easing: 'cubic-bezier(0.5, 0, 0, 1)',
});

// Intro bolumu
// Mobilde sagdan/soldan gelisler tasma yapabilir, bu yuzden mobilde alttan gelsinler
const isMobile = window.matchMedia('(max-width: 768px)').matches;

if (isMobile) {
    sr.reveal('.info-area h1', { delay: 300, origin: 'bottom', distance: '30px' });
    sr.reveal('.info-area p', { delay: 400, origin: 'bottom', distance: '30px' });
    sr.reveal('.model-area', { delay: 500, origin: 'bottom', distance: '30px' });
} else {
    sr.reveal('.info-area h1', { delay: 300, origin: 'left' });
    sr.reveal('.info-area p', { delay: 400, origin: 'left' });
    sr.reveal('.model-area', { delay: 500, origin: 'right', distance: '100px' });
}

// Spotify
sr.reveal('.spotify-embed', { interval: 200 });

// Hikaye ve sistem
sr.reveal('.story-inner h2', { delay: 200 });
sr.reveal('.story-inner p', { delay: 300 });
sr.reveal('.system-inner h2', { delay: 200 });
sr.reveal('.system-inner p', { delay: 300 });
sr.reveal('.system-card', { interval: 100 });

// Sosyal medya
sr.reveal('.socials-inner h2', { delay: 200 });
sr.reveal('.socials-inner p', { delay: 300 });
sr.reveal('.social-card', { interval: 100 });

// Navbar
sr.reveal('.island-nav', { origin: 'top', distance: '20px', delay: 800 });

// Steam adini sunucu tarafindan cek
const steamHandle = document.getElementById('steam-handle');

if (steamHandle) {
    fetch('steam.php', { headers: { Accept: 'application/json' } })
        .then((response) => {
            if (!response.ok) {
                throw new Error('Steam bilgisi alinamadi.');
            }
            return response.json();
        })
        .then((data) => {
            if (data && typeof data.personaname === 'string' && data.personaname.trim()) {
                steamHandle.textContent = data.personaname.trim();
            }
        })
        .catch(() => {
            // Endpoint hata verirse fallback metni kalsin.
        });
}
