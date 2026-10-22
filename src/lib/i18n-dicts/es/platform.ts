const strings: Record<string, string> = {
  "trend.sinceSameSkills": "(desde {date}, mismas habilidades)",
  "trend.waitForComparable": "Acabas de añadir una habilidad a tu perfil. Verás un cambio cuando vuelvas a medir las mismas habilidades.",
  "coach.privacy": "Tus mensajes, junto con un resumen de tus cribados, informes, entrenamiento y auriculares guardados, se envían al modelo Gemini de Google a través de Lovable AI Gateway para escribir cada respuesta. Puedes borrar una conversación cuando quieras.",
  "data.privacy": "Tu informe se guarda de forma privada en tu cuenta y se envía al modelo Gemini de Google, a través de Lovable AI Gateway, para leer los umbrales. Aún no puedes borrar un informe desde la app; escribe al equipo (ver la página del equipo) para que lo eliminen.",
  "train.languageNote": "Los ejercicios de habla usan grabaciones y voces en inglés, sea cual sea el idioma de esta página.",
  "sin.languageNote": "Los dígitos se dicen en inglés, sea cual sea el idioma de esta página.",
  "trend.mixNote": "Tu perfil ahora cubre habilidades distintas que antes, y la puntuación general es un promedio de lo medido, así que la línea salta ahí. Los cambios solo se comparan mientras se cubren las mismas habilidades.",
  "profile.coverage": "Basado en {n} de 5 habilidades medidas hasta ahora",
  "five.exampleTitle": "Perfil auditivo de ejemplo",
  "five.exampleBadge": "Datos de muestra",
  "five.overall": "Escucha global",
  "five.focus": "Tu foco recomendado",
  "five.startTraining": "Entrenar 5 minutos",
  "five.dimsTitle": "Oír es más que sensibilidad",
  "five.dimsLead":
    "Una prueba de tonos responde a una sola pregunta: qué tan bajo puedes detectar un sonido. Estas cinco medidas describen cómo escuchas de verdad.",
  "five.dim.sensitivity.body":
    "El tono más suave que detectas en cada frecuencia: el cribado clásico, y solo una de las cinco entradas.",
  "five.dim.speech.body":
    "Cuánto ruido de fondo toleras sin dejar de entender dígitos y frases.",
  "five.dim.discrimination.body":
    "Distinguir tonos, timbres y detalles espectrales muy próximos entre sí.",
  "five.dim.attention.body":
    "Mantener una fuente sonora mientras otras compiten por tu atención.",
  "five.dim.memory.body":
    "Retener lo que acabas de oír el tiempo suficiente para entender la frase completa.",

  "cohort.title": "Datos de validación",
  "cohort.lead":
    "Cifras anónimas y agregadas de todas las personas que usan Audiomaxxer. Sin nombres ni cuentas: solo recuentos y repetibilidad. Están para comprobarse, no para creerse.",
  "cohort.participants": "Participantes",
  "cohort.screenings": "Cribados",
  "cohort.repeat": "Cribados repetidos",
  "cohort.retest": "Test-retest con el mismo equipo",
  "cohort.retestHint": "Diferencia absoluta media entre dos sesiones con el mismo hardware.",
  "cohort.within": "Puntos de retest dentro de 10 dB",
  "cohort.speech": "Repetibilidad del habla con ruido",
  "cohort.speechHint": "Cambio medio del umbral de recepción del habla entre sesiones.",
  "cohort.speechTests": "Pruebas de habla",
  "cohort.clinic": "Informes clínicos subidos",
  "cohort.clinicHint": "Informes disponibles para comparar patrones.",
  "cohort.byDevice": "Repetibilidad por dispositivo",
  "cohort.byBand": "Repetibilidad por región de frecuencia",
  "cohort.device": "Dispositivo",
  "cohort.pairs": "Puntos coincidentes",
  "cohort.spread": "Dispersión test-retest",
  "cohort.band.low": "Frecuencias bajas (menos de 1 kHz)",
  "cohort.band.mid": "Frecuencias medias (1-4 kHz)",
  "cohort.band.high": "Frecuencias altas (4 kHz o más)",
  "cohort.none": "Aún no hay datos suficientes",
  "cohort.unknown": "Dispositivo sin especificar",
  "cohort.note":
    "La repetibilidad no es exactitud. Muestra lo estable que es un cribado al repetirlo, un requisito previo a la exactitud, no un sustituto de una medición clínica calibrada.",

  "valid.scaleWarn": "Escalas distintas",
  "valid.scaleNote":
    "Una clínica mide dB HL con un audiómetro calibrado. Audiomaxxer da un nivel estimado, relativo y dependiente del dispositivo. Restar uno del otro daría una cifra de error que parece significativa sin serlo, así que comparamos la forma de las dos curvas.",
  "valid.patternTitle": "Comparación de patrones",
  "valid.patternMatch": "Coincidencia de patrón",
  "valid.patternHint": "Con qué fidelidad suben y bajan juntas las dos curvas.",
  "valid.offset": "Desfase de escala",
  "valid.offsetHint": "Diferencia constante entre escalas. Se elimina antes de comparar: no es un error.",
  "valid.shapeSpread": "Diferencia de forma",
  "valid.shapeHint": "Desajuste medio una vez eliminado el desfase.",
  "valid.withinShape": "Puntos dentro de 10 dB de la forma común",
  "valid.agree.strong": "Ambas pruebas describen el mismo patrón auditivo",
  "valid.agree.moderate": "Patrón parecido, con algunos puntos desviados",
  "valid.agree.weak": "Los patrones todavía no coinciden",
  "valid.sameBand": "Ambas pruebas muestran menor sensibilidad alrededor de {band}.",
  "valid.diffBand":
    "Tu informe clínico es más débil cerca de {clinic}, mientras que este cribado lo es cerca de {app}.",
  "valid.band.low": "500 Hz-1 kHz",
  "valid.band.mid": "1-4 kHz",
  "valid.band.high": "4-8 kHz",
  "valid.tableShape": "Diferencia de forma",
  "valid.tableAppUnit": "nivel estimado",
  "valid.tableClinicUnit": "dB HL",
  "valid.noAbsolute":
    "No publicamos a propósito un error medio frente a dB HL clínicos. Esa cifra requiere una calibración medida entre ambas escalas, y todavía no la tenemos.",
  "valid.yourData": "Tu comparación con la clínica",
};

export default strings;
