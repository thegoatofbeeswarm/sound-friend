export const platformPack: {
  en: Record<string, string>;
  zh: Record<string, string>;
  es: Record<string, string>;
} = {
  en: {
    /* homepage five-part profile */
    "five.exampleTitle": "Example listening profile",
    "five.exampleBadge": "Sample data",
    "five.overall": "Overall listening",
    "five.focus": "Your recommended focus",
    "five.startTraining": "Start 5-minute training",
    "five.dimsTitle": "Hearing is more than sensitivity",
    "five.dimsLead":
      "A tone test shows you how quiet a sound you can detect. These five measures describe how you listen:",
    "five.dim.sensitivity.body": "The softest tone you can detect at each pitch. ",
    "five.dim.speech.body":
      "How much background noise you can tolerate and still understand spoken digits/sentences.",
    "five.dim.discrimination.body":
      "Telling apart pitches and fine spectral detail that sit close together.",
    "five.dim.attention.body":
      "Holding on to one sound source while other sounds distract you.",
    "five.dim.memory.body":
      "Keeping what you just heard in mind long enough to make sense of a whole sentence.",

    /* cohort validation */
    "cohort.title": "Validation data",
    "cohort.lead":
      "Pooled, anonymous numbers from everyone using Audiomaxxer. No names, no accounts — just counts and repeatability. These numbers are meant to be checked, not trusted.",
    "cohort.participants": "Participants",
    "cohort.screenings": "Screenings",
    "cohort.repeat": "Repeat screenings",
    "cohort.retest": "Same-device test-retest",
    "cohort.retestHint": "Mean absolute difference between two sittings on the same hardware.",
    "cohort.within": "Retest points within 10 dB",
    "cohort.speech": "Speech-in-noise repeatability",
    "cohort.speechHint": "Mean change in speech reception threshold between sittings.",
    "cohort.speechTests": "Speech tests",
    "cohort.clinic": "Clinic reports uploaded",
    "cohort.clinicHint": "Reports available for pattern comparison.",
    "cohort.byDevice": "Repeatability by device",
    "cohort.byBand": "Repeatability by pitch region",
    "cohort.device": "Device",
    "cohort.pairs": "Matched points",
    "cohort.spread": "Test-retest spread",
    "cohort.band.low": "Low pitches (under 1 kHz)",
    "cohort.band.mid": "Mid pitches (1-4 kHz)",
    "cohort.band.high": "High pitches (4 kHz and up)",
    "cohort.none": "Not enough data yet",
    "cohort.unknown": "Unspecified device",
    "cohort.note":
      "Repeatability is not accuracy. It shows how stable a screening is when repeated, which is a precondition for accuracy, not a substitute for a calibrated clinical measurement.",

    /* pattern comparison (replaces absolute error against dB HL) */
    "valid.scaleWarn": "Different scales",
    "valid.scaleNote":
      "A clinic measures dB HL on a calibrated audiometer. Audiomaxxer reports a relative, device-dependent estimated level. Subtracting one from the other would produce an error figure that looks meaningful but is not, so we compare the shape of the two curves instead.",
    "valid.patternTitle": "Pattern comparison",
    "valid.patternMatch": "Pattern match",
    "valid.patternHint": "How closely the two curves rise and fall together.",
    "valid.offset": "Scale offset",
    "valid.offsetHint": "Constant gap between the scales. Removed before comparing — it is not an error.",
    "valid.shapeSpread": "Shape difference",
    "valid.shapeHint": "Average mismatch after the offset is removed.",
    "valid.withinShape": "Points within 10 dB of the shared shape",
    "valid.agree.strong": "The two tests describe the same hearing pattern",
    "valid.agree.moderate": "Broadly the same pattern, with some points off",
    "valid.agree.weak": "The patterns do not line up yet",
    "valid.sameBand": "Both tests show relatively lower sensitivity around {band}.",
    "valid.diffBand":
      "Your clinic report is weakest around {clinic}, while this screening is weakest around {app}.",
    "valid.band.low": "500 Hz-1 kHz",
    "valid.band.mid": "1-4 kHz",
    "valid.band.high": "4-8 kHz",
    "valid.tableShape": "Shape difference",
    "valid.tableAppUnit": "estimated level",
    "valid.tableClinicUnit": "dB HL",
    "valid.noAbsolute":
      "We deliberately do not publish an average error against clinical dB HL. That number needs a measured calibration between the two scales, and we do not have one yet.",
    "valid.yourData": "Your clinic comparison",
  },
  zh: {
    "five.exampleTitle": "示例聆听档案",
    "five.exampleBadge": "示例数据",
    "five.overall": "综合聆听分",
    "five.focus": "建议优先训练",
    "five.startTraining": "开始 5 分钟训练",
    "five.dimsTitle": "听力不只是灵敏度",
    "five.dimsLead":
      "纯音测试只回答一个问题：你能听到多轻的声音。下面这五项描述的是你真正的聆听方式。",
    "five.dim.sensitivity.body": "各频率下你能察觉的最轻音——经典筛查，也只是五项输入之一。",
    "five.dim.speech.body": "在多大的背景噪声下，你仍能听懂数字与句子。",
    "five.dim.discrimination.body": "分辨彼此接近的音高、音色与细微频谱差异。",
    "five.dim.attention.body": "在其他声音争夺注意力时，仍能锁定一个声源。",
    "five.dim.memory.body": "把刚听到的内容记住足够久，才能理解整句话。",

    "cohort.title": "验证数据",
    "cohort.lead":
      "来自全部 Audiomaxxer 用户的匿名汇总数据。没有姓名，没有账号，只有数量与重复性。这些数字供你核查，而不是让你盲信。",
    "cohort.participants": "参与人数",
    "cohort.screenings": "筛查次数",
    "cohort.repeat": "重复筛查次数",
    "cohort.retest": "同设备重测一致性",
    "cohort.retestHint": "同一硬件上两次测试之间的平均绝对差值。",
    "cohort.within": "重测点在 10 dB 以内的比例",
    "cohort.speech": "噪声中言语测试的重复性",
    "cohort.speechHint": "两次测试之间言语接受阈的平均变化。",
    "cohort.speechTests": "言语测试次数",
    "cohort.clinic": "已上传的临床报告",
    "cohort.clinicHint": "可用于形态对比的报告数量。",
    "cohort.byDevice": "按设备的重复性",
    "cohort.byBand": "按频段的重复性",
    "cohort.device": "设备",
    "cohort.pairs": "匹配点数",
    "cohort.spread": "重测离散度",
    "cohort.band.low": "低频（1 kHz 以下）",
    "cohort.band.mid": "中频（1-4 kHz）",
    "cohort.band.high": "高频（4 kHz 以上）",
    "cohort.none": "数据尚不足",
    "cohort.unknown": "未指明设备",
    "cohort.note":
      "重复性不等于准确性。它说明重复筛查时结果有多稳定，这是准确的前提，但不能替代经过校准的临床测量。",

    "valid.scaleWarn": "量纲不同",
    "valid.scaleNote":
      "诊所使用经过校准的听力计测得 dB HL；Audiomaxxer 给出的是相对的、依赖设备的估算值。把两者相减会得到一个看似有意义、实则不可信的误差值，因此我们改为比较两条曲线的形态。",
    "valid.patternTitle": "形态对比",
    "valid.patternMatch": "形态吻合度",
    "valid.patternHint": "两条曲线的起伏有多一致。",
    "valid.offset": "量纲偏移",
    "valid.offsetHint": "两种量纲之间的固定差距。对比前已扣除——它不是误差。",
    "valid.shapeSpread": "形态差异",
    "valid.shapeHint": "扣除偏移后的平均偏差。",
    "valid.withinShape": "与共同形态相差 10 dB 以内的点",
    "valid.agree.strong": "两次测试描述的是同一种听力形态",
    "valid.agree.moderate": "形态大致相同，个别点有出入",
    "valid.agree.weak": "两者的形态目前对不上",
    "valid.sameBand": "两次测试都显示在 {band} 附近灵敏度相对较低。",
    "valid.diffBand": "你的临床报告在 {clinic} 附近最弱，而本次筛查在 {app} 附近最弱。",
    "valid.band.low": "500 Hz-1 kHz",
    "valid.band.mid": "1-4 kHz",
    "valid.band.high": "4-8 kHz",
    "valid.tableShape": "形态差异",
    "valid.tableAppUnit": "估算值",
    "valid.tableClinicUnit": "dB HL",
    "valid.noAbsolute":
      "我们刻意不公布相对临床 dB HL 的平均误差。那个数字需要两种量纲之间实测的校准关系，而我们目前还没有。",
    "valid.yourData": "你的临床对比",
  },
  es: {
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
  },
};
