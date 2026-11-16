/* Rutinas del socio: hasta 6 plantillas, con cada ejercicio desglosado serie a serie.
   Al entrenar se ve lo que se hizo la última vez en cada serie para saber qué superar. */
(function () {
  'use strict';
  const D = window.D, U = window.UI, esc = U.esc, ic = U.ic;
  const R = window.Rutinas = { ed: null, ses: null }, MAX = 6;
  const NOMBRES = ['Press banca', 'Press inclinado con mancuernas', 'Press militar', 'Fondos', 'Elevaciones laterales', 'Extensión de tríceps', 'Dominadas', 'Remo con barra', 'Jalón al pecho', 'Remo en polea', 'Curl de bíceps', 'Face pull', 'Sentadilla', 'Prensa', 'Peso muerto', 'Peso muerto rumano', 'Hip thrust', 'Zancadas', 'Extensión de cuádriceps', 'Curl femoral', 'Gemelos', 'Plancha', 'Crunch abdominal'];
  const LISTA = `<datalist id="ejs-rut">${NOMBRES.map(n => `<option value="${n}">`).join('')}</datalist>`;

  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) && n > 0 ? n : 0; };
  const marca = s => s ? (s.kg ? `${s.kg} kg × ${s.r}` : `${s.r} reps`) : '—';
  const haceDias = iso => { const d = D.diasDesde(iso); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`; };
  const copia = o => JSON.parse(JSON.stringify(o));
  const misRutinas = () => D.db.rutinas.filter(r => r.socioId === D.db.yo);

  // El entreno en curso se guarda en el dispositivo: si se cierra la ventana, no se pierde.
  const clave = () => 'gym_sesion' + location.pathname + '#' + D.db.yo;
  const guardaBorrador = () => { try { R.ses ? localStorage.setItem(clave(), JSON.stringify(R.ses)) : localStorage.removeItem(clave()); } catch (e) { /* sin almacenamiento: sigue en memoria */ } };
  const borrador = () => {
    if (R.ses && R.ses.uid !== D.db.yo) R.ses = null;
    if (!R.ses) { try { R.ses = JSON.parse(localStorage.getItem(clave()) || 'null'); } catch (e) { R.ses = null; } }
    return R.ses;
  };
  // Repinta la ventana sin perder la posición de desplazamiento
  const repinta = f => { const sh = document.querySelector('.sheet'), top = sh ? sh.scrollTop : 0; f(); const n = document.querySelector('.sheet'); if (n) n.scrollTop = top; };

  /* ---------- Lista de rutinas (pestaña de Progreso) ---------- */
  R.vista = () => {
    const ruts = misRutinas(), bor = borrador();
    const tarjeta = r => {
      const ult = D.entrenosDe(D.db.yo).find(e => e.rutinaId === r.id), nSets = r.ejercicios.reduce((t, x) => t + x.sets.length, 0);
      return `<article class="rutina"><div class="rut-h"><div><strong>${esc(r.nombre)}</strong><span>${r.ejercicios.length} ejercicios · ${nSets} series · ${ult ? 'Última vez ' + haceDias(ult.fecha) : 'Aún sin estrenar'}</span></div>
        <button class="btn mini sec" data-a="rutEditar" data-id="${r.id}">Editar</button></div>
        <p class="rut-ej">${r.ejercicios.map(x => esc(x.n)).join(' · ')}</p>
        <button class="btn terra ancho" data-a="rutEmpezar" data-id="${r.id}">Empezar rutina</button></article>`;
    };
    return `${bor ? `<div class="rutina en-curso"><div class="rut-h"><div><strong>${esc(bor.titulo)}</strong><span>Entreno en curso · ${bor.ejercicios.reduce((t, x) => t + x.sets.filter(s => s.ok).length, 0)} series hechas</span></div></div>
        <div class="acciones"><button class="btn terra" data-a="rutContinuar">Continuar</button><button class="btn sec" data-a="rutDescartar">Descartar</button></div></div>` : ''}
      <div class="sec-h"><h3>Mis rutinas</h3><span class="muted" style="font-size:13px">${ruts.length} de ${MAX}</span></div>
      ${ruts.map(tarjeta).join('') || '<div class="card"><p class="muted">Crea tu primera rutina con tus ejercicios y series. Cada vez que la hagas verás los kilos y repeticiones de la vez anterior.</p></div>'}
      <div class="acciones" style="flex-direction:column">${ruts.length < MAX ? `<button class="btn ancho" data-a="rutEditar">${ic('plus')} Nueva rutina</button>` : '<p class="aviso" style="margin:0">Tienes las 6 rutinas ocupadas. Edita o elimina una para crear otra.</p>'}
        <button class="btn ancho sec" data-a="nuevoEntreno">Registrar un entreno libre</button></div>`;
  };

  /* ---------- Editor de rutina ---------- */
  function pintaEditor() {
    const e = R.ed;
    repinta(() => U.modal(`<h2>${e.id ? 'Editar rutina' : 'Nueva rutina'}</h2><p class="sub">Pon los ejercicios y sus series. Los kilos son opcionales: al entrenar verás los de la última vez.</p>
      <label class="campo"><span>Nombre de la rutina</span><input class="inp" data-in="reNombre" value="${esc(e.nombre)}" maxlength="40" placeholder="Empuje, Pierna, Día 1…"></label>
      ${e.ejercicios.map((x, i) => `<div class="rs-ej"><div class="rs-ej-h"><input class="inp" list="ejs-rut" data-in="reEj" data-e="${i}" value="${esc(x.n)}" maxlength="40" placeholder="Nombre del ejercicio" aria-label="Nombre del ejercicio ${i + 1}">
          <button class="icbtn" data-a="reQuitaEj" data-e="${i}" aria-label="Quitar ejercicio">${ic('trash')}</button></div>
        <div class="re-row rs-head"><span>Serie</span><span>Reps</span><span>Kg</span><span></span></div>
        ${x.sets.map((s, j) => `<div class="re-row"><span class="rs-n">${j + 1}</span>
          <input class="inp" type="number" inputmode="numeric" min="0" data-in="reSet" data-e="${i}" data-s="${j}" data-f="r" value="${s.r || ''}" placeholder="0" aria-label="Repeticiones de la serie ${j + 1}">
          <input class="inp" type="number" inputmode="decimal" min="0" step="0.5" data-in="reSet" data-e="${i}" data-s="${j}" data-f="kg" value="${s.kg || ''}" placeholder="—" aria-label="Kilos de la serie ${j + 1}">
          <button class="icbtn" data-a="reQuitaSet" data-e="${i}" data-s="${j}" aria-label="Quitar serie">${ic('x')}</button></div>`).join('')}
        <button class="btn mini sec" data-a="reMasSet" data-e="${i}">${ic('plus')} Añadir serie</button></div>`).join('')}
      ${LISTA}<button class="btn ancho sec" data-a="reMasEj">${ic('plus')} Añadir ejercicio</button>
      <div class="acciones" style="flex-direction:column"><button class="btn terra ancho" data-a="reGuardar">Guardar rutina</button>
        ${e.id ? `<button class="btn peligro ancho" data-a="reBorrar">${ic('trash')} Eliminar rutina</button>` : ''}</div>`));
  }

  /* ---------- Sesión de entrenamiento ---------- */
  const filaSesion = (objetivo, anterior) => ({ kg: '', r: '', ok: false, obj: objetivo || null, ant: anterior || null });
  const pista = (s, f) => { const o = s.ant || s.obj; return o && o[f] ? o[f] : ''; };
  function pintaSesion() {
    const z = R.ses, total = z.ejercicios.reduce((t, x) => t + x.sets.length, 0), hechas = z.ejercicios.reduce((t, x) => t + x.sets.filter(s => s.ok).length, 0);
    repinta(() => U.modal(`<p class="eyebrow">Entreno en curso</p><h2>${esc(z.titulo)}</h2>
      <p class="sub">Marca cada serie al terminarla. En gris, lo que hiciste la última vez: a superarlo.</p>
      <div class="barra-p terra" style="margin-bottom:16px"><i style="width:${total ? hechas / total * 100 : 0}%"></i></div>
      ${z.ejercicios.map((x, i) => `<div class="rs-ej"><div class="rs-ej-h">${x.libre ? `<input class="inp" list="ejs-rut" data-in="rsEj" data-ch="rsEjFin" data-e="${i}" value="${esc(x.n)}" maxlength="40" placeholder="Nombre del ejercicio" aria-label="Nombre del ejercicio">` : `<strong>${esc(x.n)}</strong>`}
          <button class="icbtn" data-a="rsQuitaEj" data-e="${i}" aria-label="Quitar ejercicio de hoy">${ic('x')}</button></div>
        <div class="rs-row rs-head"><span style="text-align:center">#</span><span>Anterior</span><span>Kg</span><span>Reps</span><span></span></div>
        ${x.sets.map((s, j) => `<div class="rs-row ${s.ok ? 'hecha' : ''}"><span class="rs-n">${j + 1}</span><span class="rs-ant">${marca(s.ant)}</span>
          <input class="inp" type="number" inputmode="decimal" min="0" step="0.5" data-in="rsSet" data-e="${i}" data-s="${j}" data-f="kg" value="${s.kg}" placeholder="${pista(s, 'kg') || '—'}" aria-label="Kilos, serie ${j + 1}">
          <input class="inp" type="number" inputmode="numeric" min="0" data-in="rsSet" data-e="${i}" data-s="${j}" data-f="r" value="${s.r}" placeholder="${pista(s, 'r') || '0'}" aria-label="Repeticiones, serie ${j + 1}">
          <button class="rs-ok ${s.ok ? 'on' : ''}" data-a="rsOk" data-e="${i}" data-s="${j}" aria-pressed="${s.ok}" aria-label="Serie ${j + 1} hecha">${ic('check')}</button></div>`).join('')}
        <div class="acciones" style="margin-top:8px"><button class="btn mini sec" data-a="rsMasSet" data-e="${i}">${ic('plus')} Serie</button>${x.sets.length > 1 ? `<button class="btn mini sec" data-a="rsQuitaSet" data-e="${i}">Quitar última</button>` : ''}</div></div>`).join('')}
      ${LISTA}<button class="btn ancho sec" data-a="rsMasEj">${ic('plus')} Añadir ejercicio</button>
      <label class="campo" style="margin-top:16px"><span>Cómo ha ido (opcional)</span><textarea class="inp" data-in="rsNota" maxlength="240" placeholder="Sensaciones, notas…">${esc(z.nota)}</textarea></label>
      <label class="check"><input type="checkbox" data-ch="rsPublicar" ${z.publicar ? 'checked' : ''}> Publicarlo en el muro de la comunidad</label>
      <div class="acciones" style="flex-direction:column"><button class="btn terra ancho" data-a="rsTerminar">Terminar entreno · ${hechas} de ${total} series</button>
        <button class="btn sec ancho" data-a="cerrar">Seguir más tarde</button></div>`));
  }
  function empezar(rut) {
    R.ses = { uid: D.db.yo, rutinaId: rut.id, titulo: rut.nombre, nota: '', publicar: true,
      ejercicios: rut.ejercicios.map(x => { const ant = D.ultimo(x.n) || []; return { n: x.n, sets: x.sets.map((s, j) => filaSesion(s, ant[j])) }; }) };
    guardaBorrador(); pintaSesion(); U.render();
  }

  Object.assign(U.actions, {
    rutEditar(d) {
      const r = d.id && misRutinas().find(x => x.id === +d.id);
      R.ed = r ? copia({ id: r.id, nombre: r.nombre, ejercicios: r.ejercicios }) : { id: null, nombre: '', ejercicios: [{ n: '', sets: [{ r: 10, kg: 0 }, { r: 10, kg: 0 }, { r: 10, kg: 0 }] }] };
      pintaEditor();
    },
    reMasEj() { R.ed.ejercicios.push({ n: '', sets: [{ r: 10, kg: 0 }, { r: 10, kg: 0 }, { r: 10, kg: 0 }] }); pintaEditor(); },
    reQuitaEj(d) { R.ed.ejercicios.splice(+d.e, 1); pintaEditor(); },
    reMasSet(d) { const s = R.ed.ejercicios[+d.e].sets; s.push(copia(s[s.length - 1] || { r: 10, kg: 0 })); pintaEditor(); },
    reQuitaSet(d) { const s = R.ed.ejercicios[+d.e].sets; if (s.length > 1) s.splice(+d.s, 1); else U.toast('Cada ejercicio necesita al menos una serie'); pintaEditor(); },
    async reGuardar(d, el) {
      const e = R.ed, ej = e.ejercicios.filter(x => x.n.trim()).map(x => ({ n: x.n.trim(), sets: x.sets.map(s => ({ r: Math.round(num(s.r)), kg: num(s.kg) })) }));
      if (!e.nombre.trim()) return U.toast('Ponle un nombre a la rutina', 'bad');
      if (!ej.length) return U.toast('Añade al menos un ejercicio con nombre', 'bad');
      el.disabled = true;
      if (await D.guardarRutina({ id: e.id, nombre: e.nombre.trim(), ejercicios: ej })) { R.ed = null; U.cerrar(); } else el.disabled = false;
    },
    async reBorrar(d, el) {
      if (!el.dataset.seguro) { el.dataset.seguro = '1'; el.textContent = 'Pulsa otra vez para eliminarla (tus entrenos se conservan)'; return; }
      el.disabled = true;
      if (await D.borrarRutina(R.ed.id)) { R.ed = null; U.cerrar(); }
    },
    rutEmpezar(d) {
      const r = misRutinas().find(x => x.id === +d.id);
      if (borrador()) { U.toast('Ya tienes un entreno en curso: termínalo o descártalo'); return pintaSesion(); }
      empezar(r);
    },
    rutContinuar() { if (borrador()) pintaSesion(); },
    rutDescartar(d, el) {
      if (!el.dataset.seguro) { el.dataset.seguro = '1'; el.textContent = 'Pulsa otra vez para descartarlo'; return; }
      R.ses = null; guardaBorrador(); U.render(); U.toast('Entreno descartado');
    },
    rsOk(d) {
      const s = R.ses.ejercicios[+d.e].sets[+d.s];
      if (!s.ok) {
        if (s.kg === '') s.kg = pista(s, 'kg'); if (s.r === '') s.r = pista(s, 'r');
        if (!num(s.r)) return U.toast('Pon las repeticiones de esa serie', 'bad');
      }
      s.ok = !s.ok; guardaBorrador(); pintaSesion();
    },
    rsMasSet(d) {
      const x = R.ses.ejercicios[+d.e], ant = D.ultimo(x.n) || [], ult = x.sets[x.sets.length - 1];
      x.sets.push(filaSesion(ult ? { r: num(ult.r) || pista(ult, 'r'), kg: num(ult.kg) || pista(ult, 'kg') } : null, ant[x.sets.length]));
      guardaBorrador(); pintaSesion();
    },
    rsQuitaSet(d) { R.ses.ejercicios[+d.e].sets.pop(); guardaBorrador(); pintaSesion(); },
    rsMasEj() { R.ses.ejercicios.push({ n: '', libre: true, sets: [filaSesion(), filaSesion(), filaSesion()] }); guardaBorrador(); pintaSesion(); },
    rsQuitaEj(d, el) {
      if (!el.dataset.seguro) { el.dataset.seguro = '1'; el.style.color = 'var(--bad-tx)'; return U.toast('Pulsa otra vez la X para quitar este ejercicio de hoy'); }
      R.ses.ejercicios.splice(+d.e, 1); guardaBorrador(); pintaSesion();
    },
    async rsTerminar(d, el) {
      const z = R.ses, ej = z.ejercicios.map(x => ({ n: x.n.trim(), sets: x.sets.filter(s => s.ok).map(s => ({ r: Math.round(num(s.r)), kg: num(s.kg) })) })).filter(x => x.n && x.sets.length);
      if (!ej.length) return U.toast('Marca al menos una serie como hecha', 'bad');
      el.disabled = true;
      const antes = D.logros(D.yo()).filter(l => l.ok).map(l => l.id);
      const r = await D.guardarEntreno({ titulo: z.titulo, tipo: 'Fuerza', nota: z.nota.trim(), ejercicios: ej, publicar: z.publicar, rutinaId: z.rutinaId });
      if (!r) { el.disabled = false; return; }
      R.ses = null; guardaBorrador(); U.cerrar(); U.render();
      const pts = r.puntos ? ` · +${r.puntos} puntos` : '';
      U.toast(r.prs.length ? `🏆 Nuevo récord en ${r.prs.join(', ')}${pts}` : `Entreno guardado${pts}`, 'ok');
      D.logros(D.yo()).filter(l => l.ok && !antes.includes(l.id)).forEach(l => setTimeout(() => U.toast(`${l.e} Logro desbloqueado: ${l.n}`, 'ok'), 900));
    }
  });

  Object.assign(U.inputs, {
    reNombre: v => { R.ed.nombre = v; },
    reEj: (v, el) => { R.ed.ejercicios[+el.dataset.e].n = v; },
    reSet: (v, el) => { R.ed.ejercicios[+el.dataset.e].sets[+el.dataset.s][el.dataset.f] = v; },
    rsSet: (v, el) => { R.ses.ejercicios[+el.dataset.e].sets[+el.dataset.s][el.dataset.f] = v; guardaBorrador(); },
    rsEj: (v, el) => { R.ses.ejercicios[+el.dataset.e].n = v; guardaBorrador(); },
    rsNota: v => { R.ses.nota = v; guardaBorrador(); }
  });
  Object.assign(U.changes, {
    rsPublicar: (v, el) => { R.ses.publicar = el.checked; guardaBorrador(); },
    // Al escribir el nombre de un ejercicio añadido sobre la marcha, busca lo que se hizo la última vez
    rsEjFin: (v, el) => { const x = R.ses.ejercicios[+el.dataset.e], ant = D.ultimo(v) || []; x.sets.forEach((s, j) => { s.ant = ant[j] || null; }); guardaBorrador(); pintaSesion(); }
  });
})();
