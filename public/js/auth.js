// ============================================================
// Lógica de autenticación (index.html)
// ============================================================

const roleSwitch = document.getElementById('roleSwitch');
const loginForm = document.getElementById('loginForm');
const registerArea = document.getElementById('registerArea');
const registerForm = document.getElementById('registerForm');
const showRegisterBtn = document.getElementById('showRegister');
const cancelRegisterBtn = document.getElementById('cancelRegister');

let currentRole = 'DOCENTE';

// Verificar si ya hay sesión activa
(async () => {
  const me = await getMe();
  if (me?.usuario) redirectByRole(me.usuario.rol);
})();

// Cambio de rol
roleSwitch.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  roleSwitch.querySelectorAll('button').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  currentRole = btn.dataset.role;
  // Mostrar registro solo para padres
  if (currentRole === 'PADRE_FAMILIA') {
    registerArea.style.display = 'block';
  } else {
    registerArea.style.display = 'none';
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  }
});

// Login
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const correo = document.getElementById('loginCorreo').value.trim();
  const password = document.getElementById('loginPass').value;

  try {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    });
    toast('Bienvenido, ' + res.usuario.nombre, 'success');
    setTimeout(() => redirectByRole(res.usuario.rol), 600);
  } catch (err) {
    toast(err.message, 'error');
  }
});

// Mostrar formulario de registro
showRegisterBtn.addEventListener('click', () => {
  loginForm.style.display = 'none';
  registerArea.style.display = 'none';
  registerForm.style.display = 'block';
});

// Cancelar registro
cancelRegisterBtn.addEventListener('click', () => {
  registerForm.style.display = 'none';
  loginForm.style.display = 'block';
  registerArea.style.display = 'block';
  registerForm.reset();
});

// Registro (padre)
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nombre = document.getElementById('regNombre').value.trim();
  const correo = document.getElementById('regCorreo').value.trim();
  const password = document.getElementById('regPass').value;

  try {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nombre, correo, password }),
    });
    toast('Cuenta creada exitosamente', 'success');
    setTimeout(() => redirectByRole(res.usuario.rol), 600);
  } catch (err) {
    toast(err.message, 'error');
  }
});

// Olvidó contraseña (placeholder)
document.getElementById('forgotLink').addEventListener('click', (e) => {
  e.preventDefault();
  toast('Contacta a la administración para restablecer tu contraseña.', 'warn');
});
