// ============================================================
// Rutas de Estudiantes: /api/estudiantes
// ============================================================
const express = require('express');
const { prisma } = require('../lib/prisma');
const { autenticar, soloDocente } = require('../lib/auth');

const router = express.Router();

router.use(autenticar);

// GET /api/estudiantes?cursoId=X
router.get('/', async (req, res) => {
  try {
    const { cursoId } = req.query;
    const where = { activo: true };
    if (cursoId) where.cursoId = parseInt(cursoId, 10);

    const estudiantes = await prisma.estudiante.findMany({
      where,
      include: {
        curso: { select: { id: true, nombre: true } },
      },
      orderBy: [{ cursoId: 'asc' }, { numeroLista: 'asc' }],
    });
    return res.json(estudiantes);
  } catch (err) {
    console.error('GET estudiantes:', err);
    return res.status(500).json({ error: 'Error al listar estudiantes.' });
  }
});

// GET /api/estudiantes/:id
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        curso: { select: { id: true, nombre: true } },
      },
    });
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });
    return res.json(estudiante);
  } catch (err) {
    console.error('GET estudiante:', err);
    return res.status(500).json({ error: 'Error al obtener estudiante.' });
  }
});

// POST /api/estudiantes - crear (solo DOCENTE)
router.post('/', soloDocente, async (req, res) => {
  try {
    const { numeroLista, nombre, codigo, cursoId } = req.body;
    if (!numeroLista || !nombre || !cursoId) {
      return res.status(400).json({ error: 'N° de lista, nombre y curso son obligatorios.' });
    }

    const estudiante = await prisma.estudiante.create({
      data: {
        numeroLista: parseInt(numeroLista, 10),
        nombre,
        codigo: codigo || null,
        cursoId: parseInt(cursoId, 10),
      },
      include: { curso: { select: { id: true, nombre: true } } },
    });
    return res.status(201).json(estudiante);
  } catch (err) {
    console.error('POST estudiante:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un estudiante con ese número de lista en este curso.' });
    }
    return res.status(500).json({ error: 'Error al crear estudiante.' });
  }
});

// PUT /api/estudiantes/:id - actualizar (solo DOCENTE)
router.put('/:id', soloDocente, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { numeroLista, nombre, codigo, cursoId } = req.body;

    const data = {};
    if (numeroLista !== undefined) data.numeroLista = parseInt(numeroLista, 10);
    if (nombre !== undefined) data.nombre = nombre;
    if (codigo !== undefined) data.codigo = codigo || null;
    if (cursoId !== undefined) data.cursoId = parseInt(cursoId, 10);

    const estudiante = await prisma.estudiante.update({
      where: { id },
      data,
      include: { curso: { select: { id: true, nombre: true } } },
    });
    return res.json(estudiante);
  } catch (err) {
    console.error('PUT estudiante:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ya existe un estudiante con ese número de lista en este curso.' });
    }
    return res.status(500).json({ error: 'Error al actualizar estudiante.' });
  }
});

// DELETE /api/estudiantes/:id - soft delete (solo DOCENTE)
router.delete('/:id', soloDocente, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.estudiante.update({
      where: { id },
      data: { activo: false },
    });
    return res.json({ ok: true, mensaje: 'Estudiante eliminado.' });
  } catch (err) {
    console.error('DELETE estudiante:', err);
    return res.status(500).json({ error: 'Error al eliminar estudiante.' });
  }
});

module.exports = router;
