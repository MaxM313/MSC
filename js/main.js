/* MAX SPATIAL CRAFT — main.js */

// ── CURSOR ──────────────────────────────────────────
var cur  = document.getElementById('cur');
var curf = document.getElementById('curf');
if (cur && curf) {
  var mx=0, my=0, fx=0, fy=0;
  document.addEventListener('mousemove', function(e){ mx=e.clientX; my=e.clientY; cur.style.left=mx+'px'; cur.style.top=my+'px'; });
  (function tick(){ fx+=(mx-fx)*.12; fy+=(my-fy)*.12; curf.style.left=fx+'px'; curf.style.top=fy+'px'; requestAnimationFrame(tick); })();
}

// ── NAV SCROLL ──────────────────────────────────────
var nav = document.getElementById('nav');
if (nav) window.addEventListener('scroll', function(){ nav.classList.toggle('scrolled', window.scrollY > 40); });

// ── HAMBURGER ───────────────────────────────────────
var hbg = document.getElementById('hbg');
var mob = document.getElementById('mob');
if (hbg && mob) {
  hbg.addEventListener('click', function(){
    hbg.classList.toggle('open');
    mob.classList.toggle('open');
  });
  mob.querySelectorAll('.mob-link').forEach(function(l){
    l.addEventListener('click', function(){
      hbg.classList.remove('open');
      mob.classList.remove('open');
    });
  });
}

// ── SCROLL REVEAL ────────────────────────────────────
var ro = new IntersectionObserver(function(entries){
  entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.rv').forEach(function(el){ ro.observe(el); });

// ── ACTIVE NAV LINK ──────────────────────────────────
var pg = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(function(l){
  var h = l.getAttribute('href');
  l.classList.toggle('active', h===pg || (pg===''&&h==='index.html'));
});

// ── CONTACT FORM ─────────────────────────────────────
var cf   = document.getElementById('cf');
var cfok = document.getElementById('cfok');
if (cf) {
  cf.addEventListener('submit', function(e){
    e.preventDefault();
    var b = cf.querySelector('button[type=submit]');
    b.textContent = 'Wysyłanie...';
    b.disabled = true;
    setTimeout(function(){
      b.textContent = 'Wyślij zapytanie →';
      b.disabled = false;
      cf.reset();
      if (cfok){ cfok.classList.add('show'); setTimeout(function(){ cfok.classList.remove('show'); }, 5000); }
    }, 1500);
  });
}
