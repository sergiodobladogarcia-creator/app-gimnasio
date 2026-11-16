/* Panel del gimnasio (escritorio): resumen, socios, facturación, clases, cuotas, acceso y comunidad. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, D = window.D, U = window.UI, esc = U.esc, ic = U.ic, avatar = U.avatar;
  const A = { fEstado: 'todos', q: '', fPago: 'todos', mes: D.mesKey(D.hoy()), lector: null };
  const TABS = [['resumen', 'Resumen', 'grid'], ['socios', 'Socios', 'users'], ['facturacion', 'Facturación', 'euro'], ['clases', 'Clases y horarios', 'calendar'], ['cuotas', 'Cuotas', 'tag'], ['acceso', 'Control de acceso', 'door'], ['comunidad', 'Comunidad y premios', 'gift']];
  const esHoy = ts => D.iso(new Date(ts)) === D.iso(D.hoy());
  const deudas = () => D.db.pagos.filter(p => p.estado === 'pendiente' || p.estado === 'fallido');
  const inactivo = s => s.estado === 'activo' && D.diasDesde(s.ultimoAcceso || s.alta) > 10;
  const haceDias = iso => { if (!iso) return 'Nunca'; const d = D.diasDesde(iso); return d <= 0 ? 'Hoy' : d === 1 ? 'Ayer' : `Hace ${d} días`; };
  const pl = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;
  const cab = (t, sub, acc) => `<div class="main-h"><div><h1>${t}</h1><p>${sub}</p></div>${acc ? `<div class="acciones">${acc}</div>` : ''}</div>`;
  const proxFecha = dia => { const h = D.hoy(); return D.iso(D.addDays(h, (dia - D.diaSemana(h) + 7) % 7)); };

  /* ---------- Resumen ---------- */
  function resumen() {
    const hoy = D.hoy(), mes = D.mesKey(hoy), prev = D.mesKey(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1));
    const socios = D.db.socios, act = socios.filter(s => s.estado === 'activo'), altas = socios.filter(s => s.alta.startsWith(mes)).length;
    const deu = deudas(), fall = deu.filter(p => p.estado === 'fallido'), pend = deu.filter(p => p.estado === 'pendiente');
    const accHoy = D.db.accesos.filter(a => a.ok && esHoy(a.ts)).length;
    const ret = Math.round((1 - socios.filter(s => s.estado === 'baja').length / socios.length) * 100);
    const meses = [...Array(6)].map((_, i) => { const d = new Date(hoy.getFullYear(), hoy.getMonth() - 5 + i, 1); return { l: d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''), v: D.ingresos(D.mesKey(d)) }; });
    const porPlan = D.db.planes.map(p => ({ p, v: D.db.pagos.filter(x => x.planId === p.id && x.estado === 'pagado').reduce((t, x) => t + x.total, 0) })).sort((a, b) => b.v - a.v), mxPlan = Math.max(1, ...porPlan.map(x => x.v));
    const inact = act.filter(inactivo).length, vence = socios.filter(s => D.estado(s).k === 'vence').length, canjes = D.db.canjes.filter(c => !c.entregado).length;
    const sum = l => D.eur(l.reduce((t, p) => t + p.total, 0));
    const al = (tipo, icono, t, s, tab, k, v) => `<button class="alerta" data-a="irFiltro" data-tab="${tab}" data-k="${k}" data-v="${v}"><span class="ai ${tipo}">${ic(icono)}</span><div><strong>${t}</strong><span>${s}</span></div></button>`;
    const alertas = [
      fall.length && al('bad', 'alert', `${pl(fall.length, 'pago fallido', 'pagos fallidos')} · ${sum(fall)}`, 'No pueden entrar hasta regularizar el recibo', 'facturacion', 'fPago', 'fallido'),
      pend.length && al('warn', 'clock', `${pl(pend.length, 'recibo pendiente', 'recibos pendientes')} · ${sum(pend)}`, 'Domiciliaciones y cobros aún sin confirmar', 'facturacion', 'fPago', 'pendiente'),
      inact && al('warn', 'users', `${pl(inact, 'socio lleva', 'socios llevan')} más de 10 días sin venir`, 'Un mensaje a tiempo evita muchas bajas', 'socios', 'fEstado', 'inactivos'),
      vence && al('ok', 'calendar', `${pl(vence, 'cuota o bono próximo', 'cuotas o bonos próximos')} a vencer`, 'Renovaciones de los próximos 7 días y bonos casi agotados', 'socios', 'fEstado', 'vence'),
      canjes && al('ok', 'gift', `${pl(canjes, 'recompensa', 'recompensas')} por entregar`, 'Socios que han canjeado puntos', 'comunidad', '', '')
    ].filter(Boolean).join('');
    const hoyIso = D.iso(hoy);
    return cab('Resumen', hoy.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), `<a class="btn" href="#/admin/acceso">${ic('door')} Control de acceso</a>`) +
      `<div class="kpis">
        <div class="kpi"><span>Ingresos del mes</span><b>${D.eur(D.ingresos(mes))}</b><small>Mes anterior: ${D.eur(D.ingresos(prev))}</small></div>
        <div class="kpi"><span>Ingreso recurrente mensual</span><b>${D.eur(D.mrr())}</b><small>Suma de cuotas activas</small></div>
        <div class="kpi"><span>Socios activos</span><b>${act.length}</b><small class="sube">+${altas} altas este mes</small></div>
        <div class="kpi"><span>Pendiente de cobro</span><b>${sum(deu)}</b><small class="${deu.length ? 'baja' : ''}">${pl(deu.length, 'recibo', 'recibos')}</small></div>
        <div class="kpi"><span>Accesos hoy</span><b>${accHoy}</b><small>Entradas registradas por QR</small></div>
        <div class="kpi"><span>Retención</span><b>${ret} %</b><small>Socios que siguen dados de alta</small></div>
      </div>
      <div class="cols"><div class="panel"><h3>Ingresos cobrados <small>Últimos 6 meses</small></h3>${U.barChart(meses, v => Math.round(v).toLocaleString('es-ES') + ' €')}</div>
        <div class="panel"><h3>Avisos</h3>${alertas || '<p class="vacio">Todo en orden.</p>'}</div></div>
      <div class="cols"><div class="panel"><h3>Clases de hoy <small>Ocupación</small></h3>${D.clasesDe(hoyIso).map(c => { const o = D.ocup(c, hoyIso), d = D.disc(c.disc); return `<div class="ocu"><b>${c.hora}</b><span><i class="punto" style="--c:${d.color}"></i>${esc(d.nombre)} · ${esc(c.monitor)}</span><div class="barra-p ${o >= c.aforo ? 'llena' : ''}"><i style="width:${o / c.aforo * 100}%"></i></div><small>${o}/${c.aforo}</small></div>`; }).join('') || '<p class="vacio">Hoy no hay clases dirigidas.</p>'}</div>
        <div class="panel"><h3>Ingresos por cuota <small>6 meses</small></h3>${porPlan.map(x => `<div class="hbar"><div><span>${esc(x.p.nombre)}</span><b>${D.eur(x.v)}</b></div><div class="barra-p"><i style="width:${x.v / mxPlan * 100}%"></i></div></div>`).join('')}</div></div>`;
  }

  /* ---------- Socios ---------- */
  const F_SOCIOS = [['todos', 'Todos'], ['activo', 'Activos'], ['vence', 'Próx. a vencer'], ['inactivos', 'Inactivos +10 días'], ['pendiente', 'Sin cuota'], ['pausa', 'En pausa'], ['baja', 'Bajas']];
  function filasSocios() {
    const q = A.q.trim().toLowerCase();
    const lista = D.db.socios.filter(s => {
      const e = D.estado(s).k;
      if (A.fEstado === 'inactivos' ? !inactivo(s) : A.fEstado === 'activo' ? s.estado !== 'activo' : A.fEstado !== 'todos' && e !== A.fEstado) return false;
      return !q || s.nombre.toLowerCase().includes(q) || s.email.includes(q) || s.codigo.toLowerCase().includes(q);
    }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    if (!lista.length) return '<tr><td colspan="6"><p class="vacio">Ningún socio coincide con la búsqueda.</p></td></tr>';
    return lista.map(s => {
      const e = D.estado(s), deu = D.deuda(s);
      return `<tr class="clic" data-a="ficha" data-id="${s.id}" tabindex="0"><td><div class="quien">${avatar(s, 34)}<div>${esc(s.nombre)}<small>${esc(s.email)}</small></div></div></td>
        <td>${esc(D.plan(s.planId).nombre)}</td><td><span class="pill ${e.c}">${e.t}</span>${deu.length ? ` <span class="pill ${deu.some(p => p.estado === 'fallido') ? 'bad' : 'warn'}">Debe ${D.eur(deu.reduce((t, p) => t + p.total, 0))}</span>` : ''}</td>
        <td>${haceDias(s.ultimoAcceso)}</td><td>${s.proxCobro ? D.fecha(s.proxCobro, { day: 'numeric', month: 'short' }) : s.sesionesRest !== null ? s.sesionesRest + ' sesiones' : '—'}</td><td>${D.METODOS[s.metodo]}</td></tr>`;
    }).join('');
  }
  function socios() {
    return cab('Socios', `${D.db.socios.length} fichas · ${D.db.socios.filter(s => s.estado === 'activo').length} activos`, `<button class="btn" data-a="nuevoSocio">${ic('plus')} Nuevo socio</button>`) +
      `<div class="herr"><input class="inp" type="search" placeholder="Buscar por nombre, correo o código" value="${esc(A.q)}" data-in="buscar" aria-label="Buscar socio">
        <div class="chips">${F_SOCIOS.map(([k, t]) => `<button class="chip ${A.fEstado === k ? 'on' : ''}" data-a="filtro" data-k="fEstado" data-v="${k}">${t}</button>`).join('')}</div></div>
      <div class="tabla-w"><table class="tabla"><thead><tr><th>Socio</th><th>Cuota</th><th>Estado</th><th>Último acceso</th><th>Próximo cobro</th><th>Pago</th></tr></thead><tbody id="tb-socios">${filasSocios()}</tbody></table></div>`;
  }
  function ficha(id) {
    const s = D.socio(id), e = D.estado(s), plan = D.plan(s.planId), pagos = D.db.pagos.filter(p => p.socioId === s.id).reverse().slice(0, 5), deu = D.deuda(s);
    const kv = (k, v) => `<div class="kv"><span>${k}</span><b>${v}</b></div>`;
    U.modal(`<div class="ficha"><div class="ficha-h">${avatar(s, 58)}<div><h2>${esc(s.nombre)}</h2><span class="pill ${e.c}">${e.t}</span> <span class="codigo">${s.codigo}</span></div></div>
      ${s.lesiones ? `<div class="alerta-med">${ic('alert')} ${esc(s.lesiones)}</div>` : ''}
      <div class="ficha-g"><div><h3>Datos</h3>${kv('Correo', esc(s.email))}${kv('Teléfono', `${esc(s.tel)} · <a href="https://wa.me/34${s.tel.replace(/\D/g, '')}" target="_blank" rel="noopener" style="color:var(--ok-tx);font-weight:700">WhatsApp</a>`)}${kv('Nacimiento', D.fecha(s.nacimiento))}${kv('Alta', D.fecha(s.alta))}</div>
        <div><h3>Cuota</h3>${kv('Plan', `${esc(plan.nombre)} · ${D.eur(plan.precio)}`)}${kv(plan.meses ? 'Próximo cobro' : 'Sesiones', s.proxCobro ? D.fecha(s.proxCobro) : s.sesionesRest !== null ? s.sesionesRest + ' disponibles' : '—')}${kv('Método', D.METODOS[s.metodo])}${kv('Deuda', deu.length ? `<span style="color:var(--bad-tx)">${D.eur(deu.reduce((t, p) => t + p.total, 0))}</span>` : 'Al corriente')}</div>
        <div><h3>Actividad</h3>${kv('Último acceso', haceDias(s.ultimoAcceso))}${kv('Visitas este mes', s.visitasMes)}${kv('Visitas totales', s.visitas)}${kv('Puntos', `${s.puntos.toLocaleString('es-ES')} · ${esc(D.nivel(s.puntos).actual.nombre)}`)}</div>
        <div><h3>Perfil deportivo</h3>${kv('Nivel', esc(s.nivelFisico))}${kv('Objetivo', esc(s.objetivo))}${kv('Lesiones', s.lesiones ? 'Sí, ver aviso' : 'Ninguna registrada')}${kv('Entrenos registrados', D.nEntrenos(s.id))}</div></div>
      <h3>Últimos recibos</h3>${pagos.map(p => `<button class="recibo" data-a="factura" data-id="${p.id}"><div><strong>${esc(p.concepto)}</strong><span>${D.fecha(p.fecha)} · ${esc(p.n)}</span></div><span class="pill ${U.ESTADOS_PAGO[p.estado].c}">${U.ESTADOS_PAGO[p.estado].t}</span><b>${D.eur(p.total)}</b></button>`).join('') || '<p class="muted">Sin recibos.</p>'}
      <form data-form="notas"><input type="hidden" name="id" value="${s.id}"><h3>Lesiones y notas privadas del monitor</h3>
        <label class="campo"><input class="inp" name="lesiones" value="${esc(s.lesiones)}" placeholder="Lesiones o limitaciones (p. ej. hernia lumbar)" aria-label="Lesiones"></label>
        <textarea class="inp" name="notas" placeholder="Cargas habituales, observaciones, seguimiento…" aria-label="Notas privadas">${esc(s.notas)}</textarea>
        <div class="acciones"><button class="btn mini">Guardar notas</button>
          <button type="button" class="btn mini suave" data-a="cobroManual" data-id="${s.id}">${ic('euro')} Cobrar cuota</button>
          ${s.estado === 'activo' ? `<button type="button" class="btn mini sec" data-a="estado" data-id="${s.id}" data-v="pausa">Pausar cuota</button>` : s.estado !== 'pendiente' ? `<button type="button" class="btn mini sec" data-a="estado" data-id="${s.id}" data-v="activo">Reactivar</button>` : ''}
          ${s.estado !== 'baja' ? `<button type="button" class="btn mini peligro" data-a="estado" data-id="${s.id}" data-v="baja">Dar de baja</button>` : ''}
          ${s.userId && s.id !== D.db.yo ? `<button type="button" class="btn mini sec" data-a="rol" data-id="${s.id}" data-v="${s.esAdmin ? '' : '1'}">${s.esAdmin ? 'Quitar acceso al panel' : 'Dar acceso al panel'}</button>` : ''}</div>
        ${s.esAdmin ? '<p class="aviso">Esta cuenta es de administrador: puede abrir el panel del gimnasio.</p>' : !s.userId ? '<p class="aviso">Este socio aún no se ha registrado en la app con su correo.</p>' : ''}</form></div>`, 'ancha');
  }

  /* ---------- Facturación ---------- */
  const F_PAGOS = [['todos', 'Todos'], ['pagado', 'Pagados'], ['pendiente', 'Pendientes'], ['fallido', 'Fallidos'], ['reembolsado', 'Reembolsados']];
  const pagosFiltrados = () => D.db.pagos.filter(p => (!A.mes || p.fecha.startsWith(A.mes)) && (A.fPago === 'todos' || p.estado === A.fPago)).sort((a, b) => b.id - a.id);
  function facturacion() {
    const hoy = D.hoy(), delMes = D.db.pagos.filter(p => !A.mes || p.fecha.startsWith(A.mes));
    const tot = e => delMes.filter(p => p.estado === e).reduce((t, p) => t + p.total, 0), n = e => delMes.filter(p => p.estado === e).length;
    const pagadores = new Set(delMes.filter(p => p.estado === 'pagado').map(p => p.socioId)).size;
    const meses = [...Array(6)].map((_, i) => new Date(hoy.getFullYear(), hoy.getMonth() - i, 1));
    const lista = pagosFiltrados();
    return cab('Facturación', 'Recibos, cobros y facturas con numeración correlativa', `<button class="btn sec" data-a="csv">${ic('download')} Exportar a Excel (CSV)</button>`) +
      `<div class="kpis"><div class="kpi"><span>Cobrado</span><b>${D.eur(tot('pagado'))}</b><small>${pl(n('pagado'), 'recibo', 'recibos')}</small></div>
        <div class="kpi"><span>Pendiente</span><b>${D.eur(tot('pendiente'))}</b><small>${pl(n('pendiente'), 'recibo', 'recibos')}</small></div>
        <div class="kpi"><span>Fallido</span><b>${D.eur(tot('fallido'))}</b><small class="${n('fallido') ? 'baja' : ''}">${pl(n('fallido'), 'recibo', 'recibos')}</small></div>
        <div class="kpi"><span>Ticket medio por socio</span><b>${D.eur(pagadores ? tot('pagado') / pagadores : 0)}</b><small>${pagadores} socios han pagado</small></div></div>
      <div class="herr"><select class="inp" style="max-width:200px" data-ch="mes" aria-label="Mes"><option value="">Últimos 6 meses</option>${meses.map(d => `<option value="${D.mesKey(d)}" ${A.mes === D.mesKey(d) ? 'selected' : ''}>${d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</option>`).join('')}</select>
        <div class="chips">${F_PAGOS.map(([k, t]) => `<button class="chip ${A.fPago === k ? 'on' : ''}" data-a="filtro" data-k="fPago" data-v="${k}">${t}</button>`).join('')}</div></div>
      <div class="tabla-w"><table class="tabla"><thead><tr><th>N.º factura</th><th>Fecha</th><th>Socio</th><th>Concepto</th><th>Pago</th><th class="r">Base</th><th class="r">IVA</th><th class="r">Total</th><th>Estado</th><th></th></tr></thead><tbody>
      ${lista.map(p => { const s = D.socio(p.socioId), x = D.desglose(p.total), e = U.ESTADOS_PAGO[p.estado]; return `<tr><td class="num"><b>${esc(p.n)}</b></td><td>${D.fecha(p.fecha, { day: 'numeric', month: 'short' })}</td><td>${esc(s.nombre)}</td><td>${esc(p.concepto)}</td><td>${D.METODOS[p.metodo]}</td>
        <td class="r">${D.eur(x.base)}</td><td class="r">${D.eur(x.iva)}</td><td class="r"><b>${D.eur(p.total)}</b></td><td><span class="pill ${e.c}">${e.t}</span></td>
        <td><div class="ops">${p.estado === 'pendiente' || p.estado === 'fallido' ? `<button class="btn mini suave" data-a="cobrar" data-id="${p.id}">Marcar cobrado</button>` : ''}${p.estado === 'pagado' ? `<button class="icbtn" data-a="reembolsar" data-id="${p.id}" title="Reembolsar" aria-label="Reembolsar">${ic('arrow')}</button>` : ''}<button class="icbtn" data-a="factura" data-id="${p.id}" title="Ver factura" aria-label="Ver factura">${ic('file')}</button></div></td></tr>`; }).join('') || '<tr><td colspan="10"><p class="vacio">No hay recibos con ese filtro.</p></td></tr>'}
      </tbody></table></div>`;
  }

  /* ---------- Clases ---------- */
  function clases() {
    const hoyD = D.diaSemana(D.hoy());
    return cab('Clases y horarios', `${D.db.clases.length} sesiones a la semana · la ocupación es la de la próxima sesión`, `<button class="btn" data-a="claseForm">${ic('plus')} Nueva clase</button>`) +
      `<div class="semana">${D.DIAS.map((n, dia) => `<div class="${dia === hoyD ? 'hoy' : ''}"><h4>${n}${dia === hoyD ? ' · hoy' : ''}</h4>
        ${D.db.clases.filter(c => c.dia === dia).sort((a, b) => a.hora.localeCompare(b.hora)).map(c => { const d = D.disc(c.disc), o = D.ocup(c, proxFecha(dia)); return `<button class="slot" style="--c:${d.color}" data-a="claseForm" data-id="${c.id}"><b>${c.hora}</b><strong>${esc(d.nombre)}</strong><span>${esc(c.monitor)} · ${esc(c.sala)}</span><div class="barra-p ${o >= c.aforo ? 'llena' : ''}"><i style="width:${o / c.aforo * 100}%"></i></div><span style="margin:4px 0 0">${o}/${c.aforo} plazas</span></button>`; }).join('') || '<p class="muted" style="font-size:13px">Sin clases</p>'}</div>`).join('')}</div>`;
  }

  /* ---------- Cuotas ---------- */
  function cuotas() {
    return cab('Cuotas', 'Precios con IVA incluido. Los cambios se ven al momento en la app del socio.') +
      `<div class="planes-a">${D.db.planes.map(p => { const n = D.db.socios.filter(s => s.planId === p.id && s.estado === 'activo').length; return `<div class="panel"><h3>${esc(p.nombre)}<button class="btn mini sec" data-a="planForm" data-id="${p.id}">Editar</button></h3>
        <span class="precio">${D.eur(p.precio)} <small>${esc(p.periodo)}</small></span><div class="kv"><span>Socios activos</span><b>${n}</b></div><div class="kv"><span>${p.meses ? 'Ingreso mensual equivalente' : 'Renovación'}</span><b>${p.meses ? D.eur(n * p.precio / p.meses) : 'Manual'}</b></div></div>`; }).join('')}</div>`;
  }

  /* ---------- Control de acceso ---------- */
  function acceso() {
    const L = A.lector, s = L && D.socio(L.socioId), hoy = D.db.accesos.filter(a => esHoy(a.ts));
    return cab('Control de acceso', 'El socio enseña su QR en la entrada y el lector comprueba la cuota al instante') +
      `<div class="acceso"><div class="panel"><h3>Lector de la entrada</h3>
        <form data-form="leer"><label class="campo"><span>Código leído (un lector USB lo escribe aquí solo)</span><input class="inp" name="codigo" placeholder="GYM-0001-…" autocomplete="off"></label>
          <label class="campo"><span>O simula que llega un socio</span><select class="inp" name="socio"><option value="">Elegir socio…</option>${[...D.db.socios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')).map(x => `<option value="${x.id}">${esc(x.nombre)} — ${D.estado(x).t}</option>`).join('')}</select></label>
          <button class="btn ancho">${ic('qr')} Leer código</button></form>
        ${L ? `<div class="lector ${L.ok ? 'ok' : 'bad'}" role="status">${avatar(s, 64)}<h2>${L.ok ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}</h2><p><b>${esc(s.nombre)}</b> · ${esc(D.plan(s.planId).nombre)}</p><p>${esc(L.motivo)}${L.puntos ? ` · +${L.puntos} puntos` : ''}</p></div>`
        : `<div class="lector espera" role="status">${ic('qr')}<p style="margin-top:8px">Esperando un código…</p></div>`}</div>
      <div class="panel"><h3>Entradas de hoy <small>${hoy.filter(a => a.ok).length} accesos</small></h3>${hoy.map(a => { const x = D.socio(a.socioId); return `<div class="reg">${avatar(x, 32)}<strong>${esc(x.nombre)}</strong><span class="pill ${a.ok ? 'ok' : 'bad'}">${a.ok ? 'Entrada' : 'Denegado'}</span><span>${U.hora(a.ts)}</span></div>`; }).join('') || '<p class="vacio">Todavía no ha entrado nadie hoy.</p>'}</div></div>`;
  }

  /* ---------- Comunidad y premios ---------- */
  function comunidad() {
    const canjes = [...D.db.canjes].reverse(), posts = [...D.db.posts].sort((a, b) => b.ts - a.ts);
    return cab('Comunidad y premios', 'Anuncios, moderación del muro y entrega de recompensas') +
      `<div class="cols"><div class="panel"><h3>Publicar un anuncio en el muro</h3>
        <form data-form="anuncio"><textarea class="inp" name="texto" required maxlength="280" placeholder="Cambio de horario, nueva actividad, reto del mes…" aria-label="Texto del anuncio"></textarea><div class="acciones"><button class="btn">Publicar anuncio</button></div></form>
        <h3 style="margin-top:22px">Muro <small>${posts.length} publicaciones</small></h3>
        ${posts.map(p => { const a = p.oficial ? null : D.socio(p.socioId); return `<div class="reg">${avatar(a, 32)}<strong>${esc(a ? a.nombre : C.nombre)}<br><span style="font-weight:400">${esc((p.texto || p.titulo || '').slice(0, 90))}</span></strong><span>${U.hace(p.ts)}</span><button class="icbtn" data-a="borrarPost" data-id="${p.id}" title="Eliminar publicación" aria-label="Eliminar publicación">${ic('trash')}</button></div>`; }).join('')}</div>
      <div class="panel"><h3>Recompensas canjeadas</h3>${canjes.map(c => { const r = C.recompensas.find(x => x.id === c.recompensaId), s = D.socio(c.socioId); return `<div class="reg"><span style="font-size:22px">${r.icono}</span><strong>${esc(r.nombre)}<br><span style="font-weight:400">${esc(s.nombre)} · <span class="codigo">${c.codigo}</span></span></strong>${c.entregado ? '<span class="pill ok">Entregado</span>' : `<button class="btn mini" data-a="entregar" data-id="${c.id}">Entregar</button>`}</div>`; }).join('') || '<p class="vacio">Cuando un socio canjee puntos aparecerá aquí con su código.</p>'}
        <h3 style="margin-top:22px">Catálogo de recompensas</h3>${C.recompensas.map(r => `<div class="reg"><span style="font-size:22px">${r.icono}</span><strong>${esc(r.nombre)}</strong><span>${r.coste.toLocaleString('es-ES')} pts</span></div>`).join('')}
        <p class="aviso">Los puntos los suma el servidor: 10 por la primera entrada del día y 20 por entreno registrado (máximo dos al día).</p></div></div>`;
  }

  const VISTAS = { resumen, socios, facturacion, clases, cuotas, acceso, comunidad };
  window.Admin = {
    render(tab) {
      const t = VISTAS[tab] ? tab : 'resumen', nDeu = deudas().length, nCan = D.db.canjes.filter(c => !c.entregado).length;
      const badge = { facturacion: nDeu, comunidad: nCan };
      return `<div class="stage admin"><aside class="side"><h4>Gestión</h4>${TABS.map(([k, n, i]) => `<a href="#/admin/${k}" class="${k === t ? 'on' : ''}" ${k === t ? 'aria-current="page"' : ''}>${ic(i)}${n}${badge[k] && k !== t ? `<em>${badge[k]}</em>` : ''}</a>`).join('')}</aside>
        <main class="main" data-scroll>${VISTAS[t]()}</main></div>`;
    }
  };

  /* ---------- Acciones ---------- */
  const sb = D.sb;
  const opciones = (lista, sel) => lista.map(([v, t]) => `<option value="${v}" ${String(v) === String(sel) ? 'selected' : ''}>${esc(t)}</option>`).join('');
  const opPlanes = sel => opciones(D.db.planes.map(p => [p.id, `${p.nombre} · ${D.eur(p.precio)}`]), sel);
  const opMetodos = sel => opciones(Object.entries(D.METODOS), sel);
  // Tras una operación sobre un socio, vuelve a abrir su ficha ya actualizada
  const yFicha = async (promesa, ok, id) => { if (await D.hacer(promesa, ok)) ficha(id); };

  Object.assign(U.actions, {
    filtro(d) { A[d.k] = d.v; U.render(); },
    irFiltro(d) { if (d.k) A[d.k] = d.v; if (d.k === 'fPago') A.mes = ''; U.ir('#/admin/' + d.tab); },
    ficha(d) { ficha(d.id); },
    estado(d, el) {
      el.disabled = true;
      yFicha(sb.from('socios').update({ estado: d.v }).eq('id', +d.id), d.v === 'activo' ? 'Socio reactivado' : d.v === 'pausa' ? 'Cuota en pausa' : 'Socio dado de baja', d.id);
    },
    rol(d, el) {
      if (d.v && !el.dataset.seguro) { el.dataset.seguro = '1'; el.textContent = 'Pulsa otra vez: verá socios y facturación'; return; }
      el.disabled = true;
      yFicha(sb.from('socios').update({ es_admin: !!d.v }).eq('id', +d.id), d.v ? 'Ya puede abrir el panel del gimnasio' : 'Acceso al panel retirado', d.id);
    },
    cobroManual(d) {
      const s = D.socio(d.id);
      U.modal(`<h2>Cobrar cuota</h2><p class="sub">${esc(s.nombre)}. Se emite el recibo como pagado y la cuota queda activa.</p><form data-form="cobro"><input type="hidden" name="id" value="${s.id}">
        <label class="campo"><span>Cuota</span><select class="inp" name="plan">${opPlanes(s.planId)}</select></label>
        <label class="campo"><span>Forma de pago</span><select class="inp" name="metodo">${opMetodos('efectivo')}</select></label>
        <div class="acciones"><button class="btn ancho">Cobrar y activar</button></div></form>`);
    },
    cobrar(d, el) { el.disabled = true; D.hacer(sb.rpc('cobrar_pago', { p_pago: +d.id }), 'Recibo cobrado y cuota activada'); },
    reembolsar(d, el) { el.disabled = true; D.hacer(sb.from('pagos').update({ estado: 'reembolsado' }).eq('id', +d.id), 'Recibo reembolsado'); },
    csv() {
      const filas = [['Factura', 'Fecha', 'Socio', 'Concepto', 'Metodo', 'Base', 'IVA', 'Total', 'Estado']].concat(pagosFiltrados().map(p => { const x = D.desglose(p.total), f = n => n.toFixed(2).replace('.', ','); return [p.n, p.fecha, D.socio(p.socioId).nombre, p.concepto, D.METODOS[p.metodo], f(x.base), f(x.iva), f(p.total), U.ESTADOS_PAGO[p.estado].t]; }));
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob(['﻿' + filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
      a.download = `facturacion-${A.mes || 'todo'}.csv`; a.click(); URL.revokeObjectURL(a.href);
    },
    nuevoSocio() {
      U.modal(`<h2>Nuevo socio</h2><p class="sub">Se crea su ficha y su código QR. Cuando se registre en la app con este correo, la cuenta quedará enlazada.</p><form data-form="socio">
        <label class="campo"><span>Nombre y apellidos</span><input class="inp" name="nombre" required maxlength="80"></label>
        <div class="fila"><label class="campo"><span>Correo</span><input class="inp" type="email" name="email" required></label><label class="campo"><span>Teléfono</span><input class="inp" name="tel" inputmode="tel" maxlength="20"></label></div>
        <div class="fila"><label class="campo"><span>Cuota</span><select class="inp" name="plan">${opPlanes('mensual')}</select></label>
          <label class="campo"><span>Forma de pago</span><select class="inp" name="metodo">${opMetodos('efectivo')}</select></label></div>
        <label class="check"><input type="checkbox" name="cobrado" checked> Ya ha pagado la primera cuota</label>
        <div class="acciones"><button class="btn ancho">Dar de alta</button></div></form>`);
    },
    claseForm(d) {
      const c = d.id ? D.clase(d.id) : { dia: D.diaSemana(D.hoy()), hora: '18:00', disc: C.disciplinas[0].id, dur: 50, monitor: '', sala: 'Sala 1', aforo: 16, nivel: 'Todos' };
      U.modal(`<h2>${d.id ? 'Editar clase' : 'Nueva clase'}</h2><form data-form="clase"><input type="hidden" name="id" value="${d.id || ''}">
        <div class="fila"><label class="campo"><span>Actividad</span><select class="inp" name="disc">${opciones(C.disciplinas.map(x => [x.id, x.nombre]), c.disc)}</select></label><label class="campo"><span>Día</span><select class="inp" name="dia">${opciones(D.DIAS.map((n, i) => [i, n]), c.dia)}</select></label></div>
        <div class="fila"><label class="campo"><span>Hora</span><input class="inp" type="time" name="hora" value="${c.hora}" required></label><label class="campo"><span>Duración (min)</span><input class="inp" type="number" name="dur" min="10" max="180" value="${c.dur}" required></label></div>
        <div class="fila"><label class="campo"><span>Monitor</span><input class="inp" name="monitor" value="${esc(c.monitor)}" required></label><label class="campo"><span>Sala</span><input class="inp" name="sala" value="${esc(c.sala)}" required></label></div>
        <div class="fila"><label class="campo"><span>Aforo</span><input class="inp" type="number" name="aforo" min="1" max="200" value="${c.aforo}" required></label><label class="campo"><span>Nivel</span><select class="inp" name="nivel">${opciones(['Todos', 'Inicial', 'Intermedio', 'Avanzado'].map(x => [x, x]), c.nivel)}</select></label></div>
        <div class="acciones"><button class="btn">Guardar</button>${d.id ? `<button type="button" class="btn peligro" data-a="borrarClase" data-id="${d.id}">${ic('trash')} Eliminar clase</button>` : ''}</div></form>`);
    },
    async borrarClase(d, el) {
      // Segundo toque para confirmar: borra también las reservas de esa clase
      if (!el.dataset.seguro) { el.dataset.seguro = '1'; el.innerHTML = 'Pulsa otra vez para eliminarla y cancelar sus reservas'; return; }
      el.disabled = true;
      if (await D.hacer(sb.from('clases').delete().eq('id', +d.id), 'Clase eliminada del horario')) U.cerrar();
    },
    planForm(d) {
      const p = D.plan(d.id);
      U.modal(`<h2>Editar cuota</h2><form data-form="plan"><input type="hidden" name="id" value="${p.id}">
        <label class="campo"><span>Nombre</span><input class="inp" name="nombre" value="${esc(p.nombre)}" required maxlength="30"></label>
        <label class="campo"><span>Precio (€, IVA incluido)</span><input class="inp" type="number" name="precio" min="0" step="0.5" value="${p.precio}" required></label>
        <div class="acciones"><button class="btn ancho">Guardar</button></div></form>`);
    },
    borrarPost(d, el) {
      if (!el.dataset.seguro) { el.dataset.seguro = '1'; el.style.color = 'var(--bad)'; U.toast('Pulsa otra vez la papelera para eliminar la publicación'); return; }
      el.disabled = true; D.hacer(sb.from('posts').delete().eq('id', +d.id), 'Publicación eliminada');
    },
    entregar(d, el) { el.disabled = true; D.hacer(sb.from('canjes').update({ entregado: true }).eq('id', +d.id), 'Recompensa entregada'); }
  });

  U.inputs.buscar = v => { A.q = v; document.getElementById('tb-socios').innerHTML = filasSocios(); };
  U.changes.mes = v => { A.mes = v; U.render(); };

  Object.assign(U.forms, {
    notas: f => yFicha(sb.from('socios').update({ lesiones: f.lesiones.trim(), notas: f.notas.trim() }).eq('id', +f.id), 'Ficha actualizada', f.id),
    async cobro(f) { U.cerrar(); await yFicha(sb.rpc('cobro_manual', { p_socio: +f.id, p_plan: f.plan, p_metodo: f.metodo }), 'Cuota cobrada y activada', f.id); },
    async socio(f) {
      const p = D.plan(f.plan);
      const nuevo = await D.hacer(sb.from('socios').insert({ nombre: f.nombre.trim(), email: f.email.trim().toLowerCase(), tel: f.tel.trim(), plan_id: p.id, metodo: f.metodo }).select('id').single());
      if (!nuevo) return;
      const cobro = f.cobrado ? sb.rpc('cobro_manual', { p_socio: nuevo.id, p_plan: p.id, p_metodo: f.metodo })
        : sb.from('pagos').insert({ socio_id: nuevo.id, plan_id: p.id, concepto: 'Cuota ' + p.nombre, total: p.precio, estado: 'pendiente', metodo: f.metodo });
      A.q = ''; A.fEstado = 'todos';
      await D.hacer(cobro, 'Socio dado de alta');
      ficha(nuevo.id);
    },
    async clase(f) {
      const datos = { dia: +f.dia, hora: f.hora.slice(0, 5), disc: f.disc, dur: +f.dur, monitor: f.monitor.trim(), sala: f.sala.trim(), aforo: +f.aforo, nivel: f.nivel };
      if (await D.hacer(f.id ? sb.from('clases').update(datos).eq('id', +f.id) : sb.from('clases').insert(datos), 'Horario actualizado')) U.cerrar();
    },
    async plan(f) { if (await D.hacer(sb.from('planes').update({ nombre: f.nombre.trim(), precio: +f.precio }).eq('id', f.id), 'Cuota actualizada')) U.cerrar(); },
    anuncio: f => D.hacer(sb.from('posts').insert({ oficial: true, texto: f.texto.trim() }), 'Anuncio publicado en el muro'),
    async leer(f) {
      if (!f.codigo.trim() && !f.socio) return U.toast('Escribe un código o elige un socio', 'bad');
      A.lector = null;
      const r = await D.hacer(sb.rpc('registrar_acceso', { p_codigo: f.codigo.trim(), p_socio: f.socio ? +f.socio : null }));
      if (r) { A.lector = { socioId: r.socio_id, ok: r.ok, motivo: r.motivo, puntos: r.puntos }; U.render(); }
    }
  });
})();
