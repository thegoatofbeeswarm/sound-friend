/** English strings (pathway). Chinese and Spanish are in ./zh/pathway.ts and ./es/pathway.ts and load only when chosen. */
export const pathwayPack: Record<string, string> = {
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
    "The screening measures what arrives at the auditory nerve. Everything you understand from a conversation is assembled after that, across six relays and a sheet of cortex. This is that stretch of the path, and the part Audiomaxxer aims to train.",
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
    "A sound that reached your eardrum a moment ago is already most of the way to the cortex. By the time you know what it was, it has been split, timed, compared between your ears and filtered by attention.\u00a0\n\n\nTouch a relay to see what it does to the signal, and what happens to your listening when it works poorly.",
  "path.cortex.intro.title": "Past the thalamus there is no more signal processing",
  "path.cortex.intro.body":
    "These regions work together to turn sound into a word with meaning. Touch one to see what it adds, which part of your listening profile it feeds, and which exercise works it.",

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
    "This sets your fidelity ceiling. Nothing further up can recover detail the cochlea never encoded, which is why the 4–6 kHz notch costs you consonants before you notice it.",
  "path.st.cochlea.train":
    "* Frequency discrimination asks how small a pitch difference you can still resolve.\u00a0\n\n\n* High-frequency recognition checks the bands noise takes first.",
  "path.st.cochlea.profile": "Hearing sensitivity and sound discrimination",

  "path.st.cn.name": "Cochlear nucleus",
  "path.st.cn.does":
    "The cochlear nucleus is the first synapse past the auditory nerve. Here the signal splits into parallel streams: one tracks onset timing to the microsecond, another tracks sustained texture.",
  "path.st.cn.mind":
    "Onset timing is how you tell \"ba\" from \"pa\". Consonants sit in the first 40 milliseconds of a syllable and carry most of the meaning, which is why a muffled phone call costs you words even when the volume is fine.",
  "path.st.cn.train":
    "Phone call and high-frequency recognition both push you onto onsets, where the band-limited signal leaves you least to work with.",
  "path.st.cn.profile": "Sound discrimination",

  "path.st.soc.name": "Superior olivary complex",
  "path.st.soc.does":
    "The superior olivary complex is where your two ears first meet. It compares arrival times between them, down to about ten millionths of a second, and builds a map of space from the difference.",
  "path.st.soc.mind":
    "Spatial hearing lets you aim your attention at one talker in a loud room. Without it, every voice seems to come from the same place and the room noise turns to mush.",
  "path.st.soc.train":
    "Sound localization moves a target between left, centre and right and narrows the spread as you get it right.",
  "path.st.soc.profile": "Auditory attention",

  "path.st.ic.name": "Inferior colliculus",
  "path.st.ic.does":
    "Nearly every ascending fiber synapses here. This midbrain hub tunes to rhythm and amplitude modulation, the envelope of speech, at roughly 4 to 16 cycles per second.",
  "path.st.ic.mind":
    "Syllable rate falls in this band, so tracking the envelope helps you keep your place in a sentence.",
  "path.st.ic.train":
    "Rapid speech packs the words closer together until you start guessing what was said. Street corner buries a conversation in street noise.",
  "path.st.ic.profile": "Auditory memory",

  "path.st.mgn.name": "Medial geniculate nucleus",
  "path.st.mgn.does":
    "This is the thalamic gate. The cortex sends more fibers down here than it receives back, so your attention decides what gets through.",
  "path.st.mgn.mind":
    "Listening separates from hearing here. Selective attention works as a gate on the way in, which is why you can miss a sentence spoken clearly at normal volume.",
  "path.st.mgn.train":
    "Everyday sounds and Street corner both make you hold one stream while another plays.",
  "path.st.mgn.profile": "Auditory attention",

  "path.st.a1.name": "Auditory cortex",
  "path.st.a1.does":
    "The spike reaches Heschl’s gyrus still arranged by frequency. The first cortical response lands near 17 milliseconds.",
  "path.st.a1.mind":
    "Everything past this point is interpretation: pattern, then word, then meaning and memory.",
  "path.st.a1.train": "This is where most of Audiomaxxer’s training lands.",
  "path.st.a1.profile": "All five dimensions",

  /* cortical regions */
  "path.rg.a1.name": "Heschl’s gyrus",
  "path.rg.a1.sub": "Primary auditory cortex",
  "path.rg.a1.role":
    "The gyrus holds the frequency map, carried over almost intact from the cochlea. It encodes pitch, timing and level before any of it means anything.",
  "path.rg.a1.mind":
    "The gyrus is the bridge to cognition. How finely it tells similar sounds apart sets the limit for every later decision, including which word you hear.",
  "path.rg.a1.train":
    "Frequency discrimination narrows the gap between two tones until you can no longer tell them apart. High-frequency recognition does the same across bands.",
  "path.rg.a1.profile": "Sound discrimination",

  "path.rg.belt.name": "Belt and planum temporale",
  "path.rg.belt.sub": "Sound patterns",
  "path.rg.belt.role":
    "The planum temporale is a ring of secondary areas that sort sound into objects instead of frequencies: this voice, that engine, those footsteps.",
  "path.rg.belt.mind":
    "This is the cocktail party problem. Your brain has to decide which fragments belong to the same source before it can decode any of them, so grouping comes before understanding.",
  "path.rg.belt.train":
    "Speech in conversation noise adapts the signal-to-noise ratio.",
  "path.rg.belt.profile": "Speech in noise",

  "path.rg.wernicke.name": "Wernicke’s area",
  "path.rg.wernicke.sub": "Word meaning",
  "path.rg.wernicke.role":
    "In Wernicke's area, the posterior superior temporal cortex maps sound patterns onto stored words. Damage here leaves hearing intact and comprehension gone.",
  "path.rg.wernicke.mind":
    "Wernicke's area works on a tight clock. In fast conversation it has about 200 milliseconds per word to find the meaning in your mental dictionary. If it falls behind by even a fraction of a second, the delay piles up and you lose the whole sentence.",
  "path.rg.wernicke.train":
    "Rapid speech forces the decision earlier each round. Phone call strips the top of the band so you have to decide on less.",
  "path.rg.wernicke.profile": "Sound discrimination and memory",

  "path.rg.arcuate.name": "Arcuate fasciculus",
  "path.rg.arcuate.sub": "The phonological loop",
  "path.rg.arcuate.role":
    "The arcuate fasciculus is a white-matter bundle that carries sound from the temporal to the frontal cortex, so you can hold a sound in mind and rehearse it silently.",
  "path.rg.arcuate.mind":
    "This is verbal working memory. Without it you couldn't keep a phone number in your head long enough to dial it, follow a long sentence to the end, or remember a name right after hearing it.",
  "path.rg.arcuate.train":
    "Conversation simulation asks its question after the exchange ends, so you have to hold the material in mind.",
  "path.rg.arcuate.profile": "Auditory memory",

  "path.rg.broca.name": "Inferior frontal gyrus",
  "path.rg.broca.sub": "Prediction",
  "path.rg.broca.role":
    "Frontal speech regions also predict speech, sending expected sounds back down to the temporal cortex before those sounds arrive.",
  "path.rg.broca.mind":
    "In a loud room you understand speech partly by predicting it. Your brain fills in muffled words from context, and the better you know the language, the easier it is to pull a clean signal out of the noise.",
  "path.rg.broca.train":
    "Speech in conversation noise and Street corner both blank out parts of words, so you practise filling them in from context.",
  "path.rg.broca.profile": "Speech in noise",

  "path.rg.dlpfc.name": "Dorsolateral prefrontal cortex",
  "path.rg.dlpfc.sub": "Listening effort",
  "path.rg.dlpfc.role":
    "When the signal is poor, the prefrontal cortex is recruited to hold it together. In daily life this shows up as pupil dilation and fatigue.",
  "path.rg.dlpfc.mind":
    "Mental effort is limited. At a loud dinner your brain spends so much of it straining to hear the words that little is left for storing them, which is why you leave tired and unable to recall what was said.",
  "path.rg.dlpfc.train":
    "Everyday sounds and Street corner run long enough to load sustained attention.",
  "path.rg.dlpfc.profile": "Auditory attention",

  "path.rg.hippo.name": "Hippocampus",
  "path.rg.hippo.sub": "Encoding to memory",
  "path.rg.hippo.role":
    "The hippocampus binds what you heard to when and where you heard it, turning a perceived sentence into something you can retrieve later.",
  "path.rg.hippo.mind":
    "The Lancet Commission on dementia ranks hearing loss as the largest single modifiable midlife risk factor in its model. The link is an association rather than a demonstrated cause, and it is one reason to take an unnoticed loss seriously at twenty rather than sixty.",
  "path.rg.hippo.train":
    "Restaurant table and Conversation simulation both ask about what was said a few minutes earlier.",
  "path.rg.hippo.profile": "Auditory memory",
};
