// ── NAVBAR SCROLL ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 30);
});

// ── MOBILE MENU ──
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');
navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', () => navLinks.classList.remove('open'));
});

// ── FORM SUBMIT ──
const form    = document.getElementById('contactForm');
const success = document.getElementById('formSuccess');
const errorDiv = document.getElementById('formError');
const btn     = document.getElementById('f-btn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nombre   = document.getElementById('f-nombre').value.trim();
  const telefono = document.getElementById('f-telefono').value.trim();
  const nivel    = document.getElementById('f-nivel').value;
  const sede     = document.getElementById('f-sede').value;
  const mensaje  = document.getElementById('f-mensaje').value.trim();

  if (!nombre || !telefono) return;

  btn.textContent = 'Enviando...';
  btn.disabled = true;
  success.classList.remove('show');
  errorDiv.classList.remove('show');

  try {
    const res = await fetch('/contacto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, telefono, nivel, sede, mensaje })
    });
    const data = await res.json();

    if (data.ok) {
      success.classList.add('show');
      form.reset();
    } else {
      errorDiv.classList.add('show');
    }
  } catch (err) {
    errorDiv.classList.add('show');
  } finally {
    btn.textContent = 'Solicitar información ✉️';
    btn.disabled = false;
    setTimeout(() => {
      success.classList.remove('show');
      errorDiv.classList.remove('show');
    }, 6000);
  }
});

// ── SMOOTH REVEAL ON SCROLL ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.programa-card, .valor-card, .gal-item, .info-card, .servicio-card, .sede-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity .5s ease, transform .5s ease';
  observer.observe(el);
});
