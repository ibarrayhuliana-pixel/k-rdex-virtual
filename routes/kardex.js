// ============================================================
// Rutas de Kardex: /api/kardex
// ============================================================
const express = require('express');
const { prisma } = require('../lib/prisma');
const { autenticar, soloDocente } = require('../lib/auth');

const router = express.Router();

router.use(autenticar);

// GET /api/kardex?estudianteId=X&cursoId=Y
// Historial cronológico de registros (lectura para todos)
router.get('/', async (req, res) => {
  try {
    const { estudianteId, cursoId } = req.query;
    const where = {};
    if (estudianteId) where.estudianteId = parseInt(estudianteId, 10);
    if (cursoId) where.cursoId = parseInt(cursoId, 10);

    const registros = await prisma.registroKardex.findMany({
      where,
      include: {
        estudiante: { select: { id: true, nombre: true, numeroLista: true } },
        curso: { select: { id: true, nombre: true } },
        docente: { select: { id: true, nombre: true, materia: true } },
      },
      orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json(registros);
  } catch (err) {
    console.error('GET kardex:', err);
    return res.status(500).json({ error: 'Error al obtener registros.' });
  }
});

// GET /api/kardex/resumen?estudianteId=X
// Resumen: total registros, % asistencia, conteos por tipo
router.get('/resumen', async (req, res) => {
  try {
    const { estudianteId } = req.query;
    if (!estudianteId) {
      return res.status(400).json({ error: 'estudianteId es obligatorio.' });
    }
    const id = parseInt(estudianteId, 10);

    const registros = await prisma.registroKardex.findMany({
      where: { estudianteId: id },
      select: { asistencia: true },
    });

    const total = registros.length;
    const presentes = registros.filter((r) => r.asistencia === 'PRESENTE' || r.asistencia === 'ATRASO').length;
    const faltas = registros.filter((r) => r.asistencia === 'FSL' || r.asistencia === 'FCL').length;
    const asistencia = total > 0 ? Math.round((presentes / total) * 100) : 100;

    return res.json({
      total,
      asistencia,
      presentes,
      faltas,
    });
  } catch (err) {
    console.error('GET kardex resumen:', err);
    return res.status(500).json({ error: 'Error al obtener resumen.' });
  }
});

// POST /api/kardex - crear registro (solo DOCENTE)
router.post('/', soloDocente, async (req, res) => {
  try {
    const { fecha, tipo, falta, asistencia, observaciones, estudianteId, cursoId } = req.body;
    const docenteId = req.user.id;

    if (!fecha || !tipo || !falta || !asistencia || !estudianteId || !cursoId) {
      return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    const registro = await prisma.registroKardex.create({
      data: {
        fecha: new Date(fecha),
        tipo,
        falta,
        asistencia,
        observaciones: observaciones || null,
        estudianteId: parseInt(estudianteId, 10),
        cursoId: parseInt(cursoId, 10),
        docenteId,
      },
      include: {
        estudiante: { select: { id: true, nombre: true, numeroLista: true } },
        curso: { select: { id: true, nombre: true } },
        docente: { select: { id: true, nombre: true, materia: true } },
      },
    });
    return res.status(201).json(registro);
  } catch (err) {
    console.error('POST kardex:', err);
    return res.status(500).json({ error: 'Error al registrar kardex.' });
  }
});

// PUT /api/kardex/:id - actualizar (solo DOCENTE)
router.put('/:id', soloDocente, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { fecha, tipo, falta, asistencia, observaciones } = req.body;

    const data = {};
    if (fecha !== undefined) data.fecha = new Date(fecha);
    if (tipo !== undefined) data.tipo = tipo;
    if (falta !== undefined) data.falta = falta;
    if (asistencia !== undefined) data.asistencia = asistencia;
    if (observaciones !== undefined) data.observaciones = observaciones || null;

    const registro = await prisma.registroKardex.update({
      where: { id },
      data,
      include: {
        estudiante: { select: { id: true, nombre: true, numeroLista: true } },
        curso: { select: { id: true, nombre: true } },
        docente: { select: { id: true, nombre: true, materia: true } },
      },
    });
    return res.json(registro);
  } catch (err) {
    console.error('PUT kardex:', err);
    return res.status(500).json({ error: 'Error al actualizar registro.' });
  }
});

// DELETE /api/kardex/:id - eliminar (solo DOCENTE)
router.delete('/:id', soloDocente, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.registroKardex.delete({ where: { id } });
    return res.json({ ok: true, mensaje: 'Registro eliminado.' });
  } catch (err) {
    console.error('DELETE kardex:', err);
    return res.status(500).json({ error: 'Error al eliminar registro.' });
  }
});

module.exports = router;
