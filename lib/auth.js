// ============================================================
// Middleware de Autenticación y Autorización
// ============================================================
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// Extrae el usuario del token JWT (cookie httpOnly)
function autenticar(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ error: 'No autorizado. Inicia sesión.' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload; // { id, nombre, rol, materia }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

// Solo DOCENTE puede mutar (POST/PUT/DELETE)
function soloDocente(req, res, next) {
  if (req.user?.rol !== 'DOCENTE') {
    return res.status(403).json({ error: 'Solo los docentes pueden realizar esta acción.' });
  }
  next();
}

// Middleware combinado: autentica y, si es mutación, exige DOCENTE
function protegerMutacion(req, res, next) {
  const metodosMutacion = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (metodosMutacion.includes(req.method)) {
    return soloDocente(req, res, next);
  }
  next();
}

module.exports = { autenticar, soloDocente, protegerMutacion, JWT_SECRET };
