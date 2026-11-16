/* Avisos a socios desde el panel: recordatorio de cuota y mensaje para animar a volver.
   Prepara el texto personalizado y abre el correo o WhatsApp del gimnasio con todo escrito.
   Compartido por la demo y la app real. */
(function () {
  'use strict';
  const C = window.GYM_CONFIG, D = window.D, U = window.UI, esc = U.esc, ic = U.ic;
  const A = window.Avisos = { act: null };
  const TIPOS = { cuota: 'Recordatorio de cuota', animo: 'Animar a volver', libre: 'Mensaje libre' };
  const DIAS_INACTIVO = 10;

  const diasSinVenir = s => D.diasDesde(s.ultimoAcceso || s.alta);
  const inactivo = s => s.estado === 'activo' && diasSinVenir(s) > DIAS_INACTIVO;
  const sugerido = s => D.estado(s).k === 'vence' ? 'cuota' : inactivo(s) ? 'animo' : 'libre';
  const enlaceApp = () => location.origin + location.pathname.replace(/demo\/(index\.html)?$/, '').replace(/index\.html$/, '');
  const haceDias = iso => { const d = D.diasDesde(iso); return d <= 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`; };

  function plantilla(s, tipo) {
    const nombre = s.nombre.split(' ')[0], plan = D.plan(s.planId), firma = `\n\nUn saludo,\nEl equipo de ${C.nombre}`;
    if (tipo === 'cuota') {
      const bono = s.sesionesRest !== null && s.sesionesRest !== undefined && !s.proxCobro;
      const caducada = s.proxCobro && D.diasDesde(s.proxCobro) > 0;
      const fecha = s.proxCobro ? D.fecha(s.proxCobro, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
      const frase = bono ? `te quedan ${s.sesionesRest} ${s.sesionesRest === 1 ? 'sesión' : 'sesiones'} en tu ${plan.nombre.toLowerCase()}`
        : caducada ? `tu cuota ${plan.nombre.toLowerCase()} venció el ${fecha}` : `tu cuota ${plan.nombre.toLowerCase()} vence el ${fecha}`;
      return {
        asunto: bono ? `Tu bono en ${C.nombre} está a punto de agotarse` : caducada ? `Tu cuota en ${C.nombre} ha vencido` : `Tu cuota en ${C.nombre} vence pronto`,
        texto: `Hola, ${nombre}:\n\nTe escribimos para recordarte que ${frase}.\n\nPuedes renovarla en un momento desde la app (Perfil → Cuotas del gimnasio) o en recepción la próxima vez que vengas:\n${enlaceApp()}\n\nAsí sigues entrando con tu código QR sin interrupciones. Si tienes cualquier duda, responde a este mensaje.${firma}`
      };
    }
    if (tipo === 'animo') {
      const d = diasSinVenir(s);
      return {
        asunto: `${nombre}, te echamos de menos en ${C.nombre}`,
        texto: `Hola, ${nombre}:\n\nHace ${d} días que no te vemos por el gimnasio y queríamos saber cómo estás.\n\nRetomar cuesta menos de lo que parece: con una sesión corta esta semana vuelves a coger el ritmo, y lo que ya habías avanzado no se pierde tan rápido.\n\nSi te viene bien, reserva una clase desde la app o pásate cuando quieras y te ayudamos a preparar una rutina para volver poco a poco:\n${enlaceApp()}\n\nTe esperamos.${firma}`
      };
    }
    return { asunto: `Mensaje de ${C.nombre}`, texto: `Hola, ${nombre}:\n\n${firma.trim()}` };
  }

  // Celda de la tabla de socios: el botón cambia según lo que necesita cada socio
  A.celda = s => {
    const t = sugerido(s), at = `data-a="aviso" data-id="${s.id}"`;
    const boton = t === 'cuota' ? `<button class="btn mini terra" ${at}>Recordar cuota</button>`
      : t === 'animo' ? `<button class="btn mini" ${at}>Animar a volver</button>`
        : `<button class="icbtn" ${at} title="Enviar un mensaje" aria-label="Enviar un mensaje a ${esc(s.nombre)}">${ic('chat')}</button>`;
    return `<td class="col-aviso">${boton}${s.ultimoAviso ? `<small class="avisado">Avisado ${haceDias(s.ultimoAviso)}</small>` : ''}</td>`;
  };

  function pinta() {
    const s = D.socio(A.act.id), p = plantilla(s, A.act.tipo), tel = (s.tel || '').replace(/\D/g, '');
    U.modal(`<h2>Mensaje a ${esc(s.nombre.split(' ')[0])}</h2><p class="sub">Revisa el texto y pulsa enviar: se abre tu correo o tu WhatsApp con todo ya escrito.</p>
      <label class="campo"><span>Tipo de mensaje</span><select class="inp" data-ch="avisoTipo">${Object.entries(TIPOS).map(([k, t]) => `<option value="${k}" ${k === A.act.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
      <label class="campo"><span>Asunto</span><input class="inp" id="av-asunto" value="${esc(p.asunto)}" maxlength="120"></label>
      <label class="campo"><span>Mensaje</span><textarea class="inp" id="av-texto" style="min-height:230px" maxlength="1500">${esc(p.texto)}</textarea></label>
      <div class="acciones"><button class="btn terra" data-a="avisoCorreo">Enviar por correo</button>
        <button class="btn" data-a="avisoWhatsapp" ${tel ? '' : 'disabled'}>Enviar por WhatsApp</button>
        <button class="btn sec" data-a="avisoCopiar">Copiar texto</button></div>
      <p class="aviso">Para: ${esc(s.email)}${tel ? ' · ' + esc(s.tel) : ' · sin teléfono'}${s.ultimoAviso ? ` · Último aviso ${haceDias(s.ultimoAviso)}` : ''}</p>`, 'ancha');
  }
  const leido = () => ({ asunto: document.getElementById('av-asunto').value.trim(), texto: document.getElementById('av-texto').value.trim() });
  async function enviado(canal) {
    const id = A.act.id, tipo = A.act.tipo;
    U.cerrar();
    if (await D.marcarAviso(id, tipo)) U.toast(`${canal} preparado · socio marcado como avisado`, 'ok');
  }

  Object.assign(U.actions, {
    aviso(d) { A.act = { id: +d.id, tipo: sugerido(D.socio(d.id)) }; pinta(); },
    avisoCorreo() {
      const s = D.socio(A.act.id), m = leido();
      if (!m.texto) return U.toast('Escribe el mensaje', 'bad');
      window.location.href = `mailto:${encodeURIComponent(s.email)}?subject=${encodeURIComponent(m.asunto)}&body=${encodeURIComponent(m.texto)}`;
      enviado('Correo');
    },
    avisoWhatsapp() {
      const s = D.socio(A.act.id), m = leido(), tel = (s.tel || '').replace(/\D/g, '');
      if (!m.texto) return U.toast('Escribe el mensaje', 'bad');
      window.open(`https://wa.me/${tel.length === 9 ? '34' + tel : tel}?text=${encodeURIComponent(m.texto)}`, '_blank', 'noopener');
      enviado('WhatsApp');
    },
    async avisoCopiar() {
      const m = leido();
      try { await navigator.clipboard.writeText(m.texto); U.toast('Texto copiado', 'ok'); } catch (e) { U.toast('No se ha podido copiar; selecciónalo a mano', 'bad'); }
    }
  });
  U.changes.avisoTipo = v => { A.act.tipo = v; pinta(); };
})();
