// ============================================================
// Rutas de Autenticación: /api/auth
// ============================================================
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');
const { autenticar, JWT_SECRET } = require('../lib/auth');

const router = express.Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 1000 * 60 * 60 * 8, // 8 horas
};

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { correo, password } = req.body;
    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    const usuario = await prisma.user.findUnique({ where: { correo } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const valida = await bcrypt.compare(password, usuario.password);
    if (!valida) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        materia: usuario.materia,
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, COOKIE_OPTS);

    return res.json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
        materia: usuario.materia,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/register  (solo PADRE_FAMILIA)
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, password } = req.body;
    if (!nombre || !correo || !password) {
      return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }

    const existe = await prisma.user.findUnique({ where: { correo } });
    if (existe) {
      return res.status(409).json({ error: 'Este correo ya está registrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const usuario = await prisma.user.create({
      data: {
        nombre,
        correo,
        password: hashed,
        rol: 'PADRE_FAMILIA',
        materia: null,
      },
    });

    const token = jwt.sign(
      { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol, materia: null },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.cookie('token', token, COOKIE_OPTS);

    return res.status(201).json({
      ok: true,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol,
      },
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', COOKIE_OPTS);
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', autenticar, (req, res) => {
  return res.json({
    ok: true,
    usuario: {
      id: req.user.id,
      nombre: req.user.nombre,
      rol: req.user.rol,
      materia: req.user.materia,
    },
  });
});

module.exports = router;
