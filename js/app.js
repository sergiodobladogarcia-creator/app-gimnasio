/* Núcleo de la interfaz: navegación, iconos, ventanas y utilidades comunes. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, D = window.D;

  const ICONS = {
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
    users: 'M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 10a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 19v-1a4 4 0 0 0-3-3.85M15.5 3.2a3.5 3.5 0 0 1 0 6.6',
    chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
    chat: 'M4 5h16v11H9l-5 4z',
    plus: 'M12 5v14M5 12h14',
    euro: 'M18 6.5A7 7 0 1 0 18 17.5M4 10h9M4 14h9',
    qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z',
    gift: 'M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7c-2 0-4-1-4-2.5S10 2 12 7zM12 7c2 0 4-1 4-2.5S14 2 12 7z',
    door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14 12v.01',
    tag: 'M3 12V4h8l10 10-8 8zM7.5 7.5v.01',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v1a3 3 0 0 0 4 3M16 6h4v1a3 3 0 0 1-4 3M12 13v4M8 20h8',
    check: 'M5 12l5 5 9-10',
    x: 'M6 6l12 12M18 6L6 18',
    trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
    download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
    clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
    alert: 'M12 4l9 16H3zM12 10v4M12 17v.01',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    card: 'M3 6h18v12H3zM3 10h18M7 15h3',
    file: 'M6 3h8l4 4v14H6zM14 3v4h4M9 13h6M9 17h6'
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;
  const TONOS = ['#B91C1C', '#52525B', '#7F1D1D', '#71717A', '#DC2626', '#3F3F46', '#991B1B'];
  const avatar = (s, size) => {
    const nombre = s ? s.nombre : C.nombre, ini = nombre.split(' ').slice(0, 2).map(x => x[0]).join('').toUpperCase();
    return `<span class="avatar" style="--s:${size || 40}px;background:${s ? TONOS[Math.floor(D.hash(nombre) * TONOS.length)] : 'var(--terra)'}">${esc(ini)}</span>`;
  };
  const hace = ts => {
    const m = Math.floor((Date.now() - ts) / 6e4);
    if (m < 1) return 'ahora';
    if (m < 60) return `hace ${m} min`;
    if (m < 1440) return `hace ${Math.floor(m / 60)} h`;
    const d = Math.floor(m / 1440);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  };
  const hora = ts => new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  /* ---------- Código QR ---------- */
  function qrSvg(texto) {
    if (typeof window.qrcode !== 'function') return `<div class="qr-fallback">${ic('qr')}<small>${esc(texto)}</small></div>`;
    const q = window.qrcode(0, 'M'); q.addData(texto); q.make();
    const n = q.getModuleCount(); let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg class="qr" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" role="img" aria-label="Código QR de acceso"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#111"/></svg>`;
  }

  /* ---------- Gráficos ---------- */
  function barChart(datos, fmt) {
    const W = 520, H = 210, p = { l: 8, r: 8, t: 26, b: 26 }, mx = Math.max(1, ...datos.map(d => d.v));
    const bw = (W - p.l - p.r) / datos.length;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">` + datos.map((d, i) => {
      const h = (H - p.t - p.b) * d.v / mx, x = p.l + i * bw + bw * .18, y = H - p.b - h;
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(bw * .64).toFixed(1)}" height="${Math.max(h, 2).toFixed(1)}" rx="6" fill="${i === datos.length - 1 ? 'var(--terra)' : 'var(--verde)'}" opacity="${i === datos.length - 1 ? 1 : .85}"/>
        <text x="${(x + bw * .32).toFixed(1)}" y="${(y - 8).toFixed(1)}" text-anchor="middle" class="c-val">${fmt ? fmt(d.v) : d.v}</text>
        <text x="${(x + bw * .32).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="c-lab">${esc(d.l)}</text>`;
    }).join('') + '</svg>';
  }
  function lineChart(pts, unidad) {
    if (pts.length < 2) return '<p class="vacio">Registra al menos dos sesiones de este ejercicio para ver tu evolución.</p>';
    const W = 340, H = 170, p = { l: 36, r: 14, t: 16, b: 26 }, vs = pts.map(x => x.v);
    let mn = Math.min(...vs), mx = Math.max(...vs); if (mn === mx) { mn -= 1; mx += 1; }
    const pad = (mx - mn) * .18; mn -= pad; mx += pad;
    const x = i => p.l + i * (W - p.l - p.r) / (pts.length - 1), y = v => p.t + (mx - v) * (H - p.t - p.b) / (mx - mn);
    const linea = pts.map((q, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(q.v).toFixed(1)}`).join(' ');
    const guias = [0, .5, 1].map(f => { const v = mn + pad + (mx - mn - 2 * pad) * f; return `<line x1="${p.l}" x2="${W - p.r}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="c-grid"/><text x="${p.l - 6}" y="${(y(v) + 4).toFixed(1)}" text-anchor="end" class="c-lab">${Math.round(v * 10) / 10}</text>`; }).join('');
    const u = pts.length - 1;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">${guias}
      <path d="${linea} L${x(u).toFixed(1)} ${H - p.b} L${x(0).toFixed(1)} ${H - p.b} Z" fill="var(--verde)" opacity=".1"/>
      <path d="${linea}" fill="none" stroke="var(--verde)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      ${pts.map((q, i) => `<circle cx="${x(i).toFixed(1)}" cy="${y(q.v).toFixed(1)}" r="${i === u ? 5 : 3}" fill="${i === u ? 'var(--terra)' : 'var(--verde)'}" stroke-width="1.5"/>`).join('')}
      <text x="${x(u).toFixed(1)}" y="${(y(pts[u].v) - 10).toFixed(1)}" text-anchor="end" class="c-val">${pts[u].v} ${unidad || ''}</text>
      <text x="${p.l}" y="${H - 6}" class="c-lab">${esc(pts[0].l)}</text><text x="${W - p.r}" y="${H - 6}" text-anchor="end" class="c-lab">${esc(pts[u].l)}</text></svg>`;
  }

  /* ---------- Ventanas y avisos ---------- */
  function modal(html, ancho) {
    document.getElementById('modal').innerHTML = `<div class="modal-bg" data-a="cerrarFondo"><div class="sheet ${ancho || ''}" role="dialog" aria-modal="true"><button class="sheet-x no-print" data-a="cerrar" aria-label="Cerrar">${ic('x')}</button>${html}</div></div>`;
  }
  function cerrar() { document.getElementById('modal').innerHTML = ''; }
  function toast(msg, tipo) {
    const t = document.createElement('div'); t.className = 'toast ' + (tipo || ''); t.textContent = msg;
    document.getElementById('toasts').appendChild(t);
    setTimeout(() => t.classList.add('fuera'), 2800); setTimeout(() => t.remove(), 3300);
  }

  /* ---------- Factura (compartida por socio y gimnasio) ---------- */
  function factura(id) {
    const p = D.db.pagos.find(x => x.id === +id), s = D.socio(p.socioId), d = D.desglose(p.total);
    modal(`<div class="factura">
      <div class="f-top"><div><h2>${esc(C.nombre)}</h2><p>${esc(C.direccion)}<br>CIF ${esc(C.cif)} · Tel. ${esc(C.telefono)}</p></div>
        <div class="f-num"><span>Factura</span><strong>${esc(p.n)}</strong><span>${D.fecha(p.fecha)}</span></div></div>
      <div class="f-cli"><span>Cliente</span><strong>${esc(s.nombre)}</strong><span>${esc(s.email)}</span></div>
      <table class="f-tab"><thead><tr><th>Concepto</th><th>Importe</th></tr></thead><tbody>
        <tr><td>${esc(p.concepto)}</td><td>${D.eur(d.base)}</td></tr></tbody>
        <tfoot><tr><td>Base imponible</td><td>${D.eur(d.base)}</td></tr><tr><td>IVA ${C.iva} %</td><td>${D.eur(d.iva)}</td></tr><tr class="f-total"><td>Total</td><td>${D.eur(p.total)}</td></tr></tfoot></table>
      <p class="f-pie">Forma de pago: ${D.METODOS[p.metodo]} · Estado: ${ESTADOS_PAGO[p.estado].t}</p>
      <div class="acciones no-print"><button class="btn" data-a="imprimir">${ic('download')} Imprimir o guardar en PDF</button></div></div>`, 'ancha');
  }
  const ESTADOS_PAGO = { pagado: { t: 'Pagado', c: 'ok' }, pendiente: { t: 'Pendiente', c: 'warn' }, fallido: { t: 'Pago fallido', c: 'bad' }, reembolsado: { t: 'Reembolsado', c: 'muted' } };

  /* ---------- Navegación ---------- */
  const UI = window.UI = {
    actions: {}, forms: {}, inputs: {}, changes: {}, estado: 'cargando', modoAcceso: 'entrar', avisoAcceso: '',
    esc, ic, avatar, hace, hora, qrSvg, barChart, lineChart, modal, cerrar, toast, factura, ESTADOS_PAGO,
    ruta() { const [, v, t] = location.hash.split('/'); return { vista: v || 'inicio', tab: t || '' }; },
    ir(h) { if (location.hash === h) UI.render(); else location.hash = h; },
    render() {
      const app = document.getElementById('app');
      document.body.classList.toggle('claro', UI.estado === 'listo' && !!D.sesion && !!D.db && D.db.admin && UI.ruta().vista === 'admin');
      if (UI.estado === 'cargando') { app.innerHTML = '<div class="splash"><div class="rueda"></div><p>Cargando…</p></div>'; return; }
      if (UI.estado === 'error') { app.innerHTML = `<div class="splash"><h2>No se ha podido conectar</h2><p>${esc(UI.errorMsg)}</p><div class="acciones"><button class="btn" data-a="reintentar">Reintentar</button><button class="btn sec" data-a="salir">Cerrar sesión</button></div></div>`; return; }
      if (!D.sesion || !D.db) { document.title = C.nombre; app.innerHTML = acceso(); return; }
      let r = UI.ruta();
      if (!D.db.admin && r.vista !== 'socio') r = { vista: 'socio', tab: 'inicio' }; // un socio nunca ve el panel
      const sc = document.querySelector('[data-scroll]'), top = sc && UI._clave === location.hash ? sc.scrollTop : 0;
      document.title = C.nombre + ' · ' + (r.vista === 'admin' ? 'Panel de gestión' : r.vista === 'socio' ? 'App del socio' : 'Inicio');
      app.innerHTML = barra(r) + (r.vista === 'socio' ? window.Socio.render(r.tab) : r.vista === 'admin' ? window.Admin.render(r.tab) : portada());
      UI._clave = location.hash;
      const n = document.querySelector('[data-scroll]'); if (n) n.scrollTop = top;
    },
    async arrancar() {
      UI.estado = 'cargando'; UI.render();
      try { await D.iniciar(); UI.estado = 'listo'; } catch (e) { UI.estado = 'error'; UI.errorMsg = D.error(e); }
      UI.render();
    },
    // La sesión cambia fuera de los formularios (otra pestaña, caducidad…)
    async sesionCambiada() {
      if (UI.ocupado) return;
      if (!D.sesion) D.db = null;
      else if (!D.db) { try { await D.cargar(); } catch (e) { UI.estado = 'error'; UI.errorMsg = D.error(e); } }
      cerrar(); UI.render();
    },
    start() {
      window.addEventListener('hashchange', UI.render);
      document.addEventListener('click', e => { const el = e.target.closest('[data-a]'); if (!el) return; const f = UI.actions[el.dataset.a]; if (f) { if (el.tagName === 'A' || el.tagName === 'BUTTON') e.preventDefault(); f(el.dataset, el, e); } });
      document.addEventListener('submit', async e => {
        const f = UI.forms[e.target.dataset.form]; if (!f) return;
        e.preventDefault();
        const form = e.target, btn = form.querySelector('button:not([type=button])');
        if (form.dataset.enviando) return; // evita dobles envíos mientras responde el servidor
        form.dataset.enviando = '1'; if (btn) btn.disabled = true;
        try { await f(Object.fromEntries(new FormData(form)), form); }
        finally { delete form.dataset.enviando; if (btn) btn.disabled = false; }
      });
      document.addEventListener('input', e => { const f = UI.inputs[e.target.dataset.in]; if (f) f(e.target.value, e.target); });
      document.addEventListener('change', e => { const f = UI.changes[e.target.dataset.ch]; if (f) f(e.target.value, e.target); });
      document.addEventListener('keydown', e => { if (e.key === 'Escape') cerrar(); });
      // Zona de socio en ordenador: la rueda funciona en toda la pantalla y se puede arrastrar con el ratón, como en un móvil
      document.addEventListener('wheel', e => { const sc = document.querySelector('.stage-socio .screen'); if (sc && !e.target.closest('.phone') && !e.target.closest('.modal-bg')) sc.scrollTop += e.deltaY; }, { passive: true });
      let arr = null;
      document.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.button) return; const sc = e.target.closest('.screen'); if (!sc || e.target.closest('input,textarea,select')) return; arr = { sc, y: e.clientY, top: sc.scrollTop, mov: false }; });
      document.addEventListener('pointermove', e => { if (!arr) return; const dy = e.clientY - arr.y; if (!arr.mov && Math.abs(dy) > 6) { arr.mov = true; document.body.classList.add('arrastrando'); } if (arr.mov) arr.sc.scrollTop = arr.top - dy; });
      document.addEventListener('pointerup', () => { if (arr && arr.mov) { UI._arrastre = Date.now(); document.body.classList.remove('arrastrando'); } arr = null; });
      document.addEventListener('click', e => { if (Date.now() - (UI._arrastre || 0) < 80) { e.stopPropagation(); e.preventDefault(); } }, true);
      UI.arrancar();
    }
  };

  function barra(r) {
    const yo = D.yo();
    return `<div class="demobar no-print"><a class="marca" href="${D.db.admin ? '#/' : '#/socio/inicio'}">${esc(C.nombre)}</a>
      ${D.db.admin ? `<nav class="vistas"><a href="#/socio/inicio" class="${r.vista === 'socio' ? 'on' : ''}">${ic('user')}<span>Socio</span></a><a href="#/admin/resumen" class="${r.vista === 'admin' ? 'on' : ''}">${ic('grid')}<span>Gimnasio</span></a></nav>` : '<span style="margin-left:auto"></span>'}
      <span class="quien-soy">${esc(yo.nombre.split(' ')[0])}</span><button class="link" data-a="salir">Salir</button></div>`;
  }

  function acceso() {
    const reg = UI.modoAcceso === 'registro';
    return `<main class="portada" data-scroll><div class="acceso-in">
      <p class="eyebrow">${esc(C.lema)}</p><h1>${esc(C.nombre)}</h1>
      <div class="card acceso-card">
        <div class="seg"><button class="${reg ? '' : 'on'}" data-a="modoAcceso" data-v="entrar">Entrar</button><button class="${reg ? 'on' : ''}" data-a="modoAcceso" data-v="registro">Crear cuenta</button></div>
        ${UI.avisoAcceso ? `<p class="aviso ok">${esc(UI.avisoAcceso)}</p>` : ''}
        ${reg ? `<form data-form="registrar">
          <label class="campo"><span>Nombre y apellidos</span><input class="inp" name="nombre" required maxlength="80" autocomplete="name"></label>
          <label class="campo"><span>Teléfono</span><input class="inp" name="tel" inputmode="tel" maxlength="20" autocomplete="tel"></label>
          <label class="campo"><span>Correo</span><input class="inp" type="email" name="email" required autocomplete="email"></label>
          <label class="campo"><span>Contraseña (mínimo 6 caracteres)</span><input class="inp" type="password" name="clave" required minlength="6" autocomplete="new-password"></label>
          <button class="btn terra ancho">Crear mi cuenta</button></form>`
        : `<form data-form="entrar">
          <label class="campo"><span>Correo</span><input class="inp" type="email" name="email" required autocomplete="email"></label>
          <label class="campo"><span>Contraseña</span><input class="inp" type="password" name="clave" required autocomplete="current-password"></label>
          <button class="btn ancho">Entrar</button></form>`}
      </div>
      <p class="nota">¿Solo quieres ver cómo funciona? <a href="demo/index.html" style="color:var(--terra-tx);font-weight:700">Abrir la demo con datos de ejemplo</a></p>
    </div></main>`;
  }

  function portada() {
    return `<main class="portada" data-scroll><div class="portada-in">
      <p class="eyebrow">${esc(C.lema)}</p>
      <h1>${esc(C.nombre)}</h1>
      <p class="sub">Tu cuenta es de administrador: puedes usar la app como un socio más o abrir el panel de gestión del gimnasio.</p>
      <div class="puertas">
        <a class="puerta" href="#/socio/inicio"><span class="p-ic">${ic('user')}</span><h2>App del socio</h2><p>Pase QR de acceso, cuotas, reserva de clases, muro de entrenamientos, logros y recompensas.</p><span class="p-ir">Entrar como socio ${ic('arrow')}</span></a>
        <a class="puerta oscura" href="#/admin/resumen"><span class="p-ic">${ic('grid')}</span><h2>Panel del gimnasio</h2><p>Facturación, socios, clases y horarios, cuotas, control de acceso y comunidad en un solo sitio.</p><span class="p-ir">Abrir el panel ${ic('arrow')}</span></a>
      </div>
    </div></main>`;
  }

  UI.actions.cerrar = cerrar;
  UI.actions.cerrarFondo = (d, el, e) => { if (e.target === el) cerrar(); };
  UI.actions.imprimir = () => window.print();
  UI.actions.factura = d => factura(d.id);
  UI.actions.modoAcceso = d => { UI.modoAcceso = d.v; UI.avisoAcceso = ''; UI.render(); };
  UI.actions.reintentar = () => UI.arrancar();
  UI.actions.salir = async () => { UI.ocupado = true; try { await D.salir(); } catch (e) { D.sesion = null; D.db = null; } finally { UI.ocupado = false; } UI.estado = 'listo'; cerrar(); location.hash = '#/'; UI.render(); };

  const conSesion = async f => { UI.ocupado = true; try { return await f(); } catch (e) { toast(D.error(e), 'bad'); return null; } finally { UI.ocupado = false; } };
  UI.forms.entrar = async f => {
    if (await conSesion(async () => { await D.entrar(f.email.trim(), f.clave); return true; })) { UI.avisoAcceso = ''; UI.ir(D.db.admin ? '#/' : '#/socio/inicio'); UI.render(); }
  };
  UI.forms.registrar = async f => {
    const r = await conSesion(async () => ({ dentro: await D.registrar({ email: f.email.trim(), clave: f.clave, nombre: f.nombre.trim(), tel: f.tel.trim() }) }));
    if (!r) return;
    if (r.dentro) { UI.ir(D.db.admin ? '#/' : '#/socio/inicio'); UI.render(); toast('Cuenta creada. ¡Bienvenido!', 'ok'); }
    else { UI.modoAcceso = 'entrar'; UI.avisoAcceso = 'Te hemos enviado un correo. Pulsa el enlace de confirmación y después entra aquí con tu contraseña.'; UI.render(); }
  };
})();
