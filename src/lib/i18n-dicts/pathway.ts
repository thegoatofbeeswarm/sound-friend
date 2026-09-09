export const pathwayPack: {
  en: Record<string, string>;
  zh: Record<string, string>;
  es: Record<string, string>;
} = {
  en: {
    /* nav + science index */
    "nav.pathway": "Auditory pathway",
    "sci.link.pathway.label": "The auditory pathway",
    "sci.link.pathway.blurb":
      "Follow a sound from the cochlea to the cortex, relay by relay, and see where each part of your listening profile is decided.",

    /* hero teaser */
    "path.hero.gate": "Enter the ear",
    "path.hero.gate.sub": "follow the signal to the brain",
    "path.hero.cta": "Follow the nerve to the brain",
    "path.hero.step": "Brain",

    /* page shell */
    "path.badge": "Where hearing becomes thinking",
    "path.h1": "The signal leaves your ear in about one millisecond. It has sixteen more to go.",
    "path.lead":
      "The screening measures what arrives at the auditory nerve. Everything you actually understand from a conversation is assembled after that, across six relays and a sheet of cortex. This is that stretch of the path, and the part Audiomaxxer aims to train.",
    "path.disclaimer":
      "An explainer, not a diagnosis. Timings are typical values from brainstem-response recordings and vary between people.",

    /* controls */
    "path.stage.pathway": "Ascending pathway",
    "path.stage.cortex": "Auditory cortex",
    "path.back": "Back to the pathway",
    "path.fire": "Send a click through",
    "path.firing": "Travelling",
    "path.readout": "ms since the eardrum moved",
    "path.open.cortex": "Open the cortex map",
    "path.intro.title": "Six relays, seventeen milliseconds",
    "path.intro.body":
      "A sound that reached your eardrum a moment ago is already most of the way to the cortex. It has already been split, timed, compared between your two ears, and gated by attention before you have any idea what it was.\u00a0\n\n\nTouch a relay to see what it does to the signal, and what happens to your listening when that relay runs degraded.",
    "path.cortex.intro.title": "Past the thalamus there is no more signal processing",
    "path.cortex.intro.body":
      "Only interpretation. Each of these regions turns sound into something else — a pattern, a word, a held thought, a memory. Touch one to see what it contributes, which part of your listening profile it lands in, and which exercise loads it.",

    /* panel labels */
    "path.label.does": "What it does to the signal",
    "path.label.mind": "Why it matters upstairs",
    "path.label.train": "What Audiomaxxer trains here",
    "path.label.role": "What it does",
    "path.label.link": "The cognitive link",
    "path.label.drill": "How Audiomaxxer trains it",
    "path.label.profile": "Shows up in your profile as",
    "path.go.train": "Open this exercise",
    "path.go.test": "Start a screening",

    /* diagram annotations */
    "path.svg.alt":
      "Coronal section of the brain showing the auditory pathway from both cochleae up to the auditory cortex.",
    "path.cortex.svg.alt":
      "Lateral view of the left hemisphere showing the auditory regions of cortex.",
    "path.anno.rightEar": "Right ear",
    "path.anno.rightEar.sub": "crosses to the left hemisphere",
    "path.anno.leftEar": "Left ear",
    "path.anno.leftEar.sub": "crosses to the right",
    "path.anno.cross": "midline crossing at the trapezoid body",
    "path.anno.cortex": "Auditory cortex",
    "path.anno.fissure": "fissure drawn opened, so Heschl’s gyrus is visible",

    /* stations */
    "path.st.cochlea.name": "Cochlea",
    "path.st.cochlea.does":
      "Hair cells turn pressure into electrical spikes, using the pitch to sort them: high notes go near the entrance and low notes go deep inside. Every stage above inherits that map.",
    "path.st.cochlea.mind":
      "This is your fidelity ceiling - nothing further up can recover detail the cochlea never encoded, which is why the 4–6 kHz notch quietly costs you consonants.",
    "path.st.cochlea.train":
      "* Frequency discrimination asks how small a pitch difference you can still resolve.\u00a0\n\n\n* High-frequency recognition checks the bands noise takes first.",
    "path.st.cochlea.profile": "Hearing sensitivity and sound discrimination",

    "path.st.cn.name": "Cochlear nucleus",
    "path.st.cn.does":
      "The Cochlear nucleus is the first synapse past the auditory nerve. The signal forks into parallel streams, with one tracking onset timing to the microsecond and another tracking sustained texture.",
    "path.st.cn.mind":
      "Onset timing is how you tell “ba” from “pa” (for example). Consonants live in the first 40 milliseconds of a syllable and carry most of the meaning - this is why a muffled phone call costs you words, rather than volume",
    "path.st.cn.train":
      "Phone call and high-frequency recognition both push you onto onsets, where the band-limited signal leaves you least to work with.",
    "path.st.cn.profile": "Sound discrimination",

    "path.st.soc.name": "Superior olivary complex",
    "path.st.soc.does":
      "The Superior olivary complex is the first place your two ears meet. It compares the arrival times between them (down to about ten millionths of a second) and builds a map of space out of the difference.",
    "path.st.soc.mind":
      "Spatial hearing is what lets you aim attention at one talker in a loud room; without it, every voice arrives from the same place at once, and the room noise turns to mush.",
    "path.st.soc.train":
      "Sound localization moves a target between left, centre and right and narrows the spread as you get it right.",
    "path.st.soc.profile": "Auditory attention",

    "path.st.ic.name": "Inferior colliculus",
    "path.st.ic.does":
      "Nearly every ascending fiber synapses here. The midbrain hub tunes to rhythm and amplitude modulation- the envelope of speech- roughly from 4 to 16 cycles per second.",
    "path.st.ic.mind":
      "Syllable rate lives in this band, so tracking the envelope helps you keep your place in a sentence instead of losing the meaning halfway through.",
    "path.st.ic.train":
      "Rapid speech compresses word meaning until you have to pretend to know what the other person is saying; for example, a street corner might muffle the meaning of a conversation",
    "path.st.ic.profile": "Auditory memory",

    "path.st.mgn.name": "Medial geniculate nucleus",
    "path.st.mgn.does":
      "This is the thalamic gate. The cortex sends more fibers down here than it receives back up, so listening attention decides what gets through.",
    "path.st.mgn.mind":
      "This is where listening separates from hearing: selective attention is a gate on the way in, not a filter you apply after the fact, which is why you can miss a sentence even if it's spoken clearly at normal volume.",
    "path.st.mgn.train":
      "Everyday sounds and a street corner both force you hold one stream while another plays.",
    "path.st.mgn.profile": "Auditory attention",

    "path.st.a1.name": "Auditory cortex",
    "path.st.a1.does":
      "The spike reaches Heschl’s gyrus still arranged by frequency. The first cortical response lands near 17 milliseconds.",
    "path.st.a1.mind":
      "Everything past this point is interpretation. Pattern, then word, then meaning, memory, etc.",
    "path.st.a1.train": "This is where most of Audiomaxxer’s training lands.",
    "path.st.a1.profile": "All five dimensions",

    /* cortical regions */
    "path.rg.a1.name": "Heschl’s gyrus",
    "path.rg.a1.sub": "Primary auditory cortex",
    "path.rg.a1.role":
      "The frequency map, ported almost intact from the cochlea. It encodes pitch, timing and level before any of it means anything.",
    "path.rg.a1.mind":
      "Resolution. How finely this region separates two nearby sounds sets the ceiling on every judgment made downstream — including which word you think you just heard.",
    "path.rg.a1.train":
      "Frequency discrimination narrows the gap between two tones until you stop being able to call it. High-frequency recognition does the same across bands.",
    "path.rg.a1.profile": "Sound discrimination",

    "path.rg.belt.name": "Belt and planum temporale",
    "path.rg.belt.sub": "Sound patterns",
    "path.rg.belt.role":
      "A ring of secondary areas that stop treating sound as frequencies and start treating it as objects: this voice, that engine, those footsteps.",
    "path.rg.belt.mind":
      "The cocktail party problem. Your brain has to decide which fragments belong to the same source before it can decode any of them, so grouping comes before understanding.",
    "path.rg.belt.train":
      "Speech in conversation noise adapts the signal-to-noise ratio: babble closes in when you get it right and backs off when you miss. Restaurant table adds the clatter.",
    "path.rg.belt.profile": "Speech in noise",

    "path.rg.wernicke.name": "Wernicke’s area",
    "path.rg.wernicke.sub": "Word meaning",
    "path.rg.wernicke.role":
      "Posterior superior temporal cortex maps sound patterns onto stored words. Damage here leaves hearing intact and comprehension gone.",
    "path.rg.wernicke.mind":
      "Lexical access speed. Fast conversation gives you roughly 200 milliseconds a word — if access lags, you lose the sentence rather than the word.",
    "path.rg.wernicke.train":
      "Rapid speech forces the decision earlier each round. Phone call strips the top of the band so you have to decide on less.",
    "path.rg.wernicke.profile": "Sound discrimination and memory",

    "path.rg.arcuate.name": "Arcuate fasciculus",
    "path.rg.arcuate.sub": "The phonological loop",
    "path.rg.arcuate.role":
      "The Arcuate fasciculus is a white-matter bundle that carries sound from the temporal to the frontal cortex, allowing you to hold a sound in mind and rehearse it silently.",
    "path.rg.arcuate.mind":
      "This connects to verbal working memory; without it, you couldn't remember a phone number before dialing it, follow the meaning of a long sentence from start to finish, or recall someone's name immediately after meeting them. ",
    "path.rg.arcuate.train":
      "Conversation simulation asks a question after the exchange, not during it, so the material has to be held rather than reacted to.",
    "path.rg.arcuate.profile": "Auditory memory",

    "path.rg.broca.name": "Inferior frontal gyrus",
    "path.rg.broca.sub": "Prediction",
    "path.rg.broca.role":
      "Frontal speech regions do not only produce speech but also predict it,  sending expected sounds back down to temporal cortex before those sounds arrive.",
    "path.rg.broca.mind":
      "Hearing well in a loud environment depends on your ability to predict speech; instead of deciphering every muffled word, your brain relies on anticipation and real-time context clues. A stronger familiarity with the language provides a better mental blueprint, making it much easier to isolate a clean signal from the background noise. ",
    "path.rg.broca.train":
      "Speech in conversation noise and Street corner both leave the meaning in words unknown, so you have to practice to avoid this.",
    "path.rg.broca.profile": "Speech in noise",

    "path.rg.dlpfc.name": "Dorsolateral prefrontal cortex",
    "path.rg.dlpfc.sub": "Listening effort",
    "path.rg.dlpfc.role":
      "When the signal is poor, the prefrontal cortex is recruited to hold it together. This is shown as pupil dialtion and fatigue in daily life.",
    "path.rg.dlpfc.mind":
      "Mental energy is finite; when you are at a loud dinner, your brain spends so much effort just straining to hear the words that it lacks the power to actually store them in your memory. That is why you leave feeling completely exhausted yet unable to recall what was said.",
    "path.rg.dlpfc.train":
      "Everyday sounds and Street corner run long enough to load sustained attention rather than a single snap judgment.",
    "path.rg.dlpfc.profile": "Auditory attention",

    "path.rg.hippo.name": "Hippocampus",
    "path.rg.hippo.sub": "Encoding to memory",
    "path.rg.hippo.role":
      "Medial temporal structures bind what you heard to when and where you heard it, turning a perceived sentence into something you can retrieve later.",
    "path.rg.hippo.mind":
      "The Lancet Commission on dementia ranks hearing loss as the largest single modifiable midlife risk factor in its model: degraded input, withdrawal from conversation and years of extra effort compound. The link is an association rather than a demonstrated cause, and it is one reason to take an unnoticed loss seriously at twenty rather than sixty.",
    "path.rg.hippo.train":
      "Restaurant table and Conversation simulation both ask what was said, minutes later, rather than what you heard just now.",
    "path.rg.hippo.profile": "Auditory memory",
  },

  zh: {
    "nav.pathway": "听觉通路",
    "sci.link.pathway.label": "听觉通路",
    "sci.link.pathway.blurb": "跟随一个声音从耳蜗到皮层，逐站前行，看看你听力档案的每一项是在哪里决定的。",

    "path.hero.gate": "进入耳朵",
    "path.hero.gate.sub": "跟随信号进入大脑",
    "path.hero.cta": "沿听神经进入大脑",
    "path.hero.step": "大脑",

    "path.badge": "听觉如何变成思考",
    "path.h1": "信号离开耳朵只需约一毫秒，而它还有十六毫秒的路要走。",
    "path.lead":
      "筛查测量的是抵达听神经的信号。而你从一段对话中真正理解到的一切，都是在那之后组装起来的——经过六个中继站和一片皮层。这就是那段路程，也正是 Audiomaxxer 训练的部分。",
    "path.disclaimer":
      "这是科普说明，不是诊断。时间为脑干反应记录的典型值，因人而异。",

    "path.stage.pathway": "上行听觉通路",
    "path.stage.cortex": "听觉皮层",
    "path.back": "返回通路",
    "path.fire": "发送一次咔哒声",
    "path.firing": "传导中",
    "path.readout": "毫秒（自鼓膜振动起）",
    "path.open.cortex": "打开皮层图",
    "path.intro.title": "六个中继站，十七毫秒",
    "path.intro.body":
      "刚刚抵达你鼓膜的声音，此刻已快要到达皮层。在你意识到那是什么之前，它已被拆分、计时、在双耳之间比较，并由注意力把关。点击任一中继站，看看它对信号做了什么，以及当它运作不良时你的听觉会发生什么。",
    "path.cortex.intro.title": "越过丘脑，就不再有信号处理",
    "path.cortex.intro.body":
      "只剩下解读。这里的每个区域都把声音变成别的东西——一种模式、一个词、一个被暂存的念头、一段记忆。点击其中一个，看它的作用、它对应你听力档案中的哪一项，以及哪项练习会用到它。",

    "path.label.does": "它对信号做了什么",
    "path.label.mind": "为什么它对上游重要",
    "path.label.train": "Audiomaxxer 在这里训练什么",
    "path.label.role": "它的作用",
    "path.label.link": "与认知的关联",
    "path.label.drill": "Audiomaxxer 如何训练它",
    "path.label.profile": "在你的档案中体现为",
    "path.go.train": "打开这项练习",
    "path.go.test": "开始筛查",

    "path.svg.alt": "大脑冠状切面，显示从双侧耳蜗上行至听觉皮层的听觉通路。",
    "path.cortex.svg.alt": "左半球外侧面，显示皮层的各听觉区域。",
    "path.anno.rightEar": "右耳",
    "path.anno.rightEar.sub": "交叉至左半球",
    "path.anno.leftEar": "左耳",
    "path.anno.leftEar.sub": "交叉至右半球",
    "path.anno.cross": "在斜方体处越过中线",
    "path.anno.cortex": "听觉皮层",
    "path.anno.fissure": "外侧裂已画开，以便看到颞横回",

    "path.st.cochlea.name": "耳蜗",
    "path.st.cochlea.does":
      "毛细胞把压力变成电脉冲，并按音高排列：高音靠近入口，低音深藏其内。上游每一站都沿用这张图。",
    "path.st.cochlea.mind":
      "这是你的保真度上限。耳蜗从未编码的细节，上游谁也补不回来——这正是 4–6 kHz 的凹陷会悄悄夺走辅音的原因。",
    "path.st.cochlea.train":
      "频率辨别测你还能分辨多小的音高差异；高频识别检查噪声最先夺走的那几个频段。",
    "path.st.cochlea.profile": "听觉敏感度与声音辨别",

    "path.st.cn.name": "耳蜗核",
    "path.st.cn.does":
      "听神经之后的第一个突触。信号在此分成并行的通道——一条以微秒精度追踪起始时刻，另一条追踪持续的音色纹理。",
    "path.st.cn.mind":
      "起始时刻的精度决定你能否分清「ba」和「pa」。辅音藏在一个音节的前 40 毫秒里，承载了大部分含义——所以模糊的通话让你丢的是词，而不是音量。",
    "path.st.cn.train":
      "通话与高频识别都把你逼向起始段，那里带宽受限，留给你的线索最少。",
    "path.st.cn.profile": "声音辨别",

    "path.st.soc.name": "上橄榄复合体",
    "path.st.soc.does":
      "双耳信息第一次汇合的地方。它比较声音到达两耳的时间差——精细到约千万分之一秒——并据此构建出空间地图。",
    "path.st.soc.mind":
      "空间听觉让你能在嘈杂房间里把注意力对准某一个说话者。失去它，所有声音都从同一个方位一起涌来，整个房间糊成一片。",
    "path.st.soc.train":
      "声源定位在左、中、右之间移动目标，并随着你答对而缩小间距。",
    "path.st.soc.profile": "听觉注意力",

    "path.st.ic.name": "下丘",
    "path.st.ic.does":
      "几乎所有上行纤维都在此换元。这个中脑枢纽对节律和幅度调制敏感——也就是语音的包络，大约每秒 4 到 16 次。",
    "path.st.ic.mind":
      "音节速率就落在这个频段。追踪包络，是你在一句话里不掉队的方式，而不是听到一半就断了线。",
    "path.st.ic.train":
      "快速语音把包络压缩到你必须紧跟；街角则把它埋进调制速率相近的车流噪声里。",
    "path.st.ic.profile": "听觉记忆",

    "path.st.mgn.name": "内侧膝状体",
    "path.st.mgn.does":
      "丘脑的闸门。皮层下行到它的纤维比上行回来的还多，所以在这里由注意力决定什么能通过。",
    "path.st.mgn.mind":
      "这就是「听」与「听见」分道扬镳的地方。选择性注意是入口处的一道闸，而不是事后加的滤镜——所以你可能漏掉一句音量正常、口齿清楚的话。",
    "path.st.mgn.train": "日常声音与街角都要求你在另一条声流干扰下守住一条。",
    "path.st.mgn.profile": "听觉注意力",

    "path.st.a1.name": "听觉皮层",
    "path.st.a1.does":
      "脉冲抵达颞横回时，仍按频率排列。首个皮层反应约在 17 毫秒出现——但你还要再过 100 到 300 毫秒才知道自己听到了什么。",
    "path.st.a1.mind": "从这里开始，全是解读：先是模式，再是词，然后是意义，最后是记忆。",
    "path.st.a1.train": "Audiomaxxer 的大部分训练都落在这里。",
    "path.st.a1.profile": "全部五个维度",

    "path.rg.a1.name": "颞横回",
    "path.rg.a1.sub": "初级听觉皮层",
    "path.rg.a1.role":
      "几乎原封不动地承接了耳蜗的频率图。它在一切产生意义之前，先编码音高、时间和强度。",
    "path.rg.a1.mind":
      "分辨率。这个区域能把两个相近的声音分得多细，就决定了下游每一次判断的上限——包括你以为自己听到的是哪个词。",
    "path.rg.a1.train":
      "频率辨别不断缩小两个音之间的差距，直到你判断不出来；高频识别在各频段之间做同样的事。",
    "path.rg.a1.profile": "声音辨别",

    "path.rg.belt.name": "带状区与颞平面",
    "path.rg.belt.sub": "声音模式",
    "path.rg.belt.role":
      "一圈次级区域，不再把声音当作频率，而开始当作物体：这个人的嗓音、那台引擎、那阵脚步声。",
    "path.rg.belt.mind":
      "鸡尾酒会难题。大脑必须先判断哪些碎片来自同一个声源，才谈得上解码其中任何一个——归组先于理解。",
    "path.rg.belt.train":
      "对话噪声中的言语会自适应调整信噪比：答对了人声嘈杂就逼近，答错了就退开。餐厅餐桌再加上碗碟声。",
    "path.rg.belt.profile": "噪声中的言语",

    "path.rg.wernicke.name": "韦尼克区",
    "path.rg.wernicke.sub": "词义",
    "path.rg.wernicke.role":
      "颞上回后部把声音模式映射到已存储的词。此处受损，听力完好，理解却没了。",
    "path.rg.wernicke.mind":
      "词汇提取的速度。快速对话大约每个词只给你 200 毫秒——提取一慢，你丢的是整句，而不只是那个词。",
    "path.rg.wernicke.train":
      "快速语音每一轮都把判断时点提前；通话则削掉高频，让你凭更少的线索决定。",
    "path.rg.wernicke.profile": "声音辨别与记忆",

    "path.rg.arcuate.name": "弓状束",
    "path.rg.arcuate.sub": "语音回路",
    "path.rg.arcuate.role":
      "把声音从颞叶送往额叶的白质纤维束，让你能把一个声音留在脑中默默复诵。",
    "path.rg.arcuate.mind":
      "言语工作记忆。把一串号码记到拨出去为止，跟着一个长句子直到它的动词，或者只听一次就记住一个名字。",
    "path.rg.arcuate.train":
      "对话模拟在交流结束之后才提问，而不是当场提问，所以内容必须被记住，而不是被即时反应掉。",
    "path.rg.arcuate.profile": "听觉记忆",

    "path.rg.broca.name": "额下回",
    "path.rg.broca.sub": "预测",
    "path.rg.broca.role":
      "额叶言语区不只产生言语，还预测言语——在声音抵达之前，就把预期的声音下传回颞叶。",
    "path.rg.broca.mind":
      "听，有一半是猜得准。在噪声里你与其说是在解码，不如说是在预测并核对；对语言的模型越好，信号就越干净。",
    "path.rg.broca.train":
      "对话噪声中的言语与街角都会留下信号本身填不满的空档，只能由你补上。",
    "path.rg.broca.profile": "噪声中的言语",

    "path.rg.dlpfc.name": "背外侧前额叶皮层",
    "path.rg.dlpfc.sub": "听觉努力",
    "path.rg.dlpfc.role":
      "信号变差时，前额叶被调来把它撑住。这份代价在实验室里表现为瞳孔放大，在日常里表现为疲惫。",
    "path.rg.dlpfc.mind":
      "努力是零和的。用来解码一个模糊嗓音的资源，就不会用来记住它说了什么——这就是为什么你从嘈杂的聚餐出来筋疲力尽，却想不起聊了些什么。",
    "path.rg.dlpfc.train":
      "日常声音与街角的时长足够长，考的是持续注意，而不是一次瞬间判断。",
    "path.rg.dlpfc.profile": "听觉注意力",

    "path.rg.hippo.name": "海马",
    "path.rg.hippo.sub": "编码进记忆",
    "path.rg.hippo.role":
      "内侧颞叶结构把你听到的内容与听到的时间、地点绑定，使一句被感知到的话变成日后可以取回的东西。",
    "path.rg.hippo.mind":
      "《柳叶刀》痴呆委员会在其模型中，把听力损失列为中年时期最大的单项可改变风险因素：信号变差、逐渐退出交谈、加上多年的额外努力，叠加起来。这是相关而非已证实的因果关系，但它也是一个理由——不该等到六十岁，而该在二十岁就认真对待未被察觉的听力损失。",
    "path.rg.hippo.train":
      "餐厅餐桌与对话模拟问的都是几分钟前「说了什么」，而不是此刻「你听到了什么」。",
    "path.rg.hippo.profile": "听觉记忆",
  },

  es: {
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
  },
};
