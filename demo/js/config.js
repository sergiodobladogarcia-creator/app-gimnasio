/* ============================================================
   CONFIGURACIÓN DEL GIMNASIO
   Cambia aquí el nombre, las cuotas, las actividades y las
   recompensas. Después pulsa "Reiniciar demo" en la barra
   superior de la app para que se apliquen los cambios.
   ============================================================ */
window.GYM_CONFIG = {
  nombre: 'Tu Gimnasio',
  lema: 'Fuerza · Constancia · Comunidad',
  direccion: 'Calle Mayor 1, Tu Pueblo',
  cif: 'B-00000000',
  telefono: '600 000 000',
  iva: 21,               // % de IVA incluido en los precios
  serieFactura: 'F',     // prefijo del número de factura
  objetivoSemanal: 4,    // entrenos por semana que se proponen al socio

  // Horario de apertura (lunes … domingo): [hora de apertura, hora de cierre]; null = cerrado.
  // Se usa para el aforo en directo y para decir a los socios cuándo abre.
  apertura: [[7, 22], [7, 22], [7, 22], [7, 22], [7, 22], [9, 14], null],

  // Cuotas. "meses" = cada cuánto se renueva (0 = no se renueva sola).
  planes: [
    { id: 'mensual', nombre: 'Mensual', precio: 35, periodo: 'al mes', meses: 1, destacado: true,
      ventajas: ['Acceso ilimitado a sala', 'Todas las clases dirigidas', 'Sin permanencia'] },
    { id: 'trimestral', nombre: 'Trimestral', precio: 95, periodo: 'cada 3 meses', meses: 3,
      ventajas: ['Todo lo del plan mensual', 'Ahorras 10 € por trimestre', 'Valoración inicial gratis'] },
    { id: 'anual', nombre: 'Anual', precio: 340, periodo: 'al año', meses: 12,
      ventajas: ['Todo lo del plan mensual', 'Dos meses gratis', 'Puntos dobles en recompensas'] },
    { id: 'bono10', nombre: 'Bono 10 sesiones', precio: 45, periodo: 'bono', meses: 0, sesiones: 10,
      ventajas: ['10 accesos a sala o clase', 'Caduca a los 3 meses', 'Ideal si vienes poco'] },
    { id: 'dia', nombre: 'Pase de día', precio: 6, periodo: 'un día', meses: 0, sesiones: 1,
      ventajas: ['Un acceso completo', 'Sin compromiso'] }
  ],

  // Actividades dirigidas y su color en el horario.
  disciplinas: [
    { id: 'bodypump', nombre: 'BodyPump', color: '#EF4444' },
    { id: 'yoga', nombre: 'Yoga', color: '#34D399' },
    { id: 'pilates', nombre: 'Pilates', color: '#60A5FA' },
    { id: 'spinning', nombre: 'Ciclo Indoor', color: '#FBBF24' },
    { id: 'cross', nombre: 'Cross Training', color: '#F97316' },
    { id: 'zumba', nombre: 'Zumba', color: '#E879F9' }
  ],

  // Horario semanal: [días (0 = lunes … 6 = domingo), hora, actividad, minutos, monitor, sala, aforo, nivel]
  horario: [
    [[0, 2, 4], '07:15', 'spinning', 45, 'Dani', 'Sala Ciclo', 18, 'Todos'],
    [[0, 1, 2, 3, 4], '09:30', 'pilates', 50, 'Marta', 'Sala 2', 14, 'Inicial'],
    [[1, 3], '10:30', 'yoga', 60, 'Elena', 'Sala 2', 14, 'Todos'],
    [[0, 2, 4], '18:00', 'cross', 50, 'Rubén', 'Box', 12, 'Intermedio'],
    [[0, 1, 2, 3], '19:00', 'bodypump', 55, 'Marta', 'Sala 1', 20, 'Todos'],
    [[1, 3], '19:15', 'spinning', 45, 'Dani', 'Sala Ciclo', 18, 'Intermedio'],
    [[0, 2], '20:00', 'yoga', 60, 'Elena', 'Sala 2', 14, 'Intermedio'],
    [[1, 3], '20:00', 'zumba', 50, 'Carla', 'Sala 1', 22, 'Todos'],
    [[4], '19:00', 'zumba', 50, 'Carla', 'Sala 1', 22, 'Todos'],
    [[5], '10:00', 'bodypump', 55, 'Marta', 'Sala 1', 20, 'Todos'],
    [[5], '10:30', 'cross', 50, 'Rubén', 'Box', 12, 'Avanzado'],
    [[5], '11:15', 'yoga', 60, 'Elena', 'Sala 2', 14, 'Todos']
  ],

  // Puntos que gana el socio por cada acción.
  puntos: { acceso: 10, entreno: 20 },

  // Niveles de socio según los puntos acumulados.
  niveles: [
    { nombre: 'Bronce', desde: 0 },
    { nombre: 'Plata', desde: 500 },
    { nombre: 'Oro', desde: 1500 },
    { nombre: 'Platino', desde: 3000 }
  ],

  // Recompensas que se canjean con puntos.
  recompensas: [
    { id: 'batido', nombre: 'Batido de proteínas', coste: 300, icono: '🥤' },
    { id: 'amigo', nombre: 'Invita a un amigo un día', coste: 500, icono: '🤝' },
    { id: 'toalla', nombre: 'Toalla del gimnasio', coste: 800, icono: '🧺' },
    { id: 'camiseta', nombre: 'Camiseta oficial', coste: 1200, icono: '👕' },
    { id: 'personal', nombre: 'Sesión con entrenador personal', coste: 2000, icono: '🏋️' },
    { id: 'mes', nombre: 'Un mes de cuota gratis', coste: 4000, icono: '🎁' }
  ]
};
