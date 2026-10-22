const strings: Record<string, string> = {
  "device.hint.in-ear": "Auriculares o puntas dentro del canal auditivo",
  "device.hint.on-ear": "Las almohadillas se apoyan sobre la oreja",
  "device.hint.over-ear": "Las almohadillas rodean toda la oreja",
  "device.hint.bose-qc-ultra": "Circumaurales, ANC fuerte",
  "device.hint.sony-wh1000xm6": "Circumaurales, ANC fuerte",
  "device.hint.earpods-wired": "Auriculares con cable abiertos",
  "device.hint.airpods": "Auriculares abiertos apoyados en el oído",
  "device.hint.airpods-pro-2": "Puntas selladas, ANC",
  "device.hint.airpods-pro-3": "Puntas selladas, ANC adaptativa",
  "noise.noMic": "No se encontró ningún micrófono, así que no se puede comprobar la sala. Aun así puedes hacer la prueba; su puntuación de calidad indicará que falta esta comprobación.",
  "data.badge": "Tus datos auditivos",
  "data.title": "Compara cribados con total transparencia.",
  "data.lead":
    "Trae un resultado anterior de una clínica o centro auditivo a la misma vista que tus datos de Audiomaxxer. La comparación es una verificación de medición, no un diagnóstico.",
  "data.signInPrompt": "Inicia sesión para subir informes e inspeccionar tus datos auditivos guardados.",
  "data.signIn": "Iniciar sesión",
  "data.howCalcTitle": "Cómo se calcula la comparación",
  "data.howCalcDesc":
    "Solo se comparan los pares de frecuencia y oído visibles en ambos conjuntos, y se comparan por forma y no por nivel absoluto, porque las dos pruebas no están en la misma escala.",
  "data.eq1.title": "Desfase de escala entre las dos pruebas",
  "data.eq1.detail":
    "La diferencia mediana entre ambos conjuntos de números. Como la clínica informa dB HL calibrados y Audiomaxxer un nivel estimado relativo, ese hueco refleja sobre todo un cambio de escala, no un error de medida. Lo eliminamos antes de comparar nada.",
  "data.eq2.title": "Diferencia de forma en un punto coincidente",
  "data.eq2.detail":
    "Lo que queda en cada punto de oído y frecuencia una vez eliminado el desfase de escala: en qué medida suben y bajan de forma distinta las dos curvas. Valores pequeños indican el mismo patrón auditivo. No publicamos a propósito un error medio frente a dB HL clínicos, porque exige una calibración medida entre escalas que aún no tenemos.",
  "data.table.title": "Datos de umbral coincidentes",
  "data.table.subtitle": "{source} frente al último cribado de Audiomaxxer",
  "data.table.uploadPrompt": "Sube y analiza un informe para completar esta tabla.",
  "data.table.mae": "Desfase de escala",
  "data.table.header.ear": "Oído",
  "data.table.header.frequency": "Frecuencia",
  "data.table.header.audiomaxxer": "Audiomaxxer",
  "data.table.header.clinic": "Clínica",
  "data.table.header.difference": "Diferencia de forma",
  "data.table.empty":
    "Todavía no hay puntos de oído-frecuencia coincidentes. Audiomaxxer actualmente prueba {freqs} Hz; un informe clínico necesita un valor legible en la misma frecuencia para que se incluya en el cálculo.",
  "data.table.footnote":
    "Estos valores comparan las unidades tal como están impresas: los resultados clínicos suelen ser dB HL clínicos, mientras que los niveles de Audiomaxxer son relativos/estimados y dependen del dispositivo. Trata una diferencia grande como motivo para revisar los informes con un audiólogo, no como un diagnóstico.",

  "data.report.signIn":
    "Inicia sesión para subir un informe de una clínica o centro auditivo y compararlo con tu cribado de Audiomaxxer.",
  "data.report.addTitle": "Añadir un informe auditivo anterior",
  "data.report.addDesc":
    "Sube un audiograma o cribado auditivo de una clínica, centro auditivo u otra aplicación. Lovable AI leerá el informe, extraerá los umbrales de conducción aérea visibles y los comparará con tu último cribado de Audiomaxxer.",
  "data.report.fileLabel": "Archivo del informe",
  "data.report.helperDefault": "PDF, PNG o JPG · hasta 15 MB",
  "data.report.sourceLabel": "Fuente (opcional)",
  "data.report.sourcePlaceholder": "Clínica o proveedor",
  "data.report.uploadBtn": "Subir y analizar",
  "data.report.analyzing": "Analizando…",
  "data.report.note":
    "Conserva el informe original para uso clínico. La extracción con IA es una capa de conveniencia y puede pasar por alto símbolos o valores en un escaneo de baja calidad.",
  "data.report.importedTitle": "Informes importados",
  "data.report.importedDesc": "Tus informes privados y notas de comparación extraídas.",
  "data.report.saved": "{n} guardados",
  "data.report.empty": "Aún no hay informes externos.",
  "data.report.testDate": "Fecha de la prueba {date}",
  "data.report.dateUnknown": "Fecha no detectada",
  "data.report.uploaded": "subido {date}",
  "data.report.statusCompared": "Comparado",
  "data.report.statusFailed": "Necesita otra subida",
  "data.report.statusEmpty": "No se encontraron umbrales",
  "data.report.statusProcessing": "Procesando",
  "data.report.aiComparison": "Comparación de IA",
  "data.report.next": "Siguiente:",
  "data.report.errChooseFile": "Elige un informe auditivo en PDF, PNG o JPG.",
  "data.report.errFileSize": "El archivo debe pesar entre 1 byte y 15 MB.",
  "data.report.errAnalyzeFail": "No se pudo analizar el informe.",
  "data.report.errSaveFail": "No se pudo guardar el informe.",
  "data.report.toastAnalyzed": "Informe analizado · {n} umbral(es) encontrado(s)",

  "noise.title": "Ruido de la sala",
  "noise.scanPrompt": "Escanea tu entorno antes de la prueba.",
  "noise.tooLoud": "El ruido de fondo se lee alto (unos {n} en la escala relativa de este micrófono). Busca un lugar más tranquilo.",
  "noise.ok": "El ruido de fondo se lee bajo (unos {n} en la escala relativa de este micrófono). Todo listo.",
  "noise.error": "Se bloqueó el acceso al micrófono. Permítelo en la configuración del navegador para escanear la sala.",
  "noise.stop": "Detener",
  "noise.scan": "Escanear",

  "device.question": "¿Con qué estás escuchando?",
  "device.desc":
    "Los auriculares no suenan igual de fuerte con la misma señal. Para un modelo conocido la prueba aplica un ajuste de nivel estimado; no es una calibración de tus propios auriculares.",
  "device.calibratedAria": "Modelo con ajuste estimado",
  "device.calibratedNote": "Ajuste estimado para este modelo.",
  "device.calibratedDetail":
    "Los tonos reciben un ajuste estimado para la respuesta típica de {device}, tomado de mediciones publicadas de ese modelo. Tus auriculares y su colocación pueden variar, así que compara resultados con la misma configuración.",
  "device.uncalibratedNote": "Sin ajuste para estos auriculares.",
  "device.uncalibratedDetail":
    "Solo suponemos una respuesta genérica de {hint}. Los resultados siguen mostrando cambios relativos con la misma configuración, pero los niveles pueden desviarse varios dB.",
  "device.peaks": "pico ~{db} dB",

  "how.title": "Cómo funciona Audiomaxxer",
  "how.desc":
    "Un circuito cerrado: cada cribado cambia tu entrenamiento, y cada bloque de entrenamiento alimenta la siguiente comparación de cribado.",
  "how.scienceLink": "La ciencia detrás de esto",
  "how.step": "PASO",
  "how.step.screen.title": "Cribar",
  "how.step.screen.body":
    "Los tonos adaptativos se acercan al nivel más suave que puedes oír en cada frecuencia, en cada oído.",
  "how.step.analyze.title": "Analizar",
  "how.step.analyze.body":
    "Tus respuestas construyen un perfil auditivo individual: dónde eres fuerte y dónde baja la sensibilidad.",
  "how.step.train.title": "Entrenar",
  "how.step.train.body":
    "Los ejercicios se concentran en los sonidos que, según tu perfil, más te cuesta distinguir.",
  "how.step.adapt.title": "Adaptar",
  "how.step.adapt.body": "Cómo te desempeñas en una sesión cambia la dificultad y el contenido de la siguiente.",
  "how.step.track.title": "Seguir",
  "how.step.track.body":
    "Los cribados repetidos muestran cómo evoluciona tu perfil a lo largo de semanas y meses, no solo una vez.",
  "how.feedbackPre":
    "El paso 5 retroalimenta al paso 3: un perfil actualizado reorienta tu entrenamiento en lugar de repetir los mismos ejercicios. Esa flecha de retroalimentación es lo que llamamos {loop}.",
  "how.closedLoop": "circuito cerrado",

  "example.title": "Tu perfil auditivo",
  "example.badge": "Resultado de ejemplo",
  "example.detected": "Audiomaxxer detectó",
  "example.finding1": "Buena audición en frecuencias bajas",
  "example.finding2": "Sensibilidad ligeramente reducida entre 4 y 8 kHz",
  "example.finding3": "Entrenamiento recomendado: habla en ruido + reconocimiento de alta frecuencia",
  "example.cta": "Mira cómo es tu audición",
  "example.footnote": "Son datos de ejemplo. Haz tu propio cribado para ver resultados reales.",
};

export default strings;
