/* Aforo en directo: cuántas personas hay dentro del gimnasio ahora mismo.
   Cuenta a quien pasó el QR por el torno al entrar y aún no lo ha pasado al salir
   (si no lo pasa al salir, se le da por fuera tras la estancia máxima).
   Tarjeta en el inicio del socio y apartado "Aforo" en el panel. Compartido por la demo y la app real. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, D = window.D, U = window.UI, esc = U.esc, ic = U.ic, avatar = U.avatar;
  const AF = window.Aforo = { sentido: 'entrada' };
  const DIAS_PL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

  const apertura = d => (C.apertura || [])[D.diaSemana(d)] || null;
  const fmtH = h => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const nivel = p => p < 0.35 ? { c: 'ok', t: 'Tranquilo' } : p < 0.7 ? { c: 'warn', t: 'Ambiente moderado' } : { c: 'bad', t: 'Muy concurrido' };
  const hace = ts => { const s = (Date.now() - ts) / 1000; return s < 60 ? 'hace un momento' : s < 3600 ? `hace ${Math.floor(s / 60)} min` : 'hace más de una hora'; };
  const duracion = ms => { const m = Math.max(0, Math.round(ms / 6e4)); return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
  // Horas en las que abre hoy: [7, 8, …, 21]
  const horasHoy = () => { const a = apertura(D.hoy()); return a ? Array.from({ length: a[1] - a[0] }, (_, i) => a[0] + i) : []; };

  function estado() {
    const ahora = new Date(), a = apertura(ahora), h = ahora.getHours() + ahora.getMinutes() / 60;
    if (a && h >= a[0] && h < a[1]) return { abierto: true, texto: `Abierto hasta las ${fmtH(a[1])}` };
    for (let i = 0; i < 8; i++) {
      const d = D.addDays(D.hoy(), i), x = apertura(d);
      if (!x || (i === 0 && h >= x[0])) continue;
      const cuando = i === 0 ? 'hoy' : i === 1 ? 'mañana' : 'el ' + d.toLocaleDateString('es-ES', { weekday: 'long' });
      return { abierto: false, texto: `Abre ${cuando} a las ${fmtH(x[0])}` };
    }
    return { abierto: false, texto: 'Cerrado' };
  }
  const habitual = a => !!(a.tipico && a.tipico.some(v => v > 0));

  /* ---------- Gráfico por horas ---------- */
  function graficoSocio(a, abierto) {
    const hs = horasHoy();
    if (!hs.length) return '';
    const tip = habitual(a), base = tip ? a.tipico : (a.hoy || []).map(v => v || 0), ahoraH = new Date().getHours();
    const vals = hs.map(h => abierto && h === ahoraH ? a.dentro : (base[h] || 0)), mx = Math.max(1, ...vals);
    const cols = `style="grid-template-columns:repeat(${hs.length},1fr)"`;
    return `<div class="af-g" ${cols} aria-hidden="true">${hs.map((h, i) => `<i class="${abierto && h === ahoraH ? 'ahora' : ''}" style="height:${Math.max(4, vals[i] / mx * 100)}%" title="${h}:00 · ${String(vals[i]).replace('.', ',')} personas"></i>`).join('')}</div>
      <div class="af-x" ${cols} aria-hidden="true">${hs.map(h => `<span>${(h - hs[0]) % 3 === 0 ? h + 'h' : ''}</span>`).join('')}</div>
      <p class="af-ley"><span><i class="cuadro"></i>${tip ? `Lo habitual los ${DIAS_PL[D.diaSemana(D.hoy())]}` : 'Cómo ha ido hoy'}</span>${abierto ? '<span><i class="cuadro ahora"></i>Ahora</span>' : ''}</p>`;
  }

  /* ---------- Tarjeta del inicio del socio ---------- */
  AF.tarjeta = () => {
    const a = D.af;
    if (!a) return '';
    const e = estado();
    const cab = `<div class="sec-h"><h3>Aforo ahora</h3><span class="af-live ${e.abierto ? '' : 'off'}"><i></i>${e.abierto ? 'En directo' : 'Cerrado'}</span></div>`;
    if (!e.abierto) {
      return `<section class="blq" data-aforo="socio">${cab}<div class="card aforo">
        <div class="af-main"><div class="af-num"><b>Cerrado</b><span>${esc(e.texto)}</span></div><span class="pill muted">Cerrado</span></div>
        ${graficoSocio(a, false)}</div></section>`;
    }
    const p = a.max ? Math.min(1, a.dentro / a.max) : 0, n = nivel(p), ahoraH = new Date().getHours();
    let consejo = p >= 0.7 ? 'Ahora mismo está muy lleno.' : p < 0.35 ? 'Buen momento para venir.' : '';
    if (habitual(a)) {
      const luego = horasHoy().filter(h => h > ahoraH && a.tipico[h] != null);
      const mejor = luego.reduce((m, h) => (m === null || a.tipico[h] < a.tipico[m] ? h : m), null);
      if (mejor !== null && a.tipico[mejor] < a.dentro) consejo += ` Suele haber menos gente hacia las ${mejor}:00.`;
    }
    return `<section class="blq" data-aforo="socio">${cab}<div class="card aforo">
      <div class="af-main"><div class="af-num"><b>${a.dentro}</b><span>${a.dentro === 1 ? 'persona entrenando' : 'personas entrenando'}</span></div><span class="pill ${n.c}">${n.t}</span></div>
      <div class="barra-p af-barra ${n.c}" role="img" aria-label="${Math.round(p * 100)} por ciento del aforo"><i style="width:${Math.max(2, p * 100)}%"></i></div>
      <div class="af-cap"><span>${Math.round(p * 100)} % del aforo · máximo ${a.max}</span><span>Actualizado ${hace(a.ts)}</span></div>
      ${graficoSocio(a, true)}
      ${consejo ? `<p class="af-tip">${ic('clock')}<span>${esc(consejo.trim())}</span></p>` : ''}</div></section>`;
  };

  /* ---------- Apartado "Aforo" del panel ---------- */
  AF.panel = () => {
    const a = D.af || { dentro: 0, max: 0, estancia: 3, hoy: [], tipico: null, ts: Date.now() };
    const ahora = Date.now(), lista = D.dentroEn(ahora, a.estancia).sort((x, y) => x.desde - y.desde);
    const e = estado(), p = a.max ? Math.min(1, lista.length / a.max) : 0, n = nivel(p), ahoraH = new Date().getHours();
    const hoyIni = D.hoy().getTime(), entradas = D.db.accesos.filter(x => x.ok && x.ts >= hoyIni).length;
    let pico = lista.length, picoH = e.abierto && lista.length ? ahoraH : null;
    (a.hoy || []).forEach((v, h) => { if (v != null && v > pico) { pico = v; picoH = h; } });

    const hs = horasHoy(), tip = habitual(a);
    const hoyV = h => (h === ahoraH && e.abierto ? lista.length : a.hoy && a.hoy[h] != null && h <= ahoraH ? a.hoy[h] : null);
    const mx = Math.max(1, ...hs.map(h => Math.max(hoyV(h) || 0, tip ? a.tipico[h] || 0 : 0)));
    const cols = `style="grid-template-columns:repeat(${hs.length},1fr)"`;
    const grafico = hs.length ? `<div class="af-g doble" ${cols} aria-hidden="true">${hs.map(h => {
        const v = hoyV(h), t = tip ? a.tipico[h] || 0 : null;
        return `<div class="af-col" title="${h}:00 · hoy ${v == null ? '—' : v}${t != null ? ' · habitual ' + String(t).replace('.', ',') : ''}">${t != null ? `<i style="height:${Math.max(2, t / mx * 100)}%"></i>` : ''}${v != null ? `<i class="hoy ${h === ahoraH && e.abierto ? 'ahora' : ''}" style="height:${Math.max(2, v / mx * 100)}%"></i>` : '<i style="visibility:hidden"></i>'}</div>`;
      }).join('')}</div><div class="af-x" ${cols} aria-hidden="true">${hs.map(h => `<span>${(h - hs[0]) % 2 === 0 ? h + 'h' : ''}</span>`).join('')}</div>
      <p class="af-ley"><span><i class="cuadro hoy"></i>Hoy</span>${tip ? `<span><i class="cuadro"></i>Lo habitual los ${DIAS_PL[D.diaSemana(D.hoy())]}</span>` : ''}${e.abierto ? '<span><i class="cuadro ahora"></i>Ahora</span>' : ''}</p>
      ${tip ? '' : '<p class="aviso">Cuando haya unas semanas de entradas, aquí verás también lo habitual de cada día para compararlo con hoy.</p>'}`
      : '<p class="vacio">Hoy el gimnasio no abre.</p>';

    return `<div data-aforo="panel"><div class="main-h"><div><h1>Aforo</h1><p>${esc(e.texto)} · se actualiza solo cada minuto</p></div>
        <div class="acciones"><button class="btn sec" data-a="aforoAjustes">Ajustes de aforo</button></div></div>
      <div class="kpis">
        <div class="kpi"><span>Dentro ahora</span><b>${lista.length}</b><small><span class="pill ${e.abierto ? n.c : 'muted'}">${e.abierto ? n.t : 'Cerrado'}</span></small></div>
        <div class="kpi"><span>Ocupación</span><b>${Math.round(p * 100)} %</b><small>Aforo máximo: ${a.max} personas</small></div>
        <div class="kpi"><span>Entradas hoy</span><b>${entradas}</b><small>Pasos por el torno al entrar</small></div>
        <div class="kpi"><span>Pico de hoy</span><b>${pico}</b><small>${picoH !== null ? `Hacia las ${picoH}:${picoH === ahoraH && e.abierto ? String(new Date().getMinutes()).padStart(2, '0') : '30'}` : 'Sin datos todavía'}</small></div>
      </div>
      <div class="cols"><div class="panel"><h3>Ocupación por horas <small>Personas dentro</small></h3>${grafico}</div>
        <div class="panel"><h3>Ahora dentro <small>${lista.length} ${lista.length === 1 ? 'persona' : 'personas'}</small></h3>
          ${lista.map(x => { const s = D.socio(x.socioId); return `<div class="reg">${avatar(s, 32)}<strong>${esc(s.nombre)}<br><span style="font-weight:400">Entró a las ${U.hora(x.desde)} · ${duracion(ahora - x.desde)}</span></strong><button class="btn mini sec" data-a="aforoSalida" data-id="${x.socioId}">Marcar salida</button></div>`; }).join('') || '<p class="vacio">No hay nadie dentro ahora mismo.</p>'}
          <p class="aviso">Quien no pasa el QR al salir se cuenta como fuera a las ${String(a.estancia).replace('.', ',')} horas de entrar.</p></div></div></div>`;
  };

  /* ---------- Selector entrada / salida del lector ---------- */
  AF.selector = () => `<input type="hidden" name="sentido" value="${AF.sentido}">
    <div class="seg" role="group" aria-label="Sentido del paso por el torno">${[['entrada', 'Entrada'], ['salida', 'Salida']].map(([k, t]) => `<button type="button" class="${AF.sentido === k ? 'on' : ''}" data-a="lectorSentido" data-v="${k}" aria-pressed="${AF.sentido === k}">${t}</button>`).join('')}</div>`;

  Object.assign(U.actions, {
    lectorSentido(d) { AF.sentido = d.v; U.render(); },
    async aforoSalida(d, el) { el.disabled = true; await D.marcarSalida(+d.id); },
    aforoAjustes() {
      const a = D.af || { max: 60, estancia: 3 };
      U.modal(`<h2>Ajustes de aforo</h2><p class="sub">El aforo máximo es el que ven los socios en la app para saber cómo de lleno está.</p>
        <form data-form="aforoAjustes"><label class="campo"><span>Aforo máximo (personas)</span><input class="inp" type="number" name="max" min="1" max="2000" value="${a.max}" required></label>
          <label class="campo"><span>Si alguien no pasa el QR al salir, contarlo fuera a las…</span><select class="inp" name="estancia">${[1, 1.5, 2, 2.5, 3, 4, 5].map(h => `<option value="${h}" ${+a.estancia === h ? 'selected' : ''}>${String(h).replace('.', ',')} horas de entrar</option>`).join('')}</select></label>
          <div class="acciones"><button class="btn ancho">Guardar</button></div></form>`);
    }
  });
  U.forms.aforoAjustes = async f => { if (await D.guardarAjustesAforo({ max: Math.round(+f.max), estancia: +f.estancia })) U.cerrar(); };

  /* ---------- Actualización automática ---------- */
  let leyendo = false;
  async function refrescar() {
    const socio = document.querySelector('[data-aforo="socio"]'), panel = document.querySelector('[data-aforo="panel"]');
    if (leyendo || document.hidden || !D.db || (!socio && !panel)) return;
    leyendo = true;
    try { await D.leerAforo(); } catch (e) { return; } finally { leyendo = false; }
    const n = document.querySelector('[data-aforo="socio"]');
    if (n) n.outerHTML = AF.tarjeta();
    else if (document.querySelector('[data-aforo="panel"]') && !document.querySelector('.modal-bg')) U.render();
  }
  setInterval(refrescar, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refrescar(); });
  window.addEventListener('hashchange', () => setTimeout(refrescar, 50));
})();
