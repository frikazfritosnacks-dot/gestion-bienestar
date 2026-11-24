import { BienestarState } from '../types/bienestar';
import {
  ACTIVIDADES_INICIALES,
  CONVENIOS_INICIALES,
  LISTAS_ASISTENCIA_INICIALES,
  PLAN_GENERAL_INITIAL,
  PRESUPUESTO_GENERAL_2027_INITIAL,
  RESPUESTAS_ENCUESTAS_INICIALES,
} from './planBienestarData';

export const INITIAL_BIENESTAR_STATE: BienestarState = {
  lastUpdated: '2026-11-13T10:00:00.000Z',
  manual: {
    portada: {
      empresa: 'Frikaz S.A.S.',
      nombreDocumento: 'Manual del Procedimiento de Bienestar Social Laboral',
      codigoDocumental: 'TH-MBS-01',
      version: '01',
      fechaActualizacion: '13/11/2026',
      areaResponsable: 'Gestión del Talento Humano',
      elaboradoPor: '',
      revisadoPor: '',
      aprobadoPor: '',
    },
    introduccion:
      'El presente manual tiene como propósito establecer los lineamientos y procedimientos necesarios para desarrollar actividades orientadas al bienestar integral de los trabajadores de Frikaz S.A.S., considerando sus necesidades sociales, personales y laborales.\n\nA través de este documento se busca promover de forma estructurada espacios de participación, integración, reconocimiento y acompañamiento, contribuyendo al fortalecimiento del clima organizacional, la calidad de vida laboral y el compromiso mutuo entre la organización y sus colaboradores.',
    objetivoGeneral:
      'Guiar a la gerencia a implementar diferentes programas de bienestar social laboral para cada una de las dimensiones personales de los trabajadores, teniendo en cuenta sus necesidades para la estructuración de los programas, así promoviendo la participación de cada uno de los trabajadores de las diferentes áreas de Frikaz S.A.S.',
    objetivosEspecificos: [
      {
        id: 'obj-1',
        texto:
          'Realizar sensibilización a los trabajadores acerca de la importancia de los programas de bienestar para cada uno de ellos y cómo influye en su desempeño en el cumplimiento de sus actividades. Incentivos.',
      },
      {
        id: 'obj-2',
        texto: 'Aplicar los programas de bienestar en la organización para los trabajadores.',
      },
      {
        id: 'obj-3',
        texto:
          'Evaluar la satisfacción de los trabajadores frente a los programas de bienestar propuestos.',
      },
    ],
    justificacion:
      'El bienestar social laboral constituye un pilar estratégico para el desarrollo humano y organizacional dentro de Frikaz S.A.S. Invertir en la motivación, la salud emocional y la satisfacción de los trabajadores permite mejorar el desempeño, reducir el ausentismo y la rotación, y consolidar un entorno laboral saludable.\n\nAsimismo, la planificación y ejecución continua de actividades de integración, recreación y reconocimiento fortalece las relaciones entre compañeros, afianza el sentido de pertenencia y promueve una cultura organizacional basada en el respeto, la equidad y la colaboración entre todas las áreas.',
    alcance:
      'El Manual aplica a todos los colaboradores de Frikaz S.A.S., independientemente del cargo o área de trabajo, incluyendo personal administrativo, operativo y logístico.\n\nComprende acciones de integración, reconocimiento, programas de bienestar, desarrollo personal y bienestar físico, mental y social.',
  },
  normograma: [
    {
      id: 'norm-1',
      jerarquia: 'Constitución',
      nombre: 'Constitución Política de Colombia, artículos 25 y 53',
      afectacion:
        'Consagra el trabajo como un derecho y una obligación social en condiciones dignas y justas, y establece los principios mínimos fundamentales de estabilidad, remuneración justa, descanso y protección integral al trabajador.',
      queDebeHacer:
        'Garantizar que todas las políticas y programas de bienestar social laboral respeten la dignidad humana, la igualdad de oportunidades, el descanso y condiciones laborales justas para todo el personal.',
    },
    {
      id: 'norm-2',
      jerarquia: 'Ley',
      nombre: 'Ley 9 de 1979',
      afectacion:
        'Establece el Código Sanitario Nacional y dicta medidas sanitarias para preservar, conservar y mejorar la salud de los individuos en sus ocupaciones y lugares de trabajo.',
      queDebeHacer:
        'Asegurar ambientes de trabajo salubres y seguros durante las jornadas laborales y en el desarrollo de las actividades de bienestar, recreación e integración.',
    },
    {
      id: 'norm-3',
      jerarquia: 'Ley',
      nombre: 'Ley 21 de 1982',
      afectacion:
        'Regula el régimen del subsidio familiar y el papel de las Cajas de Compensación Familiar en la prestación de servicios sociales, recreativos, educativos y de bienestar para los trabajadores y sus familias.',
      queDebeHacer:
        'Mantener afiliados oportunamente a los trabajadores a la Caja de Compensación Familiar y articular convenios y programas recreativos, culturales y de capacitación en beneficio de los colaboradores y su núcleo familiar.',
    },
    {
      id: 'norm-4',
      jerarquia: 'Ley',
      nombre: 'Ley 1010 de 2006',
      afectacion:
        'Adopta medidas para prevenir, corregir y sancionar el acoso laboral y otros hostigamientos en el marco de las relaciones de trabajo, protegiendo la dignidad y la armonía laboral.',
      queDebeHacer:
        'Implementar acciones preventivas de convivencia laboral, fortalecer el Comité de Convivencia Laboral y promover espacios de comunicación asertiva y respeto mutuo dentro del Plan de Bienestar.',
    },
    {
      id: 'norm-5',
      jerarquia: 'Ley',
      nombre: 'Ley 1616 de 2013',
      afectacion:
        'Garantiza el ejercicio pleno del derecho a la salud mental en Colombia, priorizando la promoción de la salud mental y la prevención de trastornos en entornos comunitarios y laborales.',
      queDebeHacer:
        'Incorporar en los programas de bienestar talleres de autocuidado, manejo del estrés, equilibrio emocional y rutas de acompañamiento psicosocial para los colaboradores.',
    },
    {
      id: 'norm-6',
      jerarquia: 'Ley',
      nombre: 'Ley 1823 de 2017',
      afectacion:
        'Adopta la estrategia de Salas Amigas de la Familia Lactante del Entorno Laboral para proteger y apoyar la maternidad y la lactancia materna en los centros de trabajo.',
      queDebeHacer:
        'Adecuar espacios dignos, higiénicos y privados o brindar facilidades y tiempos de lactancia para las colaboradoras lactantes dentro de las instalaciones o jornadas de Frikaz S.A.S.',
    },
    {
      id: 'norm-7',
      jerarquia: 'Ley',
      nombre: 'Ley 1857 de 2017',
      afectacion:
        'Modifica la Ley 1361 de 2009 para fortalecer y garantizar el desarrollo integral de la familia, estableciendo la jornada semestral dedicada a compartir con la familia.',
      queDebeHacer:
        'Programar y facilitar al menos una jornada semestral (o de acuerdo con la regulación vigente de jornada laboral) para que los trabajadores compartan con sus familias, integrándola al calendario de bienestar.',
    },
    {
      id: 'norm-8',
      jerarquia: 'Ley',
      nombre: 'Ley 2049 de 2020',
      afectacion:
        'Crea el Consejo Nacional de Planeación Lingüística de la Lengua de Señas Colombiana y promueve la inclusión comunicativa y accesibilidad para personas con discapacidad auditiva.',
      queDebeHacer:
        'Asegurar que las convocatorias, actividades de sensibilización e integración del Plan de Bienestar contemplen criterios de inclusión y accesibilidad para toda la población trabajadora.',
    },
    {
      id: 'norm-9',
      jerarquia: 'Ley',
      nombre: 'Ley 2088 de 2021',
      afectacion:
        'Regula el trabajo en casa como forma de prestación del servicio en situaciones ocasionales, excepcionales o especiales, garantizando la igualdad de derechos laborales y de bienestar.',
      queDebeHacer:
        'Extender las actividades de bienestar, pausas activas, acompañamiento psicosocial y beneficios organizacionales a quienes laboren bajo modalidad de trabajo en casa.',
    },
    {
      id: 'norm-10',
      jerarquia: 'Ley',
      nombre: 'Ley 2101 de 2021',
      afectacion:
        'Reduce la jornada laboral semanal de manera gradual sin disminuir el salario ni afectar derechos adquiridos y garantías de los trabajadores.',
      queDebeHacer:
        'Ajustar la planeación de horarios, turnos operativos y espacios de bienestar respetando la reducción gradual de la jornada laboral y promoviendo el aprovechamiento del tiempo libre.',
    },
    {
      id: 'norm-11',
      jerarquia: 'Ley',
      nombre: 'Ley 2191 de 2022',
      afectacion:
        'Regula la desconexión laboral para garantizar el goce efectivo del tiempo libre, descansos, licencias, permisos y vacaciones, protegiendo la salud y el equilibrio vida-trabajo.',
      queDebeHacer:
        'Adoptar e implementar una política interna de desconexión laboral, respetar los horarios de descanso y evitar comunicaciones o convocatorias obligatorias fuera de la jornada laboral.',
    },
    {
      id: 'norm-12',
      jerarquia: 'Ley',
      nombre: 'Ley 2365 de 2024',
      afectacion:
        'Establece medidas de prevención, protección y atención frente al acoso sexual en el ámbito laboral y en las instituciones de educación superior.',
      queDebeHacer:
        'Divulgar protocolos claros de prevención y atención, sensibilizar a todo el personal y garantizar entornos seguros y libres de cualquier forma de violencia o acoso en las actividades laborales y de bienestar.',
    },
    {
      id: 'norm-13',
      jerarquia: 'Ley',
      nombre: 'Ley 2466 de 2025',
      afectacion:
        'Actualiza disposiciones de la reforma laboral orientadas al trabajo digno y decente, fortalecimiento de garantías laborales, estabilidad, jornadas, inclusión y bienestar en las empresas.',
      queDebeHacer:
        'Revisar y alinear el Plan de Bienestar, los incentivos, la gestión de tiempos de descanso y las condiciones laborales con las disposiciones vigentes de trabajo decente y protección al trabajador.',
    },
    {
      id: 'norm-14',
      jerarquia: 'Decreto',
      nombre: 'Decreto 1072 de 2015',
      afectacion:
        'Decreto Único Reglamentario del Sector Trabajo; compila las normas sobre relaciones laborales, Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) y bienestar laboral.',
      queDebeHacer:
        'Articular el procedimiento de Bienestar Social Laboral con el SG-SST, documentar evidencias de participación, capacitaciones y acciones de promoción de la salud en el trabajo.',
    },
    {
      id: 'norm-15',
      jerarquia: 'Decreto',
      nombre: 'Decreto 1085',
      afectacion:
        'Normativa reglamentaria vinculada a la promoción del deporte, la recreación, la actividad física y el aprovechamiento del tiempo libre como factores esenciales del desarrollo humano.',
      queDebeHacer:
        'Fomentar actividades deportivas, recreativas y lúdicas dentro del Plan de Bienestar para promover hábitos de vida saludable y la integración de los equipos de trabajo.',
    },
    {
      id: 'norm-16',
      jerarquia: 'Decreto',
      nombre: 'Decreto 1567 de 1998',
      afectacion:
        'Crea el sistema nacional de capacitación y el sistema de estímulos e incentivos, sirviendo como marco conceptual de referencia para estructurar programas de bienestar social e incentivos.',
      queDebeHacer:
        'Tomar como referente metodológico las áreas de protección y servicios sociales, calidad de vida laboral e incentivos para diseñar programas estructurados y medibles en Frikaz S.A.S.',
    },
    {
      id: 'norm-17',
      jerarquia: 'Resolución',
      nombre: 'Resolución 0312 de 2019',
      afectacion:
        'Define los Estándares Mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST) según el tamaño y nivel de riesgo de la empresa.',
      queDebeHacer:
        'Asegurar que las actividades de bienestar físico, prevención de riesgos y promoción de estilos de vida saludables aporten al cumplimiento del plan de trabajo anual del SG-SST.',
    },
    {
      id: 'norm-18',
      jerarquia: 'Resolución',
      nombre: 'Resolución 2764 de 2022',
      afectacion:
        'Adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial y las guías y protocolos para la prevención e intervención del riesgo psicosocial en el trabajo.',
      queDebeHacer:
        'Utilizar los resultados de la evaluación de riesgo psicosocial como insumo directo del diagnóstico de necesidades de bienestar para diseñar intervenciones enfocadas en clima, carga y bienestar mental.',
    },
    {
      id: 'norm-19',
      jerarquia: 'Resolución',
      nombre: 'Resolución 2646 de 2008',
      afectacion:
        'Establece disposiciones y responsabilidades para la identificación, evaluación, prevención, intervención y monitoreo permanente de la exposición a factores de riesgo psicosocial.',
      queDebeHacer:
        'Implementar programas de intervención psicosocial, fortalecimiento de relaciones interpersonales, reconocimiento y manejo del estrés dentro del calendario anual de bienestar.',
    },
    {
      id: 'norm-20',
      jerarquia: 'Resolución',
      nombre: 'Resolución 3461',
      afectacion:
        'Establece lineamientos para el funcionamiento del Comité de Convivencia Laboral y medidas preventivas orientadas a proteger la convivencia armónica y prevenir conductas de acoso en el trabajo.',
      queDebeHacer:
        'Mantener activo y capacitado el Comité de Convivencia Laboral, coordinar campañas de buen trato y articular sus acciones preventivas con las actividades de bienestar social laboral.',
    },
  ],
  terminologia: [
    {
      id: 'term-1',
      termino: 'Bienestar',
      definicion:
        'Estado integral de equilibrio físico, mental, emocional y social que permite al trabajador desenvolverse de manera saludable, plena y productiva en su entorno laboral y personal.',
    },
    {
      id: 'term-2',
      termino: 'Plenitud',
      definicion:
        'Sensación profunda de satisfacción, realización y sentido frente a la propia vida y al desempeño cotidiano, donde la persona siente que aprovecha sus capacidades de forma significativa.',
    },
    {
      id: 'term-3',
      termino: 'Armonía',
      definicion:
        'Relación equilibrada, serena y constructiva entre las distintas dimensiones de la persona y con su entorno laboral, familiar y social.',
    },
    {
      id: 'term-4',
      termino: 'Resiliencia',
      definicion:
        'Capacidad humana para afrontar, adaptarse y recuperarse de situaciones adversas, cambios o presiones laborales, saliendo fortalecido de la experiencia.',
    },
    {
      id: 'term-5',
      termino: 'Autocuidado',
      definicion:
        'Conjunto de hábitos, decisiones y prácticas conscientes que realiza el trabajador para preservar y fortalecer su salud física, mental y emocional.',
    },
    {
      id: 'term-6',
      termino: 'Autoconocimiento',
      definicion:
        'Capacidad de observar, comprender y reconocer las propias emociones, fortalezas, valores, límites y necesidades personales.',
    },
    {
      id: 'term-7',
      termino: 'Autoestima',
      definicion:
        'Valoración, respeto y aprecio que una persona tiene de sí misma, lo cual influye directamente en su seguridad, desempeño y relaciones interpersonales.',
    },
    {
      id: 'term-8',
      termino: 'Empatía',
      definicion:
        'Habilidad para comprender y conectar con los sentimientos, perspectivas y necesidades de los compañeros de trabajo de manera respetuosa y cercana.',
    },
    {
      id: 'term-9',
      termino: 'Serenidad',
      definicion:
        'Estado de calma, claridad mental y templanza emocional que facilita responder de forma reflexiva y equilibrada ante los retos cotidianos.',
    },
    {
      id: 'term-10',
      termino: 'Eudaimonía',
      definicion:
        'Bienestar profundo ligado al florecimiento humano, al desarrollo de las virtudes propias y a vivir y trabajar con propósito y sentido ético.',
    },
    {
      id: 'term-11',
      termino: 'Autorrealización',
      definicion:
        'Proceso continuo mediante el cual la persona desarrolla al máximo su potencial, talentos y aspiraciones personales y profesionales.',
    },
    {
      id: 'term-12',
      termino: 'Autonomía',
      definicion:
        'Capacidad del colaborador para tomar decisiones responsables, gestionar sus tareas con criterio propio y actuar de forma independiente dentro de los lineamientos organizacionales.',
    },
    {
      id: 'term-13',
      termino: 'Gratitud',
      definicion:
        'Disposición consciente a reconocer y valorar los aportes, gestos, aprendizajes y beneficios recibidos en el entorno laboral y personal.',
    },
    {
      id: 'term-14',
      termino: 'Equilibrio emocional',
      definicion:
        'Capacidad de regular adecuadamente las respuestas afectivas frente a estímulos positivos o estresantes, evitando desbordamientos que afecten el bienestar o la convivencia.',
    },
    {
      id: 'term-15',
      termino: 'Inteligencia emocional',
      definicion:
        'Conjunto de habilidades para percibir, comprender, expresar y gestionar las emociones propias y las de los demás, favoreciendo relaciones laborales sanas.',
    },
    {
      id: 'term-16',
      termino: 'Compasión',
      definicion:
        'Sensibilidad ante el sufrimiento o la dificultad de otra persona acompañada del deseo genuino y la disposición de brindar apoyo.',
    },
    {
      id: 'term-17',
      termino: 'Autocompasión',
      definicion:
        'Actitud de comprensión, amabilidad y cuidado hacia uno mismo frente a los errores, limitaciones o momentos difíciles, sin autocrítica destructiva.',
    },
    {
      id: 'term-18',
      termino: 'Vitalidad',
      definicion:
        'Sensación de energía física, entusiasmo y vigor mental que impulsa la participación activa y el disfrute en las actividades diarias.',
    },
    {
      id: 'term-19',
      termino: 'Propósito de vida',
      definicion:
        'Dirección clara y significativa que orienta las metas, decisiones y acciones de la persona, conectando su labor cotidiana con sus valores.',
    },
    {
      id: 'term-20',
      termino: 'Felicidad',
      definicion:
        'Estado subjetivo de alegría, bienestar duradero y valoración positiva de la propia existencia y de los vínculos construidos.',
    },
    {
      id: 'term-21',
      termino: 'Paz interior',
      definicion:
        'Tranquilidad profunda y estabilidad psicológica que permanece incluso frente a las exigencias o cambios del entorno externo.',
    },
    {
      id: 'term-22',
      termino: 'Florecimiento humano',
      definicion:
        'Condición de desarrollo integral en la que los trabajadores experimentan emociones positivas, compromiso, relaciones sanas, sentido y logro.',
    },
    {
      id: 'term-23',
      termino: 'Mindfulness',
      definicion:
        'Práctica de atención plena en el momento presente, con apertura y sin juicios, orientada a reducir el estrés y mejorar la concentración y el bienestar.',
    },
    {
      id: 'term-24',
      termino: 'Autodeterminación',
      definicion:
        'Facultad de elegir y dirigir el propio camino con convicción y coherencia personal, impulsada por la motivación intrínseca.',
    },
    {
      id: 'term-25',
      termino: 'Satisfacción personal',
      definicion:
        'Percepción positiva de logro y conformidad respecto a las condiciones de vida, el crecimiento individual y la experiencia dentro de la organización.',
    },
    {
      id: 'term-26',
      termino: 'Convivencia',
      definicion:
        'Interacción armónica, respetuosa y participativa entre los integrantes de la organización, fundamentada en acuerdos comunes y buen trato.',
    },
    {
      id: 'term-27',
      termino: 'Solidaridad',
      definicion:
        'Apoyo mutuo y colaboración desinteresada entre compañeros de trabajo frente a necesidades compartidas o situaciones particulares.',
    },
    {
      id: 'term-28',
      termino: 'Inclusión',
      definicion:
        'Práctica organizacional que garantiza la participación, el respeto y la valoración de todas las personas sin distinción ni barreras.',
    },
    {
      id: 'term-29',
      termino: 'Equidad',
      definicion:
        'Trato justo y proporcional que reconoce las necesidades y condiciones particulares de cada colaborador para ofrecer igualdad real de oportunidades.',
    },
    {
      id: 'term-30',
      termino: 'Cohesión social',
      definicion:
        'Grado de unión, confianza y sentido de equipo que mantiene integrados a los trabajadores alrededor de objetivos y valores compartidos.',
    },
    {
      id: 'term-31',
      termino: 'Sentido de pertenencia',
      definicion:
        'Vínculo afectivo y de identificación del trabajador con Frikaz S.A.S., su equipo y su propósito, sintiéndose parte valiosa de la empresa.',
    },
    {
      id: 'term-32',
      termino: 'Prosocialidad',
      definicion:
        'Conjunto de conductas voluntarias orientadas a beneficiar, ayudar, compartir y cuidar a otros miembros de la comunidad laboral.',
    },
    {
      id: 'term-33',
      termino: 'Comunicación asertiva',
      definicion:
        'Forma de expresión clara, honesta, directa y respetuosa de ideas, necesidades y desacuerdos, sin agredir ni someterse.',
    },
    {
      id: 'term-34',
      termino: 'Reciprocidad',
      definicion:
        'Principio de correspondencia mutua en el trato, el reconocimiento y la colaboración entre la empresa y los trabajadores, y entre pares.',
    },
    {
      id: 'term-35',
      termino: 'Dignidad humana',
      definicion:
        'Valor intrínseco e inviolable de toda persona por el solo hecho de existir, base de todo trato respetuoso y de las condiciones de trabajo decente.',
    },
    {
      id: 'term-36',
      termino: 'Motivación',
      definicion:
        'Impulso interno o estímulo externo que activa, orienta y sostiene el esfuerzo y el entusiasmo del trabajador hacia el logro de metas.',
    },
    {
      id: 'term-37',
      termino: 'Esperanza',
      definicion:
        'Confianza positiva en la posibilidad de alcanzar metas futuras y superar obstáculos mediante la planificación y el esfuerzo conjunto.',
    },
    {
      id: 'term-38',
      termino: 'Optimismo',
      definicion:
        'Disposición mental favorable que permite interpretar las situaciones con perspectiva constructiva y enfocarse en las soluciones.',
    },
    {
      id: 'term-39',
      termino: 'Adaptabilidad',
      definicion:
        'Capacidad para ajustarse con flexibilidad y eficacia a cambios organizacionales, nuevas metodologías o dinámicas de trabajo.',
    },
    {
      id: 'term-40',
      termino: 'Equilibrio',
      definicion:
        'Distribución saludable y sostenible del tiempo, la energía y la atención entre la vida laboral, personal y familiar.',
    },
    {
      id: 'term-41',
      termino: 'Calidad de vida',
      definicion:
        'Percepción del trabajador sobre su bienestar físico, material, social y emocional dentro y fuera del entorno laboral.',
    },
    {
      id: 'term-42',
      termino: 'Salud mental',
      definicion:
        'Estado de bienestar en el cual el individuo es consciente de sus capacidades, afronta las tensiones normales de la vida y trabaja de forma fructífera y saludable.',
    },
    {
      id: 'term-43',
      termino: 'Autoconfianza',
      definicion:
        'Convicción y seguridad en las propias capacidades, conocimientos y criterio para asumir retos y tomar decisiones acertadas.',
    },
    {
      id: 'term-44',
      termino: 'Generosidad',
      definicion:
        'Disposición a compartir tiempo, conocimiento, apoyo y reconocimiento con los demás sin esperar retribución inmediata.',
    },
    {
      id: 'term-45',
      termino: 'Trascendencia',
      definicion:
        'Búsqueda de un significado superior en lo que se hace, proyectando el aporte personal hacia el bienestar colectivo y el legado organizacional.',
    },
    {
      id: 'term-46',
      termino: 'Integridad',
      definicion:
        'Coherencia constante entre los valores éticos, las palabras y las acciones cotidianas, actuando con honestidad y transparencia.',
    },
    {
      id: 'term-47',
      termino: 'Perseverancia',
      definicion:
        'Constancia y firmeza en el empeño para alcanzar los propósitos propuestos, manteniendo el esfuerzo a pesar de las dificultades.',
    },
    {
      id: 'term-48',
      termino: 'Vulnerabilidad',
      definicion:
        'Apertura auténtica para reconocer emociones, límites o necesidades de apoyo humano, fortaleciendo la confianza en los equipos.',
    },
    {
      id: 'term-49',
      termino: 'Autenticidad',
      definicion:
        'Capacidad de mostrarse y actuar en coherencia con la propia identidad, valores y convicciones de manera genuina y respetuosa.',
    },
    {
      id: 'term-50',
      termino: 'Fluidez emocional',
      definicion:
        'Habilidad para transitar de manera natural y saludable por distintas emociones, aceptándolas y canalizándolas de forma constructiva.',
    },
  ],
  matrizMeta: {
    empresa: 'Frikaz S.A.S.',
    codigo: 'TH-MDB-01',
    version: '01',
    fecha: '13/11/2026',
    responsable: 'Área de Talento Humano',
    objetivo:
      'Garantizar la planeación, ejecución y evaluación de los programas de bienestar para elevar la calidad de vida y motivación laboral.',
  },
  proceso: [
    {
      id: 'step-1',
      symbol: 'oval',
      actividad: 'Inicio',
      descripcion:
        'Apertura formal del ciclo anual o periódico de gestión del procedimiento de Bienestar Social Laboral en Frikaz S.A.S.',
      responsable: 'Talento Humano',
      registroDocumento: 'N/A',
      isDecision: false,
      nextTargetId: 'step-2',
    },
    {
      id: 'step-2',
      symbol: 'document',
      actividad: 'Aplicar diagnóstico de necesidades de bienestar',
      descripcion:
        'Diseñar y aplicar el instrumento de diagnóstico a los colaboradores de todas las áreas (administrativa, operativa y logística) para identificar intereses y necesidades personales, familiares y laborales.',
      responsable: 'Talento Humano',
      registroDocumento: 'Instrumento de diagnóstico',
      isDecision: false,
      nextTargetId: 'step-3',
    },
    {
      id: 'step-3',
      symbol: 'document',
      actividad: 'Recolección de la información del diagnóstico',
      descripcion:
        'Consolidar, tabular y organizar las respuestas obtenidas en el instrumento aplicado para construir la matriz de resultados del diagnóstico.',
      responsable: 'Talento Humano',
      registroDocumento: 'Informe / Matriz de resultados',
      isDecision: false,
      nextTargetId: 'step-4',
    },
    {
      id: 'step-4',
      symbol: 'cylinder',
      actividad: 'Elaborar informe de resultados',
      descripcion:
        'Analizar los hallazgos y elaborar el informe de resultados alineado al direccionamiento estratégico de Frikaz S.A.S., actualizando la base de datos correspondiente.',
      responsable: 'Talento Humano',
      registroDocumento: 'Base de datos',
      isDecision: false,
      nextTargetId: 'step-5',
    },
    {
      id: 'step-5',
      symbol: 'document',
      actividad: 'Definir los programas, actividades e incentivos',
      descripcion:
        'Estructurar los programas de bienestar social laboral, actividades de integración, recreación, desarrollo personal e incentivos en función de las dimensiones y necesidades detectadas.',
      responsable: 'Talento Humano',
      registroDocumento: 'Plan de Bienestar',
      isDecision: false,
      nextTargetId: 'step-6',
    },
    {
      id: 'step-6',
      symbol: 'diamond',
      actividad: '¿Los programas son aprobados?',
      descripcion:
        'La Gerencia revisa la pertinencia, alcance y alineación estratégica de los programas, actividades e incentivos propuestos en el Plan de Bienestar.',
      responsable: 'Gerencia',
      registroDocumento: 'Acta de revisión',
      isDecision: true,
      yesLabel: 'SÍ',
      noLabel: 'NO',
      yesTargetId: 'step-8',
      noTargetId: 'step-7',
    },
    {
      id: 'step-7',
      symbol: 'rectangle',
      actividad: 'Ajustar programas',
      descripcion:
        'Incorporar las observaciones y recomendaciones de la Gerencia al Plan de Bienestar y presentarlo nuevamente para su aprobación.',
      responsable: 'Talento Humano',
      registroDocumento: 'Plan ajustado',
      isDecision: false,
      isAdjustment: true,
      nextTargetId: 'step-6',
    },
    {
      id: 'step-8',
      symbol: 'rectangle',
      actividad: 'Elaborar cronograma',
      descripcion:
        'Definir fechas, horarios, frecuencias y tiempos de ejecución de cada programa y actividad aprobada sin afectar la operación de las áreas.',
      responsable: 'Talento Humano',
      registroDocumento: 'Cronograma de actividades',
      isDecision: false,
      nextTargetId: 'step-9',
    },
    {
      id: 'step-9',
      symbol: 'diamond',
      actividad: '¿El cronograma es aprobado?',
      descripcion:
        'La Gerencia verifica la viabilidad operativa y disponibilidad de tiempos establecidos en el cronograma de actividades de bienestar.',
      responsable: 'Gerencia',
      registroDocumento: 'Cronograma revisado',
      isDecision: true,
      yesLabel: 'SÍ',
      noLabel: 'NO',
      yesTargetId: 'step-11',
      noTargetId: 'step-10',
    },
    {
      id: 'step-10',
      symbol: 'rectangle',
      actividad: 'Ajustar cronograma',
      descripcion:
        'Reprogramar fechas o secuencias según las indicaciones gerenciales y operativas, y someter nuevamente a aprobación.',
      responsable: 'Talento Humano',
      registroDocumento: 'Cronograma ajustado',
      isDecision: false,
      isAdjustment: true,
      nextTargetId: 'step-9',
    },
    {
      id: 'step-11',
      symbol: 'rectangle',
      actividad: 'Elaborar presupuesto de los programas',
      descripcion:
        'Estimar costos de logística, refrigerios, materiales, espacios, incentivos y recursos necesarios para cada programa incluido en el cronograma.',
      responsable: 'Contador',
      registroDocumento: 'Presupuesto',
      isDecision: false,
      nextTargetId: 'step-12',
    },
    {
      id: 'step-12',
      symbol: 'diamond',
      actividad: '¿El presupuesto es aprobado?',
      descripcion:
        'La Gerencia evalúa la disponibilidad financiera y viabilidad económica del presupuesto proyectado para los programas de bienestar.',
      responsable: 'Gerencia',
      registroDocumento: 'Presupuesto',
      isDecision: true,
      yesLabel: 'SÍ',
      noLabel: 'NO',
      yesTargetId: 'step-14',
      noTargetId: 'step-13',
    },
    {
      id: 'step-13',
      symbol: 'rectangle',
      actividad: 'Ajustar presupuesto',
      descripcion:
        'Optimizar rubros, cotizaciones o alcances presupuestales atendiendo las observaciones de Gerencia para nueva revisión.',
      responsable: 'Talento Humano',
      registroDocumento: 'Presupuesto ajustado',
      isDecision: false,
      isAdjustment: true,
      nextTargetId: 'step-12',
    },
    {
      id: 'step-14',
      symbol: 'cylinder',
      actividad: 'Definir responsables',
      descripcion:
        'Asignar los líderes y facilitadores encargados de coordinar, preparar recursos y ejecutar cada actividad del Plan de Bienestar.',
      responsable: 'Talento Humano',
      registroDocumento: 'Base de datos',
      isDecision: false,
      nextTargetId: 'step-15',
    },
    {
      id: 'step-15',
      symbol: 'cylinder',
      actividad: 'Establecer participantes',
      descripcion:
        'Identificar y segmentar en la base de datos de los trabajadores a los colaboradores convocados de las áreas administrativas, operativas y logísticas.',
      responsable: 'Talento Humano',
      registroDocumento: 'Base de datos',
      isDecision: false,
      nextTargetId: 'step-16',
    },
    {
      id: 'step-16',
      symbol: 'document',
      actividad: 'Enviar invitaciones',
      descripcion:
        'Comunicar oportunamente a los participantes la fecha, hora, lugar y objetivo de las actividades mediante invitaciones oficiales.',
      responsable: 'Talento Humano',
      registroDocumento: 'Invitaciones',
      isDecision: false,
      nextTargetId: 'step-17',
    },
    {
      id: 'step-17',
      symbol: 'document',
      actividad: 'Ejecutar los programas de bienestar',
      descripcion:
        'Desarrollar las actividades programadas conforme al Plan de Bienestar, garantizando el cumplimiento de recursos, logística e inclusión.',
      responsable: 'Responsables asignados',
      registroDocumento: 'Plan de Bienestar',
      isDecision: false,
      nextTargetId: 'step-18',
    },
    {
      id: 'step-18',
      symbol: 'document',
      actividad: 'Aplicar encuesta y registro',
      descripcion:
        'Registrar la asistencia de los participantes, aplicar la encuesta de satisfacción al finalizar y recopilar la evidencia fotográfica correspondiente.',
      responsable: 'Talento Humano',
      registroDocumento: 'Lista, encuesta y fotos',
      isDecision: false,
      nextTargetId: 'step-19',
    },
    {
      id: 'step-19',
      symbol: 'document',
      actividad: 'Elaborar informes de resultados',
      descripcion:
        'Consolidar indicadores de participación, satisfacción, cumplimiento de cronograma y ejecución presupuestal en el informe final de resultados.',
      responsable: 'Talento Humano',
      registroDocumento: 'Indicadores e informe',
      isDecision: false,
      nextTargetId: 'step-20',
    },
    {
      id: 'step-20',
      symbol: 'oval',
      actividad: 'FIN',
      descripcion:
        'Cierre formal del ciclo de ejecución y evaluación del procedimiento de Bienestar Social Laboral, dejando trazabilidad para mejora continua.',
      responsable: 'Talento Humano',
      registroDocumento: 'N/A',
      isDecision: false,
    },
  ],
  planGeneral: PLAN_GENERAL_INITIAL,
  planBienestar: ACTIVIDADES_INICIALES,
  presupuestoGeneral2027: PRESUPUESTO_GENERAL_2027_INITIAL,
  respuestasEncuestas: RESPUESTAS_ENCUESTAS_INICIALES,
  listasAsistencia: LISTAS_ASISTENCIA_INICIALES,
  convenios: CONVENIOS_INICIALES,
  seguimiento: [],
};
