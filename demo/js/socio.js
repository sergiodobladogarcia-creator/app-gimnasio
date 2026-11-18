/* App del socio (formato móvil): inicio, clases, comunidad, progreso y perfil. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, D = window.D, U = window.UI, esc = U.esc, ic = U.ic, avatar = U.avatar;
  const S = { dia: D.iso(D.hoy()), disc: '', com: 'muro', prog: 'rutinas', ejercicio: 'Sentadilla', abiertos: new Set() };
  const TABS = [['inicio', 'Inicio', 'home'], ['clases', 'Clases', 'calendar'], ['comunidad', 'Comunidad', 'users'], ['progreso', 'Progreso', 'chart'], ['perfil', 'Perfil', 'user']];
  const guardar = () => { D.save(); U.render(); };

  function proxima(id) {
    const ahora = new Date();
    return D.db.reservas.filter(r => r.socioId === id).map(r => ({ r, c: D.clase(r.claseId) }))
      .filter(x => x.c && D.cuando(x.r.fecha, x.c.hora) > ahora)
      .sort((a, b) => D.cuando(a.r.fecha, a.c.hora) - D.cuando(b.r.fecha, b.c.hora))[0];
  }
  const vigencia = s => s.proxCobro ? 'Se renueva el ' + D.fecha(s.proxCobro, { day: 'numeric', month: 'long' }) : s.sesionesRest !== null ? `${s.sesionesRest} sesiones disponibles` : '';

  function claseRow(c, fecha) {
    const d = D.disc(c.disc), libres = c.aforo - D.ocup(c, fecha), mia = D.reservada(c.id, fecha, D.db.yo), pasada = D.cuando(fecha, c.hora) < new Date();
    const at = `data-clase="${c.id}" data-fecha="${fecha}"`;
    const btn = pasada ? '<span class="tag">Terminada</span>'
      : mia ? `<button class="btn mini suave" data-a="cancelar" ${at} title="Toca para cancelar la reserva">${ic('check')} Reservada</button>`
        : libres <= 0 ? '<span class="tag">Completa</span>'
          : `<button class="btn mini" data-a="reservar" ${at}>Reservar</button>`;
    const plazas = mia ? 'Tienes plaza' : libres <= 0 ? 'Sin plazas' : libres === 1 ? 'Queda 1 plaza' : `${libres} plazas libres`;
    return `<article class="clase ${pasada ? 'pasada' : ''}" style="--c:${d.color}">
      <div class="cl-h"><b>${c.hora}</b><span>${c.dur} min</span></div>
      <div class="cl-i"><strong>${esc(d.nombre)}</strong><span>${esc(c.monitor)} · ${esc(c.sala)} · ${esc(c.nivel)}</span><span class="plazas ${libres <= 0 && !mia ? 'cero' : libres <= 3 && !mia ? 'pocas' : ''}">${plazas}</span></div>
      ${btn}</article>`;
  }

  /* ---------- Inicio ---------- */
  function inicio() {
    const s = D.yo(), plan = D.plan(s.planId), acc = D.puedeEntrar(s), nx = proxima(s.id), sem = D.entrenosSemana(s.id), obj = C.objetivoSemanal, hoy = D.iso(D.hoy());
    const quedan = D.clasesDe(hoy).filter(c => D.cuando(hoy, c.hora) > new Date()).slice(0, 3);
    const ult = D.logros(s).filter(l => !l.ok).sort((a, b) => b.p - a.p)[0];
    return `<header class="hello"><div><p class="eyebrow">${new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p><h1>Hola, ${esc(s.nombre.split(' ')[0])}</h1></div>${avatar(s, 46)}</header>
    <button class="pass" data-a="verQR" aria-label="Mostrar mi código QR de acceso">
      <div class="pass-info"><small>Pase de acceso</small><strong>${esc(plan.nombre)}</strong><span class="pill ${acc.ok ? 'ok' : 'bad'}">${esc(acc.motivo)}</span><em>${esc(vigencia(s))}</em></div>
      <div class="pass-qr">${U.qrSvg(s.codigo)}<span>Toca para ampliar</span></div>
    </button>
    ${window.Aforo.tarjeta()}
    <section class="blq"><div class="sec-h"><h3>Tu próxima clase</h3><a href="#/socio/clases">Ver horario</a></div>
      ${nx ? `<div class="card next"><div class="next-f"><b>${D.parse(nx.r.fecha).getDate()}</b><span>${D.fecha(nx.r.fecha, { weekday: 'short' }).replace('.', '')}</span></div>
        <div class="next-i"><strong>${esc(D.disc(nx.c.disc).nombre)} · ${nx.c.hora}</strong><span>${esc(nx.c.monitor)} · ${esc(nx.c.sala)} · ${nx.c.dur} min</span></div>
        <button class="btn mini sec" data-a="cancelar" data-clase="${nx.c.id}" data-fecha="${nx.r.fecha}">Cancelar</button></div>`
        : `<div class="card"><p class="muted">No tienes ninguna clase reservada.</p><div class="acciones"><a class="btn mini" href="#/socio/clases">Reservar una clase</a></div></div>`}
    </section>
    <section class="blq"><div class="card"><div class="sem-top"><b>Objetivo de la semana</b><span class="muted">${Math.min(sem, obj)} de ${obj} entrenos</span></div><div class="barra-p terra"><i style="width:${Math.min(100, sem / obj * 100)}%"></i></div></div></section>
    <section class="blq trio"><div class="dato"><b>${D.racha(s.id)}</b><span>semanas de racha</span></div><div class="dato"><b>${s.visitas}</b><span>visitas en total</span></div><div class="dato"><b>${s.puntos.toLocaleString('es-ES')}</b><span>puntos · ${esc(D.nivel(s.puntos).actual.nombre)}</span></div></section>
    ${ult ? `<section class="blq"><div class="sec-h"><h3>Tu siguiente logro</h3><a href="#/socio/progreso" data-a="seg" data-k="prog" data-v="logros">Ver todos</a></div>
      <div class="premio"><span class="em">${ult.e}</span><div><strong>${esc(ult.n)}</strong><span>${esc(ult.d)}</span><div class="barra-p" style="margin-top:7px"><i style="width:${ult.p * 100}%"></i></div></div><b class="num">${Math.floor(ult.p * 100)}%</b></div></section>` : ''}
    <section class="blq"><div class="sec-h"><h3>Hoy en el gimnasio</h3></div>${quedan.length ? quedan.map(c => claseRow(c, hoy)).join('') : '<p class="vacio">No quedan clases por hoy.</p>'}</section>`;
  }

  /* ---------- Clases ---------- */
  function clases() {
    const hoy = D.hoy(), dias = [...Array(7)].map((_, i) => D.addDays(hoy, i));
    const lista = D.clasesDe(S.dia).filter(c => !S.disc || c.disc === S.disc);
    return `<h1 class="s-tit">Clases y horarios</h1>
    <div class="dias">${dias.map(d => { const k = D.iso(d); return `<button class="dia ${k === S.dia ? 'on' : ''}" data-a="seg" data-k="dia" data-v="${k}"><span>${d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', '')}</span><b>${d.getDate()}</b></button>`; }).join('')}</div>
    <div class="chips"><button class="chip ${!S.disc ? 'on' : ''}" data-a="seg" data-k="disc" data-v="">Todas</button>${C.disciplinas.map(d => `<button class="chip ${S.disc === d.id ? 'on' : ''}" data-a="seg" data-k="disc" data-v="${d.id}">${esc(d.nombre)}</button>`).join('')}</div>
    ${lista.length ? lista.map(c => claseRow(c, S.dia)).join('') : '<p class="vacio">No hay clases este día con ese filtro.</p>'}`;
  }

  /* ---------- Comunidad ---------- */
  function bloqueEntreno(p, detalle) {
    if (!p.ejercicios || !p.ejercicios.length) return '';
    const prs = (p.prs || []).map(x => x.toLowerCase());
    return `<div class="entreno"><h4>${esc(p.titulo || 'Entrenamiento')}${p.tipo ? ` <span class="tag">${esc(p.tipo)}</span>` : ''}${prs.length ? ' <span class="pr">🏆 Nuevo récord</span>' : ''}</h4>
      <ul>${p.ejercicios.map(e => {
        const ss = D.sets(e), top = ss.reduce((a, b) => (b.kg > a.kg || (b.kg === a.kg && b.r > a.r) ? b : a), ss[0] || { r: 0, kg: 0 });
        return `<li><div>${esc(e.n)}${prs.includes(e.n.toLowerCase()) ? ' 🏆' : ''}${detalle ? `<div class="series">${ss.map(s => `<span>${s.kg ? s.kg + ' kg × ' : ''}${s.r}</span>`).join('')}</div>` : ''}</div><span>${ss.length} ${ss.length === 1 ? 'serie' : 'series'}${top.kg ? ` · ${top.kg} kg × ${top.r}` : ''}</span></li>`;
      }).join('')}</ul></div>`;
  }
  function postHtml(p) {
    const a = p.oficial ? null : D.socio(p.socioId), ab = S.abiertos.has(p.id);
    return `<article class="post ${p.oficial ? 'oficial' : ''}">
      <div class="post-h">${avatar(a, 38)}<div><strong>${esc(a ? a.nombre.split(' ').slice(0, 2).join(' ') : C.nombre)}</strong><span>${p.oficial ? 'Anuncio del gimnasio · ' : ''}${U.hace(p.ts)}</span></div></div>
      ${p.texto ? `<p>${esc(p.texto)}</p>` : ''}${bloqueEntreno(p)}
      <div class="post-a"><button class="${p.liked ? 'on' : ''}" data-a="like" data-id="${p.id}" aria-pressed="${p.liked}">${ic('heart')} ${p.likes}</button><button data-a="coms" data-id="${p.id}">${ic('chat')} ${p.comentarios.length}</button></div>
      ${ab ? `<div class="coms">${p.comentarios.map(c => { const x = D.socio(c.socioId); return `<div class="com">${avatar(x, 28)}<div><b>${esc(x.nombre.split(' ')[0])}</b>${esc(c.texto)}</div></div>`; }).join('')}
        <form class="com-f" data-form="comentar"><input type="hidden" name="id" value="${p.id}"><input class="inp" name="texto" placeholder="Escribe un comentario…" required maxlength="200" aria-label="Comentario"><button class="btn mini">Enviar</button></form></div>` : ''}
    </article>`;
  }
  function comunidad() {
    const yo = D.db.yo;
    let cuerpo;
    if (S.com === 'muro') cuerpo = [...D.db.posts].sort((a, b) => b.ts - a.ts).map(postHtml).join('') || '<p class="vacio">Todavía no hay publicaciones.</p>';
    else {
      const orden = D.db.socios.filter(s => s.estado === 'activo').sort((a, b) => b.visitasMes - a.visitasMes);
      const top = orden.slice(0, 10), pos = orden.findIndex(s => s.id === yo);
      const fila = (s, i) => `<div class="rank ${i < 3 ? 'top' : ''} ${s.id === yo ? 'yo' : ''}"><i>${i + 1}</i>${avatar(s, 34)}<strong>${esc(s.nombre.split(' ').slice(0, 2).join(' '))}${s.id === yo ? ' (tú)' : ''}</strong><span>${s.visitasMes} visitas</span></div>`;
      cuerpo = `<div class="card"><p class="muted" style="font-size:13px;margin-bottom:6px">Socios que más han venido este mes</p>${top.map(fila).join('')}${pos >= 10 ? fila(orden[pos], pos) : ''}</div>`;
    }
    return `<h1 class="s-tit">Comunidad</h1>
    <div class="seg"><button class="${S.com === 'muro' ? 'on' : ''}" data-a="seg" data-k="com" data-v="muro">Muro</button><button class="${S.com === 'ranking' ? 'on' : ''}" data-a="seg" data-k="com" data-v="ranking">Ranking del mes</button></div>${cuerpo}<div style="height:60px"></div>`;
  }

  /* ---------- Progreso ---------- */
  function progreso() {
    const s = D.yo(), ents = D.entrenosDe(s.id), niv = D.nivel(s.puntos);
    const seg = `<div class="seg cuatro">${[['rutinas', 'Rutinas'], ['evolucion', 'Evolución'], ['logros', 'Logros'], ['recompensas', 'Recompensas']].map(([k, t]) => `<button class="${S.prog === k ? 'on' : ''}" data-a="seg" data-k="prog" data-v="${k}">${t}</button>`).join('')}</div>`;
    let cuerpo = '';
    if (S.prog === 'rutinas') cuerpo = window.Rutinas.vista();
    else if (S.prog === 'evolucion') {
      const nombres = [...new Set(ents.flatMap(e => e.ejercicios.filter(x => D.kgMax(x) > 0).map(x => x.n)))];
      if (!nombres.includes(S.ejercicio)) S.ejercicio = nombres[0] || '';
      const pts = ents.filter(e => e.ejercicios.some(x => x.n === S.ejercicio)).reverse().map(e => ({ l: D.fecha(e.fecha, { day: 'numeric', month: 'short' }), v: Math.max(...e.ejercicios.filter(x => x.n === S.ejercicio).map(D.kgMax)) }));
      const mes = D.mesKey(D.hoy()), sube = pts.length > 1 ? pts[pts.length - 1].v - pts[0].v : 0;
      cuerpo = `<div class="trio"><div class="dato"><b>${ents.filter(e => e.fecha.startsWith(mes)).length}</b><span>entrenos este mes</span></div><div class="dato"><b>${ents.length}</b><span>entrenos en total</span></div><div class="dato"><b>${D.prs(s.id)}</b><span>récords personales</span></div></div>
      <section class="blq"><div class="card">${nombres.length ? `<label class="campo"><span>Evolución de carga</span><select class="inp" data-ch="ejercicio">${nombres.map(n => `<option ${n === S.ejercicio ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label>
        ${U.lineChart(pts, 'kg')}${pts.length > 1 ? `<p class="aviso">Mejor marca: <b>${Math.max(...pts.map(p => p.v))} kg</b>. ${sube > 0 ? `Has subido <b>${sube} kg</b> desde tu primera sesión.` : 'Sigue registrando para ver tu progresión.'}</p>` : ''}` : '<p class="vacio">Registra tu primer entrenamiento para empezar a ver tu evolución.</p>'}</div></section>
      <section class="blq"><div class="sec-h"><h3>Historial</h3><span class="muted" style="font-size:13px">Kilos × repeticiones de cada serie</span></div>${ents.slice(0, 6).map(e => `<div class="post"><div class="post-h" style="margin:0"><div><strong>${esc(e.titulo)}</strong><span>${D.fecha(e.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}</span></div><span class="tag">${e.ejercicios.reduce((t, x) => t + D.sets(x).reduce((a, s) => a + s.r * s.kg, 0), 0).toLocaleString('es-ES')} kg</span></div>${bloqueEntreno({ ejercicios: e.ejercicios, titulo: e.tipo, prs: e.prs }, true)}</div>`).join('')}</section><div style="height:60px"></div>`;
    } else if (S.prog === 'logros') {
      const L = D.logros(s);
      cuerpo = `<div class="nivel"><small>Tu nivel</small><h2>${esc(niv.actual.nombre)}</h2><p>${s.puntos.toLocaleString('es-ES')} puntos</p><div class="barra-p"><i style="width:${niv.pct * 100}%"></i></div><p>${niv.siguiente ? `Te faltan ${niv.faltan} puntos para ${esc(niv.siguiente.nombre)}` : 'Has alcanzado el nivel máximo'}</p></div>
      <section class="blq"><div class="sec-h"><h3>Logros</h3><span class="muted" style="font-size:13px">${L.filter(l => l.ok).length} de ${L.length}</span></div>
      <div class="logros">${L.map(l => `<div class="logro ${l.ok ? '' : 'no'}"><div class="medalla">${l.e}</div><strong>${esc(l.n)}</strong><span>${esc(l.d)}</span>${l.ok ? '' : `<div class="barra-p"><i style="width:${l.p * 100}%"></i></div>`}</div>`).join('')}</div></section>
      <p class="aviso">Ganas ${C.puntos.acceso} puntos cada vez que entras al gimnasio y ${C.puntos.entreno} por cada entrenamiento que registras.</p>`;
    } else {
      const mios = D.db.canjes.filter(c => c.socioId === s.id).reverse();
      cuerpo = `<div class="card next"><div class="next-f"><b>${ic('gift')}</b></div><div class="next-i"><strong>${s.puntos.toLocaleString('es-ES')} puntos</strong><span>disponibles para canjear</span></div></div>
      <section class="blq">${C.recompensas.map(r => `<div class="premio"><span class="em">${r.icono}</span><div><strong>${esc(r.nombre)}</strong><span>${r.coste.toLocaleString('es-ES')} puntos</span></div>
        <button class="btn mini ${s.puntos >= r.coste ? 'terra' : 'sec'}" data-a="canjear" data-id="${r.id}" ${s.puntos >= r.coste ? '' : 'disabled'}>${s.puntos >= r.coste ? 'Canjear' : `Faltan ${r.coste - s.puntos}`}</button></div>`).join('')}</section>
      ${mios.length ? `<section class="blq"><div class="sec-h"><h3>Mis canjes</h3></div>${mios.map(c => { const r = C.recompensas.find(x => x.id === c.recompensaId); return `<div class="premio"><span class="em">${r.icono}</span><div><strong>${esc(r.nombre)}</strong><span>${c.entregado ? 'Entregado' : 'Enseña este código en recepción'}</span></div><span class="codigo">${c.codigo}</span></div>`; }).join('')}</section>` : ''}`;
    }
    return `<h1 class="s-tit">Mi progreso</h1>${seg}${cuerpo}`;
  }

  /* ---------- Perfil, cuotas y pagos ---------- */
  function perfil() {
    const s = D.yo(), plan = D.plan(s.planId), est = D.estado(s), pagos = D.db.pagos.filter(p => p.socioId === s.id).reverse().slice(0, 6);
    return `<div class="perfil-h">${avatar(s, 76)}<h1>${esc(s.nombre)}</h1><span class="muted">Socio desde ${D.fecha(s.alta, { month: 'long', year: 'numeric' })} · Nivel ${esc(D.nivel(s.puntos).actual.nombre)}</span></div>
    <div class="card"><div class="sec-h"><h3>Mi suscripción</h3><span class="pill ${est.c}">${est.t}</span></div>
      <div class="kv"><span>Cuota</span><b>${esc(plan.nombre)} · ${D.eur(plan.precio)}</b></div>
      <div class="kv"><span>${plan.meses ? 'Próximo cobro' : 'Sesiones'}</span><b>${s.proxCobro ? D.fecha(s.proxCobro) : s.sesionesRest !== null ? s.sesionesRest + ' disponibles' : '—'}</b></div>
      <div class="kv"><span>Método de pago</span><b>${D.METODOS[s.metodo]}${s.metodo === 'tarjeta' ? ' ···· 4242' : ''}</b></div>
      <div class="acciones"><button class="btn mini sec" data-a="metodo">${ic('card')} Cambiar método de pago</button></div></div>
    <section class="blq"><div class="sec-h"><h3>Cuotas del gimnasio</h3></div>
      ${D.db.planes.map(p => `<div class="plan ${p.id === s.planId ? 'actual' : ''}">${p.destacado ? '<span class="cinta">La más elegida</span>' : ''}
        <div class="plan-h"><strong>${esc(p.nombre)}</strong><span class="precio">${D.eur(p.precio)} <small>${esc(p.periodo)}</small></span></div>
        <ul>${p.ventajas.map(v => `<li>${ic('check')}${esc(v)}</li>`).join('')}</ul>
        ${p.id === s.planId ? `<button class="btn ancho suave" data-a="contratar" data-plan="${p.id}">Tu cuota actual · Renovar ahora</button>` : `<button class="btn ancho" data-a="contratar" data-plan="${p.id}">Contratar</button>`}</div>`).join('')}</section>
    <section class="blq"><div class="sec-h"><h3>Recibos y facturas</h3></div><div class="card">${pagos.length ? pagos.map(p => `<button class="recibo" data-a="factura" data-id="${p.id}">${ic('file')}<div><strong>${esc(p.concepto)}</strong><span>${D.fecha(p.fecha)} · ${esc(p.n)}</span></div><b>${D.eur(p.total)}</b></button>`).join('') : '<p class="vacio">Aún no tienes recibos.</p>'}</div></section>
    <section class="blq"><div class="card"><div class="sec-h"><h3>Mis datos</h3></div><div class="kv"><span>Correo</span><b>${esc(s.email)}</b></div><div class="kv"><span>Teléfono</span><b>${esc(s.tel)}</b></div><div class="kv"><span>Objetivo</span><b>${esc(s.objetivo)}</b></div><div class="kv"><span>Nivel</span><b>${esc(s.nivelFisico)}</b></div></div></section>`;
  }

  const VISTAS = { inicio, clases, comunidad, progreso, perfil };
  window.Socio = {
    render(tab) {
      const t = VISTAS[tab] ? tab : 'inicio';
      const fab = t === 'comunidad' || (t === 'progreso' && S.prog === 'evolucion') ? `<button class="fab" data-a="nuevoEntreno">${ic('plus')} ${t === 'comunidad' ? 'Publicar entreno' : 'Registrar entreno'}</button>` : '';
      return `<div class="stage stage-socio"><div class="phone"><div class="screen" data-scroll>${VISTAS[t]()}</div>${fab}
        <nav class="tabbar" aria-label="Secciones">${TABS.map(([k, n, i]) => `<a href="#/socio/${k}" class="${k === t ? 'on' : ''}" ${k === t ? 'aria-current="page"' : ''}>${ic(i)}${n}</a>`).join('')}</nav></div></div>`;
    }
  };

  /* ---------- Acciones ---------- */
  const opsPago = sel => [['tarjeta', 'Tarjeta ···· 4242', 'Se cobra al momento'], ['bizum', 'Bizum', 'Confirmas el pago desde tu banco'], ['sepa', 'Domiciliación bancaria', 'Se carga en tu cuenta en 1-2 días']]
    .map(([k, t, d]) => `<label class="op"><input type="radio" name="metodo" value="${k}" ${k === sel ? 'checked' : ''}><div><strong>${t}</strong><span>${d}</span></div></label>`).join('');
  const AVISO_PAGO = '<p class="aviso">Modo demo: no se realiza ningún cobro. En la versión real el pago pasa por una pasarela segura (Stripe o Redsys) y la app nunca guarda los datos de la tarjeta.</p>';

  Object.assign(U.actions, {
    seg(d) { S[d.k] = d.v; if (d.k === 'prog' && U.ruta().tab !== 'progreso') return U.ir('#/socio/progreso'); U.render(); },
    verQR() {
      const s = D.yo(), acc = D.puedeEntrar(s);
      U.modal(`<div class="centrado"><p class="eyebrow">Pase de acceso</p><h2 style="padding:0">${esc(s.nombre)}</h2><div class="qr-grande">${U.qrSvg(s.codigo)}</div>
        <p><span class="codigo">${s.codigo}</span></p><p style="margin-top:12px"><span class="pill ${acc.ok ? 'ok' : 'bad'}">${esc(acc.motivo)}</span></p>
        <p class="aviso">Acerca este código al lector de la entrada. Cada acceso suma ${C.puntos.acceso} puntos.</p></div>`);
    },
    reservar(d) {
      const s = D.yo(), acc = D.puedeEntrar(s), c = D.clase(d.clase);
      if (!acc.ok) return U.toast('No puedes reservar: ' + acc.motivo.toLowerCase(), 'bad');
      if (D.ocup(c, d.fecha) >= c.aforo) return U.toast('La clase se acaba de completar', 'bad');
      D.db.reservas.push({ claseId: c.id, fecha: d.fecha, socioId: s.id });
      guardar(); U.toast(`Plaza reservada · ${D.disc(c.disc).nombre} ${c.hora}`, 'ok');
    },
    cancelar(d) {
      D.db.reservas = D.db.reservas.filter(r => !(r.claseId === +d.clase && r.fecha === d.fecha && r.socioId === D.db.yo));
      guardar(); U.toast('Reserva cancelada');
    },
    like(d) { const p = D.db.posts.find(x => x.id === +d.id); p.liked = !p.liked; p.likes += p.liked ? 1 : -1; guardar(); },
    coms(d) { const id = +d.id; S.abiertos.has(id) ? S.abiertos.delete(id) : S.abiertos.add(id); U.render(); },
    nuevoEntreno() {
      const nombres = ['Sentadilla', 'Press banca', 'Peso muerto', 'Press militar', 'Remo con barra', 'Hip thrust', 'Dominadas', 'Prensa', 'Zancadas', 'Curl de bíceps', 'Fondos', 'Plancha'];
      const fila = () => `<div class="ej-row"><input class="inp" list="ejs" placeholder="Ejercicio" aria-label="Ejercicio"><input class="inp" type="number" min="1" value="4" aria-label="Series"><input class="inp" type="number" min="1" value="8" aria-label="Repeticiones"><input class="inp" type="number" min="0" step="0.5" placeholder="0" aria-label="Kilos"><button type="button" data-a="quitarEj" aria-label="Quitar ejercicio">${ic('x')}</button></div>`;
      U.modal(`<h2>Registrar entreno</h2><p class="sub">Apunta lo que has hecho hoy. Si superas una marca, lo detectamos.</p>
        <form data-form="entreno"><div class="fila"><label class="campo"><span>Título</span><input class="inp" name="titulo" placeholder="Día de pierna" required maxlength="40"></label>
          <label class="campo"><span>Tipo</span><select class="inp" name="tipo"><option>Fuerza</option><option>Cardio</option><option>Clase dirigida</option><option>Movilidad</option></select></label></div>
          <div class="ej-row ej-head"><span>Ejercicio</span><span>Series</span><span>Reps</span><span>Kg</span><span></span></div>
          <div id="ejs-rows">${fila()}${fila()}</div><datalist id="ejs">${nombres.map(n => `<option value="${n}">`).join('')}</datalist>
          <button type="button" class="btn mini sec" data-a="masEj">${ic('plus')} Añadir ejercicio</button>
          <label class="campo" style="margin-top:14px"><span>Cómo ha ido (opcional)</span><textarea class="inp" name="nota" maxlength="240" placeholder="Sensaciones, notas…"></textarea></label>
          <label class="check"><input type="checkbox" name="publicar" checked> Publicarlo en el muro de la comunidad</label>
          <label class="check" style="margin-top:0"><input type="checkbox" name="rutina"> Guardarlo también como rutina</label>
          <div class="acciones"><button class="btn terra ancho">Guardar entreno · +${C.puntos.entreno} puntos</button></div></form>`);
      U._filaEj = fila;
    },
    masEj() { document.getElementById('ejs-rows').insertAdjacentHTML('beforeend', U._filaEj()); },
    quitarEj(d, el) { el.closest('.ej-row').remove(); },
    canjear(d) {
      const s = D.yo(), r = C.recompensas.find(x => x.id === d.id);
      if (s.puntos < r.coste) return;
      s.puntos -= r.coste;
      const codigo = 'R-' + Math.random().toString(36).slice(2, 7).toUpperCase();
      D.db.canjes.push({ id: D.db.canjes.length + 1, socioId: s.id, recompensaId: r.id, ts: Date.now(), codigo, entregado: false });
      guardar(); U.toast(`Canjeado: ${r.nombre}. Enseña el código en recepción.`, 'ok');
    },
    contratar(d) {
      const p = D.plan(d.plan), s = D.yo(), x = D.desglose(p.precio);
      U.modal(`<h2>${esc(p.nombre)}</h2><p class="sub">${D.eur(p.precio)} ${esc(p.periodo)}${p.meses ? ' · se renueva automáticamente' : ''}</p>
        <form data-form="pagar"><input type="hidden" name="plan" value="${p.id}">${opsPago(s.metodo)}
          <div style="margin-top:14px"><div class="kv"><span>Base imponible</span><b>${D.eur(x.base)}</b></div><div class="kv"><span>IVA ${C.iva} %</span><b>${D.eur(x.iva)}</b></div><div class="kv"><span>Total</span><b>${D.eur(p.precio)}</b></div></div>
          <div class="acciones"><button class="btn terra ancho">Pagar ${D.eur(p.precio)}</button></div>${AVISO_PAGO}</form>`);
    },
    metodo() {
      U.modal(`<h2>Método de pago</h2><p class="sub">Con este método se cobrarán tus próximas cuotas.</p><form data-form="metodo">${opsPago(D.yo().metodo)}<div class="acciones"><button class="btn ancho">Guardar</button></div>${AVISO_PAGO}</form>`);
    }
  });

  U.changes.ejercicio = v => { S.ejercicio = v; U.render(); };

  Object.assign(U.forms, {
    comentar(f) {
      const p = D.db.posts.find(x => x.id === +f.id), t = f.texto.trim();
      if (!t) return;
      p.comentarios.push({ socioId: D.db.yo, texto: t }); guardar();
    },
    async entreno(f, form) {
      const filas = [...form.querySelectorAll('#ejs-rows .ej-row')].map(r => { const i = r.querySelectorAll('input'); return { n: i[0].value.trim(), s: +i[1].value || 1, r: +i[2].value || 1, kg: +i[3].value || 0 }; }).filter(x => x.n);
      if (!filas.length) return U.toast('Añade al menos un ejercicio', 'bad');
      const antes = D.logros(D.yo()).filter(l => l.ok).map(l => l.id);
      const r = await D.guardarEntreno({ titulo: f.titulo.trim(), tipo: f.tipo, nota: f.nota.trim(), ejercicios: filas, publicar: !!f.publicar, guardarRutina: !!f.rutina });
      if (!r) return;
      if (filas.some(x => x.kg > 0)) S.ejercicio = filas.find(x => x.kg > 0).n;
      U.cerrar(); U.render();
      const pts = r.puntos ? ` · +${r.puntos} puntos` : '';
      U.toast(r.prs.length ? `🏆 Nuevo récord en ${r.prs.join(', ')}${pts}` : `Entreno guardado${pts}`, 'ok');
      D.logros(D.yo()).filter(l => l.ok && !antes.includes(l.id)).forEach(l => setTimeout(() => U.toast(`${l.e} Logro desbloqueado: ${l.n}`, 'ok'), 900));
    },
    pagar(f) {
      const s = D.yo(), p = D.plan(f.plan);
      s.metodo = f.metodo; D.activarPlan(s, p);
      D.nuevoPago(s.id, p, f.metodo === 'sepa' ? 'pendiente' : 'pagado', f.metodo);
      U.cerrar(); guardar();
      U.toast(f.metodo === 'sepa' ? 'Cuota contratada · el recibo se cargará en tu cuenta' : `Pago realizado · ${p.nombre} activa`, 'ok');
    },
    metodo(f) { D.yo().metodo = f.metodo; U.cerrar(); guardar(); U.toast('Método de pago actualizado', 'ok'); }
  });
})();
