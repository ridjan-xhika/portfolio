'use strict';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const projects = JSON.parse($('#project-data').textContent);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionEnabled = !reducedMotion.matches;
try { motionEnabled = motionEnabled && localStorage.getItem('portfolio-motion') !== 'off'; } catch { /* Private browsing can restrict storage. */ }
let redrawArtwork = () => {};

function applyMotion() {
  document.documentElement.classList.toggle('has-motion', motionEnabled);
  document.documentElement.classList.toggle('motion-off', !motionEnabled);
  const button = $('#motion-toggle');
  button.textContent = reducedMotion.matches ? 'Motion reduced' : motionEnabled ? 'Pause motion  Ⅱ' : 'Resume motion  ▷';
  button.setAttribute('aria-pressed', String(!motionEnabled));
  button.disabled = reducedMotion.matches;
  redrawArtwork();
}
$('#motion-toggle').addEventListener('click', () => {
  motionEnabled = !motionEnabled;
  try { localStorage.setItem('portfolio-motion', motionEnabled ? 'on' : 'off'); } catch { /* The toggle still works without persistence. */ }
  applyMotion();
});
reducedMotion.addEventListener('change', () => {
  motionEnabled = !reducedMotion.matches;
  try { motionEnabled = motionEnabled && localStorage.getItem('portfolio-motion') !== 'off'; } catch { /* Use system preference. */ }
  applyMotion();
});
applyMotion();
$('#year').textContent = new Date().getFullYear();

// Navigation stays ordinary anchor navigation, including without JavaScript.
const menuToggle = $('.menu-toggle');
const navigation = $('#nav-links');
function closeMenu() {
  menuToggle.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('is-open');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
$$('a', navigation).forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('is-open')) {
    closeMenu();
    menuToggle.focus();
  }
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav')) closeMenu();
});
matchMedia('(max-width: 650px)').addEventListener('change', closeMenu);

if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  $$('.reveal').forEach(element => revealObserver.observe(element));
  const activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.nav-links a').forEach(link => {
        if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  $$('main section[id]').forEach(section => activeObserver.observe(section));
}

// Filtering and details use the same publicly sourced project catalogue.
$$('.filter').forEach(button => button.addEventListener('click', () => {
  const filter = button.dataset.filter;
  let visible = 0;
  $$('.project-card').forEach(card => {
    card.hidden = filter !== 'all' && card.dataset.category !== filter;
    if (!card.hidden) visible++;
  });
  $$('.filter').forEach(item => {
    const active = item === button;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-pressed', String(active));
  });
  $('.projects-grid').classList.toggle('is-filtered', filter !== 'all');
  $('#project-count').textContent = `${visible} project${visible === 1 ? '' : 's'}`;
}));
const dialog = $('#project-dialog');
let dialogTrigger = null;
$$('[data-open-project]').forEach(button => button.addEventListener('click', () => {
  const project = projects.find(item => item.id === button.dataset.openProject);
  if (!project) return;
  dialogTrigger = button;
  $('#dialog-category').textContent = project.eyebrow;
  $('#dialog-title').textContent = project.name;
  $('#dialog-intro').textContent = project.intro;
  $('#dialog-points').replaceChildren(...project.points.map(point => {
    const item = document.createElement('li'); item.textContent = point; return item;
  }));
  $('#dialog-tags').replaceChildren(...project.stack.map(technology => {
    const item = document.createElement('li'); item.textContent = technology; return item;
  }));
  $('#dialog-repo').href = 'https://github.com/ridjan-xhika/' + project.repo;
  dialog.showModal();
  document.body.classList.add('modal-open');
}));
$('#dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  dialogTrigger?.focus({ preventScroll: true });
});

// This is a portfolio toy, never a shell. Input is written only as text.
const terminalOutput = $('#terminal-output');
const terminalInput = $('#terminal-input');
const history = [];
let historyPosition = 0;
const responses = {
  help: () => 'whoami     Meet Ridjan\nprojects   Browse the project list\nskills     Look at the workbench\nexperience Summer 2026 internships\nctf        Challenges and write-ups\nmusic      The coding soundtrack\ncontact    Say hello\nclear      Start with a fresh terminal',
  whoami: () => 'Ridjan Xhika — also known as Joker.\nEpitech student, developer, and CTF player.\nUsually on Linux. Always asking how it works.',
  skills: () => 'C · Rust · Python · JavaScript · TypeScript\nReact · Node.js · GTK · OpenCV · Dash\nLinux · Git · Docker · MySQL\nReverse engineering · web security · CTFs',
  projects: () => projects.map((p, i) => String(i + 1).padStart(2, '0') + '  ' + p.name).join('\n') + '\n\nOpen a project card above for details and code.',
  experience: () => 'June–August 2026 / Web development internships\n\nAttavi Couture — attavicouture.com\nAssogba Estate Group — assogbaestategroup.com\n\nBuilt websites for both companies.',
  ctf: () => 'DAMCTF 2025: RISCy Business & Hidden-Orongutang.\nDawgCTF 2025: participation with OwlSec.\n\nWrite-ups: github.com/ridjan-xhika/damctf',
  music: () => 'Anime in the headphones.\nTry the Spotify player just below this section.',
  contact: () => 'Email: joker4life@duck.com\nGitHub: github.com/ridjan-xhika\nOr follow the LinkedIn link in the footer.',
};
function runCommand(command) {
  const raw = command.trim();
  if (!raw) return;
  history.push(raw);
  if (history.length > 50) history.shift();
  historyPosition = history.length;
  if (raw.toLowerCase() === 'clear') {
    terminalOutput.replaceChildren();
  } else {
    const echo = document.createElement('p'); echo.className = 'input-echo'; echo.textContent = '~ $ ' + raw;
    const output = document.createElement('p');
    const handler = responses[raw.toLowerCase()] || (raw.toLowerCase() === 'about' ? responses.whoami : null);
    output.textContent = handler ? handler() : `Unknown command: ${raw}\nTry help. This terminal only knows portfolio commands.`;
    terminalOutput.append(echo, output);
    while (terminalOutput.children.length > 80) terminalOutput.firstElementChild.remove();
  }
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
  terminalInput.value = '';
}
$('#terminal-form').addEventListener('submit', event => { event.preventDefault(); runCommand(terminalInput.value); });
$$('[data-command]').forEach(button => button.addEventListener('click', () => { runCommand(button.dataset.command); terminalInput.focus({ preventScroll: true }); }));
terminalInput.addEventListener('keydown', event => {
  if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return;
  event.preventDefault();
  historyPosition = Math.max(0, Math.min(history.length, historyPosition + (event.key === 'ArrowUp' ? -1 : 1)));
  terminalInput.value = history[historyPosition] || '';
  terminalInput.setSelectionRange(terminalInput.value.length, terminalInput.value.length);
});

// Spotify is loaded only when requested; closing the player stops playback.
$('#spotify-toggle').addEventListener('click', () => {
  const button = $('#spotify-toggle');
  const container = $('#spotify-player');
  const open = button.getAttribute('aria-expanded') !== 'true';
  button.setAttribute('aria-expanded', String(open));
  container.hidden = !open;
  button.textContent = open ? 'Close player  ×' : 'Listen here  ▷';
  container.replaceChildren();
  if (open) {
    const frame = document.createElement('iframe');
    frame.src = 'https://open.spotify.com/embed/playlist/37i9dQZF1DXdBREWaHui4o?utm_source=generator&theme=0';
    frame.title = 'Best of Anime Now 2025 — Spotify playlist';
    frame.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    frame.height = '352';
    container.append(frame);
  }
});
$('#copy-email').addEventListener('click', async () => {
  const status = $('#copy-status');
  try {
    if (!navigator.clipboard) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText('joker4life@duck.com');
    status.textContent = 'Email copied.';
  } catch {
    status.textContent = 'Copy this address: joker4life@duck.com';
  }
});

// Original 3D point-and-line artwork on a 2D canvas. No libraries or external assets.
(() => {
  const canvas = $('#constellation');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  let width = 560, height = 560, frame = null, visible = true, last = 0, time = 0;
  let pointerX = 0, pointerY = 0;
  function project(x, y, z, angle) {
    const a = angle + pointerX * .18;
    const tilt = .35 + pointerY * .12;
    const rx = x * Math.cos(a) + z * Math.sin(a);
    const rz = -x * Math.sin(a) + z * Math.cos(a);
    const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
    const zz = y * Math.sin(tilt) + rz * Math.cos(tilt);
    const perspective = 3.8 / (3.8 - zz * .23);
    return [width * .51 + rx * width * .265 * perspective, height * .435 + ry * width * .265 * perspective, zz];
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cx = width * .51, cy = height * .435;
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, width * .43);
    glow.addColorStop(0, '#6b985124'); glow.addColorStop(.6, '#466c3120'); glow.addColorStop(1, '#10141100');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height);
    const angle = time * .1 + .4;
    // The latitude wires and longitude dots form a slowly rotating sphere.
    for (let latitude = -78; latitude <= 78; latitude += 12) {
      const lat = latitude * Math.PI / 180;
      let previous = null;
      for (let longitude = 0; longitude <= 360; longitude += 6) {
        const lon = longitude * Math.PI / 180;
        const point = project(Math.cos(lat) * Math.cos(lon), Math.sin(lat), Math.cos(lat) * Math.sin(lon), angle);
        if (previous) {
          ctx.strokeStyle = point[2] > 0 ? `rgba(187,224,153,${.13 + point[2] * .13})` : 'rgba(136,172,108,.055)';
          ctx.lineWidth = .7;
          ctx.beginPath(); ctx.moveTo(previous[0], previous[1]); ctx.lineTo(point[0], point[1]); ctx.stroke();
        }
        if (longitude % 18 === 0) {
          ctx.fillStyle = point[2] > 0 ? `rgba(204,242,174,${.38 + point[2] * .5})` : 'rgba(136,172,108,.12)';
          ctx.beginPath(); ctx.arc(point[0], point[1], point[2] > .3 ? 1.4 : .85, 0, Math.PI * 2); ctx.fill();
        }
        previous = point;
      }
    }
    for (const [rotation, scale, color] of [[-.55,.43,'#9bdca050'],[.67,.44,'#91b28b35'],[.03,.87,'#9cad8430']]) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rotation);
      ctx.strokeStyle = color; ctx.lineWidth = .8;
      ctx.beginPath(); ctx.ellipse(0, 0, width * .39, width * .39 * scale, 0, 0, Math.PI * 2); ctx.stroke();
      const orbit = angle * .6 + rotation * 4;
      const px = Math.cos(orbit) * width * .39, py = Math.sin(orbit) * width * .39 * scale;
      ctx.fillStyle = '#cfeaaf'; ctx.shadowBlur = 10; ctx.shadowColor = '#b9e5a2';
      ctx.beginPath(); ctx.arc(px, py, width * .005, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#8ea07720'; ctx.lineWidth = .6;
    ctx.beginPath(); ctx.moveTo(cx, cy - width * .33); ctx.lineTo(cx, cy + width * .33); ctx.stroke();
    ctx.fillStyle = '#bed3a8'; ctx.font = `${Math.max(8, width * .018)}px monospace`;
    ctx.fillText('∞', cx - width * .007, cy - width * .35);
  }
  function tick(now) {
    frame = null;
    if (!visible || document.hidden || !motionEnabled) return;
    if (now - last > 33) { time += Math.min((now - last) / 1000, .05); last = now; draw(); }
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = null;
    draw();
    if (visible && !document.hidden && motionEnabled) { last = performance.now(); frame = requestAnimationFrame(tick); }
  }
  function resize() {
    const box = canvas.getBoundingClientRect();
    width = box.width; height = box.height;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    sync();
  }
  canvas.parentElement.addEventListener('pointermove', event => {
    if (!motionEnabled) return;
    const box = canvas.getBoundingClientRect();
    pointerX = (event.clientX - box.left) / box.width - .5;
    pointerY = (event.clientY - box.top) / box.height - .5;
  });
  canvas.parentElement.addEventListener('pointerleave', () => { pointerX = 0; pointerY = 0; });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }, { threshold: 0 }).observe(canvas);
  new ResizeObserver(resize).observe(canvas);
  document.addEventListener('visibilitychange', sync);
  redrawArtwork = sync;
  resize();
})();
