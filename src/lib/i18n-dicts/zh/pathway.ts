const strings: Record<string, string> = {
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
};

export default strings;
