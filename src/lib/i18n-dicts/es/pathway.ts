const strings: Record<string, string> = {
  "nav.pathway": "Vía auditiva",
  "sci.link.pathway.label": "La vía auditiva",
  "sci.link.pathway.blurb":
    "Sigue un sonido de la cóclea a la corteza, relevo a relevo, y mira dónde se decide cada parte de tu perfil auditivo.",

  "path.hero.gate": "Entra en el oído",
  "path.hero.gate.sub": "sigue la señal hasta el cerebro",
  "path.hero.cta": "Sigue el nervio hasta el cerebro",
  "path.hero.step": "Cerebro",

  "path.badge": "Donde oír se convierte en pensar",
  "path.h1": "La señal sale de tu oído en un milisegundo. Le quedan dieciséis por recorrer.",
  "path.lead":
    "El cribado mide lo que llega al nervio auditivo. Todo lo que de verdad entiendes de una conversación se monta después, a lo largo de seis relevos y una lámina de corteza. Este es ese tramo del camino, y es la parte que entrena Audiomaxxer.",
  "path.disclaimer":
    "Es una explicación, no un diagnóstico. Los tiempos son valores típicos de registros de respuesta del tronco encefálico y varían entre personas.",

  "path.stage.pathway": "Vía auditiva ascendente",
  "path.stage.cortex": "Corteza auditiva",
  "path.back": "Volver a la vía",
  "path.fire": "Enviar un clic",
  "path.firing": "Viajando",
  "path.readout": "ms desde que se movió el tímpano",
  "path.open.cortex": "Abrir el mapa de la corteza",
  "path.intro.title": "Seis relevos, diecisiete milisegundos",
  "path.intro.body":
    "Un sonido que llegó a tu tímpano hace un instante ya va camino de la corteza. Ha sido dividido, cronometrado, comparado entre tus dos oídos y filtrado por la atención antes de que tengas la menor idea de qué era. Toca un relevo para ver qué le hace a la señal, y qué le pasa a tu escucha cuando ese relevo funciona mal.",
  "path.cortex.intro.title": "Pasado el tálamo ya no hay procesamiento de señal",
  "path.cortex.intro.body":
    "Solo interpretación. Cada una de estas regiones convierte el sonido en otra cosa: un patrón, una palabra, un pensamiento retenido, un recuerdo. Toca una para ver qué aporta, en qué parte de tu perfil auditivo aparece y qué ejercicio la carga.",

  "path.label.does": "Qué le hace a la señal",
  "path.label.mind": "Por qué importa más arriba",
  "path.label.train": "Qué entrena Audiomaxxer aquí",
  "path.label.role": "Qué hace",
  "path.label.link": "El vínculo cognitivo",
  "path.label.drill": "Cómo lo entrena Audiomaxxer",
  "path.label.profile": "Aparece en tu perfil como",
  "path.go.train": "Abrir este ejercicio",
  "path.go.test": "Empezar un cribado",

  "path.svg.alt":
    "Corte coronal del cerebro con la vía auditiva desde ambas cócleas hasta la corteza auditiva.",
  "path.cortex.svg.alt":
    "Vista lateral del hemisferio izquierdo con las regiones auditivas de la corteza.",
  "path.anno.rightEar": "Oído derecho",
  "path.anno.rightEar.sub": "cruza al hemisferio izquierdo",
  "path.anno.leftEar": "Oído izquierdo",
  "path.anno.leftEar.sub": "cruza al derecho",
  "path.anno.cross": "cruce de la línea media en el cuerpo trapezoide",
  "path.anno.cortex": "Corteza auditiva",
  "path.anno.fissure": "cisura dibujada abierta para ver el giro de Heschl",

  "path.st.cochlea.name": "Cóclea",
  "path.st.cochlea.does":
    "Las células ciliadas convierten la presión en impulsos eléctricos, ordenados por tono: los agudos cerca de la entrada, los graves en el fondo. Cada etapa superior hereda ese mapa.",
  "path.st.cochlea.mind":
    "Este es tu techo de fidelidad. Nada más arriba puede recuperar el detalle que la cóclea nunca codificó, y por eso la muesca de 4–6 kHz te cuesta consonantes sin que lo notes.",
  "path.st.cochlea.train":
    "La discriminación de frecuencia mide qué diferencia de tono tan pequeña sigues resolviendo. El reconocimiento de agudos revisa las bandas que el ruido se lleva primero.",
  "path.st.cochlea.profile": "Sensibilidad auditiva y discriminación",

  "path.st.cn.name": "Núcleo coclear",
  "path.st.cn.does":
    "La primera sinapsis pasado el nervio auditivo. La señal se bifurca en vías paralelas: una sigue el inicio con precisión de microsegundos, otra sigue la textura sostenida.",
  "path.st.cn.mind":
    "El instante de inicio es lo que distingue «ba» de «pa». Las consonantes viven en los primeros 40 milisegundos de una sílaba y cargan casi todo el significado, y por eso una llamada apagada te quita palabras, no volumen.",
  "path.st.cn.train":
    "Llamada telefónica y reconocimiento de agudos te empujan hacia los inicios, donde la señal recortada te deja menos con lo que trabajar.",
  "path.st.cn.profile": "Discriminación de sonidos",

  "path.st.soc.name": "Complejo olivar superior",
  "path.st.soc.does":
    "El primer punto donde se encuentran tus dos oídos. Compara el tiempo de llegada entre ellos, hasta unas diez millonésimas de segundo, y construye un mapa del espacio con esa diferencia.",
  "path.st.soc.mind":
    "La audición espacial es lo que te deja apuntar la atención a un solo hablante en una sala ruidosa. Sin ella todas las voces llegan del mismo sitio a la vez y la sala se vuelve papilla.",
  "path.st.soc.train":
    "La localización de sonido mueve el objetivo entre izquierda, centro y derecha, y estrecha la separación conforme aciertas.",
  "path.st.soc.profile": "Atención auditiva",

  "path.st.ic.name": "Colículo inferior",
  "path.st.ic.does":
    "Casi toda fibra ascendente hace sinapsis aquí. Este centro del mesencéfalo se sintoniza al ritmo y a la modulación de amplitud: la envolvente del habla, de unos 4 a 16 ciclos por segundo.",
  "path.st.ic.mind":
    "La velocidad silábica vive en esa banda. Seguir la envolvente es lo que te mantiene en tu sitio dentro de una frase en vez de perder el hilo a mitad.",
  "path.st.ic.train":
    "Habla rápida comprime la envolvente hasta que tienes que cabalgarla. Esquina de la calle la entierra bajo un tráfico que modula a un ritmo parecido.",
  "path.st.ic.profile": "Memoria auditiva",

  "path.st.mgn.name": "Núcleo geniculado medial",
  "path.st.mgn.does":
    "La puerta talámica. La corteza le manda más fibras hacia abajo de las que recibe de vuelta, así que aquí decide la atención qué pasa.",
  "path.st.mgn.mind":
    "Aquí es donde escuchar se separa de oír. La atención selectiva es una puerta a la entrada, no un filtro que aplicas después, y por eso puedes perderte una frase dicha con claridad y a volumen normal.",
  "path.st.mgn.train":
    "Sonidos cotidianos y Esquina de la calle te obligan a sostener una corriente mientras suena otra rival.",
  "path.st.mgn.profile": "Atención auditiva",

  "path.st.a1.name": "Corteza auditiva",
  "path.st.a1.does":
    "El impulso llega al giro de Heschl todavía ordenado por frecuencia. La primera respuesta cortical aparece cerca de los 17 milisegundos, pero no sabrás qué oíste hasta 100 o 300 más tarde.",
  "path.st.a1.mind":
    "Todo lo que viene después es interpretación: primero patrón, luego palabra, luego significado, luego memoria.",
  "path.st.a1.train": "Aquí es donde cae la mayor parte del entrenamiento de Audiomaxxer.",
  "path.st.a1.profile": "Las cinco dimensiones",

  "path.rg.a1.name": "Giro de Heschl",
  "path.rg.a1.sub": "Corteza auditiva primaria",
  "path.rg.a1.role":
    "El mapa de frecuencias, trasladado casi intacto desde la cóclea. Codifica tono, tiempo y nivel antes de que nada de eso signifique algo.",
  "path.rg.a1.mind":
    "Resolución. Lo fino que esta región separe dos sonidos cercanos marca el techo de cada juicio posterior, incluida qué palabra crees haber oído.",
  "path.rg.a1.train":
    "La discriminación de frecuencia acerca dos tonos hasta que dejas de poder distinguirlos. El reconocimiento de agudos hace lo mismo entre bandas.",
  "path.rg.a1.profile": "Discriminación de sonidos",

  "path.rg.belt.name": "Cinturón y plano temporal",
  "path.rg.belt.sub": "Patrones de sonido",
  "path.rg.belt.role":
    "Un anillo de áreas secundarias que dejan de tratar el sonido como frecuencias y empiezan a tratarlo como objetos: esta voz, aquel motor, esos pasos.",
  "path.rg.belt.mind":
    "El problema del cóctel. Tu cerebro tiene que decidir qué fragmentos vienen de la misma fuente antes de poder descodificar ninguno, así que agrupar viene antes que entender.",
  "path.rg.belt.train":
    "Habla en ruido de conversación adapta la relación señal-ruido: el murmullo se acerca cuando aciertas y se retira cuando fallas. Mesa de restaurante añade el estrépito.",
  "path.rg.belt.profile": "Habla en ruido",

  "path.rg.wernicke.name": "Área de Wernicke",
  "path.rg.wernicke.sub": "Significado de las palabras",
  "path.rg.wernicke.role":
    "La corteza temporal superior posterior asigna patrones de sonido a palabras almacenadas. Una lesión aquí deja la audición intacta y se lleva la comprensión.",
  "path.rg.wernicke.mind":
    "Velocidad de acceso léxico. Una conversación rápida te da unos 200 milisegundos por palabra: si el acceso se retrasa, pierdes la frase, no la palabra.",
  "path.rg.wernicke.train":
    "Habla rápida adelanta la decisión en cada ronda. Llamada telefónica recorta la parte alta de la banda para que decidas con menos.",
  "path.rg.wernicke.profile": "Discriminación y memoria",

  "path.rg.arcuate.name": "Fascículo arqueado",
  "path.rg.arcuate.sub": "El bucle fonológico",
  "path.rg.arcuate.role":
    "El haz de sustancia blanca que lleva el sonido del lóbulo temporal al frontal y te permite retener un sonido en la mente y repetirlo en silencio.",
  "path.rg.arcuate.mind":
    "Memoria de trabajo verbal. Retener un número hasta marcarlo, seguir una frase larga hasta su verbo, quedarte con un nombre tras una sola presentación.",
  "path.rg.arcuate.train":
    "La simulación de conversación pregunta después del intercambio, no durante, así que el material hay que retenerlo en vez de reaccionar a él.",
  "path.rg.arcuate.profile": "Memoria auditiva",

  "path.rg.broca.name": "Giro frontal inferior",
  "path.rg.broca.sub": "Predicción",
  "path.rg.broca.role":
    "Las regiones frontales del habla no solo producen habla, también la predicen: mandan los sonidos esperados de vuelta a la corteza temporal antes de que lleguen.",
  "path.rg.broca.mind":
    "La mitad de escuchar es acertar al adivinar. En ruido no descodificas tanto como predices y compruebas, y un mejor modelo del idioma equivale a una señal más limpia.",
  "path.rg.broca.train":
    "Habla en ruido de conversación y Esquina de la calle dejan huecos que la señal nunca rellena, así que tienes que ponerlos tú.",
  "path.rg.broca.profile": "Habla en ruido",

  "path.rg.dlpfc.name": "Corteza prefrontal dorsolateral",
  "path.rg.dlpfc.sub": "Esfuerzo de escucha",
  "path.rg.dlpfc.role":
    "Cuando la señal es mala, se recluta la corteza prefrontal para sostenerla. El coste se ve como dilatación pupilar en el laboratorio y como fatiga en la vida diaria.",
  "path.rg.dlpfc.mind":
    "El esfuerzo es de suma cero. Los recursos que gastas descodificando una voz degradada no los gastas en recordar lo que dijo, y por eso sales agotado de una cena ruidosa sin poder recordar gran cosa.",
  "path.rg.dlpfc.train":
    "Sonidos cotidianos y Esquina de la calle duran lo suficiente para cargar atención sostenida, no un juicio instantáneo.",
  "path.rg.dlpfc.profile": "Atención auditiva",

  "path.rg.hippo.name": "Hipocampo",
  "path.rg.hippo.sub": "Codificar en memoria",
  "path.rg.hippo.role":
    "Las estructuras temporales mediales unen lo que oíste con cuándo y dónde lo oíste, y convierten una frase percibida en algo que podrás recuperar luego.",
  "path.rg.hippo.mind":
    "La Comisión Lancet sobre demencia sitúa la pérdida auditiva como el mayor factor de riesgo modificable de la mediana edad en su modelo: señal degradada, retirada de la conversación y años de esfuerzo extra se acumulan. El vínculo es una asociación y no una causa demostrada, y es una razón para tomarse en serio una pérdida inadvertida a los veinte y no a los sesenta.",
  "path.rg.hippo.train":
    "Mesa de restaurante y Simulación de conversación preguntan qué se dijo, minutos después, en vez de qué acabas de oír.",
  "path.rg.hippo.profile": "Memoria auditiva",
};

export default strings;
