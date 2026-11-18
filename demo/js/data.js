/* Datos de la demo: se generan solos y se guardan en el navegador.
   En la versión real, este archivo se sustituye por la base de datos. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, KEY = 'gymapp_demo_v3', D = window.D = {};

  /* ---------- Fechas y formato ---------- */
  D.hoy = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  D.iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  D.parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  D.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  D.diasDesde = s => Math.round((D.hoy() - D.parse(s)) / 864e5);
  D.diaSemana = d => (d.getDay() + 6) % 7; // 0 = lunes
  D.lunes = d => D.addDays(d, -D.diaSemana(d));
  D.eur = n => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);
  D.fecha = (s, o) => D.parse(s).toLocaleDateString('es-ES', o || { day: 'numeric', month: 'short', year: 'numeric' });
  D.mesKey = d => D.iso(d).slice(0, 7);
  D.DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  D.METODOS = { tarjeta: 'Tarjeta', bizum: 'Bizum', sepa: 'Domiciliación', efectivo: 'Efectivo' };

  function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  D.hash = hash;

  /* ---------- Generación de la demo ---------- */
  function seed() {
    const r = rng(20261), hoy = D.hoy(), ahora = Date.now();
    const pick = a => a[Math.floor(r() * a.length)];
    const N = ['Lucía', 'Carlos', 'María', 'Javier', 'Carmen', 'Antonio', 'Laura', 'Manuel', 'Ana', 'David', 'Marta', 'José', 'Elena', 'Pablo', 'Sara', 'Álvaro', 'Paula', 'Andrés', 'Irene', 'Raúl', 'Nuria', 'Diego', 'Rocío', 'Iván', 'Cristina', 'Adrián', 'Beatriz', 'Rubén', 'Alba', 'Jorge', 'Silvia', 'Óscar', 'Noelia', 'Víctor', 'Patricia', 'Hugo', 'Inés', 'Marcos', 'Teresa', 'Mateo', 'Clara', 'Fernando', 'Lorena', 'Miguel', 'Eva', 'Alberto', 'Julia', 'Samuel'];
    const A = ['García', 'Martín', 'López', 'Sánchez', 'Romero', 'Navarro', 'Torres', 'Ruiz', 'Díaz', 'Moreno', 'Muñoz', 'Jiménez', 'Castro', 'Ortega', 'Rubio', 'Molina', 'Delgado', 'Serrano', 'Ramos', 'Gil', 'Vega', 'Blanco', 'Marín', 'Iglesias'];
    const LES = ['Hernia lumbar L5-S1', 'Molestias cervicales', 'Tendinitis rotuliana (rodilla dcha.)', 'Operación de hombro en 2024', 'Embarazo — 2.º trimestre', 'Esguince de tobillo recurrente'];
    const slug = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '.');

    const planes = JSON.parse(JSON.stringify(C.planes));
    const planDe = id => planes.find(p => p.id === id);

    const socios = N.map((nom, i) => {
      const p = r(), e = r();
      const planId = p < .55 ? 'mensual' : p < .75 ? 'trimestral' : p < .87 ? 'anual' : 'bono10';
      const estado = e < .8 ? 'activo' : e < .88 ? 'pausa' : 'baja';
      // Uno de cada siete es un alta de este mes, para que el panel tenga altas recientes
      const antig = i % 7 === 3 ? Math.floor(r() * hoy.getDate()) : 5 + Math.floor(Math.pow(r(), 1.7) * 540);
      let ult = estado === 'activo' ? Math.floor(Math.pow(r(), 2.2) * 19) : estado === 'pausa' ? 20 + Math.floor(r() * 50) : 45 + Math.floor(r() * 120);
      ult = Math.min(ult, antig);
      const plan = planDe(planId);
      const visitas = Math.floor(antig / 7 * (1.2 + r() * 2.4));
      const nombre = `${nom} ${pick(A)} ${pick(A)}`;
      return {
        id: i + 1, nombre, email: slug(nombre) + '@correo.example', tel: '600 10 00 ' + String(i).padStart(2, '0'),
        nacimiento: D.iso(new Date(1962 + Math.floor(r() * 42), Math.floor(r() * 12), 1 + Math.floor(r() * 28))),
        alta: D.iso(D.addDays(hoy, -antig)), planId, estado,
        proxCobro: estado === 'activo' && plan.meses ? D.iso(D.addDays(hoy, 1 + Math.floor(r() * 30 * plan.meses))) : null,
        sesionesRest: plan.sesiones ? 1 + Math.floor(r() * plan.sesiones) : null,
        metodo: (m => m < .6 ? 'tarjeta' : m < .85 ? 'sepa' : 'bizum')(r()),
        ultimoAcceso: D.iso(D.addDays(hoy, -ult)),
        nivelFisico: pick(['Inicial', 'Inicial', 'Intermedio', 'Intermedio', 'Avanzado']),
        objetivo: pick(['Ganar fuerza', 'Perder grasa', 'Salud general', 'Mejorar movilidad', 'Preparar oposiciones']),
        lesiones: r() < .2 ? pick(LES) : '', notas: '',
        visitas, visitasMes: estado === 'activo' ? Math.floor(r() * 21) : 0, puntos: visitas * 10 + Math.floor(r() * 300),
        codigo: 'GYM-' + String(i + 1).padStart(4, '0') + '-' + Math.floor(r() * 0xfffff).toString(16).toUpperCase().padStart(5, '0')
      };
    });

    // El socio de la demo (la cuenta con la que se entra en "Soy socio")
    Object.assign(socios[0], {
      nombre: 'Lucía Romero Vega', email: 'lucia.romero@correo.example', alta: D.iso(D.addDays(hoy, -214)),
      planId: 'mensual', estado: 'activo', proxCobro: D.iso(D.addDays(hoy, 9)), sesionesRest: null, metodo: 'tarjeta',
      ultimoAcceso: D.iso(D.addDays(hoy, -1)), nivelFisico: 'Intermedio', objetivo: 'Ganar fuerza', lesiones: '',
      visitas: 97, visitasMes: 14, puntos: 1640
    });

    // Recibos de los últimos 6 meses
    const pagos = [];
    for (let m = 5; m >= 0; m--) {
      const base = new Date(hoy.getFullYear(), hoy.getMonth() - m, 1);
      socios.forEach(s => {
        const a = D.parse(s.alta), plan = planDe(s.planId);
        const msa = (base.getFullYear() - a.getFullYear()) * 12 + base.getMonth() - a.getMonth();
        if (msa < 0) return;
        if (s.estado === 'baja' && m < 2) return;
        if (s.estado === 'pausa' && m < 1) return;
        const toca = plan.meses ? msa % plan.meses === 0 : (msa === 0 || r() < .4);
        if (!toca) return;
        const f = msa === 0 ? a : new Date(base.getFullYear(), base.getMonth(), Math.min(a.getDate(), 28));
        if (f > hoy) return;
        let estado = 'pagado';
        const x = r();
        if (s.id !== 1 && s.estado === 'activo') {
          if (m === 0) estado = x < .12 ? 'fallido' : x < .32 ? 'pendiente' : 'pagado';
          else if (m === 1 && x < .03) estado = 'pendiente';
          else if (x > .99) estado = 'reembolsado';
        }
        pagos.push({
          socioId: s.id, fecha: D.iso(f), planId: plan.id, total: plan.precio, estado, metodo: s.metodo,
          concepto: plan.meses === 1 ? 'Cuota mensual · ' + f.toLocaleDateString('es-ES', { month: 'long' }) : plan.meses ? 'Cuota ' + plan.nombre.toLowerCase() : plan.nombre
        });
      });
    }
    pagos.sort((a, b) => a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : a.socioId - b.socioId);
    pagos.forEach((p, i) => { p.id = i + 1; p.n = `${C.serieFactura}-${p.fecha.slice(0, 4)}-${String(i + 1).padStart(4, '0')}`; });

    // Clases de la semana
    const clases = [];
    C.horario.forEach(h => h[0].forEach(dia => clases.push({ id: clases.length + 1, dia, hora: h[1], disc: h[2], dur: h[3], monitor: h[4], sala: h[5], aforo: h[6], nivel: h[7] })));

    // Entradas y salidas por el torno: las va generando D.simular() según la hora real
    const accesos = [], salidas = [];

    // Entrenamientos del socio de la demo (con progresión real de cargas)
    const entrenos = [];
    [-66, -62, -57, -52, -45, -41, -36, -31, -24, -19, -12, -8, -3, -1].forEach((d, i) => {
      const k = Math.floor(i / 2), esA = i % 2 === 0;
      entrenos.push({
        id: i + 1, socioId: 1, fecha: D.iso(D.addDays(hoy, d)), titulo: esA ? 'Pierna y empuje' : 'Cadena posterior', tipo: 'Fuerza', nota: '',
        ejercicios: esA
          ? [{ n: 'Sentadilla', s: 4, r: 8, kg: 40 + k * 2.5 }, { n: 'Press banca', s: 4, r: 8, kg: 25 + k * 2.5 }, { n: 'Remo con barra', s: 3, r: 10, kg: 30 + k * 2.5 }]
          : [{ n: 'Peso muerto', s: 4, r: 6, kg: 50 + k * 5 }, { n: 'Press militar', s: 4, r: 8, kg: 20 + Math.floor(k / 2) * 2.5 }, { n: 'Hip thrust', s: 3, r: 10, kg: 60 + k * 5 }]
      });
    });

    // Cada ejercicio desglosado serie a serie, y dos rutinas ya creadas
    entrenos.forEach((e, i) => {
      e.rutinaId = i % 2 === 0 ? 1 : 2;
      e.ejercicios = e.ejercicios.map(x => ({ n: x.n, sets: Array.from({ length: x.s }, (_, j) => ({ r: Math.max(1, x.r - (j >= 2 ? j - 1 : 0)), kg: x.kg })) }));
    });
    const plantilla = e => e.ejercicios.map(x => ({ n: x.n, sets: x.sets.map(s => ({ r: s.r, kg: 0 })) }));
    const rutinas = [{ id: 1, socioId: 1, nombre: 'Pierna y empuje', ejercicios: plantilla(entrenos[12]) }, { id: 2, socioId: 1, nombre: 'Cadena posterior', ejercicios: plantilla(entrenos[13]) }];
    entrenos[13].prs = ['Peso muerto'];

    // Muro de la comunidad
    const h = 36e5;
    const posts = [
      { socioId: 0, ts: ahora - 3 * h, oficial: true, texto: 'Nuevo en el horario de los sábados: Cross Training a las 10:30 con Rubén. Plazas limitadas, reserva desde la pestaña Clases.', likes: 18, comentarios: [] },
      { socioId: 6, ts: ahora - 5 * h, texto: 'Primera clase de BodyPump superada. Mañana no me muevo del sofá 😅', likes: 14, comentarios: [{ socioId: 11, texto: 'La segunda duele menos, prometido.' }] },
      { socioId: 13, ts: ahora - 9 * h, titulo: 'Día de pierna', tipo: 'Fuerza', texto: 'Por fin han salido los 80 en sentadilla.', ejercicios: [{ n: 'Sentadilla', s: 5, r: 5, kg: 80 }, { n: 'Prensa', s: 4, r: 10, kg: 140 }, { n: 'Zancadas', s: 3, r: 12, kg: 16 }], prs: ['Sentadilla'], likes: 27, comentarios: [{ socioId: 4, texto: '¡Bestia! 👏' }, { socioId: 21, texto: 'Hace tres meses estabas en 60. Enhorabuena.' }] },
      { socioId: 1, ts: ahora - 26 * h, titulo: 'Cadena posterior', tipo: 'Fuerza', texto: 'Peso muerto subiendo poco a poco.', ejercicios: entrenos[13].ejercicios, prs: ['Peso muerto'], likes: 11, comentarios: [] },
      { socioId: 4, ts: ahora - 30 * h, texto: 'Tres meses seguidos sin faltar una sola semana. Quién me lo iba a decir en enero.', likes: 33, comentarios: [{ socioId: 6, texto: 'Ejemplo para todos.' }] },
      { socioId: 21, ts: ahora - 52 * h, texto: 'Yoga de las 20:00 con Elena = dormir del tirón. Recomendadísimo si venís cargados de la semana.', likes: 9, comentarios: [] },
      { socioId: 9, ts: ahora - 75 * h, titulo: 'Ciclo + core', tipo: 'Cardio', texto: '45 minutos de ciclo y abdominales al terminar.', ejercicios: [{ n: 'Ciclo Indoor', s: 1, r: 45, kg: 0 }, { n: 'Plancha', s: 4, r: 60, kg: 0 }], likes: 7, comentarios: [] }
    ].map((p, i) => Object.assign({ id: i + 1, liked: false }, p));

    const db = { v: 3, dia: D.iso(hoy), yo: 1, planes, socios, pagos, clases, reservas: [], accesos, salidas, ajustes: { max: 25, estancia: 3 }, simHasta: D.hoy().getTime(), entrenos, rutinas, posts, canjes: [], nFactura: pagos.length };

    // Dos reservas ya hechas por el socio de la demo
    ['bodypump', 'yoga'].forEach(disc => {
      for (let i = 1; i <= 7; i++) {
        const f = D.addDays(hoy, i), c = clases.find(c => c.disc === disc && c.dia === D.diaSemana(f));
        if (c) { db.reservas.push({ claseId: c.id, fecha: D.iso(f), socioId: 1 }); break; }
      }
    });
    return db;
  }

  /* ---------- Guardado ---------- */
  D.save = () => { try { localStorage.setItem(KEY, JSON.stringify(D.db)); } catch (e) { /* sin almacenamiento: la demo sigue en memoria */ } };
  D.reset = () => { D.db = seed(); D.simular(); D.save(); };
  D.load = () => {
    try { D.db = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { D.db = null; }
    // La demo se regenera cada día para que las fechas, accesos y reservas sean siempre actuales.
    if (!D.db || D.db.v !== 3 || D.db.dia !== D.iso(D.hoy())) D.reset();
    else { D.simular(); D.save(); }
  };

  /* ---------- Consultas ---------- */
  D.socio = id => D.db.socios.find(s => s.id === +id);
  D.yo = () => D.socio(D.db.yo);
  D.plan = id => D.db.planes.find(p => p.id === id) || D.db.planes[0];
  D.disc = id => C.disciplinas.find(d => d.id === id) || { id, nombre: id, color: '#64748B' };
  D.clase = id => D.db.clases.find(c => c.id === +id);
  D.deuda = s => D.db.pagos.filter(p => p.socioId === s.id && (p.estado === 'pendiente' || p.estado === 'fallido'));

  D.estado = s => {
    if (s.estado === 'baja') return { k: 'baja', t: 'Baja', c: 'bad' };
    if (s.estado === 'pausa') return { k: 'pausa', t: 'En pausa', c: 'muted' };
    if ((s.proxCobro && D.diasDesde(s.proxCobro) >= -7) || (s.sesionesRest !== null && s.sesionesRest <= 2)) return { k: 'vence', t: 'Próx. a vencer', c: 'warn' };
    return { k: 'activo', t: 'Activo', c: 'ok' };
  };

  D.puedeEntrar = s => {
    if (s.estado === 'baja') return { ok: false, motivo: 'Socio dado de baja' };
    if (s.estado === 'pausa') return { ok: false, motivo: 'Cuota en pausa' };
    if (D.deuda(s).some(p => p.estado === 'fallido')) return { ok: false, motivo: 'Pago fallido' };
    if (s.sesionesRest !== null && s.sesionesRest <= 0) return { ok: false, motivo: 'Bono agotado' };
    return { ok: true, motivo: 'Cuota al día' };
  };

  // Ocupación de una clase en una fecha: base simulada + reservas reales
  D.ocup = (c, fecha) => {
    const base = Math.min(c.aforo, Math.floor(c.aforo * (.3 + hash(c.id + '|' + fecha) * .78)));
    const mias = D.db.reservas.filter(x => x.claseId === c.id && x.fecha === fecha).length;
    return Math.min(c.aforo, base + mias);
  };
  D.reservada = (claseId, fecha, socioId) => D.db.reservas.some(x => x.claseId === +claseId && x.fecha === fecha && x.socioId === socioId);
  D.clasesDe = fecha => { const d = D.diaSemana(D.parse(fecha)); return D.db.clases.filter(c => c.dia === d).sort((a, b) => a.hora.localeCompare(b.hora)); };
  D.cuando = (fecha, hora) => new Date(fecha + 'T' + hora + ':00');

  D.nivel = pts => {
    const L = C.niveles; let i = 0;
    L.forEach((l, j) => { if (pts >= l.desde) i = j; });
    const sig = L[i + 1];
    return { actual: L[i], siguiente: sig, pct: sig ? (pts - L[i].desde) / (sig.desde - L[i].desde) : 1, faltan: sig ? sig.desde - pts : 0 };
  };

  D.entrenosDe = id => D.db.entrenos.filter(e => e.socioId === id).sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id - a.id);
  D.entrenosSemana = id => { const l = D.iso(D.lunes(D.hoy())); return D.entrenosDe(id).filter(e => e.fecha >= l).length; };
  D.racha = id => {
    const semanas = new Set(D.entrenosDe(id).map(e => D.iso(D.lunes(D.parse(e.fecha)))));
    let l = D.lunes(D.hoy()), n = 0;
    if (!semanas.has(D.iso(l))) l = D.addDays(l, -7);
    while (semanas.has(D.iso(l))) { n++; l = D.addDays(l, -7); }
    return n;
  };
  D.maxKg = (id, ejercicio, exceptoId) => Math.max(0, ...D.db.entrenos.filter(e => e.socioId === id && e.id !== exceptoId).flatMap(e => e.ejercicios).filter(x => x.n.toLowerCase() === ejercicio.toLowerCase()).map(D.kgMax));
D.sets = x => x.sets || Array.from({ length: x.s || 1 }, () => ({ r: x.r || 0, kg: x.kg || 0 }));
  D.kgMax = x => Math.max(0, ...D.sets(x).map(s => s.kg));
  // Lo que hizo el usuario la última vez en un ejercicio, serie a serie
  D.ultimo = nombre => {
    const k = String(nombre || '').trim().toLowerCase();
    if (!k) return null;
    for (const e of D.entrenosDe(D.db.yo)) { const x = e.ejercicios.find(y => y.n.toLowerCase() === k); if (x) return D.sets(x); }
    return null;
  };
  const sigId = l => Math.max(0, ...l.map(x => x.id)) + 1;
  D.guardarEntreno = async o => {
    const db = D.db, s = D.yo(), hoy = D.iso(D.hoy());
    const ej = o.ejercicios.map(x => ({ n: x.n, sets: D.sets(x) }));
    const prs = ej.filter(x => { const m = D.maxKg(s.id, x.n); return m > 0 && D.kgMax(x) > m; }).map(x => x.n);
    let rutinaId = o.rutinaId || null;
    if (o.guardarRutina && !rutinaId && db.rutinas.filter(r => r.socioId === s.id).length < 6) {
      rutinaId = sigId(db.rutinas);
      db.rutinas.push({ id: rutinaId, socioId: s.id, nombre: o.titulo || 'Entrenamiento', ejercicios: JSON.parse(JSON.stringify(ej)) });
    }
    const puntos = db.entrenos.filter(e => e.socioId === s.id && e.fecha === hoy).length < 2 ? C.puntos.entreno : 0;
    db.entrenos.push({ id: sigId(db.entrenos), socioId: s.id, fecha: hoy, titulo: o.titulo || 'Entrenamiento', tipo: o.tipo || 'Fuerza', nota: o.nota || '', ejercicios: ej, prs, rutinaId });
    s.puntos += puntos;
    if (o.publicar) db.posts.push({ id: sigId(db.posts), socioId: s.id, ts: Date.now(), titulo: o.titulo, tipo: o.tipo || 'Fuerza', texto: o.nota || '', ejercicios: ej, prs, likes: 0, liked: false, comentarios: [] });
    D.save(); window.UI.render();
    return { prs, puntos };
  };
  D.guardarRutina = async r => {
    const db = D.db, mias = db.rutinas.filter(x => x.socioId === db.yo);
    if (r.id) Object.assign(db.rutinas.find(x => x.id === r.id), { nombre: r.nombre, ejercicios: r.ejercicios });
    else if (mias.length >= 6) { window.UI.toast('Ya tienes 6 rutinas. Borra una para crear otra.', 'bad'); return false; }
    else db.rutinas.push({ id: sigId(db.rutinas), socioId: db.yo, nombre: r.nombre, ejercicios: r.ejercicios });
    D.save(); window.UI.render(); window.UI.toast('Rutina guardada', 'ok');
    return true;
  };
  D.borrarRutina = async id => {
    D.db.rutinas = D.db.rutinas.filter(r => r.id !== id);
    D.db.entrenos.forEach(e => { if (e.rutinaId === id) e.rutinaId = null; });
    D.save(); window.UI.render(); window.UI.toast('Rutina eliminada');
    return true;
  };
  D.marcarAviso = async (id, tipo) => { Object.assign(D.socio(id), { ultimoAviso: D.iso(D.hoy()), avisoTipo: tipo }); D.save(); window.UI.render(); return true; };
  D.dentroEn = (t, est) => {
    const ult = {}, desde = t - est * 36e5;
    const ver = (lista, sale) => (lista || []).forEach(a => {
      if ((sale || a.ok) && a.ts <= t && a.ts > desde) { const u = ult[a.socioId]; if (!u || a.ts > u.ts || (a.ts === u.ts && sale)) ult[a.socioId] = { ts: a.ts, sale }; }
    });
    ver(D.db.accesos, false); ver(D.db.salidas, true);
    return Object.keys(ult).filter(id => !ult[id].sale).map(id => ({ socioId: +id, desde: ult[id].ts }));
  };
  // Afluencia típica de la demo (entradas por hora): mañanas y tardes con pico a última hora, sábados por la mañana
  const RITMO = { laborable: { 7: 3, 8: 4, 9: 3.5, 10: 2.5, 11: 2, 12: 2, 13: 1.5, 14: 1.5, 15: 2, 16: 3, 17: 5, 18: 7, 19: 7, 20: 5, 21: 2.5 }, sabado: { 9: 4, 10: 6, 11: 6, 12: 4, 13: 2 } };
  const ritmo = (dia, h) => {
    const a = (C.apertura || [])[dia];
    if (!a || h < a[0] || h >= a[1]) return 0;
    return (dia === 5 ? RITMO.sabado : dia === 6 ? {} : RITMO.laborable)[h] || 0;
  };
  // Simula el paso de socios por el torno desde la última vez hasta ahora, para que el aforo esté vivo durante la presentación
  D.simular = () => {
    const db = D.db, ahora = Date.now(), ini = D.hoy().getTime(), PASO = 3e5, hoyIso = D.iso(D.hoy());
    if (!db.simHasta || db.simHasta < ini) db.simHasta = ini;
    const habituales = db.socios.filter(s => s.estado === 'activo' && s.id !== db.yo && D.diasDesde(s.ultimoAcceso) <= 10);
    for (let t = Math.ceil(db.simHasta / PASO) * PASO; t + PASO <= ahora; t += PASO) {
      const d = new Date(t), esperadas = ritmo(D.diaSemana(d), d.getHours()) / 12;
      if (!esperadas) continue;
      const r = rng(Math.floor(t / PASO));
      let n = Math.floor(esperadas) + (r() < esperadas % 1 ? 1 : 0);
      while (n-- > 0) {
        const ts = t + Math.floor(r() * PASO), dentro = new Set(D.dentroEn(ts, db.ajustes.estancia).map(x => x.socioId));
        const yaHoy = new Set(db.accesos.filter(a => a.ts >= ini).map(a => a.socioId));
        let pool = habituales.filter(s => !dentro.has(s.id) && !yaHoy.has(s.id));
        if (!pool.length) pool = habituales.filter(s => !dentro.has(s.id));
        if (!pool.length) break;
        const s = pool[Math.floor(r() * pool.length)];
        db.accesos.push({ socioId: s.id, ts, ok: true });
        if (r() > 0.15) db.salidas.push({ socioId: s.id, ts: ts + (45 + Math.floor(r() * 60)) * 6e4 }); // algunos no pasan el QR al salir
        if (s.ultimoAcceso !== hoyIso) { s.ultimoAcceso = hoyIso; s.visitas++; s.visitasMes++; }
      }
    }
    db.simHasta = Math.max(db.simHasta, Math.floor(ahora / PASO) * PASO);
    db.accesos.sort((a, b) => b.ts - a.ts);
    D.af = D.calcAforo();
  };
  D.calcAforo = () => {
    const db = D.db, est = db.ajustes.estancia, ahora = Date.now(), hoy = D.hoy(), dia = D.diaSemana(hoy);
    const punto = h => new Date(hoy).setHours(h, 30, 0, 0), aire = 0.9 + D.hash('aforo' + dia) * 0.2;
    return {
      dentro: D.dentroEn(ahora, est).length, max: db.ajustes.max, estancia: est, ts: ahora,
      hoy: Array.from({ length: 24 }, (_, h) => (punto(h) <= ahora ? D.dentroEn(punto(h), est).length : null)),
      tipico: Array.from({ length: 24 }, (_, h) => Math.round((ritmo(dia, h) * 0.55 + ritmo(dia, h - 1) * 0.7) * aire * 10) / 10)
    };
  };
  D.leerAforo = async () => { D.simular(); D.save(); return D.af; };
  D.marcarSalida = async id => { D.db.salidas.push({ socioId: id, ts: Date.now() }); D.af = D.calcAforo(); D.save(); window.UI.render(); window.UI.toast('Salida registrada', 'ok'); return true; };
  D.guardarAjustesAforo = async o => { D.db.ajustes = { max: o.max, estancia: o.estancia }; D.af = D.calcAforo(); D.save(); window.UI.render(); window.UI.toast('Ajustes de aforo guardados', 'ok'); return true; };
  D.prs = id => D.db.entrenos.filter(e => e.socioId === id && e.prs && e.prs.length).length;

  D.logros = s => {
    const antig = D.diasDesde(s.alta), ent = D.entrenosDe(s.id).length, racha = D.racha(s.id);
    return [
      { id: 'hola', e: '👋', n: 'Bienvenida', d: 'Tu primer día en el gimnasio', p: 1 },
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

  /* ---------- Operaciones ---------- */
  D.nuevoPago = (socioId, plan, estado, metodo, concepto) => {
    const db = D.db, hoy = D.iso(D.hoy());
    db.nFactura++;
    const p = { id: db.pagos.length ? Math.max(...db.pagos.map(x => x.id)) + 1 : 1, n: `${C.serieFactura}-${hoy.slice(0, 4)}-${String(db.nFactura).padStart(4, '0')}`, socioId, fecha: hoy, planId: plan.id, total: plan.precio, estado, metodo, concepto: concepto || (plan.meses ? 'Cuota ' + plan.nombre.toLowerCase() : plan.nombre) };
    db.pagos.push(p);
    return p;
  };
  D.activarPlan = (s, plan) => {
    const d = new Date(D.hoy()); d.setMonth(d.getMonth() + plan.meses);
    s.planId = plan.id; s.estado = 'activo';
    s.proxCobro = plan.meses ? D.iso(d) : null;
    s.sesionesRest = plan.sesiones || null;
  };
  D.desglose = total => { const base = total / (1 + C.iva / 100); return { base, iva: total - base }; };
  D.mrr = () => D.db.socios.filter(s => s.estado === 'activo').reduce((t, s) => { const p = D.plan(s.planId); return t + (p.meses ? p.precio / p.meses : 0); }, 0);
  D.ingresos = mes => D.db.pagos.filter(p => p.estado === 'pagado' && p.fecha.startsWith(mes)).reduce((t, p) => t + p.total, 0);

  D.load();
})();
