import { BienestarState } from '../types/bienestar';
import {
  ACTIVIDADES_INICIALES,
  CONVENIOS_INICIALES,
  LISTAS_ASISTENCIA_INICIALES,
  PLAN_GENERAL_INITIAL,
  PRESUPUESTO_GENERAL_2027_INITIAL,
  RESPUESTAS_ENCUESTAS_INICIALES,
} from './planBienestarData';

export const CURRENT_MANUAL_CONTENT_VERSION = 3;

export const INITIAL_BIENESTAR_STATE: BienestarState = {
  manualContentVersion: CURRENT_MANUAL_CONTENT_VERSION,
  lastUpdated: '2026-11-26T10:00:00.000Z',
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
      'El presente Manual de Procedimientos de Bienestar Social Laboral de Frikaz S.A.S. tiene como propósito establecer los lineamientos y procedimientos necesarios para planificar, desarrollar y evaluar actividades orientadas al bienestar integral de los trabajadores, teniendo en cuenta sus necesidades personales, familiares, sociales y laborales.\n\nEl Bienestar Social Laboral se define como el conjunto de programas, estrategias y actividades que buscan mejorar la calidad de vida de los trabajadores, promoviendo su desarrollo personal, social y profesional, así como condiciones que favorezcan su satisfacción, motivación e integración dentro de la organización. Su finalidad es fortalecer las relaciones interpersonales, el sentido de pertenencia, el clima laboral y el equilibrio entre la vida personal y laboral.\n\nDe acuerdo con Max-Neef, Elizalde y Hopenhayn (1986), las necesidades humanas fundamentales comprenden aspectos como el afecto, la participación, la protección, la identidad y el entendimiento, lo que permite reconocer la importancia de atender al trabajador desde una perspectiva integral. Asimismo, la Organización Mundial de la Salud (2010) señala que los entornos laborales saludables deben promover y proteger la salud, la seguridad y el bienestar de los trabajadores, considerando tanto las condiciones físicas como los aspectos psicosociales del ambiente laboral.\n\nEn este sentido, el Manual de Bienestar Social Laboral de Frikaz S.A.S. se convierte en una herramienta de apoyo para la Gestión del Talento Humano, ya que permite organizar y estandarizar las actividades dirigidas a los colaboradores, estableciendo objetivos, responsables y mecanismos de seguimiento. Además, facilita la identificación de las necesidades del personal y la implementación de acciones que respondan a ellas.\n\nDe esta manera, se busca fortalecer una cultura organizacional basada en el respeto, la participación, la equidad y el reconocimiento, comprendiendo que el bienestar de los trabajadores no solo favorece su calidad de vida, sino que también contribuye al compromiso, la productividad y el crecimiento de la organización.',
    objetivoGeneral:
      'Guiar a la gerencia a construir diferentes programas de bienestar social laboral para cada una de las dimensiones personales de los trabajadores, teniendo en cuenta sus necesidades para la estructuración de los programas, así promoviendo la participación de cada uno de los trabajadores de las diferentes áreas de Frikaz S.A.S.',
    objetivosEspecificos: [
      {
        id: 'obj-1',
        texto:
          'Diseñar un instrumento diagnóstico para conocer las necesidades de bienestar de los trabajadores en Frikaz S.A.S.',
      },
      {
        id: 'obj-2',
        texto:
          'Realizar los programas de bienestar social laboral de acuerdo con las necesidades de los trabajadores, abarcando la dimensión social, mental, física, familiar, económica y emocional.',
      },
      {
        id: 'obj-3',
        texto:
          'Aplicar encuesta de satisfacción con el fin de saber si los trabajadores estuvieron satisfechos con los programas y las actividades propuestas.',
      },
    ],
    justificacion:
      'El manual de procedimiento de bienestar social laboral se realiza porque los trabajadores son una parte fundamental de Frikaz S.A.S. y es importante tener en cuenta su bienestar, motivación y satisfacción dentro de la empresa. Además contar con un buen ambiente laboral ayuda a fortalecer las relaciones entre compañeros y a mejorar el trabajo en equipo.\n\nEste manual tiene como finalidad organizar las actividades de bienestar, como celebraciones de fechas especiales, espacios de integración, recreación y reconocimiento de los trabajadores. De esta manera, se busca fomentar la unión, mejorar el ambiente laboral y lograr que los trabajadores se sientan valorados y motivados en Frikaz S.A.S.',
    alcance:
      'El presente Manual de Bienestar al trabajador aplica a todos los colaboradores sin importar el cargo o el área de trabajo, por lo cual incluye al personal administrativo, operativos y logísticos. Su finalidad es establecer una guía con unos lineamientos correspondientes y actividades orientadas a mejorar la vida laboral del trabajador dentro y fuera de las instalaciones, esto contribuyendo al desarrollo profesional y personal de los trabajadores.\n\nEste manual contiene acciones de integración, reconocimientos, programas de bienestar, desarrollo personal, bienestar físico, mental y social, esto de acuerdo a las necesidades de cada colaborador que pertenece a la organización. Así mismo busca fomentar el sentido de pertenencia, el trabajo en equipo y sobre todo el compromiso con los objetivos organizacionales, contribuyendo al clima laboral y al crecimiento de Frikaz S.A.S.',
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
    fecha: '13/11/2026',
    responsable: 'Gestión del Talento Humano',
    objetivo:
      'Estandarizar paso a paso la planificación, aprobación, ejecución, seguimiento y evaluación del Procedimiento de Bienestar Social Laboral en Frikaz S.A.S.',
  },
  proceso: [
    {
      id: 'step-1',
      symbol: 'oval',
      actividad: 'Inicio',
      descripcion:
        'Talento Humano da apertura formal al ciclo anual del procedimiento revisando el Manual vigente, confirmando los objetivos y habilitando la ruta documental para iniciar la fase de diagnóstico con cobertura en todas las áreas.',
      responsable: 'Talento Humano',
      registroDocumento: 'N/A',
      isDecision: false,
      nextTargetId: 'step-2',
    },
    {
      id: 'step-2',
      symbol: 'document',
      actividad: 'Diseñar y aplicar diagnóstico de necesidades',
      descripcion:
        'Talento Humano elabora el instrumento diagnóstico con preguntas sobre las dimensiones social, mental, física, familiar, económica y emocional, y lo distribuye al personal administrativo, operativo y logístico en horarios adecuados. Se busca recoger información representativa y confidencial sobre sus necesidades reales.',
      responsable: 'Talento Humano',
      registroDocumento: 'Instrumento diagnóstico',
      isDecision: false,
      nextTargetId: 'step-3',
    },
    {
      id: 'step-3',
      symbol: 'document',
      actividad: 'Recolección y tabulación del diagnóstico',
      descripcion:
        'Talento Humano recopila los cuestionarios diligenciados, verifica que correspondan al total del personal convocado y organiza las respuestas en una matriz de tabulación. Con esto se asegura contar con datos depurados y clasificados por área y dimensión.',
      responsable: 'Talento Humano',
      registroDocumento: 'Matriz de tabulación',
      isDecision: false,
      nextTargetId: 'step-4',
    },
    {
      id: 'step-4',
      symbol: 'cylinder',
      actividad: 'Elaborar informe de resultados del diagnóstico',
      descripcion:
        'Talento Humano analiza los datos tabulados, identifica las necesidades prioritarias por dimensión y redacta el informe diagnóstico, guardando la información consolidada en la base de datos. Se verifica que las conclusiones reflejen fielmente los resultados obtenidos para orientar los programas.',
      responsable: 'Talento Humano',
      registroDocumento: 'Base de datos e informe',
      isDecision: false,
      nextTargetId: 'step-5',
    },
    {
      id: 'step-5',
      symbol: 'document',
      actividad: 'Definir programas, actividades e incentivos',
      descripcion:
        'Con base en el informe diagnóstico, Talento Humano estructura los programas de bienestar, celebraciones, espacios de integración, recreación e incentivos, detallando objetivos, metodología y cobertura. Se verifica que la propuesta atienda las necesidades identificadas y cumpla la normativa aplicable.',
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
        'La Gerencia revisa la propuesta del Plan de Bienestar evaluando su pertinencia frente a las necesidades del personal, el alcance para todas las áreas y el cumplimiento de los lineamientos internos. Si aprueba, se avanza al cronograma; si solicita cambios, se remite a ajuste.',
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
        'Talento Humano revisa las observaciones emitidas por la Gerencia y modifica los objetivos, metodologías o actividades señaladas en la propuesta. Una vez corregida, verifica que atienda todos los comentarios antes de presentarla nuevamente para aprobación.',
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
        'Talento Humano asigna fechas, horarios, duración y periodicidad a las actividades aprobadas, consultando los turnos de producción, administración y logística. Se busca organizar un calendario equilibrado que respete los tiempos de trabajo y descanso del personal.',
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
        'La Gerencia revisa las fechas y horarios propuestos frente a la programación operativa de la empresa para confirmar que no afecten la producción ni excluyan turnos. Si está conforme, aprueba el cronograma para su costeo; de lo contrario, indica las reprogramaciones necesarias.',
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
        'Talento Humano coordina con las áreas operativas, administrativas y logísticas nuevas fechas u horarios para resolver los cruces señalados por la Gerencia. Se verifica que el calendario actualizado mantenga todas las actividades aprobadas y conserve su viabilidad operativa.',
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
        'El Contador, junto con Talento Humano, estima los costos unitarios y totales de materiales, logística, refrigerios, espacios e incentivos de cada actividad del cronograma, verificando posibles apoyos de la Caja de Compensación. Con ello se consolida una propuesta financiera exacta y justificada.',
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
        'La Gerencia revisa los montos y rubros presupuestales frente a la disponibilidad financiera de la empresa y el beneficio esperado para los trabajadores. Si aprueba los recursos, se continúa con la asignación de responsables; si requiere reducciones, se devuelve a ajuste.',
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
        'Talento Humano y el área contable revisan cotizaciones, cantidades o alternativas con aliados y convenios para optimizar los costos según las indicaciones de la Gerencia. Se verifica que la nueva propuesta financiera siga permitiendo cumplir los objetivos de cada actividad.',
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
        'Talento Humano designa a los líderes y apoyos encargados de coordinar la logística, los recursos y el acompañamiento de cada actividad, dejando el registro en la base de datos. Se confirma que cada jornada cuente con responsables claros que conozcan sus funciones y medidas de seguridad.',
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
        'Talento Humano depura la base de datos de trabajadores activos para definir los convocados a cada actividad, asegurando inclusión equitativa del personal administrativo, operativo y logístico. Se verifica que el listado esté actualizado y considere turnos o condiciones particulares.',
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
        'Talento Humano redacta y difunde las invitaciones con la fecha, hora, lugar, objetivo y recomendaciones de cada jornada a través de los canales internos dentro del horario laboral. Se verifica que la convocatoria llegue oportunamente a todas las áreas para facilitar la participación.',
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
        'Los responsables asignados alistan el espacio y los insumos requeridos, reciben a los asistentes y desarrollan la agenda prevista promoviendo un trato digno, seguro y respetuoso. Durante la jornada se verifica el cumplimiento del programa y las condiciones adecuadas de higiene y convivencia.',
      responsable: 'Responsables asignados',
      registroDocumento: 'Plan de Bienestar',
      isDecision: false,
      nextTargetId: 'step-18',
    },
    {
      id: 'step-18',
      symbol: 'document',
      actividad: 'Aplicar encuesta de satisfacción y registro',
      descripcion:
        'Al finalizar cada actividad, Talento Humano recoge el listado de asistencia firmado, toma las evidencias fotográficas y aplica la encuesta de satisfacción de manera confidencial. Se verifica que los soportes queden completos para conocer el nivel de agrado y participación.',
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
        'Talento Humano tabula las encuestas de satisfacción, calcula indicadores de asistencia, cumplimiento y percepción frente al cronograma y presupuesto, y redacta el informe final con oportunidades de mejora. Se verifica la consistencia entre las cifras reportadas y los soportes archivados.',
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
        'Talento Humano confirma que todas las actividades del ciclo finalizaron y verifica el archivo ordenado de actas, cronogramas, presupuestos, listas de asistencia, encuestas e informes. Con esto se cierra formalmente el procedimiento y se dejan insumos para el siguiente periodo.',
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
