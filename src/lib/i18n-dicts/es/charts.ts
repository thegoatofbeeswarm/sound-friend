const strings: Record<string, string> = {
  "chart.frequencyHz": "Frecuencia (Hz)",
  "chart.hearingLevel": "Nivel estimado (dB, relativo)",
  "chart.leftEar": "Oído izquierdo",
  "chart.rightEar": "Oído derecho",
  "chart.hz": "{v} Hz",
  "chart.dbHl": "{v} dB",
  "chart.audiogramHelp":
    "Léelo como un audiograma: los sonidos más suaves están arriba, así que una línea alta indica que detectaste tonos más suaves. Son niveles estimados y dependientes del dispositivo, no dB HL clínicos, así que úsalos para comparar tus propios cribados a lo largo del tiempo.",
  "chart.accuracy": "Precisión %",
  "chart.difficulty": "Dificultad alcanzada",

  "quality.title": "Calidad del cribado",
  "quality.compact": "Calidad del cribado {score}/100 · {label}",
  "quality.heading": "Calidad del cribado: {label}",
  "quality.label.excellent": "Condiciones excelentes",
  "quality.label.good": "Buenas condiciones",
  "quality.label.fair": "Condiciones aceptables",
  "quality.label.low": "Fiabilidad limitada",
  "quality.interpretation.excellent":
    "Los umbrales absolutos de este cribado pueden compararse con los rangos estándar con confianza.",
  "quality.interpretation.good":
    "Los umbrales son fiables para el seguimiento, con unos pocos dB de incertidumbre.",
  "quality.interpretation.fair":
    "Usa esta sesión para seguimiento relativo; los umbrales absolutos pueden estar desplazados por las condiciones.",
  "quality.interpretation.low":
    "Toma estos números solo como indicativos y repite el cribado en mejores condiciones.",
  "quality.issue.noNoiseScan": "No se midió el ruido de la sala antes del cribado.",
  "quality.issue.noisy": "El ruido de fondo era de ~{db} dB, lo que puede enmascarar los tonos más suaves.",
  "quality.issue.veryNoisy":
    "El ruido de fondo era de ~{db} dB: demasiado alto para tonos de bajo nivel fiables.",
  "quality.issue.noDevice": "No se registró ningún dispositivo de escucha para este cribado.",
  "quality.issue.uncalibrated":
    "{device} no tiene perfil de modelo, así que los niveles pueden desviarse varios dB.",
  "quality.issue.fewTrials": "Solo se respondieron {n} ensayos, así que las estimaciones son aproximadas.",
  "quality.issue.noTrials": "No se registraron ensayos.",
  "quality.issue.lowConfidence": "La confianza media de la estimación fue solo del {pct}%.",
  "quality.issue.unsettled":
    "Al menos una frecuencia nunca se estabilizó: las respuestas allí pueden haber sido inconsistentes.",
  "quality.strength.veryQuiet": "Sala muy silenciosa (~{db} dB).",
  "quality.strength.quiet": "Sala razonablemente silenciosa (~{db} dB).",
  "quality.strength.calibrated": "{device} tiene un perfil de corrección estimada aplicado.",
  "quality.strength.trials": "{n} ensayos respondidos.",
  "quality.strength.confidence": "Confianza media de la estimación {pct}%.",
  "quality.issue.catchFail": "Dijiste oír un tono en {failed} de {total} ensayos silenciosos de control.",
  "quality.issue.inconsistent": "Los tonos repetidos recibieron la misma respuesta solo el {pct}% de las veces.",
  "test.stepCatch": "Algunas rondas son silenciosas. Elige \"Nada\" cuando no oigas ningún tono.",
  "quality.strength.catchPass": "Superaste los {n} ensayos silenciosos de control.",
  "quality.strength.consistent": "Las respuestas coincidieron en el {pct}% de los tonos repetidos.",
};

export default strings;
