document.addEventListener('DOMContentLoaded', () => {
    
    // Navbar Scroll Effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '0.5rem 0';
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        } else {
            navbar.style.padding = '1rem 0';
            navbar.style.background = 'rgba(255, 255, 255, 0.7)';
        }
    });

    // Contact Form -> WhatsApp
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const message = document.getElementById('message').value;
            
            // Professional WhatsApp number
            const myNumber = "5491155964569"; 
            
            const text = `Hola Alejandro! Mi nombre es ${name}. Me contacto desde la web por el servicio de Flores de Bach. Mi WhatsApp es ${phone}. Mensaje: ${message}`;
            const encodedText = encodeURIComponent(text);
            
            window.open(`https://wa.me/${myNumber}?text=${encodedText}`, '_blank');
        });
    }

    // Tracking Form -> Google Sheets
    const trackingForm = document.getElementById('trackingForm');
    const trackingStatus = document.getElementById('trackingStatus');

    if (trackingForm) {
        const savedId = localStorage.getItem('bach_client_id');
        if (savedId) document.getElementById('track-id').value = savedId;

        trackingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('track-id').value;
            const mood = document.getElementById('track-mood').value;
            const notes = document.getElementById('track-notes').value;
            const timestamp = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

            localStorage.setItem('bach_client_id', id);

            const btn = trackingForm.querySelector('button');
            btn.innerText = "Guardando...";
            btn.disabled = true;

            // === URL del Google Apps Script deployado ===
            // Reemplaza esto con tu URL real después de hacer la implementación
            const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwD9eesRmpnUgVDTYG-_7AM8p7S3dzx_umRbpe8KFSE4-6cavgLVhsYKY0Mh4ZUwzzd/exec";

            const payload = { timestamp, id, mood, notes };

            try {
                // Envío GET con cache-buster para que cada envío sea único
                const query = new URLSearchParams({...payload, _t: Date.now()}).toString();
                await fetch(`${APPS_SCRIPT_URL}?${query}`);
                // No leemos response (no‑cors), solo asumimos éxito

                // no-cors siempre devuelve opaque, se asume éxito si no hay error
                trackingStatus.innerHTML = `
                    <strong>✅ ¡Avance registrado con éxito!</strong><br>
                    <small>Fecha: ${timestamp} | Estado: ${mood}</small>
                `;
                trackingStatus.className = "form-success";
                trackingStatus.classList.remove('hidden');
                trackingForm.reset();
                // Restaurar ID guardado
                document.getElementById('track-id').value = id;

            } catch (error) {
                trackingStatus.innerText = "Error al conectar. Verificá tu conexión e intentá de nuevo.";
                trackingStatus.className = "form-error";
                trackingStatus.classList.remove('hidden');
                console.error("Error al enviar a Google Sheets:", error);
            } finally {
                btn.innerText = "Subir Avance";
                btn.disabled = false;
            }
        });
    }

    // Scroll reveal logic (Simple implementation)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card, .terapeuta-text, .terapeuta-img-box, .section-header').forEach(el => {
        observer.observe(el);
    });

});
