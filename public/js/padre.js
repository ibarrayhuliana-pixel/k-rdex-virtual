// ============================================================
// Dashboard Padre de Familia - vista de solo lectura
// ============================================================

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

let cursos = [];

// Inicialización
(async () => {
  const me = await getMe();
  if (!me || me.usuario.rol !== 'PADRE_FAMILIA') {
    location.href = '/index.html';
    return;
  }

  await cargarCursos();
  bindUI();
})();

// Cargar cursos
async function cargarCursos() {
  try {
    cursos = await apiFetch('/api/cursos');
    const sel = document.getElementById('cursoSelect');
    sel.innerHTML = '<option value="">Selecciona un curso</option>';
    cursos.forEach((c) => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.nombre;
      sel.appendChild(opt);
    });
  } catch (err) {
    toast('Error al cargar cursos', 'error');
  }
}

// Cargar estudiantes por curso
async function cargarEstudiantes(cursoId) {
  const sel = document.getElementById('estudianteSelect');
  sel.innerHTML = '<option value="">Cargando...</option>';
  sel.disabled = true;
  try {
    const estudiantes = await apiFetch(`/api/estudiantes?cursoId=${cursoId}`);
    sel.innerHTML = '<option value="">Selecciona un estudiante</option>';
    estudiantes.forEach((e) => {
      const opt = document.createElement('option');
      opt.value = e.id;
      opt.textContent = e.nombre;
      sel.appendChild(opt);
    });
    sel.disabled = false;
  } catch (err) {
    toast('Error al cargar estudiantes', 'error');
  }
}

// Cargar historial de un estudiante
async function cargarHistorial(estudianteId) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  try {
    const [registros, resumen] = await Promise.all([
      apiFetch(`/api/kardex?estudianteId=${estudianteId}`),
      apiFetch(`/api/kardex/resumen?estudianteId=${estudianteId}`),
    ]);

    // Resumen
    document.getElementById('statGrid').style.display = 'grid';
    document.getElementById('statAsistencia').textContent = `${resumen.asistencia}%`;
    document.getElementById('statRegistros').textContent = resumen.total;

    document.getElementById('historialCard').style.display = 'block';

    if (registros.length === 0) {
      timeline.innerHTML = '<p style="color:var(--text-soft);">Sin observaciones registradas.</p>';
      return;
    }

    registros.forEach((r) => {
      const fecha = new Date(r.fecha);
      const item = document.createElement('div');
      item.className = 'tl-item';
      const tagClass = r.tipo === 'CONDUCTA' ? 'tag-conducta' : 'tag-pedagogica';
      item.innerHTML = `
        <div class="tl-date">
          <div class="day">${fecha.getDate()}</div>
          <div class="mon">${MESES[fecha.getMonth()]}</div>
        </div>
        <div class="tl-card">
          <div class="top">
            <span class="tag ${tagClass}">${r.tipo}</span>
            <span class="time">${fmtHora(r.createdAt)}</span>
          </div>
          <strong style="font-size:1.1rem;">${r.falta}</strong>
          <p class="desc">${r.observaciones || 'Sin observaciones adicionales.'}</p>
          <div class="meta">
            <span>📄</span> ${r.docente.nombre} · ${r.docente.materia || ''}
          </div>
        </div>
      `;
      timeline.appendChild(item);
    });
  } catch (err) {
    toast('Error al cargar historial', 'error');
  }
}

function fmtHora(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Bind UI
function bindUI() {
  document.getElementById('cursoSelect').addEventListener('change', (e) => {
    const cursoId = e.target.value;
    const estSel = document.getElementById('estudianteSelect');
    if (!cursoId) {
      estSel.innerHTML = '<option value="">Primero selecciona un curso</option>';
      estSel.disabled = true;
      document.getElementById('historialCard').style.display = 'none';
      document.getElementById('statGrid').style.display = 'none';
      return;
    }
    cargarEstudiantes(cursoId);
  });

  document.getElementById('estudianteSelect').addEventListener('change', (e) => {
    const id = e.target.value;
    if (id) cargarHistorial(id);
    else {
      document.getElementById('historialCard').style.display = 'none';
      document.getElementById('statGrid').style.display = 'none';
    }
  });

  document.getElementById('btnLogout').addEventListener('click', async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' });
    location.href = '/index.html';
  });

  document.getElementById('btnNotif').addEventListener('click', () => {
    toast('No hay notificaciones nuevas', 'info');
  });
}
