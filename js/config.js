/* ============================================================
   CONFIGURACIÓN DEL GIMNASIO
   Aquí se cambian el nombre, los datos fiscales, las actividades
   y los niveles. Las cuotas y el horario se editan desde el
   propio panel del gimnasio (se guardan en la base de datos).
   ============================================================ */
window.GYM_CONFIG = {
  nombre: 'Tu Gimnasio',
  lema: 'Fuerza · Constancia · Comunidad',
  direccion: 'Calle Mayor 1, Tu Pueblo',
  cif: 'B-00000000',
  telefono: '600 000 000',
  iva: 21,               // % de IVA incluido en los precios
  objetivoSemanal: 4,    // entrenos por semana que se proponen al socio

  // Conexión con la base de datos. Esta clave es pública por diseño:
  // lo que protege los datos son las reglas de seguridad del servidor.
  supabase: {
    url: 'https://jfbwxhnkdpcwzrybrwmr.supabase.co',
    clave: 'sb_publishable_LReXT_lCoEyb-jQ18QO3eA_zc2EulQc'
  },

  // Actividades dirigidas y su color en el horario.
  disciplinas: [
    { id: 'bodypump', nombre: 'BodyPump', color: '#EF4444' },
    { id: 'yoga', nombre: 'Yoga', color: '#34D399' },
    { id: 'pilates', nombre: 'Pilates', color: '#60A5FA' },
    { id: 'spinning', nombre: 'Ciclo Indoor', color: '#FBBF24' },
    { id: 'cross', nombre: 'Cross Training', color: '#F97316' },
    { id: 'zumba', nombre: 'Zumba', color: '#E879F9' }
  ],

  // Puntos por acción (solo informativo: los puntos los suma el servidor).
  puntos: { acceso: 10, entreno: 20 },

  // Niveles de socio según los puntos acumulados.
  niveles: [
    { nombre: 'Bronce', desde: 0 },
    { nombre: 'Plata', desde: 500 },
    { nombre: 'Oro', desde: 1500 },
    { nombre: 'Platino', desde: 3000 }
  ],

  recompensas: [] // se cargan de la base de datos
};
