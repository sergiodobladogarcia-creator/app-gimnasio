/* Capa de datos: cuentas y base de datos reales (Supabase).
   Carga en D.db lo que el usuario conectado tiene permiso para ver. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, D = window.D = {};

  /* ---------- Fechas y formato ---------- */
  D.hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  D.iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  D.parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  D.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  D.diasDesde = s => Math.round((D.hoy() - D.parse(s)) / 864e5);
  D.diaSemana = d => (d.getDay() + 6) % 7; // 0 = lunes
  D.lunes = d => D.addDays(d, -D.diaSemana(d));
  D.eur = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  D.fecha = (s, o) => s ? D.parse(s).toLocaleDateString('es-ES', o || { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
  D.mesKey = d => D.iso(d).slice(0, 7);
  D.DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  D.METODOS = { tarjeta: 'Tarjeta', bizum: 'Bizum', sepa: 'Domiciliación', efectivo: 'Efectivo' };
  D.hash = str => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; };

  /* ---------- Conexión ---------- */
  const sb = D.sb = window.supabase.createClient(C.supabase.url, C.supabase.clave);
  const camel = v => Array.isArray(v) ? v.map(camel)
    : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k.replace(/_([a-z])/g, (m, c) => c.toUpperCase()), camel(x)])) : v;
  const q = async p => { const { data, error } = await p; if (error) throw error; return data; };
  D.sesion = null; D.db = null;

  const ERRORES = [
    [/invalid login credentials/i, 'Correo o contraseña incorrectos'],
    [/already registered/i, 'Ya existe una cuenta con ese correo'],
    [/email not confirmed/i, 'Confirma tu correo con el enlace que te enviamos antes de entrar'],
    [/password should be at least/i, 'La contraseña debe tener al menos 6 caracteres'],
    [/rate limit|too many/i, 'Demasiados intentos. Espera unos minutos y vuelve a probar'],
    [/failed to fetch|network/i, 'Sin conexión. Comprueba tu internet y vuelve a intentarlo'],
    [/row-level security|permission denied/i, 'No tienes permiso para hacer eso'],
    [/socios_email_key|duplicate key/i, 'Ya existe un socio con ese correo'],
    [/pagos_socio_id_fkey/i, 'No se puede borrar: el socio tiene recibos']
  ];
  D.error = e => { const m = (e && e.message) || String(e); const f = ERRORES.find(([re]) => re.test(m)); return f ? f[1] : m; };

  /* ---------- Cuentas ---------- */
  D.iniciar = async () => {
    const { data } = await sb.auth.getSession();
    D.sesion = data.session;
    sb.auth.onAuthStateChange((ev, s) => {
      const antes = D.sesion && D.sesion.user.id, ahora = s && s.user.id;
      D.sesion = s;
      if (antes !== ahora) setTimeout(() => window.UI.sesionCambiada(), 0); // p. ej. se cierra sesión en otra pestaña
    });
    if (D.sesion) await D.cargar();
  };
  D.entrar = async (email, clave) => { const { data, error } = await sb.auth.signInWithPassword({ email, password: clave }); if (error) throw error; D.sesion = data.session; await D.cargar(); };
  D.registrar = async f => {
    const { data, error } = await sb.auth.signUp({ email: f.email, password: f.clave, options: { data: { nombre: f.nombre, tel: f.tel }, emailRedirectTo: location.origin + location.pathname } });
    if (error) throw error;
    D.sesion = data.session; // null si hay que confirmar el correo
    if (D.sesion) await D.cargar();
    return !!D.sesion;
  };
  D.salir = async () => { await sb.auth.signOut(); D.sesion = null; D.db = null; };

  /* ---------- Carga ---------- */
  D.cargar = async () => {
    const yo = camel(await q(sb.rpc('mi_socio')));
    const hoy = D.hoy(), admin = yo.esAdmin, mes1 = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const [planes, clases, recompensas, reservas, pagos, entrenos, canjes, muro, ranking, ocup, socios, accesos, nEnt] = await Promise.all([
      q(sb.from('planes').select('*').order('orden')),
      q(sb.from('clases').select('*')),
      q(sb.from('recompensas').select('*').eq('activa', true).order('coste')),
      q(sb.from('reservas').select('*').gte('fecha', D.iso(hoy))),
      q(sb.from('pagos').select('*').order('id')),
      q(sb.from('entrenos').select('*').eq('socio_id', yo.id).order('id')),
      q(sb.from('canjes').select('*').order('id')),
      q(sb.rpc('muro')), q(sb.rpc('ranking_mes')),
      q(sb.rpc('ocupacion', { p_desde: D.iso(hoy), p_hasta: D.iso(D.addDays(hoy, 7)) })),
      admin ? q(sb.from('socios').select('*').order('nombre')) : [],
      admin ? q(sb.from('accesos').select('*').gte('ts', mes1.toISOString()).order('ts', { ascending: false })) : [],
      admin ? q(sb.from('entrenos').select('socio_id')) : []
    ]);
    const ms = l => camel(l).map(x => Object.assign(x, { ts: Date.parse(x.ts) }));
    const db = {
      yo: yo.id, admin, planes: camel(planes), clases: camel(clases), reservas: camel(reservas),
      pagos: camel(pagos).map(p => Object.assign(p, { n: p.numero, total: +p.total })),
      entrenos: camel(entrenos), canjes: ms(canjes), posts: ms(muro), ranking: camel(ranking),
      accesos: ms(accesos), socios: admin ? camel(socios) : [yo], ocup: {}, nombres: {}, nEnt: {}
    };
    db.planes.forEach(p => { p.precio = +p.precio; });
    ocup.forEach(o => { db.ocup[o.clase_id + '|' + o.fecha] = o.n; });
    nEnt.forEach(e => { db.nEnt[e.socio_id] = (db.nEnt[e.socio_id] || 0) + 1; });
    // Nombres visibles de otros socios (solo nombre, para el muro y el ranking)
    db.posts.forEach(p => { if (p.socioId) db.nombres[p.socioId] = p.autor; p.comentarios.forEach(c => { db.nombres[c.socioId] = db.nombres[c.socioId] || c.autor; }); });
    // Visitas del mes: días distintos con entrada
    const vis = {};
    db.accesos.filter(a => a.ok).forEach(a => { (vis[a.socioId] = vis[a.socioId] || new Set()).add(D.iso(new Date(a.ts))); });
    db.socios.forEach(s => { s.visitasMes = vis[s.id] ? vis[s.id].size : ((db.ranking.find(r => r.id === s.id) || {}).visitas || 0); });
    if (admin) Object.assign(db.socios.find(s => s.id === yo.id) || {}, { esAdmin: true });
    db.rutinas = camel(await q(sb.from('rutinas').select('*').eq('socio_id', yo.id).order('id')));
    C.recompensas = camel(recompensas);
    D.db = db;
  };

  // Ejecuta una operación en el servidor, recarga los datos y repinta.
  D.hacer = async (promesa, ok) => {
    try {
      const data = await q(promesa);
      await D.cargar(); window.UI.render();
      if (ok) window.UI.toast(ok, 'ok');
      return data === null || data === undefined ? true : data;
    } catch (e) { window.UI.toast(D.error(e), 'bad'); return null; }
  };

  /* ---------- Consultas sobre lo cargado ---------- */
  const SIN_PLAN = { id: null, nombre: 'Sin cuota', precio: 0, periodo: '', meses: 0, ventajas: [] };
  D.socio = id => D.db.socios.find(s => s.id === +id) || { id: +id, nombre: D.db.nombres[id] || 'Socio' };
  D.yo = () => D.db.socios.find(s => s.id === D.db.yo);
  D.plan = id => D.db.planes.find(p => p.id === id) || SIN_PLAN;
  D.disc = id => C.disciplinas.find(d => d.id === id) || { id, nombre: id, color: '#64748B' };
  D.clase = id => D.db.clases.find(c => c.id === +id);
  D.deuda = s => D.db.pagos.filter(p => p.socioId === s.id && (p.estado === 'pendiente' || p.estado === 'fallido'));
  D.nEntrenos = id => id === D.db.yo ? D.db.entrenos.length : (D.db.nEnt[id] || 0);

  D.estado = s => {
    if (s.estado === 'baja') return { k: 'baja', t: 'Baja', c: 'bad' };
    if (s.estado === 'pausa') return { k: 'pausa', t: 'En pausa', c: 'muted' };
    if (s.estado === 'pendiente' || !s.planId) return { k: 'pendiente', t: 'Sin cuota', c: 'muted' };
    if (s.proxCobro && D.diasDesde(s.proxCobro) > 0) return { k: 'vence', t: 'Caducada', c: 'bad' };
    if ((s.proxCobro && D.diasDesde(s.proxCobro) >= -7) || (s.sesionesRest !== null && s.sesionesRest <= 2)) return { k: 'vence', t: 'Próx. a vencer', c: 'warn' };
    return { k: 'activo', t: 'Activo', c: 'ok' };
  };
  // Mismas reglas que aplica el servidor al leer el QR
  D.puedeEntrar = s => {
    const no = motivo => ({ ok: false, motivo });
    if (s.estado === 'baja') return no('Socio dado de baja');
    if (s.estado === 'pausa') return no('Cuota en pausa');
    if (s.estado === 'pendiente' || !s.planId) return no('Sin cuota activa');
    if (D.deuda(s).some(p => p.estado === 'fallido')) return no('Pago fallido');
    if (s.sesionesRest !== null && s.sesionesRest <= 0) return no('Bono agotado');
    if (s.proxCobro && D.diasDesde(s.proxCobro) > 0) return no('Cuota caducada');
    return { ok: true, motivo: 'Cuota al día' };
  };

  D.ocup = (c, fecha) => Math.min(c.aforo, D.db.ocup[c.id + '|' + fecha] || 0);
  D.reservada = (claseId, fecha, socioId) => D.db.reservas.some(x => x.claseId === +claseId && x.fecha === fecha && x.socioId === socioId);
  D.clasesDe = fecha => { const d = D.diaSemana(D.parse(fecha)); return D.db.clases.filter(c => c.dia === d).sort((a, b) => a.hora.localeCompare(b.hora)); };
  D.cuando = (fecha, hora) => new Date(fecha + 'T' + hora + ':00');

  D.nivel = pts => {
    const L = C.niveles; let i = 0;
    L.forEach((l, j) => { if (pts >= l.desde) i = j; });
    const sig = L[i + 1];
    return { actual: L[i], siguiente: sig, pct: sig ? (pts - L[i].desde) / (sig.desde - L[i].desde) : 1, faltan: sig ? sig.desde - pts : 0 };
  };

  // Entrenos: solo están cargados los del usuario conectado
  D.entrenosDe = id => D.db.entrenos.filter(e => e.socioId === id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  D.entrenosSemana = id => { const l = D.iso(D.lunes(D.hoy())); return D.entrenosDe(id).filter(e => e.fecha >= l).length; };
  D.racha = id => {
    const semanas = new Set(D.entrenosDe(id).map(e => D.iso(D.lunes(D.parse(e.fecha)))));
    let l = D.lunes(D.hoy()), n = 0;
    if (!semanas.has(D.iso(l))) l = D.addDays(l, -7);
    while (semanas.has(D.iso(l))) { n++; l = D.addDays(l, -7); }
    return n;
  };
D.sets = x => x.sets || Array.from({ length: x.s || 1 }, () => ({ r: x.r || 0, kg: x.kg || 0 }));
  D.kgMax = x => Math.max(0, ...D.sets(x).map(s => s.kg));
  // Lo que hizo el usuario la última vez en un ejercicio, serie a serie
  D.ultimo = nombre => {
    const k = String(nombre || '').trim().toLowerCase();
    if (!k) return null;
    for (const e of D.entrenosDe(D.db.yo)) { const x = e.ejercicios.find(y => y.n.toLowerCase() === k); if (x) return D.sets(x); }
    return null;
  };
  D.guardarEntreno = o => D.hacer(sb.rpc('registrar_entreno', { p_titulo: o.titulo, p_tipo: o.tipo || 'Fuerza', p_nota: o.nota || '', p_ejercicios: o.ejercicios, p_publicar: !!o.publicar, p_rutina: o.rutinaId || null, p_guardar_rutina: !!o.guardarRutina }));
  D.guardarRutina = async r => !!(await D.hacer(sb.rpc('guardar_rutina', { p_id: r.id || null, p_nombre: r.nombre, p_ejercicios: r.ejercicios }), 'Rutina guardada'));
  D.borrarRutina = async id => !!(await D.hacer(sb.from('rutinas').delete().eq('id', id).eq('socio_id', D.db.yo), 'Rutina eliminada'));
  D.prs = id => D.db.entrenos.filter(e => e.socioId === id && e.prs && e.prs.length).length;

  D.logros = s => {
    const antig = D.diasDesde(s.alta), ent = D.entrenosDe(s.id).length, racha = D.racha(s.id);
    return [
      { id: 'hola', e: '👋', n: 'Bienvenida', d: 'Tu primer día en el gimnasio', p: s.visitas },
      { id: 'm1', e: '🌱', n: 'Primer mes', d: '30 días como socio', p: antig / 30 },
      { id: 'm3', e: '🔥', n: 'Trimestre', d: '3 meses como socio', p: antig / 90 },
      { id: 'm6', e: '💪', n: 'Medio año', d: '6 meses como socio', p: antig / 180 },
      { id: 'a1', e: '👑', n: 'Un año', d: '12 meses como socio', p: antig / 365 },
      { id: 'v10', e: '🎯', n: '10 visitas', d: 'Ven 10 veces al gimnasio', p: s.visitas / 10 },
      { id: 'v50', e: '⚡', n: '50 visitas', d: 'Ven 50 veces al gimnasio', p: s.visitas / 50 },
      { id: 'v100', e: '🏅', n: '100 visitas', d: 'Ven 100 veces al gimnasio', p: s.visitas / 100 },
      { id: 'r4', e: '📆', n: 'Constancia', d: '4 semanas seguidas entrenando', p: racha / 4 },
      { id: 'e1', e: '📝', n: 'Primer registro', d: 'Apunta tu primer entreno', p: ent },
      { id: 'e25', e: '📈', n: '25 entrenos', d: 'Apunta 25 entrenamientos', p: ent / 25 },
      { id: 'pr', e: '🏆', n: 'Récord personal', d: 'Supera tu mejor marca', p: D.prs(s.id) }
    ].map(l => Object.assign(l, { p: Math.max(0, Math.min(1, l.p)), ok: l.p >= 1 }));
  };

  D.desglose = total => { const base = total / (1 + C.iva / 100); return { base, iva: total - base }; };
  D.mrr = () => D.db.socios.filter(s => s.estado === 'activo').reduce((t, s) => { const p = D.plan(s.planId); return t + (p.meses ? p.precio / p.meses : 0); }, 0);
  D.ingresos = mes => D.db.pagos.filter(p => p.estado === 'pagado' && p.fecha.startsWith(mes)).reduce((t, p) => t + p.total, 0);
})();
