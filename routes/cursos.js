// ============================================================
// Rutas de Cursos: /api/cursos
// ============================================================
const express = require('express');
const { prisma } = require('../lib/prisma');
const { autenticar, soloDocente } = require('../lib/auth');

const router = express.Router();

// Todos requieren autenticación
router.use(autenticar);

// GET /api/cursos - listar cursos (todos los usuarios autenticados)
router.get('/', async (req, res) => {
  try {
    const cursos = await prisma.curso.findMany({
      orderBy: [{ nivel: 'asc' }, { paralelo: 'asc' }],
      include: {
        docente: { select: { id: true, nombre: true, materia: true } },
        estudiantes: { where: { activo: true }, select: { id: true } },
      },
    });
    return res.json(cursos);
  } catch (err) {
    console.error('GET cursos:', err);
    return res.status(500).json({ error: 'Error al listar cursos.' });
  }
});

// GET /api/cursos/docentes/listar - listar docentes (DEBE ir antes que /:id)
router.get('/docentes/listar', async (req, res) => {
  try {
    const docentes = await prisma.user.findMany({
      where: { rol: 'DOCENTE' },
      select: { id: true, nombre: true, materia: true },
      orderBy: { nombre: 'asc' },
    });
    return res.json(docentes);
  } catch (err) {
    console.error('GET docentes:', err);
    return res.status(500).json({ error: 'Error al listar docentes.' });
  }
});

// GET /api/cursos/:id - detalle de un curso con estudiantes
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const curso = await prisma.curso.findUnique({
      where: { id },
      include: {
        docente: { select: { id: true, nombre: true, materia: true } },
        estudiantes: {
          where: { activo: true },
          orderBy: { numeroLista: 'asc' },
        },
      },
    });
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado.' });
    return res.json(curso);
  } catch (err) {
    console.error('GET curso:', err);
    return res.status(500).json({ error: 'Error al obtener curso.' });
  }
});

// POST /api/cursos - crear curso (solo DOCENTE)
router.post('/', soloDocente, async (req, res) => {
  try {
    const { nivel, paralelo, docenteId } = req.body;
    if (!nivel || !paralelo) {
      return res.status(400).json({ error: 'Nivel y paralelo son obligatorios.' });
    }
    const nombre = `${nivel.replace('Sexto de Secundaria', '6to de Secundaria')} "${paralelo}"`;

    const curso = await prisma.curso.create({
      data: {
        nivel,
        paralelo,
        nombre,
        docenteId: docenteId ? parseInt(docenteId, 10) : null,
      },
    });
    return res.status(201).json(curso);
  } catch (err) {
    console.error('POST curso:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Este curso ya existe.' });
    }
    return res.status(500).json({ error: 'Error al crear curso.' });
  }
});

module.exports = router;
