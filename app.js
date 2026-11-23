// ============================================================
// Express App - Ensambla middleware y rutas
// ============================================================
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const cursosRoutes = require('./routes/cursos');
const estudiantesRoutes = require('./routes/estudiantes');
const kardexRoutes = require('./routes/kardex');

const app = express();

// Middleware
app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(cookieParser());

// Sirve archivos estáticos de /public
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/cursos', cursosRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/kardex', kardexRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor.' });
});

module.exports = app;
