// ============================================================
// Utilidades compartidas (toast, fetch helper, redirección)
// ============================================================

// Configuración base
const API = ''; // mismo origen

// Fetch helper con credenciales (cookies)
async function apiFetch(url, opts = {}) {
  const res = await fetch(API + url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

// Sistema de toasts
function toast(msg, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .3s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

// Obtener usuario actual
async function getMe() {
  try {
    return await apiFetch('/api/auth/me');
  } catch {
    return null;
  }
}

// Redirigir según rol
function redirectByRole(rol) {
  if (rol === 'DOCENTE') location.href = '/docente.html';
  else if (rol === 'PADRE_FAMILIA') location.href = '/padre.html';
  else location.href = '/index.html';
}

// Formatear fecha dd/mm/aaaa
function fmtFecha(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Iniciales de un nombre
function iniciales(nombre) {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}
