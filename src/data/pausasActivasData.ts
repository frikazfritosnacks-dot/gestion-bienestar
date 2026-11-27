export type ExercisePoseId =
  | 'neck-tilt'
  | 'shoulder-shrug'
  | 'shoulder-rolls'
  | 'overhead-reach'
  | 'back-stretch'
  | 'wrist-stretch'
  | 'knee-lifts'
  | 'calf-raises'
  | 'full-combo';

export interface PausaActivaExercise {
  id: string;
  numero: number;
  poseId: ExercisePoseId;
  nombre: string;
  zonaTrabajada: string;
  instruccion: string;
  duracionSegundos: number;
  repeticionesTexto: string;
  recomendacionBasica: string;
}

export const PAUSAS_ACTIVAS_EXERCISES: PausaActivaExercise[] = [
  {
    id: 'pausa-1',
    numero: 1,
    poseId: 'neck-tilt',
    nombre: 'Estiramiento lateral de cuello',
    zonaTrabajada: 'Cuello y zona cervical',
    instruccion:
      'De pie o sentado con la espalda recta, inclina suavemente la cabeza hacia el hombro derecho sin elevar los hombros, sostén unos segundos y cambia al lado izquierdo.',
    duracionSegundos: 24,
    repeticionesTexto: '24 segundos · 2 inclinaciones suaves por lado (6 s cada una)',
    recomendacionBasica:
      'Mantén los hombros relajados y respira lento; nunca forces la inclinación con la mano ni gires bruscamente el cuello.',
  },
  {
    id: 'pausa-2',
    numero: 2,
    poseId: 'shoulder-shrug',
    nombre: 'Elevación y descenso de hombros',
    zonaTrabajada: 'Hombros y trapecio superior',
    instruccion:
      'Inhala elevando ambos hombros hacia las orejas de forma controlada, sostén 2 segundos arriba y exhala dejándolos caer suavemente.',
    duracionSegundos: 24,
    repeticionesTexto: '24 segundos · 6 elevaciones lentas y controladas',
    recomendacionBasica:
      'Coordina el movimiento con la respiración y evita tensar el cuello o apretar la mandíbula.',
  },
  {
    id: 'pausa-3',
    numero: 3,
    poseId: 'shoulder-rolls',
    nombre: 'Rotación suave de hombros',
    zonaTrabajada: 'Hombros y parte alta del torso',
    instruccion:
      'Con los brazos relajados a los costados, realiza círculos amplios y lentos con los hombros hacia atrás durante la mitad del tiempo y luego hacia adelante.',
    duracionSegundos: 26,
    repeticionesTexto: '26 segundos · 5 círculos hacia atrás y 5 hacia adelante',
    recomendacionBasica:
      'Mantén el tronco firme y ejecuta círculos cómodos dentro de tu rango natural de movimiento.',
  },
  {
    id: 'pausa-4',
    numero: 4,
    poseId: 'overhead-reach',
    nombre: 'Estiramiento de brazos y torso hacia arriba',
    zonaTrabajada: 'Brazos, costados del torso y columna',
    instruccion:
      'Eleva ambos brazos por los lados hacia arriba alargando suavemente el torso como si quisieras alcanzar el techo, baja lento y repite.',
    duracionSegundos: 24,
    repeticionesTexto: '24 segundos · 3 extensiones suaves de 6 segundos',
    recomendacionBasica:
      'Evita arquear en exceso la zona lumbar; mantén el abdomen suavemente activo y la mirada al frente.',
  },
  {
    id: 'pausa-5',
    numero: 5,
    poseId: 'back-stretch',
    nombre: 'Estiramiento suave de espalda',
    zonaTrabajada: 'Espalda alta y media',
    instruccion:
      'Lleva los brazos al frente entrelazando suavemente las manos a la altura del pecho mientras redondeas ligeramente la espalda alta y sueltas la tensión dorsal.',
    duracionSegundos: 26,
    repeticionesTexto: '26 segundos · 3 ciclos lentos de extensión dorsal',
    recomendacionBasica:
      'Realiza la flexión únicamente en la parte alta de la espalda, manteniendo las rodillas ligeramente sueltas.',
  },
  {
    id: 'pausa-6',
    numero: 6,
    poseId: 'wrist-stretch',
    nombre: 'Movilidad y estiramiento de muñecas y manos',
    zonaTrabajada: 'Muñecas, manos y antebrazos',
    instruccion:
      'Extiende el brazo derecho al frente con la palma hacia arriba y flexiona suavemente los dedos hacia abajo con la otra mano; alterna ambos lados y realiza giros lentos de muñeca.',
    duracionSegundos: 26,
    repeticionesTexto: '26 segundos · 8 segundos por mano + 5 rotaciones suaves',
    recomendacionBasica:
      'Aplica una presión muy ligera sin doblar el codo en exceso; ideal tras empaque, digitación o manipulación manual.',
  },
  {
    id: 'pausa-7',
    numero: 7,
    poseId: 'knee-lifts',
    nombre: 'Elevación alternada de rodillas',
    zonaTrabajada: 'Caderas, muslos y circulación de piernas',
    instruccion:
      'De pie en un espacio despejado, eleva suavemente una rodilla hacia el frente hasta una altura cómoda, apoya el pie y alterna con la otra pierna manteniendo el equilibrio.',
    duracionSegundos: 28,
    repeticionesTexto: '28 segundos · 10 a 12 elevaciones alternadas a ritmo pausado',
    recomendacionBasica:
      'Apóyate cerca de una superficie firme si necesitas mayor estabilidad y evita inclinarte hacia atrás.',
  },
  {
    id: 'pausa-8',
    numero: 8,
    poseId: 'calf-raises',
    nombre: 'Activación de piernas y elevación de talones',
    zonaTrabajada: 'Pantorrillas, tobillos y retorno venoso',
    instruccion:
      'Con los pies separados al ancho de los hombros, despega suavemente ambos talones del piso quedando en puntas durante 2 segundos y desciende de forma lenta.',
    duracionSegundos: 24,
    repeticionesTexto: '24 segundos · 8 elevaciones controladas',
    recomendacionBasica:
      'Usa calzado firme y antideslizante; realiza la subida y bajada sin rebotar sobre los tobillos.',
  },
  {
    id: 'pausa-9',
    numero: 9,
    poseId: 'full-combo',
    nombre: 'Estiramiento combinado suave de brazos y piernas',
    zonaTrabajada: 'Cuerpo completo y respiración de cierre',
    instruccion:
      'Inhala abriendo y elevando suavemente los brazos mientras das un paso ligero o elevas los talones, y exhala regresando a una postura erguida y relajada.',
    duracionSegundos: 28,
    repeticionesTexto: '28 segundos · 4 ciclos completos suaves de cierre',
    recomendacionBasica:
      'Aprovecha este cierre para regular la respiración y retomar tus actividades laborales con calma y postura cómoda.',
  },
];

export const PAUSAS_ACTIVAS_SAFETY_GUIDELINES = {
  titulo: 'Recomendaciones básicas de seguridad y autocuidado',
  items: [
    'Esta guía interactiva ofrece ejercicios generales y suaves de movilidad laboral; no constituye tratamiento médico, diagnóstico clínico ni rehabilitación terapéutica.',
    'Realiza cada movimiento de forma lenta, fluida y controlada, evitando giros bruscos, rebotes o estiramientos forzados.',
    'Respeta tus límites físicos y las condiciones de tu área de trabajo (superficie firme, despejada y sin obstáculos).',
    'Suspende de inmediato cualquier ejercicio si presentas dolor agudo, mareo, adormecimiento o molestia, y comunícalo oportunamente a la Gerente.',
  ],
};
