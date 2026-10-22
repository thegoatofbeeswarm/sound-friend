const strings: Record<string, string> = {
  "plan.title": "Tu plan de entrenamiento",
  "plan.fromClinic": "Basado en tu informe clínico: {source}",
  "plan.fromScreening": "Basado en tu último cribado de Audiomaxxer",
  "plan.fromNone": "Plan inicial: haz un cribado o sube un informe clínico para personalizarlo",
  "plan.step": "Paso {n}",
  "plan.start": "Empezar este entrenamiento",
  "plan.upload": "Sube tu audiograma",
  "plan.uploadHint":
    "Sube un audiograma de una clínica o centro auditivo y el plan se reconstruye con la medición real.",
  "plan.signedOut": "Inicia sesión para obtener un plan hecho con tus propios resultados.",
  "plan.summaryHigh": "Frecuencias altas (4 kHz+): {db} dB de media",
  "plan.summaryLow": "Frecuencias bajas: {db} dB de media",
  "plan.summaryAsym": "Entre oídos en frecuencias altas: {db} dB de diferencia",
  "plan.reason.highLoss":
    "Tus frecuencias altas promedian {db} dB, el rango de las consonantes: empieza por ahí.",
  "plan.reason.consonants":
    "Perder el detalle agudo es lo que dificulta el habla en un sitio ruidoso, así que practícalo.",
  "plan.reason.sinWeak":
    "Tu puntuación de habla con ruido es {score}/100: es tu punto más débil.",
  "plan.reason.followTalk": "Practica seguir una conversación y responder preguntas sobre ella.",
  "plan.reason.asymmetry":
    "Tus oídos difieren unos {db} dB en agudos, así que conviene practicar de dónde viene el sonido.",
  "plan.reason.lowLoss":
    "Las frecuencias bajas promedian {db} dB: entrena a distinguir sonidos reales según bajan de volumen.",
  "plan.reason.general": "El habla con ruido es la habilidad que más se traslada a la vida diaria.",
  "plan.reason.discrimination": "La discriminación fina de tono afina el detalle que capta tu oído.",
  "plan.reason.memory": "El habla rápida exige atención auditiva y memoria de trabajo.",
};

export default strings;
