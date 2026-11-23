// ============================================================
// Dashboard Docente - lógica principal
// ============================================================

// Catálogo de faltas (según capturas Figma)
const FALTAS_CONDUCTA = [
  'No realiza limpieza de su entorno',
  'Sale del aula sin permiso',
  'No porta uniforme de la U.E.',
  'Causa desorden en el aula',
  'Juega con el desayuno escolar',
  'Se expresa con palabras groseras',
  'Atraso (A)',
  'Molesta en horas de clase',
  'No tiene el cabello recogido / corte escolar',
  'No respeta a sus compañeras(os)',
  'Usa celular sin autorización',
  'Destroza el mobiliario del curso',
];

const FALTAS_PEDAGOGICA = [
  'No presentó tarea',
  'No realizó su examen',
  'No realizó su exposición',
  'No atiende en clases',
  'No realizó su trabajo práctico',
  'Copió la tarea en clases',
  'Realiza trabajos de otras asignaturas',
  'No tiene material de trabajo',
  'No tiene texto de lectura o apoyo',
];

const HINT = 'Registro para seguimiento y comunicación con el tutor.';

// Estado
let usuario = null;
let cursos = [];
let estudiantes = [];
let cursoActivoId = null;
let estudianteActivo = null;
let asistenciaSeleccionada = 'PRESENTE';

// Inicialización
(async () => {
  usuario = await getMe();
  if (!usuario || usuario.usuario.rol !== 'DOCENTE') {
    location.href = '/index.html';
    return;
  }
  usuario = usuario.usuario;
  document.getElementById('docenteReg').value = usuario.nombre;
  document.getElementById('materiaReg').value = usuario.materia || '';

  // Fecha por defecto: hoy
  document.getElementById('fechaReg').value = new Date().toISOString().split('T')[0];

  await cargarCursos();
  await cargarDocentesSelect();
  renderFaltas();
  bindUI();
})();

// Cargar cursos
async function cargarCursos() {
  try {
    cursos = await apiFetch('/api/cursos');
    const sel = document.getElementById('cursoSelect');
    sel.innerHTML = '';
    if (cursos.length === 0) {
      sel.innerHTML = '<option value="">Sin cursos disponibles</option>';
      return;
    }
    cursos.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
    cursoActivoId = cursos[0].id;
    await cargarEstudiantes();
  } catch (err) {
    toast('Error al cargar cursos', 'error');
  }
}

// Cargar docentes para el modal de curso
async function cargarDocentesSelect() {
  try {
    const docentes = await apiFetch('/api/cursos/docentes/listar');
    const sel = document.getElementById('cursoDocente');
    sel.innerHTML = '';
    docentes.forEach((d) => {
      const opt = document.createElement('option');
      opt.value = d.id;
      opt.textContent = d.nombre;
      sel.appendChild(opt);
    });
  } catch (err) {
    // no crítico
  }
}

// Cargar estudiantes del curso activo
async function cargarEstudiantes() {
  if (!cursoActivoId) return;
  try {
    estudiantes = await apiFetch(`/api/estudiantes?cursoId=${cursoActivoId}`);
    renderEstudiantes();
    // Llenar select de curso en modales
    const estCursoSel = document.getElementById('estCurso');
    const editCursoSel = document.getElementById('editCurso');
    [estCursoSel, editCursoSel].forEach((sel) => {
      sel.innerHTML = '';
      cursos.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.nombre;
        sel.appendChild(opt);
      });
    });
    document.getElementById('estCurso').value = cursoActivoId;
    document.getElementById('editCurso').value = cursoActivoId;
    document.getElementById('countEstudiantes').textContent = estudiantes.length;
  } catch (err) {
    toast('Error al cargar estudiantes', 'error');
  }
}

// Renderizar lista de estudiantes
function renderEstudiantes(filtro = '') {
  const list = document.getElementById('studentList');
  list.innerHTML = '';
  const filtrados = estudiantes.filter((e) =>
    e.nombre.toLowerCase().includes(filtro.toLowerCase())
  );
  if (filtrados.length === 0) {
    list.innerHTML = '<p style="color:var(--text-soft); padding:12px;">No se encontraron estudiantes.</p>';
    return;
  }
  filtrados.forEach((e) => {
    const row = document.createElement('div');
    row.className = 'student-row';
    row.dataset.id = e.id;
    row.innerHTML = `
      <div class="student-avatar">${iniciales(e.nombre)}</div>
      <div class="student-info">
        <div class="nm">${e.nombre}</div>
        <div class="num">N° ${e.numeroLista}</div>
      </div>
    `;
    row.addEventListener('click', () => seleccionarEstudiante(e));
    list.appendChild(row);
  });
}

// Seleccionar estudiante
function seleccionarEstudiante(e) {
  estudianteActivo = e;
  document.querySelectorAll('.student-row').forEach((r) => r.classList.remove('active'));
  document.querySelector(`.student-row[data-id="${e.id}"]`)?.classList.add('active');

  document.getElementById('kardexForm').style.display = 'block';
  document.getElementById('selNombre').textContent = `${e.nombre} · N° ${e.numeroLista}`;
  document.getElementById('selAvatar').textContent = iniciales(e.nombre);

  // Resetear checkboxes y asistencia
  document.querySelectorAll('.faltas-grid input[type="checkbox"]').forEach((cb) => (cb.checked = false));
  setAsistencia('PRESENTE');
  document.getElementById('obsReg').value = '';

  cargarHistorial(e.id);
}

// Renderizar checkboxes de faltas
function renderFaltas() {
  const gridC = document.getElementById('gridConducta');
  const gridP = document.getElementById('gridPedagogica');

  FALTAS_CONDUCTA.forEach((f) => {
    gridC.appendChild(crearFaltaItem(f, 'CONDUCTA'));
  });
  FALTAS_PEDAGOGICA.forEach((f) => {
    gridP.appendChild(crearFaltaItem(f, 'PEDAGOGICA'));
  });
}

function crearFaltaItem(falta, tipo) {
  const item = document.createElement('label');
  item.className = 'falta-item';
  item.innerHTML = `
    <input type="checkbox" value="${falta}" data-tipo="${tipo}" />
    <div>
      <span class="label">${falta}</span>
      <span class="hint">${HINT}</span>
    </div>
  `;
  return item;
}

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const t = tab.dataset.tab;
    document.getElementById('gridConducta').style.display = t === 'conducta' ? 'grid' : 'none';
    document.getElementById('gridPedagogica').style.display = t === 'pedagogica' ? 'grid' : 'none';
  });
});

// Asistencia
function setAsistencia(val) {
  asistenciaSeleccionada = val;
  document.querySelectorAll('.asistencia-btn').forEach((b) => {
    b.classList.toggle('active', b.dataset.val === val);
  });
}
document.querySelectorAll('.asistencia-btn').forEach((b) => {
  b.addEventListener('click', () => setAsistencia(b.dataset.val));
});

// Guardar registro
document.getElementById('btnGuardar').addEventListener('click', async () => {
  if (!estudianteActivo) {
    toast('Selecciona un estudiante', 'warn');
    return;
  }
  const checks = Array.from(document.querySelectorAll('.faltas-grid input[type="checkbox"]:checked'));
  if (checks.length === 0) {
    toast('Selecciona al menos una falta', 'warn');
    return;
  }
  const fecha = document.getElementById('fechaReg').value;
  const observaciones = document.getElementById('obsReg').value;

  try {
    for (const cb of checks) {
      await apiFetch('/api/kardex', {
        method: 'POST',
        body: JSON.stringify({
          fecha,
          tipo: cb.dataset.tipo,
          falta: cb.value,
          asistencia: asistenciaSeleccionada,
          observaciones,
          estudianteId: estudianteActivo.id,
          cursoId: cursoActivoId,
        }),
      });
    }
    toast(`✓ Registro guardado (${checks.length} falta(s))`, 'success');
    // Resetear checks
    checks.forEach((cb) => (cb.checked = false));
    document.getElementById('obsReg').value = '';
    await cargarHistorial(estudianteActivo.id);
  } catch (err) {
    toast(err.message, 'error');
  }
});

// Historial
async function cargarHistorial(estudianteId) {
  try {
    const registros = await apiFetch(`/api/kardex?estudianteId=${estudianteId}`);
    document.getElementById('countRegistros').textContent = `${registros.length} registro(s)`;
    const est = estudiantes.find((e) => e.id === estudianteId);
    document.getElementById('histSubtitle').textContent = `Faltas y observaciones registradas para ${est?.nombre || ''}`;

    const tbody = document.getElementById('historialBody');
    tbody.innerHTML = '';
    if (registros.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-soft);">Sin registros aún.</td></tr>';
      document.getElementById('historialCard').style.display = 'block';
      return;
    }
    registros.forEach((r) => {
      const tr = document.createElement('tr');
      const esConducta = r.tipo === 'CONDUCTA';
      tr.innerHTML = `
        <td>${fmtFecha(r.fecha)}</td>
        <td>${esConducta ? `<span class="tag tag-conducta">${r.falta}</span>` : '<span style="color:var(--text-soft);">Sin falta</span>'}</td>
        <td>${!esConducta ? `<span class="tag tag-pedagogica">${r.falta}</span>` : '<span style="color:var(--text-soft);">Sin falta</span>'}</td>
        <td class="${asistenciaClass(r.asistencia)}">${asistenciaLabel(r.asistencia)}</td>
        <td>${r.observaciones || '—'}</td>
        <td><div style="font-size:0.8rem;">${r.docente.nombre}<br><span style="color:var(--text-soft);">${r.docente.materia || ''}</span></div></td>
      `;
      tbody.appendChild(tr);
    });
    document.getElementById('historialCard').style.display = 'block';
  } catch (err) {
    console.error(err);
  }
}

function asistenciaClass(a) {
  if (a === 'PRESENTE') return 'tag-presente';
  if (a === 'ATRASO') return 'tag-atraso';
  return 'tag-falta';
}
function asistenciaLabel(a) {
  const map = { PRESENTE: 'Presente', ATRASO: 'Atraso', FSL: 'F.S.L.', FCL: 'F.C.L.' };
  return map[a] || a;
}

// ---- Bind UI ----
function bindUI() {
  // Cambio de curso
  document.getElementById('cursoSelect').addEventListener('change', async (e) => {
    cursoActivoId = parseInt(e.target.value, 10);
    estudianteActivo = null;
    document.getElementById('kardexForm').style.display = 'none';
    document.getElementById('historialCard').style.display = 'none';
    await cargarEstudiantes();
  });

  // Búsqueda
  document.getElementById('buscarEstudiante').addEventListener('input', (e) => {
    renderEstudiantes(e.target.value);
  });

  // Logout
  document.getElementById('btnLogout').addEventListener('click', async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    location.href = '/index.html';
  });

  // Notificaciones (placeholder)
  document.getElementById('btnNotif').addEventListener('click', () => {
    toast('No hay notificaciones nuevas', 'info');
  });

  // Modales
  document.getElementById('btnAddCurso').addEventListener('click', () => abrirModal('modalCurso'));
  document.getElementById('btnAddEstudiante').addEventListener('click', () => {
    document.getElementById('estCurso').value = cursoActivoId;
    abrirModal('modalEstudiante');
  });
  document.getElementById('btnEditarEstudiante').addEventListener('click', () => {
    if (!estudianteActivo) return;
    document.getElementById('editNumLista').value = estudianteActivo.numeroLista;
    document.getElementById('editNombre').value = estudianteActivo.nombre;
    document.getElementById('editCurso').value = estudianteActivo.cursoId;
    abrirModal('modalEditarEst');
  });

  // Cerrar modales
  document.querySelectorAll('[data-close]').forEach((el) => {
    el.addEventListener('click', () => cerrarModal(el.dataset.close));
  });
  document.querySelectorAll('.modal-overlay').forEach((ov) => {
    ov.addEventListener('click', (e) => {
      if (e.target === ov) ov.classList.remove('open');
    });
  });

  // Guardar curso
  document.getElementById('btnSaveCurso').addEventListener('click', saveCurso);

  // Guardar estudiante
  document.getElementById('btnSaveEstudiante').addEventListener('click', saveEstudiante);

  // Guardar edición
  document.getElementById('btnSaveEdit').addEventListener('click', saveEditEstudiante);

  // Eliminar estudiante
  document.getElementById('btnEliminarEstudiante').addEventListener('click', eliminarEstudiante);
}

// ---- Modal helpers ----
function abrirModal(id) {
  document.getElementById(id).classList.add('open');
}
function cerrarModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Guardar curso
async function saveCurso() {
  const nivel = document.getElementById('cursoNivel').value;
  const paralelo = document.getElementById('cursoParalelo').value.trim();
  const docenteId = document.getElementById('cursoDocente').value;
  if (!paralelo) {
    toast('Ingresa el paralelo', 'warn');
    return;
  }
  try {
    await apiFetch('/api/cursos', {
      method: 'POST',
      body: JSON.stringify({ nivel, paralelo, docenteId }),
    });
    toast('Curso creado exitosamente', 'success');
    cerrarModal('modalCurso');
    document.getElementById('cursoParalelo').value = '';
    await cargarCursos();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Guardar estudiante
async function saveEstudiante() {
  const numeroLista = document.getElementById('estNumLista').value;
  const nombre = document.getElementById('estNombre').value.trim();
  const cursoId = document.getElementById('estCurso').value;
  if (!numeroLista || !nombre || !cursoId) {
    toast('Completa todos los campos', 'warn');
    return;
  }
  try {
    await apiFetch('/api/estudiantes', {
      method: 'POST',
      body: JSON.stringify({ numeroLista, nombre, cursoId }),
    });
    toast('Estudiante agregado exitosamente', 'success');
    cerrarModal('modalEstudiante');
    document.getElementById('estNumLista').value = '';
    document.getElementById('estNombre').value = '';
    await cargarEstudiantes();
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Guardar edición de estudiante
async function saveEditEstudiante() {
  if (!estudianteActivo) return;
  const numeroLista = document.getElementById('editNumLista').value;
  const nombre = document.getElementById('editNombre').value.trim();
  const cursoId = document.getElementById('editCurso').value;
  try {
    const actualizado = await apiFetch(`/api/estudiantes/${estudianteActivo.id}`, {
      method: 'PUT',
      body: JSON.stringify({ numeroLista, nombre, cursoId }),
    });
    toast('Cambios guardados', 'success');
    cerrarModal('modalEditarEst');
    await cargarEstudiantes();
    estudianteActivo = actualizado;
    document.getElementById('selNombre').textContent = `${actualizado.nombre} · N° ${actualizado.numeroLista}`;
    document.getElementById('selAvatar').textContent = iniciales(actualizado.nombre);
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Eliminar estudiante
async function eliminarEstudiante() {
  if (!estudianteActivo) return;
  if (!confirm(`¿Eliminar a ${estudianteActivo.nombre}?`)) return;
  try {
    await apiFetch(`/api/estudiantes/${estudianteActivo.id}`, { method: 'DELETE' });
    toast('Estudiante eliminado', 'success');
    cerrarModal('modalEditarEst');
    estudianteActivo = null;
    document.getElementById('kardexForm').style.display = 'none';
    document.getElementById('historialCard').style.display = 'none';
    await cargarEstudiantes();
  } catch (err) {
    toast(err.message, 'error');
  }
}
