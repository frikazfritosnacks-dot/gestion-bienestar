import { BienestarState } from '../types/bienestar';
import {
  ACTIVIDADES_INICIALES,
  CONVENIOS_INICIALES,
  LISTAS_ASISTENCIA_INICIALES,
  PLAN_GENERAL_INITIAL,
  PRESUPUESTO_GENERAL_2027_INITIAL,
  RESPUESTAS_ENCUESTAS_INICIALES,
} from './planBienestarData';

export const CURRENT_MANUAL_CONTENT_VERSION = 4;

export const INITIAL_BIENESTAR_STATE: BienestarState = {
  manualContentVersion: CURRENT_MANUAL_CONTENT_VERSION,
  lastUpdated: '2026-11-27T10:00:00.000Z',
  manual: {
    portada: {
      empresa: 'Frikaz S.A.S.',
      nombreDocumento: 'Manual del Procedimiento de Bienestar Social Laboral',
      codigoDocumental: 'TH-MBS-01',
      version: '01',
      fechaActualizacion: '27/11/2026',
      areaResponsable: 'Gerencia',
      elaboradoPor: '',
      revisadoPor: '',
      aprobadoPor: '',
    },
    introduccion:
      'El bienestar social laboral constituye un eje estratégico para el desarrollo humano dentro de las organizaciones contemporáneas, al integrar condiciones físicas, emocionales, familiares, sociales y económicas que influyen en la calidad de vida en el trabajo, la motivación cotidiana y la sostenibilidad empresarial. En el caso de Frikaz S.A.S., una organización conformada por 10 colaboradores distribuidos entre las áreas administrativa, operativa y logística, cuidar de manera planificada las condiciones en que se desarrolla la labor diaria resulta fundamental para promover relaciones respetuosas, prevenir el desgaste y consolidar un equipo cohesionado.\n\nDesde una perspectiva institucional y científica, la Organización Mundial de la Salud [OMS] (2010, 2022) ha enfatizado en sus directrices sobre entornos laborales saludables y salud mental en el trabajo que el bienestar laboral depende tanto del ambiente físico seguro como de la gestión participativa de los factores psicosociales, el apoyo organizacional y el fortalecimiento de habilidades personales y financieras. De forma complementaria, el enfoque de desarrollo a escala humana propuesto por Max-Neef, Elizalde y Hopenhayn (1986) sostiene que las personas requieren satisfactores integrales vinculados con la protección, el afecto, el entendimiento, la participación y la identidad, lo que orienta los programas laborales hacia el reconocimiento integral del trabajador como ser humano y miembro de una familia.\n\nLa investigación empírica reciente en el contexto iberoamericano y colombiano respalda esta relación entre gestión humana planificada y resultados positivos compartidos. García-Rubiano et al. (2024) evidenciaron que el clima organizacional actúa como un mediador decisivo entre la disposición de los equipos y el bienestar eudaimónico de los trabajadores, mientras que Mendoza-Vargas, Burbano-Pantoja y Mendoza-Vargas (2022) constataron en una empresa colombiana una asociación directa entre las dimensiones del clima laboral y el desempeño cotidiano. En esa misma línea, Chunga Díaz y Escuza Pasco (2023), a partir de una revisión sistemática, y Rosero-Lasso, Chaucanes-Figueroa y Chavez-Martinez (2025), en un estudio empírico realizado en Colombia, destacaron que el fortalecimiento de la satisfacción laboral y del clima interno favorece el sentido de pertenencia, la comunicación entre áreas y la estabilidad de los equipos de trabajo.\n\nEn el marco normativo colombiano vigente, disposiciones como la Ley 2466 de 2025 (Reforma Laboral) refuerzan la relevancia de garantizar condiciones de trabajo dignas, el respeto por los tiempos de descanso, la equidad y el equilibrio entre la vida laboral, personal y familiar (Congreso de la República de Colombia, 2025). Atender este propósito en una microempresa en crecimiento demanda contar con un instrumento claro, realista y ajustado a la escala de Frikaz S.A.S., en el cual la Gerente lidere directamente la planeación anual a partir de un diagnóstico participativo, optimice los recursos disponibles y evalúe periódicamente el impacto percibido por las personas.\n\nEn consecuencia, el presente Manual del Procedimiento de Bienestar Social Laboral establece los lineamientos, el flujo operativo y los instrumentos de control para diseñar, ejecutar y evaluar actividades alcanzables —como pausas activas, espacios lúdicos, formación financiera, apoyos familiares, desayunos comunitarios, conmemoraciones, flexibilidad horaria y reconocimientos— que generen beneficios mutuos: mejorar el bienestar integral y la calidad de vida de los trabajadores y, al mismo tiempo, fortalecer el compromiso, la productividad responsable y la cultura organizacional de Frikaz S.A.S.',
    objetivoGeneral:
      'Guiar a la gerencia a construir diferentes programas de bienestar social laboral para cada una de las dimensiones personales de los trabajadores, teniendo en cuenta sus necesidades para la estructuración de los programas, así promoviendo la participación de cada uno de los trabajadores de las diferentes áreas de Frikaz S.A.S.',
    objetivoGeneralResponsable: 'Gerente',
    objetivoGeneralFuncion:
      'Liderar, aprobar y supervisar de manera directa el diseño, la planeación anual, la coordinación operativa y la evaluación integral de todos los programas de bienestar social laboral para las áreas administrativa, operativa y logística de Frikaz S.A.S.',
    objetivosEspecificos: [
      {
        id: 'obj-1',
        texto:
          'Diseñar un instrumento diagnóstico para conocer las necesidades de bienestar de los trabajadores en Frikaz S.A.S.',
        responsable: 'Gerente',
        funcionResponsable:
          'Elaborar, aprobar y aplicar una vez al año el instrumento diagnóstico al inicio del ciclo anual para identificar las necesidades, intereses y preferencias de los 10 colaboradores.',
      },
      {
        id: 'obj-2',
        texto:
          'Realizar los programas de bienestar social laboral de acuerdo con las necesidades de los trabajadores, abarcando la dimensión social, mental, física, familiar, económica y emocional.',
        responsable: 'Gerente',
        funcionResponsable:
          'Estructurar el plan anual, programar el cronograma, definir el presupuesto, gestionar posibles apoyos externos y dirigir la ejecución de cada actividad aprobada.',
      },
      {
        id: 'obj-3',
        texto:
          'Aplicar encuesta de satisfacción con el fin de saber si los trabajadores estuvieron satisfechos con los programas y las actividades propuestas.',
        responsable: 'Gerente',
        funcionResponsable:
          'Aplicar las encuestas al finalizar las actividades realizadas, consolidar los resultados y definir ajustes de mejora para el fortalecimiento continuo del plan.',
      },
    ],
    justificacion:
      'El Plan de Bienestar Social Laboral es indispensable para Frikaz S.A.S. porque el funcionamiento diario de una empresa de 10 trabajadores —distribuidos entre labores administrativas, operativas de planta y logística— depende directamente de la disposición, la salud, la coordinación y el compromiso humano de cada integrante. Sin una guía estructurada, las acciones dirigidas al personal corren el riesgo de realizarse de manera aislada, sin responder a necesidades reales ni guardar equilibrio frente a la capacidad financiera de una MiPyme.\n\nImplementar este manual permite transformar buenas intenciones en un procedimiento ordenado, viable y verificable. A través de acciones concretas y sostenibles durante la vigencia 2027, el plan busca aportar progresivamente al fortalecimiento de los siguientes aspectos dentro de Frikaz S.A.S.:\n\n• Clima organizacional: favorecer un ambiente de trabajo respetuoso, cercano y armónico mediante espacios de encuentro como los desayunos comunitarios mensuales y las conmemoraciones internas.\n• Relaciones interpersonales: promover el trato cordial, la empatía y la integración cotidiana entre compañeros de planta, logística y administración mediante pausas activas compartidas, juegos de mesa y celebraciones voluntarias de cumpleaños.\n• Motivación y sentido de pertenencia: fortalecer el vínculo afectivo con la empresa haciendo visibles las fechas significativas, el cuidado mutuo y la escucha periódica de las expectativas del equipo.\n• Reconocimiento al esfuerzo: valorar la dedicación, el cumplimiento y los valores laborales mediante la distinción del Trabajador del Mes con criterios claros y transparentes.\n• Hábitos saludables: incentivar la movilidad corporal, la descarga osteomuscular y el autocuidado cotidiano a través de las pausas activas en los puestos de trabajo.\n• Equilibrio entre la vida laboral, personal y familiar: respaldar el tiempo y bienestar del núcleo familiar mediante la flexibilidad horaria sujeta a autorización operativa y la entrega semestral de bonos familiares.\n• Habilidades personales y sociales: aportar conocimientos útiles para la vida cotidiana y la relación con los demás, especialmente mediante capacitaciones en finanzas personales y espacios participativos de diálogo.\n• Comunicación interna: facilitar canales directos y cercanos entre la Gerencia y los colaboradores para informar actividades, escuchar inquietudes y retroalimentar resultados.\n• Prevención del agotamiento y bienestar emocional: ofrecer respiros breves durante la jornada —como las pausas activas y los encuentros lúdicos semanales— orientados a reducir la tensión acumulada.\n• Participación y compromiso: involucrar activamente al personal desde el diagnóstico anual hasta la evaluación de satisfacción posterior a las actividades, fomentando la corresponsabilidad.\n• Trabajo en equipo: reforzar la cooperación transversal entre las áreas administrativa, operativa y logística en escenarios compartidos fuera de la presión inmediata de la tarea.\n• Satisfacción laboral: contribuir a que los colaboradores perciban interés genuino de la organización por sus necesidades y condiciones humanas de trabajo.\n• Productividad y cumplimiento de objetivos organizacionales: apoyar la estabilidad del equipo, la disposición hacia la calidad y el cumplimiento responsable de las metas de Frikaz S.A.S. en un entorno laboral saludable.\n\nDe este modo, el documento ofrece a la Gerencia un marco práctico y realista que articula el cuidado integral de los 10 colaboradores con la sostenibilidad financiera y operativa de la empresa.',
    alcance:
      'El presente Manual y el Plan de Bienestar Social Laboral aplican a los 10 colaboradores de Frikaz S.A.S. vinculados en las áreas administrativa, operativa y logística, así como a las acciones dirigidas a sus núcleos familiares. Abarca las ocho dimensiones del bienestar y las nueve actividades institucionales definidas para la vigencia del año 2027 (enero a diciembre), desde el diagnóstico anual de necesidades hasta la evaluación de satisfacción y mejora, bajo la conducción y responsabilidad principal de la Gerente.',
  },
  responsablesPlan: {
    cargoPrincipal: 'Gerente',
    alcanceResponsabilidad:
      'En coherencia con la estructura organizacional de Frikaz S.A.S. (10 trabajadores), la Gerente ejerce como única responsable principal de todas las actividades del Plan de Bienestar Social Laboral 2027, asumiendo su planeación, aprobación, ejecución, seguimiento y evaluación integral.',
    responsabilidades: [
      {
        id: 'resp-1',
        numero: 1,
        texto: 'Diagnosticar las necesidades de los trabajadores.',
        apartadoRelacionado: 'Matriz Detallada · Etapa anual de diagnóstico',
      },
      {
        id: 'resp-2',
        numero: 2,
        texto: 'Estructurar los programas de bienestar.',
        apartadoRelacionado: 'Programas de Bienestar · 8 Dimensiones y 9 Fichas',
      },
      {
        id: 'resp-3',
        numero: 3,
        texto: 'Organizar el cronograma anual.',
        apartadoRelacionado: 'Cronograma y Diagrama de Gantt 2027',
      },
      {
        id: 'resp-4',
        numero: 4,
        texto: 'Definir y aprobar el presupuesto.',
        apartadoRelacionado: 'Presupuesto General 2027',
      },
      {
        id: 'resp-5',
        numero: 5,
        texto: 'Coordinar y supervisar la ejecución de cada actividad.',
        apartadoRelacionado: 'Fichas de Actividades y Listas de Asistencia',
      },
      {
        id: 'resp-6',
        numero: 6,
        texto: 'Gestionar posibles convenios o apoyos con entidades externas.',
        apartadoRelacionado: 'Convenios y Alianzas Estratégicas',
      },
      {
        id: 'resp-7',
        numero: 7,
        texto: 'Comunicar e invitar a los trabajadores a participar en las actividades.',
        apartadoRelacionado: 'Matriz Detallada · Convocatoria e Invitaciones',
      },
      {
        id: 'resp-8',
        numero: 8,
        texto: 'Hacer seguimiento al cumplimiento de las acciones programadas.',
        apartadoRelacionado: 'Seguimiento e Indicadores',
      },
      {
        id: 'resp-9',
        numero: 9,
        texto: 'Evaluar los resultados y la satisfacción de los trabajadores.',
        apartadoRelacionado: 'Encuestas de Satisfacción y Consolidado',
      },
      {
        id: 'resp-10',
        numero: 10,
        texto: 'Realizar ajustes o mejoras para fortalecer el plan de bienestar.',
        apartadoRelacionado: 'Plan de Mejora Continua y Cierre Anual',
      },
    ],
  },
  normograma: [
    {
      id: 'norm-1',
      jerarquia: 'Constitución Política',
      nombre:
        'Artículo 25: Derecho al trabajo en condiciones dignas y justas. Artículo 53: Principios mínimos fundamentales del trabajo.',
      afectacion:
        'Garantiza que los trabajadores reciban un trato digno, igualdad de oportunidades, condiciones laborales justas, descanso y protección de sus derechos.',
      queDebeHacer:
        'La empresa debe garantizar condiciones de trabajo dignas y justas, respetar los derechos laborales, promover la igualdad de oportunidades, evitar cualquier tipo de discriminación y fomentar un ambiente laboral basado en el respeto y la protección de los trabajadores.',
    },
    {
      id: 'norm-2',
      jerarquia: 'Ley 9 de 1979',
      nombre: 'Por la cual se dictan medidas sanitarias.',
      afectacion:
        'Influye en las condiciones de higiene, seguridad y salud de los trabajadores de Frikaz S.A.S., especialmente en las áreas de producción, donde se manipulan alimentos, se utilizan equipos y se presentan condiciones de calor y exposición a diferentes factores de riesgo.',
      queDebeHacer:
        'La empresa debe mantener instalaciones limpias, ventiladas y en condiciones adecuadas de higiene y seguridad, garantizar espacios de trabajo seguros, proporcionar los elementos de protección necesarios, realizar actividades de prevención de accidentes y enfermedades laborales y desarrollar capacitaciones sobre higiene, seguridad y autocuidado para proteger la salud de sus trabajadores.',
    },
    {
      id: 'norm-3',
      jerarquia: 'Ley 21 de 1982',
      nombre:
        'Por la cual se modifica el régimen del subsidio familiar y se dictan otras disposiciones.',
      afectacion:
        'Contribuye al bienestar económico y familiar de los trabajadores de Frikaz S.A.S., permitiéndoles acceder a los beneficios ofrecidos por las cajas de compensación familiar, de acuerdo con los requisitos establecidos.',
      queDebeHacer:
        'Realizar los aportes correspondientes a la Caja de Compensación Familiar, facilitar la afiliación de sus trabajadores e informarles sobre los beneficios de recreación, educación, vivienda y subsidios a los que pueden acceder.',
    },
    {
      id: 'norm-4',
      jerarquia: 'Ley 1010 de 2006',
      nombre:
        'Ley 1010 de 2006, por medio de la cual se adoptan medidas para prevenir, corregir y sancionar el acoso laboral y otros hostigamientos en el marco de las relaciones de trabajo.',
      afectacion:
        'Promueve el respeto, la sana convivencia y las buenas relaciones entre los trabajadores. Busca prevenir situaciones de maltrato, persecución, discriminación y comportamientos que puedan afectar el bienestar y el ambiente laboral.',
      queDebeHacer:
        'En Frikaz S.A.S. se deben promover relaciones laborales basadas en el respeto, establecer mecanismos para prevenir y atender posibles situaciones de acoso laboral, informar a los trabajadores sobre sus derechos y contar con un Comité de Convivencia Laboral de acuerdo con las disposiciones aplicables.',
    },
    {
      id: 'norm-5',
      jerarquia: 'Ley 1616 de 2013',
      nombre:
        'Ley 1616 de 2013, por medio de la cual se expide la Ley de Salud Mental y se dictan otras disposiciones, modificada por la Ley 2460 de 2025.',
      afectacion:
        'Promueve el cuidado de la salud mental de los trabajadores, la prevención de situaciones que puedan afectar su bienestar emocional y la creación de ambientes laborales saludables.',
      queDebeHacer:
        'En Frikaz S.A.S. se deben promover actividades que favorezcan la salud mental de sus 10 trabajadores, fomentar el respeto y la buena convivencia, identificar situaciones de estrés laboral y desarrollar espacios de comunicación y acompañamiento que contribuyan al bienestar emocional del equipo.',
    },
    {
      id: 'norm-6',
      jerarquia: 'Ley 1823 de 2017',
      nombre:
        'Por medio de la cual se adopta la estrategia Salas Amigas de la Familia Lactante del Entorno Laboral.',
      afectacion:
        'Permite proteger los derechos de las trabajadoras de Frikaz S.A.S. durante el periodo de lactancia, facilitando condiciones adecuadas para que puedan continuar con esta etapa sin afectar sus derechos laborales.',
      queDebeHacer:
        'Garantizar los tiempos de lactancia establecidos por la ley, brindar condiciones adecuadas a las trabajadoras lactantes y disponer de un espacio apropiado para la extracción y conservación de la leche materna cuando la empresa esté legalmente obligada a contar con él.',
    },
    {
      id: 'norm-7',
      jerarquia: 'Ley 1857',
      nombre: 'Ley 1857 de 2017 - Fortalecimiento y protección de la familia',
      afectacion:
        'Favorece el equilibrio entre la vida laboral y la vida familiar de los trabajadores, promoviendo espacios de interacción con la familia.',
      queDebeHacer:
        'Frikaz S.A.S. debe organizar una jornada semestralmente (dependiendo de las horas que trabajen dentro de la empresa) para que los trabajadores compartan con sus familias y facilitar horarios flexibles cuando corresponda.',
    },
    {
      id: 'norm-8',
      jerarquia: 'Ley 2049 de 2020',
      nombre:
        'Por la cual se crea el Consejo Nacional de Planeación Lingüística de la Lengua de Señas Colombiana (LSC), se fortalece la participación de la población sorda en el ámbito educativo y se dictan otras disposiciones.',
      afectacion:
        'Se relaciona con la inclusión y la igualdad de oportunidades, promoviendo el reconocimiento de las personas sordas y la eliminación de barreras de comunicación. En Frikaz S.A.S. puede servir como referencia para fortalecer la inclusión laboral de personas con discapacidad auditiva.',
      queDebeHacer:
        'La empresa puede promover espacios laborales inclusivos, sensibilizar a sus trabajadores sobre la importancia de respetar las diferencias, facilitar la comunicación con personas sordas mediante herramientas de apoyo y fomentar la igualdad de oportunidades en los procesos de integración y participación laboral.',
    },
    {
      id: 'norm-9',
      jerarquia: 'Ley 2088 de 2021',
      nombre:
        'Por la cual se regula el trabajo en casa y se dictan otras disposiciones.',
      afectacion:
        'Permite que los trabajadores de Frikaz S.A.S. que desempeñan funciones administrativas puedan desarrollar sus actividades desde casa ante situaciones ocasionales, excepcionales o especiales.',
      queDebeHacer:
        'Establecer las condiciones para implementar el trabajo en casa cuando corresponda, especialmente para el personal administrativo, garantizando sus derechos laborales, respetando los horarios y promoviendo el equilibrio entre la vida personal y laboral.',
    },
    {
      id: 'norm-10',
      jerarquia: 'Ley 2101 de 2021',
      nombre:
        'Por medio de la cual se reduce la jornada laboral semanal de manera gradual, sin disminuir el salario de los trabajadores.',
      afectacion:
        'Influye en la organización de los horarios del personal administrativo y operativo de Frikaz S.A.S., permitiendo mejorar los tiempos de descanso y el equilibrio entre las responsabilidades laborales y personales.',
      queDebeHacer:
        'Ajustar los horarios de sus trabajadores para cumplir con la jornada máxima legal de 42 horas semanales, sin reducir sus salarios, organizando los turnos de producción y garantizando los espacios de descanso correspondientes.',
    },
    {
      id: 'norm-11',
      jerarquia: 'Ley 2191 de 2022',
      nombre:
        'Ley 2191 de 2022, por medio de la cual se regula la desconexión laboral.',
      afectacion:
        'Establece el respeto por los horarios de trabajo y los tiempos de descanso de los trabajadores, favoreciendo el equilibrio entre la vida laboral, personal y familiar. Contribuye al bienestar y a un ambiente laboral saludable.',
      queDebeHacer:
        'En Frikaz S.A.S. se debe establecer una política de desconexión laboral, respetar los horarios de trabajo de sus 10 trabajadores, evitar solicitar actividades laborales durante sus descansos, vacaciones o permisos y establecer un medio para recibir y atender quejas cuando no se respete este derecho.',
    },
    {
      id: 'norm-12',
      jerarquia: 'Ley 2365 de 2024',
      nombre:
        'Por medio de la cual se adoptan medidas de prevención, protección y atención del acoso sexual en el ámbito laboral y en las instituciones de educación superior en Colombia.',
      afectacion:
        'Permite garantizar que los trabajadores de Frikaz S.A.S. desarrollen sus actividades en un ambiente seguro, respetuoso y libre de situaciones de acoso sexual.',
      queDebeHacer:
        'Establecer protocolos para prevenir y atender situaciones de acoso sexual, habilitar canales de denuncia, realizar campañas de sensibilización, proteger la confidencialidad de las personas involucradas y garantizar que no existan represalias contra quienes denuncien.',
    },
    {
      id: 'norm-13',
      jerarquia: 'Ley 2466 de 2025',
      nombre: 'Ley 2466 de 2025 – Reforma Laboral',
      afectacion:
        'Influye en el bienestar de los trabajadores porque promueve condiciones laborales más dignas, el respeto de sus derechos, el equilibrio entre la vida personal y laboral y la protección de su calidad de vida. Esto hace necesario que Frikaz S.A.S. tenga en cuenta las necesidades de sus colaboradores y procure mantener un ambiente de trabajo saludable, respetuoso y equitativo.',
      queDebeHacer:
        'Frikaz S.A.S. debería fortalecer sus programas de bienestar social laboral mediante actividades de integración, reconocimiento, motivación y acompañamiento a los trabajadores. Asimismo, debería promover un ambiente laboral basado en el respeto, la igualdad y la sana convivencia, teniendo en cuenta las necesidades de sus colaboradores y revisando sus prácticas internas para adaptarse a las disposiciones de la reforma laboral.',
    },
    {
      id: 'norm-14',
      jerarquia: 'Decreto 1072 de 2015',
      nombre:
        'Decreto 1072 de 2015, por medio del cual se expide el Decreto Único Reglamentario del Sector Trabajo.',
      afectacion:
        'Establece disposiciones relacionadas con la protección de la salud, la seguridad y las condiciones laborales de los trabajadores. También promueve la prevención de riesgos laborales, el cuidado de la salud y el mejoramiento del ambiente de trabajo, aspectos que contribuyen al bienestar de los trabajadores.',
      queDebeHacer:
        'En Frikaz S.A.S. se debe mantener el Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), realizar actividades de prevención de riesgos, promover el cuidado de la salud de sus 10 trabajadores, identificar las condiciones que puedan afectar su bienestar y desarrollar actividades que favorezcan un ambiente laboral seguro y saludable.',
    },
    {
      id: 'norm-15',
      jerarquia: 'Decreto 1085',
      nombre:
        'Por medio del cual se expide el Decreto Único Reglamentario del Sector Administrativo del Deporte.',
      afectacion:
        'Se relaciona con el bienestar de los trabajadores porque contempla aspectos relacionados con el deporte, la recreación, la actividad física y el aprovechamiento del tiempo libre, que pueden servir como referencia para promover hábitos saludables y espacios de integración en Frikaz S.A.S.',
      queDebeHacer:
        'La empresa puede implementar jornadas deportivas, actividades recreativas, pausas activas y espacios de integración que promuevan la actividad física, el aprovechamiento del tiempo libre y el bienestar de sus trabajadores. Este decreto regula específicamente el sector administrativo del deporte, por lo que no establece una obligación directa de bienestar laboral para Frikaz S.A.S.',
    },
    {
      id: 'norm-16',
      jerarquia: 'Decreto 1567 de 1998',
      nombre: 'Decreto 1567 de 1998 – Sistema de Capacitación y Estímulos',
      afectacion:
        'Establece el Sistema Nacional de Capacitación y el Sistema de Estímulos para los empleados del Estado. Busca promover el desarrollo personal y laboral de los trabajadores mediante programas de capacitación, bienestar social, incentivos y reconocimiento.',
      queDebeHacer:
        'Frikaz S.A.S. podría tomar como referencia los lineamientos de este decreto para desarrollar un programa de bienestar que incluya actividades de integración, capacitaciones, incentivos, reconocimiento al buen desempeño y espacios de participación para los trabajadores. Además, debería identificar las necesidades de sus colaboradores y evaluar periódicamente las actividades realizadas para contribuir a su satisfacción y desarrollo dentro de la organización.',
    },
    {
      id: 'norm-17',
      jerarquia: 'Resolución 0312 de 2019',
      nombre:
        'Resolución 0312 de 2019 – Estándares Mínimos del Sistema de Gestión de Seguridad y Salud en el Trabajo.',
      afectacion:
        'Establece los requisitos mínimos que deben cumplir las empresas para proteger la seguridad y salud de los trabajadores, prevenir accidentes y enfermedades laborales y garantizar ambientes de trabajo seguros.',
      queDebeHacer:
        'Frikaz S.A.S. debe implementar el SG-SST, identificar y controlar los riesgos laborales, capacitar a los trabajadores, realizar actividades de prevención, evaluar las condiciones de trabajo y hacer seguimiento a la salud de los empleados.',
    },
    {
      id: 'norm-18',
      jerarquia: 'Resolución 2764 de 2022',
      nombre:
        'Por la cual se adopta la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial, la Guía Técnica General para la Promoción, Prevención e Intervención de los Factores Psicosociales y sus efectos en la población trabajadora y sus protocolos específicos.',
      afectacion:
        'En Frikaz S.A.S. permite identificar y evaluar los factores de riesgo psicosocial que pueden afectar a los trabajadores, como el estrés, las cargas laborales, las relaciones interpersonales y las condiciones del entorno de trabajo. Sus resultados permiten establecer actividades de bienestar y estrategias para mejorar el ambiente laboral.',
      queDebeHacer:
        'La empresa debe aplicar la Batería de Instrumentos para la Evaluación de Factores de Riesgo Psicosocial de acuerdo con las condiciones y periodicidad establecidas en la normativa, garantizar la confidencialidad de la información de los trabajadores y desarrollar planes de intervención y prevención según los resultados obtenidos, realizando seguimiento a los factores de riesgo identificados.',
    },
    {
      id: 'norm-19',
      jerarquia: 'Resolución 2646 de 2008',
      nombre:
        'Resolución 2646 de 2008 – Factores de riesgo psicosocial en el trabajo.',
      afectacion:
        'Establece responsabilidades para identificar, evaluar, prevenir e intervenir factores de riesgo psicosocial, como el estrés, la sobrecarga laboral y los problemas en las relaciones entre compañeros.',
      queDebeHacer:
        'Permite a Frikaz S.A.S. evaluar los riesgos psicosociales, identificar las situaciones que afectan a los trabajadores, implementar medidas de prevención y realizar seguimiento a las condiciones laborales.',
    },
    {
      id: 'norm-20',
      jerarquia: 'Resolución 3461',
      nombre:
        'Disposiciones para la conformación y funcionamiento del Comité de Convivencia Laboral',
      afectacion:
        'Promueve un ambiente laboral saludable, previene el acoso laboral y fortalece las relaciones interpersonales, la convivencia y la salud mental de los trabajadores.',
      queDebeHacer:
        'Frikaz S.A.S. debe conformar el Comité de Convivencia Laboral, establecer mecanismos confidenciales para recibir las quejas, realizar actividades de integración y capacitación sobre la comunicación asertiva y la resolución de conflictos.',
    },
  ],
  terminologia: [
    {
      id: 'term-1',
      termino: 'Bienestar',
      definicion:
        'Estado integral de equilibrio físico, mental, emocional y social que permite a una persona desarrollar sus capacidades y alcanzar una vida satisfactoria.',
    },
    {
      id: 'term-2',
      termino: 'Plenitud',
      definicion:
        'Sensación de realización y satisfacción profunda que surge al encontrar significado y coherencia en las experiencias de vida.',
    },
    {
      id: 'term-3',
      termino: 'Armonía',
      definicion:
        'Equilibrio entre las diferentes dimensiones de la vida, que permite mantener relaciones saludables consigo mismo, con los demás y con el entorno.',
    },
    {
      id: 'term-4',
      termino: 'Resiliencia',
      definicion:
        'Capacidad de afrontar situaciones adversas, adaptarse a los cambios y recuperarse de experiencias difíciles.',
    },
    {
      id: 'term-5',
      termino: 'Autocuidado',
      definicion:
        'Conjunto de acciones conscientes orientadas a proteger la salud, preservar el equilibrio personal y mejorar la calidad de vida.',
    },
    {
      id: 'term-6',
      termino: 'Autoconocimiento',
      definicion:
        'Proceso de identificación y comprensión de las propias emociones, pensamientos, capacidades, valores y limitaciones.',
    },
    {
      id: 'term-7',
      termino: 'Autoestima',
      definicion:
        'Valoración que una persona tiene de sí misma y reconocimiento de su propia dignidad, capacidades y cualidades.',
    },
    {
      id: 'term-8',
      termino: 'Empatía',
      definicion:
        'Capacidad de comprender las emociones y perspectivas de otras personas, reconociendo sus experiencias y necesidades.',
    },
    {
      id: 'term-9',
      termino: 'Serenidad',
      definicion:
        'Estado de tranquilidad interior que permite afrontar situaciones cotidianas con calma, claridad y equilibrio emocional.',
    },
    {
      id: 'term-10',
      termino: 'Eudaimonía',
      definicion:
        'Concepto filosófico que representa el florecimiento humano mediante el desarrollo de las virtudes, las capacidades y una vida con propósito.',
    },
    {
      id: 'term-11',
      termino: 'Autorrealización',
      definicion:
        'Proceso de desarrollo del potencial individual mediante el cumplimiento de objetivos y la construcción de una vida significativa.',
    },
    {
      id: 'term-12',
      termino: 'Autonomía',
      definicion:
        'Capacidad de tomar decisiones libres y conscientes, asumiendo la responsabilidad sobre las propias acciones.',
    },
    {
      id: 'term-13',
      termino: 'Gratitud',
      definicion:
        'Reconocimiento y valoración de las experiencias, oportunidades y relaciones positivas presentes en la vida.',
    },
    {
      id: 'term-14',
      termino: 'Equilibrio emocional',
      definicion:
        'Capacidad de gestionar las emociones de manera adecuada, manteniendo estabilidad frente a las situaciones cotidianas.',
    },
    {
      id: 'term-15',
      termino: 'Inteligencia emocional',
      definicion:
        'Habilidad para reconocer, comprender y regular las propias emociones, así como interpretar las emociones de los demás.',
    },
    {
      id: 'term-16',
      termino: 'Compasión',
      definicion:
        'Disposición para reconocer el sufrimiento ajeno y actuar con sensibilidad, comprensión y voluntad de ayudar.',
    },
    {
      id: 'term-17',
      termino: 'Autocompasión',
      definicion:
        'Capacidad de tratarse con amabilidad y comprensión ante los errores, dificultades y experiencias dolorosas.',
    },
    {
      id: 'term-18',
      termino: 'Vitalidad',
      definicion:
        'Estado de energía, dinamismo y disposición física y mental para desarrollar las actividades cotidianas.',
    },
    {
      id: 'term-19',
      termino: 'Propósito de vida',
      definicion:
        'Sentido de dirección que orienta las decisiones, metas y acciones hacia objetivos considerados significativos.',
    },
    {
      id: 'term-20',
      termino: 'Felicidad',
      definicion:
        'Estado subjetivo de satisfacción y bienestar asociado con experiencias positivas, realización personal y valoración de la propia vida.',
    },
    {
      id: 'term-21',
      termino: 'Paz interior',
      definicion:
        'Condición de tranquilidad y aceptación personal que permite mantener estabilidad ante las dificultades y la incertidumbre.',
    },
    {
      id: 'term-22',
      termino: 'Florecimiento humano',
      definicion:
        'Proceso mediante el cual una persona desarrolla sus capacidades, fortalezas y potencialidades para alcanzar una vida plena.',
    },
    {
      id: 'term-23',
      termino: 'Mindfulness',
      definicion:
        'Práctica de atención plena que consiste en reconocer y observar conscientemente las experiencias del momento presente.',
    },
    {
      id: 'term-24',
      termino: 'Autodeterminación',
      definicion:
        'Capacidad de orientar la propia vida mediante decisiones independientes, conscientes y coherentes con los valores personales.',
    },
    {
      id: 'term-25',
      termino: 'Satisfacción personal',
      definicion:
        'Percepción de conformidad y realización respecto a las experiencias, decisiones y logros alcanzados.',
    },
    {
      id: 'term-26',
      termino: 'Convivencia',
      definicion:
        'Capacidad de relacionarse con otras personas mediante el respeto, la tolerancia, la comunicación y la cooperación.',
    },
    {
      id: 'term-27',
      termino: 'Solidaridad',
      definicion:
        'Disposición para brindar apoyo y colaborar con otras personas, reconociendo sus necesidades y dificultades.',
    },
    {
      id: 'term-28',
      termino: 'Inclusión',
      definicion:
        'Principio que garantiza la participación y el reconocimiento de todas las personas, respetando sus diferencias y particularidades.',
    },
    {
      id: 'term-29',
      termino: 'Equidad',
      definicion:
        'Principio de justicia que reconoce las necesidades individuales y busca proporcionar oportunidades y condiciones adecuadas para todos.',
    },
    {
      id: 'term-30',
      termino: 'Cohesión social',
      definicion:
        'Grado de integración, confianza y cooperación que fortalece los vínculos entre los integrantes de una comunidad.',
    },
    {
      id: 'term-31',
      termino: 'Sentido de pertenencia',
      definicion:
        'Vínculo emocional que permite sentirse identificado, aceptado y reconocido dentro de un grupo o comunidad.',
    },
    {
      id: 'term-32',
      termino: 'Prosocialidad',
      definicion:
        'Conjunto de comportamientos voluntarios orientados a beneficiar a otras personas mediante acciones de ayuda, cooperación y generosidad.',
    },
    {
      id: 'term-33',
      termino: 'Comunicación asertiva',
      definicion:
        'Capacidad de expresar ideas, opiniones y sentimientos de manera clara, respetuosa y oportuna.',
    },
    {
      id: 'term-34',
      termino: 'Reciprocidad',
      definicion:
        'Principio de interacción basado en el intercambio mutuo de apoyo, respeto, colaboración y reconocimiento.',
    },
    {
      id: 'term-35',
      termino: 'Dignidad humana',
      definicion:
        'Valor inherente a toda persona que fundamenta el respeto por su integridad, libertad y derechos.',
    },
    {
      id: 'term-36',
      termino: 'Motivación',
      definicion:
        'Conjunto de factores internos y externos que impulsan a una persona a actuar, alcanzar objetivos y superar dificultades.',
    },
    {
      id: 'term-37',
      termino: 'Esperanza',
      definicion:
        'Actitud orientada hacia la posibilidad de alcanzar resultados positivos y construir mejores condiciones en el futuro.',
    },
    {
      id: 'term-38',
      termino: 'Optimismo',
      definicion:
        'Disposición para interpretar las situaciones desde una perspectiva favorable y mantener expectativas positivas frente al futuro.',
    },
    {
      id: 'term-39',
      termino: 'Adaptabilidad',
      definicion:
        'Capacidad de modificar comportamientos, pensamientos y estrategias para responder adecuadamente a nuevas circunstancias.',
    },
    {
      id: 'term-40',
      termino: 'Equilibrio',
      definicion:
        'Estado de estabilidad entre diferentes necesidades, responsabilidades y dimensiones de la vida.',
    },
    {
      id: 'term-41',
      termino: 'Calidad de vida',
      definicion:
        'Percepción del bienestar general considerando las condiciones de salud, seguridad, relaciones, oportunidades y satisfacción personal.',
    },
    {
      id: 'term-42',
      termino: 'Salud mental',
      definicion:
        'Estado de bienestar psicológico que permite afrontar las tensiones cotidianas, desarrollar capacidades y participar activamente en la sociedad.',
    },
    {
      id: 'term-43',
      termino: 'Autoconfianza',
      definicion:
        'Seguridad que una persona desarrolla respecto a sus capacidades y habilidades para enfrentar desafíos y tomar decisiones.',
    },
    {
      id: 'term-44',
      termino: 'Generosidad',
      definicion:
        'Disposición para compartir recursos, conocimientos, tiempo y experiencias con otras personas sin esperar necesariamente una recompensa.',
    },
    {
      id: 'term-45',
      termino: 'Trascendencia',
      definicion:
        'Orientación de la existencia hacia propósitos y acciones que superan los intereses individuales y contribuyen al bienestar colectivo.',
    },
    {
      id: 'term-46',
      termino: 'Integridad',
      definicion:
        'Coherencia entre los valores, principios, pensamientos y comportamientos de una persona.',
    },
    {
      id: 'term-47',
      termino: 'Perseverancia',
      definicion:
        'Capacidad de mantener el esfuerzo y el compromiso frente a los obstáculos hasta alcanzar un objetivo.',
    },
    {
      id: 'term-48',
      termino: 'Vulnerabilidad',
      definicion:
        'Condición de susceptibilidad ante situaciones que pueden afectar el bienestar físico, emocional o social.',
    },
    {
      id: 'term-49',
      termino: 'Autenticidad',
      definicion:
        'Capacidad de actuar de acuerdo con la propia identidad, convicciones y valores, sin perder la coherencia personal.',
    },
    {
      id: 'term-50',
      termino: 'Fluidez emocional',
      definicion:
        'Capacidad de reconocer, aceptar y transitar las emociones sin quedar permanentemente condicionado por ellas.',
    },
  ],
  matrizMeta: {
    empresa: 'Frikaz S.A.S.',
    codigo: 'TH-MDB-01',
    version: '01',
    fecha: '27/11/2026',
    responsable: 'Gerente',
    objetivo:
      'Estandarizar paso a paso la planificación, aprobación, ejecución, seguimiento y evaluación del Procedimiento de Bienestar Social Laboral en Frikaz S.A.S., bajo la conducción directa de la Gerente.',
  },
  proceso: [
    {
      id: 'step-1',
      symbol: 'oval',
      actividad: 'Inicio',
      descripcion:
        'Al comenzar la vigencia anual, la Gerente da apertura formal al ciclo del Plan de Bienestar Social Laboral revisando el manual vigente, los objetivos y las normas aplicables, y habilita los formatos de registro para organizar las actividades de los 10 trabajadores de las áreas administrativa, operativa y logística.',
      responsable: 'Gerente',
      registroDocumento: 'Manual vigente',
      isDecision: false,
      nextTargetId: 'step-2',
    },
    {
      id: 'step-2',
      symbol: 'document',
      actividad: 'Diseñar y aplicar diagnóstico anual de necesidades',
      descripcion:
        'Una vez al año, al inicio de la planeación anual, la Gerente elabora y aplica un cuestionario breve y confidencial a los 10 trabajadores de Frikaz S.A.S. (no mensualmente ni después de cada jornada) para conocer sus necesidades, intereses y preferencias en las dimensiones física, mental, financiera, familiar, social, de horarios, incentivos y reconocimientos.',
      responsable: 'Gerente',
      registroDocumento: 'Instrumento diagnóstico anual',
      isDecision: false,
      nextTargetId: 'step-3',
    },
    {
      id: 'step-3',
      symbol: 'document',
      actividad: 'Recolección y tabulación del diagnóstico anual',
      descripcion:
        'Tras la aplicación anual única, la Gerente recopila los cuestionarios diligenciados, verifica la participación del personal convocado y organiza las respuestas en una matriz de tabulación por área y dimensión, asegurando datos completos y depurados para la planeación del año.',
      responsable: 'Gerente',
      registroDocumento: 'Matriz de tabulación anual',
      isDecision: false,
      nextTargetId: 'step-4',
    },
    {
      id: 'step-4',
      symbol: 'cylinder',
      actividad: 'Elaborar informe de resultados del diagnóstico anual',
      descripcion:
        'Con la información tabulada una vez al año, la Gerente analiza las prioridades de los 10 colaboradores, redacta el informe diagnóstico y guarda el consolidado en la base de datos. Con este insumo verifica qué actividades requieren mantenerse o ajustarse antes de estructurar el plan anual.',
      responsable: 'Gerente',
      registroDocumento: 'Informe diagnóstico anual y base de datos',
      isDecision: false,
      nextTargetId: 'step-5',
    },
    {
      id: 'step-5',
      symbol: 'document',
      actividad: 'Definir programas, actividades e incentivos',
      descripcion:
        'Con base en el diagnóstico anual, la Gerente estructura las actividades de Frikaz S.A.S. (pausas activas, juegos de mesa, capacitaciones financieras, bonos familiares, desayunos comunitarios, celebraciones del Día de la Mujer y del Hombre, flexibilidad de horarios sujeta a autorización y necesidad operativa, cumpleaños autogestionados y Trabajador del Mes), precisando objetivos, metodología y criterios.',
      responsable: 'Gerente',
      registroDocumento: 'Plan de Bienestar 2027',
      isDecision: false,
      nextTargetId: 'step-6',
    },
    {
      id: 'step-6',
      symbol: 'diamond',
      actividad: '¿Los programas son aprobados?',
      descripcion:
        'La Gerente evalúa formalmente la propuesta del Plan de Bienestar verificando que responda al diagnóstico anual, cubra equitativamente a las áreas administrativa, operativa y logística y sea viable dentro de la escala de la empresa. Si cumple, se pasa al cronograma; si requiere cambios, se ajusta la propuesta.',
      responsable: 'Gerente',
      registroDocumento: 'Acta de revisión de programas',
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
        'La Gerente corrige los objetivos, alcances o metodologías de las actividades observadas, verificando que la versión actualizada conserve coherencia con las necesidades del equipo y con los recursos internos disponibles antes de aprobarla.',
      responsable: 'Gerente',
      registroDocumento: 'Plan de Bienestar ajustado',
      isDecision: false,
      isAdjustment: true,
      nextTargetId: 'step-6',
    },
    {
      id: 'step-8',
      symbol: 'rectangle',
      actividad: 'Elaborar cronograma',
      descripcion:
        'La Gerente asigna fechas, frecuencias, horarios y espacios internos en el calendario anual 2027 (pausas activas diarias, juegos de mesa semanales, desayunos y Trabajador del Mes mensuales, finanzas trimestrales, bonos semestrales y fechas especiales), coordinando los turnos de planta, logística y administración sin afectar la operación.',
      responsable: 'Gerente',
      registroDocumento: 'Cronograma y Gantt 2027',
      isDecision: false,
      nextTargetId: 'step-9',
    },
    {
      id: 'step-9',
      symbol: 'diamond',
      actividad: '¿El cronograma es aprobado?',
      descripcion:
        'La Gerente valida que las fechas y horarios programados no interfieran con picos operativos ni excluyan turnos, y verifica las condiciones para otorgar flexibilidad horaria según necesidad operativa. Si es viable, se aprueba el cronograma; si hay cruces, se reprograman las fechas.',
      responsable: 'Gerente',
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
        'La Gerente reubica fechas u horarios en el calendario anual consultando la carga de producción, entregas logísticas y labores administrativas, verificando que todas las actividades mantengan su frecuencia y cobertura para los 10 trabajadores.',
      responsable: 'Gerente',
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
        'La Gerente consolida los costos unitarios y totales de guías de pausas activas, juegos reutilizables, cartillas financieras, bonos familiares, desayunos comunitarios, detalles conmemorativos y reconocimientos del Trabajador del Mes (manteniendo sin gasto directo empresarial la flexibilidad horaria y cumpleaños voluntarios), revisando posibles apoyos externos gratuitos.',
      responsable: 'Gerente',
      registroDocumento: 'Presupuesto General 2027',
      isDecision: false,
      nextTargetId: 'step-12',
    },
    {
      id: 'step-12',
      symbol: 'diamond',
      actividad: '¿El presupuesto es aprobado?',
      descripcion:
        'La Gerente revisa la disponibilidad financiera real de Frikaz S.A.S. para autorizar la ejecución de los rubros propuestos —incluidos bonos, desayunos y reconocimientos del Trabajador del Mes sujetos a aprobación presupuestal—. Si se aprueba, se avanza a la organización operativa; si no, se optimizan rubros.',
      responsable: 'Gerente',
      registroDocumento: 'Presupuesto aprobado por Gerencia',
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
        'La Gerente revisa cantidades, cotizaciones y opciones de apoyo con entidades externas como Caja de Compensación, SENA o ARL para ajustar los gastos a la capacidad financiera de la MiPyme sin desvirtuar el propósito de las actividades.',
      responsable: 'Gerente',
      registroDocumento: 'Presupuesto ajustado',
      isDecision: false,
      isAdjustment: true,
      nextTargetId: 'step-12',
    },
    {
      id: 'step-14',
      symbol: 'cylinder',
      actividad: 'Organizar recursos, apoyos y logística',
      descripcion:
        'Con el presupuesto aprobado, la Gerente prepara los materiales requeridos en sede (guías, juegos, cartillas, bonos o alimentos), verifica las condiciones de seguridad e higiene del espacio y gestiona las consultas de convenios o apoyos externos cuando aplique, registrando el estado en la base de datos.',
      responsable: 'Gerente',
      registroDocumento: 'Base de datos de recursos y convenios',
      isDecision: false,
      nextTargetId: 'step-15',
    },
    {
      id: 'step-15',
      symbol: 'cylinder',
      actividad: 'Establecer participantes',
      descripcion:
        'La Gerente actualiza el listado de los 10 trabajadores activos de las áreas administrativa, operativa y logística y define los convocados a cada jornada (y sus familias cuando aplique, como en los bonos semestrales), verificando criterios objetivos de equidad y disponibilidad de turnos.',
      responsable: 'Gerente',
      registroDocumento: 'Listado de participantes convocados',
      isDecision: false,
      nextTargetId: 'step-16',
    },
    {
      id: 'step-16',
      symbol: 'document',
      actividad: 'Enviar invitaciones',
      descripcion:
        'Dentro de la jornada laboral y con la debida anticipación, la Gerente comunica a los colaboradores la fecha, horario, lugar, objetivo y recomendaciones de cada actividad o beneficio (incluyendo las condiciones para solicitar flexibilidad horaria o participar en celebraciones), verificando que todo el personal quede enterado.',
      responsable: 'Gerente',
      registroDocumento: 'Invitaciones y comunicados internos',
      isDecision: false,
      nextTargetId: 'step-17',
    },
    {
      id: 'step-17',
      symbol: 'document',
      actividad: 'Ejecutar los programas de bienestar',
      descripcion:
        'En las fechas programadas, la Gerente coordina y supervisa el desarrollo de cada actividad en un entorno respetuoso, seguro e higiénico: guía o verifica pausas activas, habilita juegos de mesa, desarrolla capacitaciones financieras, entrega bonos y reconocimientos aprobados, facilita desayunos, conmemora fechas especiales y autoriza flexibilidad horaria o espacios de cumpleaños.',
      responsable: 'Gerente',
      registroDocumento: 'Plan de Bienestar y actas de ejecución',
      isDecision: false,
      nextTargetId: 'step-18',
    },
    {
      id: 'step-18',
      symbol: 'document',
      actividad: 'Aplicar encuesta de satisfacción y registro',
      descripcion:
        'Después de realizar las actividades del plan, la Gerente diligencia o recopila la lista de asistencia firmada, conserva las evidencias fotográficas y aplica la encuesta de satisfacción confidencial (en línea o impresa) para conocer la percepción, utilidad y sugerencias de los trabajadores sobre la actividad realizada.',
      responsable: 'Gerente',
      registroDocumento: 'Lista de asistencia, encuesta de satisfacción y evidencias',
      isDecision: false,
      nextTargetId: 'step-19',
    },
    {
      id: 'step-19',
      symbol: 'document',
      actividad: 'Elaborar informes de resultados',
      descripcion:
        'La Gerente consolida las respuestas de satisfacción, calcula los indicadores de asistencia, cumplimiento del cronograma y ejecución presupuestal real, y documenta oportunidades de mejora para ajustar futuras jornadas o el plan del siguiente año, verificando consistencia con los soportes archivados.',
      responsable: 'Gerente',
      registroDocumento: 'Informe de resultados y plan de mejora',
      isDecision: false,
      nextTargetId: 'step-20',
    },
    {
      id: 'step-20',
      symbol: 'oval',
      actividad: 'FIN',
      descripcion:
        'Al finalizar el periodo anual 2027, la Gerente confirma el cierre de las actividades programadas y verifica el archivo ordenado de cronogramas, presupuestos aprobados, listas de asistencia, encuestas de satisfacción e informes, dejando la trazabilidad completa para el próximo diagnóstico anual.',
      responsable: 'Gerente',
      registroDocumento: 'Archivo anual del Plan de Bienestar',
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
