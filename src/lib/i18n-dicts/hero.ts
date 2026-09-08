export const heroPack: {
  en: Record<string, string>;
  zh: Record<string, string>;
  es: Record<string, string>;
} = {
  en: {
    "hero.tagline": "listening health for the headphone generation",
    "hero.title": "You can hear fine. Can you follow a conversation in a loud bar?",
    "hero.lede":
      "Studies show that 12~17% of teens are affected by unnoticed hearing-related problems. Not being able to follow a conversation in a noisy area is a sign of this. To combat rapid hearing loss, Audiomaxxer uses a screening test to build a five-part listening profile — sensitivity, speech in noise, discrimination, attention, and memory — then trains your weakest skill and retests it.",
    "hero.meter.label": "Play a note into the ear",
    "hero.place.danger":
      "Peaks {mm} in from the base — the stretch noise damages first, and the one a threshold test can pass straight over.",
    "hero.place.normal": "Peaks {mm} in from the base of the cochlea.",
    "hero.cta.test": "Start a screening",
    "hero.cta.profile": "See a sample profile",
    "hero.fine": "About four minutes, headphones required. Screening, not a diagnosis.",
    "hero.hint": "Hover a part of the ear to name it. Click to open it.",
    "hero.count": "{n} of {total} opened.",
    "hero.peek.more": "Click for what goes wrong here",
    "hero.close": "Close",
    "hero.close.aria": "Close details",
    "hero.panel.wrong": "When this goes wrong",
    "hero.panel.profile": "Shows up in your profile as",
    "hero.panel.path": "The signal path",
    "hero.panel.alongside": "Alongside it",
    "hero.done":
      "That is the whole path. A screening measures what four of these leave behind.",
    "hero.done.cta": "Start yours",
    "hero.svg.alt":
      "Cross-section of the human ear. Each part can be focused and opened for detail.",

    "hero.band.1": "bass you feel more than hear",
    "hero.band.2": "the warmth in a voice",
    "hero.band.3": "vowels — the body of speech",
    "hero.band.4": "where a voice is easiest to place",
    "hero.band.5": "consonants: t, k, s, f",
    "hero.band.6": "the ear canal's own resonance",
    "hero.band.7": "where noise damage starts",
    "hero.band.8": "air, sibilance, detail",

    "hero.lbl.outer": "Outer ear",
    "hero.lbl.canal": "Ear canal",
    "hero.lbl.drum": "Eardrum",
    "hero.lbl.bones": "Three small bones",
    "hero.lbl.balance": "Balance canals",
    "hero.lbl.cochlea": "Cochlea",
    "hero.lbl.nerve": "Auditory nerve",
    "hero.lbl.eustachian": "Eustachian tube",
    "hero.annot.first": "first to go",

    "hero.part.outer.title": "Outer ear",
    "hero.part.outer.short": "Outer ear",
    "hero.part.outer.what":
      "The folds of the outer ear color a sound depending on where it came from, which is how you tell a voice above you from one behind you.",
    "hero.part.outer.wrong":
      "This is rarely the problem, and usually fixable when it is (i.e. wax or water that won't clear). Sound is blocked rather than lost, so it comes back when the blockage does.",
    "hero.part.outer.profile": "Auditory attention",
    "hero.part.outer.kind": "Conductive, usually temporary",

    "hero.part.canal.title": "Ear canal",
    "hero.part.canal.short": "Canal",
    "hero.part.canal.what":
      "About 25 mm of tube. Its length makes it resonate near 3 kHz, which is the band that carries consonants. ",
    "hero.part.canal.wrong":
      "Wearing an earbud seals this tube shut. This kills the natural resonance and puts a driver millimetres from the eardrum, so the level arriving there is higher than the number on your phone suggests.",
    "hero.part.canal.profile": "Hearing sensitivity",
    "hero.part.canal.kind": "Conductive, usually temporary",

    "hero.part.drum.title": "Eardrum",
    "hero.part.drum.short": "Eardrum",
    "hero.part.drum.what":
      "A membrane the width of a pencil eraser. It moves less than the width of a single atom at the quietest sound you can hear.",
    "hero.part.drum.wrong":
      "A blast or a sharp pressure change can tear it, but it usually heals within weeks. Muscles behind it take tens of milliseconds to brace against loud sound.",
    "hero.part.drum.profile": "Hearing sensitivity",
    "hero.part.drum.kind": "Conductive, usually heals",

    "hero.part.ossicles.title": "Malleus, incus, stapes",
    "hero.part.ossicles.short": "Bones",
    "hero.part.ossicles.what":
      "The three smallest bones in your body, levering the eardrum onto a window seventeen times smaller so the vibration is strong enough to move fluid.",
    "hero.part.ossicles.wrong":
      "Bone can stiffen or the chain can come apart. Either way, sound arrives quieter but undistorted. Luckily, a test can see it, because sound conducted through the skull skips these bones entirely and a gap opens between the two routes.",
    "hero.part.ossicles.profile": "Hearing sensitivity",
    "hero.part.ossicles.kind": "Conductive, often treatable",

    "hero.part.cochlea.title": "Cochlea",
    "hero.part.cochlea.short": "Cochlea",
    "hero.part.cochlea.what":
      "The Cochlea is a coiled tube filled with 35 mm of fluid. The Cochlea sorts high notes near the entrance and low notes deep inside.",
    "hero.part.cochlea.wrong":
      "Around 12,000 outer hair cells amplify quiet sound. Loud noise kills them, they don't grow back, and the ones nearest the entrance go first. That is the 4–6 kHz notch, and it can sit there for years before you notice anything missing.",
    "hero.part.cochlea.profile": "Hearing sensitivity and sound discrimination",
    "hero.part.cochlea.kind": "Sensorineural, permanent",

    "hero.part.nerve.title": "Auditory nerve",
    "hero.part.nerve.short": "Nerve",
    "hero.part.nerve.what":
      "The Auditory nerve contains roughly 30,000 fibres. The ones that fire tell your brain which pitch arrived. How they fire in time tells it where the sound came from.",
    "hero.part.nerve.wrong":
      "The connections between hair cells and nerve fibres can be lost while the hair cells themselves survive. In animals this happens after noise that leaves thresholds looking normal, and it is one suspected reason a person can pass a hearing test and still lose the thread in a loud bar.",
    "hero.part.nerve.profile": "Speech in noise",
    "hero.part.nerve.kind": "Sensorineural, and largely invisible to a threshold test",

    "hero.part.vestibular.title": "Semicircular canals",
    "hero.part.vestibular.short": "Balance canals",
    "hero.part.vestibular.what":
      "Three loops at right angles, filled with fluid that lags behind when you turn your head. These have nothing to do with hearing.",
    "hero.part.vestibular.wrong":
      "The semicircular canals share fluid and bone with the cochlea. Very loud sound makes some people briefly dizzy, and inner-ear disorders often take both hearing and balance. ",
    "hero.part.vestibular.profile":
      "Not measured — see a clinician about balance symptoms",
    "hero.part.vestibular.kind": "Off the hearing path",

    "hero.part.eustachian.title": "Eustachian tube",
    "hero.part.eustachian.short": "Eustachian tube",
    "hero.part.eustachian.what":
      "A valve down to the back of your throat. It flicks open when you swallow, which is why yawning fixes your ears on a plane.",
    "hero.part.eustachian.wrong":
      "When it stays shut, pressure behind the eardrum drops and fluid collects behind it. In children that is the commonest cause of hearing loss, and it is why a screening taken during a cold can look worse than you are.",
    "hero.part.eustachian.profile": "Hearing sensitivity, temporarily",
    "hero.part.eustachian.kind": "Conductive, usually temporary",
  },

  zh: {
    "hero.tagline": "为耳机世代打造的听力健康",
    "hero.title": "你听得见，但在嘈杂的酒吧里还跟得上对话吗？",
    "hero.lede":
      "研究显示，约 12~17% 的青少年存在未被察觉的听力相关问题。在嘈杂环境中跟不上对话就是一个信号。为了对抗快速的听力退化，Audiomaxxer 通过一次筛查测试建立五维听力档案——敏感度、噪声中言语、辨别力、注意力与记忆力——然后针对你最弱的一项进行训练并复测。",
    "hero.meter.label": "向耳朵里播放一个音",
    "hero.place.danger":
      "峰值位于距底部 {mm} 处——这段区域最先被噪声损伤，而阈值测试往往会直接略过它。",
    "hero.place.normal": "峰值位于距耳蜗底部 {mm} 处。",
    "hero.cta.test": "开始筛查",
    "hero.cta.profile": "查看示例档案",
    "hero.fine": "约四分钟，需要耳机。这是筛查，不是诊断。",
    "hero.hint": "把鼠标移到耳朵的某个部位可显示名称，点击可展开。",
    "hero.count": "已查看 {n} / {total} 个部位。",
    "hero.peek.more": "点击查看这里会出什么问题",
    "hero.close": "关闭",
    "hero.close.aria": "关闭详情",
    "hero.panel.wrong": "这里出问题时",
    "hero.panel.profile": "在档案中体现为",
    "hero.panel.path": "声音传导路径",
    "hero.panel.alongside": "相邻结构",
    "hero.done": "这就是完整的传导路径。筛查测量的是其中四处留下的影响。",
    "hero.done.cta": "开始你的筛查",
    "hero.svg.alt": "人耳剖面图。每个部位都可以聚焦并展开查看详情。",

    "hero.band.1": "更多是感觉到而非听到的低频",
    "hero.band.2": "嗓音中的温暖感",
    "hero.band.3": "元音——言语的主体",
    "hero.band.4": "最容易定位人声的频段",
    "hero.band.5": "辅音：t、k、s、f",
    "hero.band.6": "外耳道自身的共振",
    "hero.band.7": "噪声损伤最先出现的频段",
    "hero.band.8": "空气感、齿音、细节",

    "hero.lbl.outer": "外耳",
    "hero.lbl.canal": "外耳道",
    "hero.lbl.drum": "鼓膜",
    "hero.lbl.bones": "三块听小骨",
    "hero.lbl.balance": "半规管",
    "hero.lbl.cochlea": "耳蜗",
    "hero.lbl.nerve": "听神经",
    "hero.lbl.eustachian": "咽鼓管",
    "hero.annot.first": "最先受损",

    "hero.part.outer.title": "外耳",
    "hero.part.outer.short": "外耳",
    "hero.part.outer.what":
      "外耳的褶皱会根据声音来向改变音色，这就是你能分辨头顶的人声与身后人声的原因。",
    "hero.part.outer.wrong":
      "这里很少是问题所在，即使有问题通常也可以解决（例如耵聍或排不出的进水）。声音是被挡住而不是丢失，堵塞解除后就会恢复。",
    "hero.part.outer.profile": "听觉注意力",
    "hero.part.outer.kind": "传导性，通常是暂时的",

    "hero.part.canal.title": "外耳道",
    "hero.part.canal.short": "耳道",
    "hero.part.canal.what":
      "约 25 毫米长的管道。它的长度使其在 3 kHz 附近产生共振，而这正是承载辅音的频段。",
    "hero.part.canal.wrong":
      "入耳式耳机会把这条管道封住，破坏自然共振，并把发声单元放在距鼓膜仅几毫米处，因此实际到达的声压高于手机上显示的数值。",
    "hero.part.canal.profile": "听力敏感度",
    "hero.part.canal.kind": "传导性，通常是暂时的",

    "hero.part.drum.title": "鼓膜",
    "hero.part.drum.short": "鼓膜",
    "hero.part.drum.what":
      "一层铅笔橡皮头大小的薄膜。在你能听到的最轻声音下，它的位移小于一个原子的宽度。",
    "hero.part.drum.wrong":
      "爆震或剧烈的压力变化可能使其破裂，但通常几周内会自行愈合。它后方的肌肉需要几十毫秒才能对强声做出保护性收缩。",
    "hero.part.drum.profile": "听力敏感度",
    "hero.part.drum.kind": "传导性，通常可自愈",

    "hero.part.ossicles.title": "锤骨、砧骨、镫骨",
    "hero.part.ossicles.short": "听小骨",
    "hero.part.ossicles.what":
      "人体最小的三块骨头，把鼓膜的振动杠杆式地传到面积小十七倍的卵圆窗上，使振动足以推动液体。",
    "hero.part.ossicles.wrong":
      "骨质可能硬化，链条也可能断开。无论哪种情况，声音都会变轻但不失真。好在测试能发现它，因为经颅骨传导的声音会完全绕过这些小骨，两条通路之间就会出现差距。",
    "hero.part.ossicles.profile": "听力敏感度",
    "hero.part.ossicles.kind": "传导性，通常可治疗",

    "hero.part.cochlea.title": "耳蜗",
    "hero.part.cochlea.short": "耳蜗",
    "hero.part.cochlea.what":
      "耳蜗是一条盘旋的管道，内含 35 毫米长的液体通道。它把高音分配在入口附近，低音分配在深处。",
    "hero.part.cochlea.wrong":
      "约 12,000 个外毛细胞负责放大轻声。强噪声会杀死它们，且不会再生，靠近入口的最先受损。这就是 4–6 kHz 的凹陷，它可能存在多年而你毫无察觉。",
    "hero.part.cochlea.profile": "听力敏感度与声音辨别力",
    "hero.part.cochlea.kind": "感音神经性，不可逆",

    "hero.part.nerve.title": "听神经",
    "hero.part.nerve.short": "神经",
    "hero.part.nerve.what":
      "听神经约含三万条纤维。哪些纤维放电告诉大脑到达的是什么音高，它们放电的时间关系则告诉大脑声音来自哪里。",
    "hero.part.nerve.wrong":
      "毛细胞与神经纤维之间的连接可能丢失，而毛细胞本身仍然存活。在动物实验中，噪声暴露后阈值看起来正常却出现这种情况，这被认为是有人能通过听力测试却在嘈杂酒吧里跟不上对话的原因之一。",
    "hero.part.nerve.profile": "噪声中言语",
    "hero.part.nerve.kind": "感音神经性，且阈值测试基本看不出来",

    "hero.part.vestibular.title": "半规管",
    "hero.part.vestibular.short": "半规管",
    "hero.part.vestibular.what":
      "三个互成直角的环状管道，内部液体在你转头时会滞后。它们与听觉无关。",
    "hero.part.vestibular.wrong":
      "半规管与耳蜗共用液体和骨质结构。极强的声音会让一些人短暂眩晕，而内耳疾病往往同时影响听觉与平衡。",
    "hero.part.vestibular.profile": "不在测量范围内——平衡症状请就医",
    "hero.part.vestibular.kind": "不在听觉通路上",

    "hero.part.eustachian.title": "咽鼓管",
    "hero.part.eustachian.short": "咽鼓管",
    "hero.part.eustachian.what":
      "通往咽喉后部的一个阀门。吞咽时它会短暂打开，这就是打哈欠能缓解坐飞机时耳闷的原因。",
    "hero.part.eustachian.wrong":
      "当它持续闭合时，鼓膜后方压力下降并积液。这是儿童听力下降最常见的原因，也是感冒期间做筛查结果会偏差的原因。",
    "hero.part.eustachian.profile": "暂时性的听力敏感度下降",
    "hero.part.eustachian.kind": "传导性，通常是暂时的",
  },

  es: {
    "hero.tagline": "salud auditiva para la generación de los auriculares",
    "hero.title": "Oyes bien. ¿Pero puedes seguir una conversación en un bar ruidoso?",
    "hero.lede":
      "Los estudios muestran que entre el 12 y el 17 % de los adolescentes tiene problemas auditivos que pasan desapercibidos. No poder seguir una conversación en un lugar ruidoso es una señal. Para combatir la pérdida auditiva acelerada, Audiomaxxer usa una prueba de cribado para crear un perfil de escucha de cinco partes — sensibilidad, habla en ruido, discriminación, atención y memoria — y luego entrena tu habilidad más débil y la vuelve a medir.",
    "hero.meter.label": "Reproduce un tono dentro del oído",
    "hero.place.danger":
      "Su pico está a {mm} de la base: el tramo que el ruido daña primero y que una prueba de umbrales puede pasar por alto.",
    "hero.place.normal": "Su pico está a {mm} de la base de la cóclea.",
    "hero.cta.test": "Empezar un cribado",
    "hero.cta.profile": "Ver un perfil de ejemplo",
    "hero.fine": "Unos cuatro minutos, con auriculares. Es un cribado, no un diagnóstico.",
    "hero.hint": "Pasa el cursor por una parte del oído para verla; haz clic para abrirla.",
    "hero.count": "{n} de {total} abiertas.",
    "hero.peek.more": "Haz clic para ver qué falla aquí",
    "hero.close": "Cerrar",
    "hero.close.aria": "Cerrar detalles",
    "hero.panel.wrong": "Cuando esto falla",
    "hero.panel.profile": "Aparece en tu perfil como",
    "hero.panel.path": "El recorrido de la señal",
    "hero.panel.alongside": "Junto a él",
    "hero.done":
      "Ese es el recorrido completo. Un cribado mide lo que dejan cuatro de estas partes.",
    "hero.done.cta": "Empieza el tuyo",
    "hero.svg.alt":
      "Corte transversal del oído humano. Cada parte puede enfocarse y abrirse para ver detalles.",

    "hero.band.1": "graves que sientes más que oyes",
    "hero.band.2": "la calidez de una voz",
    "hero.band.3": "vocales: el cuerpo del habla",
    "hero.band.4": "donde una voz es más fácil de ubicar",
    "hero.band.5": "consonantes: t, k, s, f",
    "hero.band.6": "la resonancia propia del canal auditivo",
    "hero.band.7": "donde empieza el daño por ruido",
    "hero.band.8": "aire, sibilancia, detalle",

    "hero.lbl.outer": "Oído externo",
    "hero.lbl.canal": "Canal auditivo",
    "hero.lbl.drum": "Tímpano",
    "hero.lbl.bones": "Tres huesecillos",
    "hero.lbl.balance": "Canales del equilibrio",
    "hero.lbl.cochlea": "Cóclea",
    "hero.lbl.nerve": "Nervio auditivo",
    "hero.lbl.eustachian": "Trompa de Eustaquio",
    "hero.annot.first": "los primeros en caer",

    "hero.part.outer.title": "Oído externo",
    "hero.part.outer.short": "Oído externo",
    "hero.part.outer.what":
      "Los pliegues del oído externo tiñen el sonido según de dónde venga, y así distingues una voz encima de ti de otra detrás de ti.",
    "hero.part.outer.wrong":
      "Rara vez es el problema, y cuando lo es suele tener solución (cera o agua que no sale). El sonido queda bloqueado, no perdido, así que vuelve cuando se retira el bloqueo.",
    "hero.part.outer.profile": "Atención auditiva",
    "hero.part.outer.kind": "Conductiva, normalmente temporal",

    "hero.part.canal.title": "Canal auditivo",
    "hero.part.canal.short": "Canal",
    "hero.part.canal.what":
      "Unos 25 mm de tubo. Su longitud lo hace resonar cerca de los 3 kHz, la banda que lleva las consonantes.",
    "hero.part.canal.wrong":
      "Un auricular de botón sella este tubo. Eso anula la resonancia natural y coloca un altavoz a milímetros del tímpano, así que el nivel que llega es mayor de lo que sugiere el número en tu móvil.",
    "hero.part.canal.profile": "Sensibilidad auditiva",
    "hero.part.canal.kind": "Conductiva, normalmente temporal",

    "hero.part.drum.title": "Tímpano",
    "hero.part.drum.short": "Tímpano",
    "hero.part.drum.what":
      "Una membrana del ancho de una goma de lápiz. Con el sonido más débil que puedes oír se mueve menos que el ancho de un solo átomo.",
    "hero.part.drum.wrong":
      "Una explosión o un cambio brusco de presión pueden romperlo, pero suele curarse en semanas. Los músculos que hay detrás tardan decenas de milisegundos en protegerlo del sonido fuerte.",
    "hero.part.drum.profile": "Sensibilidad auditiva",
    "hero.part.drum.kind": "Conductiva, suele curarse",

    "hero.part.ossicles.title": "Martillo, yunque, estribo",
    "hero.part.ossicles.short": "Huesecillos",
    "hero.part.ossicles.what":
      "Los tres huesos más pequeños del cuerpo: hacen palanca del tímpano a una ventana diecisiete veces menor para que la vibración mueva el líquido.",
    "hero.part.ossicles.wrong":
      "El hueso puede rigidizarse o la cadena puede separarse. En ambos casos el sonido llega más flojo pero sin distorsión. Por suerte una prueba lo detecta, porque el sonido conducido por el cráneo se salta estos huesos y se abre una diferencia entre ambas vías.",
    "hero.part.ossicles.profile": "Sensibilidad auditiva",
    "hero.part.ossicles.kind": "Conductiva, a menudo tratable",

    "hero.part.cochlea.title": "Cóclea",
    "hero.part.cochlea.short": "Cóclea",
    "hero.part.cochlea.what":
      "La cóclea es un tubo enrollado con 35 mm de líquido. Ordena los agudos cerca de la entrada y los graves en el fondo.",
    "hero.part.cochlea.wrong":
      "Unas 12.000 células ciliadas externas amplifican el sonido débil. El ruido fuerte las mata, no se regeneran y las más cercanas a la entrada caen primero. Ese es el bache de 4–6 kHz, y puede estar ahí años antes de que notes nada.",
    "hero.part.cochlea.profile": "Sensibilidad auditiva y discriminación del sonido",
    "hero.part.cochlea.kind": "Neurosensorial, permanente",

    "hero.part.nerve.title": "Nervio auditivo",
    "hero.part.nerve.short": "Nervio",
    "hero.part.nerve.what":
      "El nervio auditivo tiene unas 30.000 fibras. Cuáles se activan le dice a tu cerebro qué tono llegó; cómo se activan en el tiempo le dice de dónde vino el sonido.",
    "hero.part.nerve.wrong":
      "Las conexiones entre células ciliadas y fibras nerviosas pueden perderse aunque las células sobrevivan. En animales ocurre tras ruido que deja umbrales normales, y es una de las causas sospechadas de que alguien pase una prueba auditiva y aun así pierda el hilo en un bar ruidoso.",
    "hero.part.nerve.profile": "Habla en ruido",
    "hero.part.nerve.kind": "Neurosensorial, y casi invisible para una prueba de umbrales",

    "hero.part.vestibular.title": "Canales semicirculares",
    "hero.part.vestibular.short": "Canales del equilibrio",
    "hero.part.vestibular.what":
      "Tres bucles en ángulo recto, llenos de líquido que se retrasa cuando giras la cabeza. No tienen nada que ver con la audición.",
    "hero.part.vestibular.wrong":
      "Los canales semicirculares comparten líquido y hueso con la cóclea. El sonido muy fuerte marea brevemente a algunas personas, y los trastornos del oído interno suelen afectar a la vez a la audición y al equilibrio.",
    "hero.part.vestibular.profile":
      "No se mide: consulta a un profesional si tienes síntomas de equilibrio",
    "hero.part.vestibular.kind": "Fuera del recorrido auditivo",

    "hero.part.eustachian.title": "Trompa de Eustaquio",
    "hero.part.eustachian.short": "Trompa de Eustaquio",
    "hero.part.eustachian.what":
      "Una válvula que baja al fondo de la garganta. Se abre al tragar, y por eso bostezar te destapa los oídos en un avión.",
    "hero.part.eustachian.wrong":
      "Cuando queda cerrada, la presión detrás del tímpano baja y se acumula líquido. En niños es la causa más común de pérdida auditiva, y por eso un cribado hecho con un resfriado puede salir peor de lo que estás.",
    "hero.part.eustachian.profile": "Sensibilidad auditiva, temporalmente",
    "hero.part.eustachian.kind": "Conductiva, normalmente temporal",
  },
};
