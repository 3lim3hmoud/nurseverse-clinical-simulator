/**
 * GENERATED from Critical_procedures.html and Critical_Equipment.html (course CLN2424). Do not edit by hand:
 * fix the source documents and regenerate. The VAP / CAUTI / CLABSI bundles have no equipment list in the
 * source; theirs is added in catalog.ts and flagged there.
 */
export interface RawStep {
  n: number;
  en: string;
  ar: string;
  /** "What am I doing?" (Arabic only in the source) */
  doing: string;
  whyEn: string;
  whyAr: string;
}
export interface RawItem {
  en: string;
  ar: string;
  use: string;
}
export interface RawGroup {
  en: string;
  ar: string;
  items: RawItem[];
}
export interface RawProcedure {
  id: string;
  titleEn: string;
  titleAr: string;
  steps: RawStep[];
  groups: RawGroup[];
}

export const RAW_PROCEDURES: RawProcedure[] = [
 {
  "id": "mv",
  "titleEn": "MV Care",
  "titleAr": "رعاية جهاز التنفس الصناعي",
  "steps": [
   {
    "n": 1,
    "en": "Perform Hand Hygiene & Wear PPE (gloves, mask, goggles)",
    "ar": "غسل اليدين وارتداء معدات الوقاية الشخصية (جوانتي، كمامة، واقي عينين)",
    "doing": "بأغسل إيدي صح بالماء والصابون أو المطهر الكحولي، وبألبس جوانتي وكمامة وواقي عينين قبل أي تعامل مع المريض.",
    "whyEn": "Prevents cross-contamination and protects both patient and nurse from infection transmission.",
    "whyAr": "يمنع انتقال العدوى ويحمي المريض والممرضة من التلوث المتبادل."
   },
   {
    "n": 2,
    "en": "Gather Equipment (suction catheter, sterile gloves, sterile saline, oral care supplies, tape/holder, stethoscope, Ambu bag)",
    "ar": "تجميع الأدوات (قسطرة شفط، جوانتي معقمة، سالاين معقم، أدوات العناية بالفم، لاصق/حامل، سماعة، أمبو باج)",
    "doing": "بأجهّز كل الأدوات المطلوبة قبل ما أبدأ الإجراء عشان ما تنقطعش أثناء الشغل.",
    "whyEn": "Ensures all supplies are available before starting, preventing interruptions and maintaining procedural safety.",
    "whyAr": "يضمن توفر كل المستلزمات قبل البدء ويمنع الانقطاع ويحافظ على سلامة الإجراء."
   },
   {
    "n": 3,
    "en": "Explain Procedure to Patient, Position Patient (semi-Fowler's 30–45°)",
    "ar": "شرح الإجراء للمريض ووضعه في وضعية شبه الجلوس (30–45 درجة)",
    "doing": "بأشرح للمريض إيه اللي هعمله حتى لو على المنفسة، وبأرفع السرير لزاوية 30-45 درجة وبأتحقق منها بشكل منتظم.",
    "whyEn": "Explanation reduces anxiety and promotes cooperation. Semi-Fowler's reduces aspiration risk and VAP incidence.",
    "whyAr": "الشرح يقلل القلق ويعزز التعاون. وضعية شبه الجلوس تقلل خطر الاستنشاق والالتهاب الرئوي المرتبط بالمنفسة."
   },
   {
    "n": 4,
    "en": "Assess Patient (vital signs, SpO₂, breath sounds, respiratory effort)",
    "ar": "تقييم المريض (العلامات الحيوية، SpO₂، أصوات التنفس، مجهود التنفس)",
    "doing": "بأقيس العلامات الحيوية والـ SpO₂، وبأسمع أصوات التنفس بالسماعة على الجانبين، وبأشوف مجهود التنفس وأي علامات ضيق.",
    "whyEn": "Establishes baseline data to detect changes and evaluate patient response to care interventions.",
    "whyAr": "يوفر بيانات أساسية للكشف عن التغيرات وتقييم استجابة المريض للتدخلات."
   },
   {
    "n": 5,
    "en": "Pre-oxygenate Patient (increase FiO₂ by 10–20% or 100% for 30–60 seconds)",
    "ar": "تأكسج المريض مسبقاً (زيادة FiO₂ بنسبة 10–20% أو لـ 100% لمدة 30–60 ثانية)",
    "doing": "بأزود نسبة الأكسجين على المنفسة بمقدار 10-20% أو لـ 100% وبأنتظر 30-60 ثانية قبل ما أبدأ الشفط.",
    "whyEn": "Increases oxygen reserves to prevent hypoxia during suctioning, which temporarily interrupts ventilation.",
    "whyAr": "يزيد مخزون الأكسجين لمنع نقص الأكسجين أثناء الشفط الذي يقاطع التهوية مؤقتاً."
   },
   {
    "n": 6,
    "en": "Perform Endotracheal Suctioning (insert catheter without suction, apply suction while withdrawing, limit to 10–15 seconds). Assess Breath Sounds bilaterally.",
    "ar": "إجراء الشفط الرغامي (إدخال القسطرة بدون شفط، تطبيق الشفط أثناء السحب، تحديد بـ 10–15 ثانية). تقييم أصوات التنفس على الجانبين.",
    "doing": "بأدخل القسطرة بدون شفط، وبأطبق الشفط وأنا بسحبها في حركة دائرية. مش بأكمل أكتر من 10-15 ثانية. وبعدين بأسمع أصوات التنفس على الجانبين.",
    "whyEn": "Inserting without suction prevents mucosal trauma. Time limit prevents hypoxia. Bilateral auscultation confirms ETT position and airway clearance effectiveness.",
    "whyAr": "الإدخال بدون شفط يمنع صدمة الغشاء المخاطي. تحديد الوقت يمنع نقص الأكسجين. السماع الثنائي يؤكد موضع الأنبوب وفاعلية التنظيف."
   },
   {
    "n": 7,
    "en": "Check ETT Position (verify cm marking) and Cuff Pressure (maintain 20–30 cmH₂O)",
    "ar": "التحقق من موضع أنبوب التنبيب (علامة السم) وضغط البالونة (20–30 سم ماء)",
    "doing": "بأتحقق من علامة السم عند الشفاه وبأسجّلها، وبأقيس ضغط البالونة بالمانوميتر وبأتأكد إنه بين 20-30 cmH₂O وبأضيف أو بأفرّغ هواء لو لازم.",
    "whyEn": "Correct ETT position ensures bilateral lung ventilation. Proper cuff pressure prevents aspiration while avoiding tracheal ischemia from over-inflation.",
    "whyAr": "الموضع الصحيح يضمن تهوية الرئتين. الضغط المناسب يمنع الاستنشاق مع تجنب نقص تروية القصبة من الضخ الزائد."
   },
   {
    "n": 8,
    "en": "Secure ETT (replace tape/holder if soiled; ensure firm but not tight) and Provide Oral Care (clean mouth, teeth, tongue with oral swabs/toothbrush)",
    "ar": "تثبيت أنبوب التنبيب (تغيير اللاصق/الحامل لو متوسخ) والعناية بالفم (تنظيف الفم والأسنان واللسان)",
    "doing": "بأغير اللاصق أو الحامل لو متوسخ وبأتأكد إنه ثابت ومش ضايق. وبعدين بأنظف الفم والأسنان واللسان بأسواب الفم أو الفرشة الصغيرة.",
    "whyEn": "Proper securing prevents accidental extubation. Oral care reduces oral bacterial colonization, the main source of VAP pathogens.",
    "whyAr": "التثبيت الصحيح يمنع الخلع غير المقصود. العناية بالفم تقلل تكاثر البكتيريا الفموية المصدر الرئيسي لمسببات الالتهاب الرئوي."
   },
   {
    "n": 9,
    "en": "Inspect Skin (check corners of mouth, lips, nares for pressure areas)",
    "ar": "فحص الجلد (زوايا الفم، الشفاه، فتحتي الأنف لوجود مناطق ضغط)",
    "doing": "بأفحص زوايا الفم والشفاه وفتحتي الأنف عشان أشوف لو في احمرار أو كدمات أو جروح ناتجة عن الضغط وبأوثّق ما شفته.",
    "whyEn": "Early detection of pressure injuries allows timely intervention to prevent skin breakdown and ulceration.",
    "whyAr": "الكشف المبكر عن إصابات الضغط يسمح بالتدخل في الوقت المناسب لمنع تدهور الجلد والتقرح."
   },
   {
    "n": 10,
    "en": "Reposition ETT (move tube to opposite side of mouth if appropriate)",
    "ar": "إعادة تموضع أنبوب التنبيب (تحريكه للجهة التانية من الفم لو مناسب)",
    "doing": "بأحرك الأنبوب للجهة التانية من الفم إذا كان مناسباً، وبأسجّل العلامة الجديدة وبأتأكد من ثبات التثبيت بعد التحريك.",
    "whyEn": "Repositioning distributes pressure, prevents localized tissue damage, and reduces risk of pressure ulcers at the mouth corners.",
    "whyAr": "إعادة التموضع توزع الضغط وتمنع تلف الأنسجة الموضعي وتقلل خطر قرح الضغط عند زوايا الفم."
   },
   {
    "n": 11,
    "en": "Reassess Patient (vital signs, SpO₂, breathing pattern, comfort level)",
    "ar": "إعادة تقييم المريض (العلامات الحيوية، SpO₂، نمط التنفس، مستوى الراحة)",
    "doing": "بأقيس العلامات الحيوية والـ SpO₂ من جديد وبأشوف نمط التنفس ومستوى راحة المريض وبأقارن بالقياسات السابقة.",
    "whyEn": "Post-procedure assessment detects complications such as hypoxia, arrhythmia, or agitation that may have resulted from the intervention.",
    "whyAr": "التقييم بعد الإجراء يكشف المضاعفات كنقص الأكسجين أو اضطراب النظم أو الهياج الناتجة عن التدخل."
   },
   {
    "n": 12,
    "en": "Return FiO₂ to Baseline (if increased for suctioning) and Ensure Patient Comfort (reposition patient, provide communication method)",
    "ar": "إعادة FiO₂ للمستوى الأساسي وضمان راحة المريض (إعادة التموضع، توفير وسيلة تواصل)",
    "doing": "بأرجع الـ FiO₂ لنسبته الأصلية لو كنت زودته للشفط. وبأعيد تموضع المريض وبأوفرله لوح أو تطبيق تواصل لو عنده وعي.",
    "whyEn": "Prolonged hyperoxia causes oxidative damage. Communication methods reduce patient anxiety and improve cooperation with care.",
    "whyAr": "فرط الأكسجين المطوّل يسبب ضرراً تأكسدياً. وسائل التواصل تقلل قلق المريض وتحسن تعاونه مع الرعاية."
   },
   {
    "n": 13,
    "en": "Perform Hand Hygiene and Documentation (date/time, ETT position/cm marking, cuff pressure, secretion characteristics, breath sounds, patient tolerance, complications)",
    "ar": "غسل اليدين والتوثيق (التاريخ/الوقت، موضع الأنبوب/علامة السم، ضغط البالونة، طبيعة الإفرازات، أصوات التنفس، تحمّل المريض، المضاعفات)",
    "doing": "بأغسل إيدي وبأوثّق كل التفاصيل: التاريخ والوقت، علامة الأنبوب، ضغط البالونة، لون وقوام الإفرازات، أصوات التنفس، وأي مضاعفات حدثت.",
    "whyEn": "Hand hygiene prevents post-procedure infection spread. Accurate documentation ensures care continuity, monitors trends, and provides legal protection.",
    "whyAr": "غسل اليدين يمنع انتشار العدوى بعد الإجراء. التوثيق الدقيق يضمن استمرارية الرعاية ويراقب التغيرات ويوفر الحماية القانونية."
   }
  ],
  "groups": [
   {
    "en": "Main Devices",
    "ar": "الأجهزة الرئيسية",
    "items": [
     {
      "en": "Mechanical Ventilator",
      "ar": "جهاز التنفس الصناعي",
      "use": "يتحكم في التنفس الآلي للمريض ويضبط معدل التنفس والضغط ونسبة الأكسجين"
     },
     {
      "en": "Endotracheal Tube (ETT)",
      "ar": "أنبوب القصبة الهوائية",
      "use": "يُدخل عبر الفم أو الأنف لتأمين مجرى هواء مفتوح وربط الجهاز بالرئتين"
     },
     {
      "en": "Tracheostomy Tube",
      "ar": "أنبوب الرغامى",
      "use": "يُدخل عبر فتحة جراحية في الرقبة لتأمين مجرى هواء بديل طويل الأمد"
     }
    ]
   },
   {
    "en": "Intubation & Support",
    "ar": "التنبيب والدعم",
    "items": [
     {
      "en": "Laryngoscope + Blades (Macintosh / Miller)",
      "ar": "منظار الحنجرة + الشفرات",
      "use": "يُستخدم لرؤية الحبال الصوتية وتوجيه الأنبوب أثناء عملية التنبيب"
     },
     {
      "en": "Stylet (rigid guide)",
      "ar": "الدليل الصلب",
      "use": "يُدخل داخل الأنبوب لتصليبه وتشكيله لتسهيل إدخاله في مجرى الهواء"
     },
     {
      "en": "Syringe (10–20 mL for cuff)",
      "ar": "حقنة 10–20 مل لنفخ الكفة",
      "use": "لنفخ كفة الأنبوب لإحكام إغلاق مجرى الهواء ومنع التسريب"
     },
     {
      "en": "Manual Resuscitation Bag (Ambu Bag)",
      "ar": "كيس الإنعاش اليدوي (أمبو باج)",
      "use": "للتهوية اليدوية الطارئة عند انقطاع الجهاز أو أثناء نقل المريض"
     }
    ]
   },
   {
    "en": "Circuit Components",
    "ar": "مكونات الدائرة",
    "items": [
     {
      "en": "Water Trap",
      "ar": "مصيدة المياه",
      "use": "لتجميع تكاثف الرطوبة داخل الدائرة ومنع وصوله للمريض"
     },
     {
      "en": "Bacterial / Viral Filter",
      "ar": "فلتر بكتيري / فيروسي",
      "use": "لمنع انتقال الميكروبات بين الجهاز والمريض وحماية كليهما"
     },
     {
      "en": "Heated Humidifier",
      "ar": "مرطب الهواء الساخن",
      "use": "لترطيب وتدفئة الهواء قبل وصوله للرئتين تجنبًا لجفاف الأغشية المخاطية"
     },
     {
      "en": "Sterile Water",
      "ar": "ماء معقم",
      "use": "يُملأ به المرطب لتوليد البخار الرطب اللازم للتهوية"
     }
    ]
   },
   {
    "en": "Gas Supply",
    "ar": "مصادر الغاز",
    "items": [
     {
      "en": "Oxygen Supply (Wall Outlet / Cylinder)",
      "ar": "مصدر الأكسجين (حائط أو أسطوانة)",
      "use": "لتوفير الأكسجين اللازم لعملية التهوية الصناعية"
     },
     {
      "en": "Medical Air Supply",
      "ar": "الهواء الطبي",
      "use": "يُخلط مع الأكسجين للتحكم في نسبة FiO₂ المُعطاة للمريض"
     },
     {
      "en": "Oxygen Flowmeter",
      "ar": "مقياس تدفق الأكسجين",
      "use": "لضبط وقياس معدل تدفق الأكسجين بدقة"
     }
    ]
   },
   {
    "en": "Monitoring",
    "ar": "المراقبة",
    "items": [
     {
      "en": "Pulse Oximeter + Probe",
      "ar": "جهاز قياس الأكسجين + مسبار",
      "use": "لمراقبة تشبع الأكسجين في الدم (SpO₂) بشكل مستمر وغير جراحي"
     },
     {
      "en": "Stethoscope",
      "ar": "سماعة طبية",
      "use": "للتحقق من أصوات التنفس والتأكد من صحة موضع الأنبوب في الرئتين"
     }
    ]
   },
   {
    "en": "Maintenance & Hygiene",
    "ar": "الصيانة والنظافة",
    "items": [
     {
      "en": "Suction Catheter",
      "ar": "قسطرة الشفط",
      "use": "لشفط الإفرازات والمخاط من مجرى الهواء والأنبوب"
     },
     {
      "en": "Suction Apparatus",
      "ar": "جهاز الشفط",
      "use": "يولد قوة الشفط السلبية اللازمة لسحب الإفرازات"
     },
     {
      "en": "Sterile Gloves",
      "ar": "قفازات معقمة",
      "use": "للحفاظ على التعقيم أثناء الشفط وأي إجراء يمس مجرى الهواء"
     },
     {
      "en": "Sterile Saline",
      "ar": "محلول ملحي معقم",
      "use": "لتليين الإفرازات الجافة قبل الشفط وتنظيف المجرى"
     },
     {
      "en": "Oral Care Supplies (swabs / toothbrush)",
      "ar": "مستلزمات العناية بالفم",
      "use": "للحفاظ على نظافة الفم والحد من خطر الالتهاب الرئوي المرتبط بالتنفس الصناعي (VAP)"
     },
     {
      "en": "Tape or ETT Holder",
      "ar": "لاصق أو حامل الأنبوب",
      "use": "لتثبيت الأنبوب في مكانه ومنع تحركه أو خروجه بشكل غير مقصود"
     }
    ]
   },
   {
    "en": "Personal Protection",
    "ar": "الحماية الشخصية",
    "items": [
     {
      "en": "PPE (gloves, mask, goggles)",
      "ar": "معدات الوقاية الشخصية",
      "use": "لحماية الممرض من التعرض للإفرازات والعدوى أثناء الإجراء"
     }
    ]
   }
  ]
 },
 {
  "id": "trach",
  "titleEn": "Tracheostomy Care",
  "titleAr": "رعاية أنبوب الرغامى",
  "steps": [
   {
    "n": 1,
    "en": "Wash Hands and Wear PPE",
    "ar": "غسل اليدين وارتداء معدات الوقاية الشخصية",
    "doing": "بأغسل إيدي صح وبألبس جوانتي وكمامة وواقي عينين قبل ما أقرب من المريض.",
    "whyEn": "Standard precautions prevent cross-contamination and protect both the patient and healthcare worker from infection.",
    "whyAr": "احتياطات المعيار تمنع التلوث المتبادل وتحمي المريض والعاملين الصحيين من العدوى."
   },
   {
    "n": 2,
    "en": "Hyperoxygenation and suction the trachea and pharynx as needed",
    "ar": "التأكسج الزائد والشفط من القصبة والبلعوم عند الحاجة",
    "doing": "بأزود الأكسجين لـ 100% لمدة 30-60 ثانية وبأعمل شفط للقصبة والبلعوم لو في إفرازات قبل ما أبدأ تغيير القنية.",
    "whyEn": "Pre-oxygenation prevents hypoxia during cannula change. Suctioning clears the airway and reduces infection risk from pooled secretions.",
    "whyAr": "التأكسج المسبق يمنع نقص الأكسجين أثناء تغيير القنية. الشفط يفتح مجرى الهواء ويقلل خطر العدوى من الإفرازات المتجمعة."
   },
   {
    "n": 3,
    "en": "Remove and discard soiled tracheostomy dressing. Remove gloves, wash hands, and wear another pair of gloves.",
    "ar": "إزالة الضمادة المتسخة والتخلص منها. خلع الجوانتي وغسل اليدين وارتداء جوانتي جديدة.",
    "doing": "بأشيل الضمادة القديمة وبأرميها في الكيس الطبي. وبعدين بأخلع الجوانتي وبأغسل إيدي وبألبس جوانتي جديدة نظيفة.",
    "whyEn": "Changing gloves between contaminated and clean steps is essential to prevent self-contamination and maintain aseptic technique.",
    "whyAr": "تغيير الجوانتي بين الخطوات الملوثة والنظيفة ضروري لمنع التلوث الذاتي والحفاظ على تقنية التعقيم."
   },
   {
    "n": 4,
    "en": "For disposable inner cannulas: Open prepackaged cannula → Remove soiled cannula → Replace with new cannula. For non-disposable: Prepare sterile field → Apply sterile gloves → Remove cannula and place in sterile saline/water.",
    "ar": "للقنية القابلة للتخلص: فتح العبوة → إزالة القديمة → تركيب الجديدة. لغير القابلة: تجهيز حقل معقم → جوانتي معقمة → إزالة القنية ووضعها في سالاين/ماء معقم.",
    "doing": "للقابلة: بأفتح العبوة الجديدة وبأشيل القديمة وبأركب الجديدة مباشرةً. لغير القابلة: بأجهّز أدوات معقمة وبأشيل القنية وأنظفها في السالاين المعقم.",
    "whyEn": "Regular inner cannula care prevents secretion buildup and encrustation, maintains airway patency, and significantly reduces infection risk.",
    "whyAr": "العناية المنتظمة بالقنية الداخلية تمنع تراكم الإفرازات وتحافظ على مجرى هواء مفتوح وتقلل بشكل كبير خطر العدوى."
   },
   {
    "n": 5,
    "en": "Place tracheostomy collar, T-tube, or ventilator oxygen source over/near the outer cannula. Clean inner cannula with small brush and rinse it.",
    "ar": "وضع مصدر الأكسجين فوق أو قريب من القنية الخارجية. تنظيف القنية الداخلية بالفرشة الصغيرة وشطفها.",
    "doing": "بأحط مصدر الأكسجين قريب من القنية الخارجية عشان ما ينقطعش الأكسجين، وبأنظف القنية بالفرشة في السالاين المعقم وبأشطفها كويس.",
    "whyEn": "Maintaining oxygen during cleaning prevents hypoxia. Thorough brushing removes biofilm and secretions that promote bacterial growth.",
    "whyAr": "الحفاظ على الأكسجين أثناء التنظيف يمنع نقص الأكسجين. التنظيف الشامل يزيل الغشاء الحيوي والإفرازات التي تعزز نمو البكتيريا."
   },
   {
    "n": 6,
    "en": "Insert the inner cannula and lock it into place.",
    "ar": "إدخال القنية الداخلية وتثبيتها في مكانها.",
    "doing": "بأدخل القنية الداخلية بلطف وبأدورها في اتجاه الساعة عشان تتقفل في مكانها الصح وبأتأكد إنها ثابتة.",
    "whyEn": "Proper locking prevents accidental displacement of the inner cannula, ensuring a secure and patent airway.",
    "whyAr": "القفل الصحيح يمنع إزاحة القنية الداخلية غير المقصودة ويضمن مجرى هواء آمن ومفتوح."
   },
   {
    "n": 7,
    "en": "Dry the skin around the stoma by patting it dry and place a gauze pad between the stoma and tracheostomy.",
    "ar": "تجفيف الجلد حول الفتحة بالتربيت ووضع شاش بين الفتحة والقنية.",
    "doing": "بأجفف الجلد حول الفتحة بالتربيت (مش الفرك) وبأحط شاش نظيف مقصوص بين الفتحة والقنية عشان يمتص الإفرازات.",
    "whyEn": "Moisture causes skin maceration and increases infection risk. Gauze absorbs secretions and protects peristomal skin integrity.",
    "whyAr": "الرطوبة تسبب تمزق الجلد وتزيد خطر العدوى. الشاش يمتص الإفرازات ويحمي سلامة الجلد حول الفتحة."
   },
   {
    "n": 8,
    "en": "Change tracheostomy tie and reassess the patient's respiratory status (O₂ level, RR, and depth).",
    "ar": "تغيير رباط القنية وإعادة تقييم الحالة التنفسية (مستوى الأكسجين، معدل التنفس، عمقه).",
    "doing": "بأغير الرباط القديم بجديد وبأتأكد إنه بيدخل إصبعين تحته (مش ضايق ومش مرخي). وبعدين بأقيس الـ SpO₂ ومعدل وعمق التنفس.",
    "whyEn": "Secure ties prevent accidental decannulation (life-threatening). Post-procedure reassessment detects complications like hypoxia or displacement.",
    "whyAr": "الرباط الثابت يمنع الخلع غير المقصود (مهدد للحياة). إعادة التقييم تكشف المضاعفات كنقص الأكسجين أو الإزاحة."
   },
   {
    "n": 9,
    "en": "Discard used supplies and remove personal protective equipment.",
    "ar": "التخلص من المستلزمات المستخدمة وخلع معدات الوقاية الشخصية.",
    "doing": "بأرمي كل المستلزمات المستخدمة في الكيس الطبي المخصص وبأخلع الجوانتي والكمامة وواقي العينين بالطريقة الصحيحة.",
    "whyEn": "Proper disposal of contaminated materials prevents environmental contamination and reduces the risk of infection transmission.",
    "whyAr": "التخلص الصحيح من المواد الملوثة يمنع التلوث البيئي ويقلل خطر انتقال العدوى."
   },
   {
    "n": 10,
    "en": "Wash hands and document the procedure (cannula type, skin condition, secretion characteristics, respiratory status, patient tolerance).",
    "ar": "غسل اليدين وتوثيق الإجراء (نوع القنية، حالة الجلد، طبيعة الإفرازات، الحالة التنفسية، تحمّل المريض).",
    "doing": "بأغسل إيدي وبأوثّق: نوع القنية، حالة الجلد حول الفتحة، لون وقوام الإفرازات، الـ SpO₂ ومعدل التنفس، وأي مضاعفات.",
    "whyEn": "Hand hygiene prevents post-procedure infection spread. Documentation ensures care continuity and monitors for developing complications.",
    "whyAr": "غسل اليدين يمنع انتشار العدوى. التوثيق يضمن استمرارية الرعاية ويراقب ظهور المضاعفات."
   }
  ],
  "groups": [
   {
    "en": "General Supplies",
    "ar": "المستلزمات العامة",
    "items": [
     {
      "en": "Sterile Gloves",
      "ar": "قفازات معقمة",
      "use": "للحفاظ على التعقيم التام أثناء تنظيف الكانيولا والقسطرة"
     },
     {
      "en": "Clean Gloves",
      "ar": "قفازات نظيفة",
      "use": "تُستخدم في الخطوات غير المعقمة كإزالة الضمادة القديمة"
     },
     {
      "en": "PPE",
      "ar": "معدات الوقاية الشخصية",
      "use": "لحماية الممرض من الإفرازات والعدوى أثناء الرعاية"
     }
    ]
   },
   {
    "en": "Cleaning & Dressing",
    "ar": "التنظيف والضمادة",
    "items": [
     {
      "en": "Sterile Tracheostomy Dressing",
      "ar": "ضمادة الرغامى المعقمة",
      "use": "توضع حول فتحة الرغامى لامتصاص الإفرازات وحماية الجلد"
     },
     {
      "en": "Sterile Gauze",
      "ar": "شاش معقم",
      "use": "لتنظيف الجلد حول فتحة الرغامى وتجفيفه"
     },
     {
      "en": "Normal Saline",
      "ar": "محلول ملحي طبيعي",
      "use": "لتنظيف الكانيولا الداخلية والجلد من الإفرازات الجافة"
     },
     {
      "en": "Hydrogen Peroxide (if policy allows)",
      "ar": "ماء أوكسجين (حسب السياسة)",
      "use": "لإذابة الإفرازات المتكلسة الصعبة من الكانيولا الداخلية"
     },
     {
      "en": "Sterile Cotton-Tipped Applicators",
      "ar": "مسحات قطنية معقمة",
      "use": "لتنظيف الزوايا والمناطق الضيقة حول فتحة الرغامى بدقة"
     }
    ]
   },
   {
    "en": "Airway Management",
    "ar": "إدارة مجرى الهواء",
    "items": [
     {
      "en": "Suction Catheter",
      "ar": "قسطرة الشفط",
      "use": "لشفط الإفرازات من داخل أنبوب الرغامى والمجرى الهوائي"
     },
     {
      "en": "Suction Apparatus",
      "ar": "جهاز الشفط",
      "use": "يولد قوة الشفط السلبية لسحب الإفرازات بأمان"
     },
     {
      "en": "Oxygen Source",
      "ar": "مصدر الأكسجين",
      "use": "لتعويض الأكسجين أثناء وبعد إجراءات الشفط والتغيير"
     },
     {
      "en": "Pulse Oximeter",
      "ar": "جهاز قياس الأكسجين",
      "use": "لمراقبة مستوى تشبع الأكسجين في الدم أثناء الإجراء"
     }
    ]
   },
   {
    "en": "Securing",
    "ar": "التثبيت",
    "items": [
     {
      "en": "New Tracheostomy Ties or Velcro Holder",
      "ar": "أربطة أو حامل فيلكرو جديد",
      "use": "لتثبيت أنبوب الرغامى بأمان ومنع سقوطه أو تحركه"
     },
     {
      "en": "Scissors",
      "ar": "مقص",
      "use": "لقطع الأربطة القديمة المراد تغييرها"
     }
    ]
   },
   {
    "en": "Inner Cannula Care",
    "ar": "رعاية الكانيولا الداخلية",
    "items": [
     {
      "en": "New Prepackaged Inner Cannula (disposable)",
      "ar": "كانيولا داخلية جاهزة (للاستخدام مرة واحدة)",
      "use": "تُستبدل بالكانيولا المستخدمة للحفاظ على نظافة مجرى الهواء"
     },
     {
      "en": "Small Brush + Pipe Cleaner (non-disposable)",
      "ar": "فرشاة صغيرة + منظف الأنابيب",
      "use": "لتنظيف الكانيولا الداخلية القابلة لإعادة الاستخدام"
     }
    ]
   },
   {
    "en": "Oxygen Delivery",
    "ar": "توصيل الأكسجين",
    "items": [
     {
      "en": "Tracheostomy Collar (Mask)",
      "ar": "قناع الرغامى",
      "use": "لإعطاء الأكسجين المرطب مباشرةً عبر فتحة الرغامى"
     },
     {
      "en": "T-Tube",
      "ar": "أنبوب على شكل T",
      "use": "يُستخدم بديلاً للقناع لتوصيل الأكسجين أو دعم التنفس"
     }
    ]
   },
   {
    "en": "Skin Care",
    "ar": "العناية بالجلد",
    "items": [
     {
      "en": "Lubricant / Skin Barrier Cream",
      "ar": "مرطب / كريم حماية الجلد",
      "use": "لحماية الجلد حول فتحة الرغامى من التهيج والقرح الناتجة عن الإفرازات"
     }
    ]
   }
  ]
 },
 {
  "id": "acls",
  "titleEn": "ACLS",
  "titleAr": "الإنعاش القلبي الرئوي المتقدم",
  "steps": [
   {
    "n": 1,
    "en": "Ensure scene safety. Assess unresponsiveness (tap & shout). Call for help / activate code blue. Simultaneously check breathing and carotid pulse (max 10 sec). If no pulse → initiate high-quality CPR immediately.",
    "ar": "التأكد من سلامة المكان. تقييم الاستجابة (نقر ونداء). طلب المساعدة / تفعيل الكود الأزرق. التحقق من التنفس ونبض السباتي في آنٍ واحد (أقصى 10 ثوانٍ). إن لم يكن هناك نبض → ابدأ الإنعاش فوراً.",
    "doing": "بأتأكد إن المكان آمن، وبنقر على الكتف وأنادي بصوت عالٍ. لو مفيش استجابة، بنادي بصوت لطلب المساعدة وبفعّل الكود الأزرق. وفي نفس الوقت بشوف التنفس والنبض في 10 ثواني. لو مفيش نبض، بأبدأ الإنعاش فوراً.",
    "whyEn": "Every minute without CPR reduces survival by 10%. Simultaneous pulse and breathing check saves time and enables faster initiation of resuscitation.",
    "whyAr": "كل دقيقة بدون إنعاش تقلل البقاء على الحياة بنسبة 10%. التحقق المتزامن يوفر الوقت ويسرع بدء الإنعاش."
   },
   {
    "n": 2,
    "en": "Begin chest compressions: depth 5–6 cm, rate 100–120/min, full recoil. Use 30:2 ratio if no advanced airway.",
    "ar": "بدء ضغطات الصدر: عمق 5–6 سم، معدل 100–120/دقيقة، مع الارتداد الكامل. نسبة 30:2 إن لم يكن هناك مجرى هواء متقدم.",
    "doing": "بأبدأ ضغطات الصدر بعمق 5-6 سم ومعدل 100-120 في الدقيقة، وبأتأكد إن الصدر بيرجع كامل بعد كل ضغطة. بستخدم 30 ضغطة على 2 تنفسة.",
    "whyEn": "Adequate depth and rate generate sufficient cardiac output. Full chest recoil allows cardiac refilling. The 30:2 ratio balances compressions with ventilation.",
    "whyAr": "العمق والمعدل الكافيان يولدان ناتجاً قلبياً كافياً. الارتداد الكامل يسمح بملء القلب. نسبة 30:2 توازن بين الضغطات والتهوية."
   },
   {
    "n": 3,
    "en": "Rotate compressors every 2 minutes.",
    "ar": "تبديل القائم على الضغطات كل دقيقتين.",
    "doing": "بأتفق مع زميلي على التبادل كل دقيقتين عشان الضغطات تفضل بجودة عالية ومحدنا ما يتعب.",
    "whyEn": "Compressor fatigue leads to inadequate depth and rate within 2 minutes, reducing CPR quality and survival outcomes.",
    "whyAr": "إرهاق القائم على الضغطات يؤدي لعمق ومعدل غير كافيين في خلال دقيقتين مما يقلل جودة الإنعاش وفرص البقاء."
   },
   {
    "n": 4,
    "en": "Attach defibrillator/monitor as soon as available.",
    "ar": "توصيل جهاز إزالة الرجفان / الشاشة فور توفره.",
    "doing": "بأوصّل الإلكترودات وجهاز الديفيبريلاتور فور ما يكون متاح وبأحلل النظم القلبي بسرعة.",
    "whyEn": "Early rhythm analysis identifies shockable rhythms (VF/pVT) where immediate defibrillation dramatically improves survival.",
    "whyAr": "التحليل المبكر للنظم يحدد النظم القابلة للصدمة حيث تحسّن إزالة الرجفان الفورية البقاء على الحياة بشكل كبير."
   },
   {
    "n": 5,
    "en": "Shockable rhythm (VF/pVT): Deliver 1 shock (200 J biphasic). Say \"CLEAR!\" before shocking; ensure no contact. Resume CPR immediately for 2 minutes.",
    "ar": "نظم قابل للصدمة (VF/pVT): صدمة واحدة (200 جول ثنائي الطور). قول \"ابتعدوا!\" والتأكد من عدم الملامسة. استئناف الإنعاش فوراً لدقيقتين.",
    "doing": "لو النظم VF أو pVT، بأشحن 200 جول وبأصيح \"ابتعدوا!\" وبأتأكد محدش بيلمس المريض، وبعدين بأعطي الصدمة وبأرجع للإنعاش فوراً.",
    "whyEn": "Early defibrillation terminates VF/pVT. Immediate post-shock CPR supports coronary perfusion until spontaneous rhythm restores.",
    "whyAr": "إزالة الرجفان المبكرة تُنهي VF/pVT. الإنعاش الفوري بعد الصدمة يدعم تروية الشريان التاجي حتى عودة النظم التلقائي."
   },
   {
    "n": 6,
    "en": "Non-shockable rhythm (PEA/Asystole): Continue CPR, do not shock.",
    "ar": "نظم غير قابل للصدمة (PEA/Asystole): الاستمرار في الإنعاش، لا تعطِ صدمة.",
    "doing": "لو النظم PEA أو Asystole، بأكمل الإنعاش من غير ما أعطي صدمة وبأركز على تحديد وعلاج الأسباب القابلة للعلاج.",
    "whyEn": "PEA and asystole are non-shockable; defibrillation is ineffective and wastes time. Treatment focuses on CPR and reversible causes.",
    "whyAr": "PEA والـ Asystole غير قابلان للصدمة؛ إزالة الرجفان غير فعالة وتضيع الوقت. يركز العلاج على الإنعاش والأسباب القابلة للعلاج."
   },
   {
    "n": 7,
    "en": "Reassess rhythm every 2 minutes.",
    "ar": "إعادة تقييم النظم كل دقيقتين.",
    "doing": "كل دقيقتين بأوقف الإنعاش لثواني فقط وبأشوف النظم على الشاشة وبأقرر: صدمة ولا أكمل إنعاش.",
    "whyEn": "Regular rhythm checks allow timely identification of rhythm changes and appropriate intervention adjustments throughout resuscitation.",
    "whyAr": "الفحص المنتظم للنظم يتيح التعرف في الوقت المناسب على تغيرات النظم وتعديل التدخلات طوال فترة الإنعاش."
   },
   {
    "n": 8,
    "en": "Open airway using jaw-thrust or head-tilt-chin-lift. Provide BVM ventilation with 100% oxygen.",
    "ar": "فتح مجرى الهواء بدفع الفك أو إمالة الرأس ورفع الذقن. توفير التهوية بالكيس والقناع بأكسجين 100%.",
    "doing": "بأفتح مجرى الهواء بالتقنية المناسبة (دفع الفك لو في إصابة رقبة)، وبأركب الماسك صح على الوجه وبأضغط الكيس عشان أديه تنفسة كاملة.",
    "whyEn": "An open airway is essential for oxygenation. 100% O₂ via BVM maximizes oxygen delivery during resuscitation.",
    "whyAr": "مجرى الهواء المفتوح ضروري للأكسجة. 100% أكسجين عبر BVM يعظّم إيصال الأكسجين أثناء الإنعاش."
   },
   {
    "n": 9,
    "en": "Place advanced airway (ETT or supraglottic) when trained provider available. After placement: ventilate 1 breath every 6 seconds (10/min), continue chest compressions without pause.",
    "ar": "وضع مجرى هواء متقدم (ETT أو فوق لساني المزمار) عند توفر مختص. بعد الوضع: تهوية بنفس كل 6 ثوانٍ (10/دقيقة) مع الاستمرار في الضغطات بدون توقف.",
    "doing": "بأساعد المختص في وضع الأنبوب وبأتأكد من مكانه الصح. وبعدين بأهوّي بنفسة كل 6 ثواني بدون ما أوقف ضغطات الصدر.",
    "whyEn": "Advanced airway secures ventilation more reliably. Asynchronous ventilation (10/min) with continuous compressions maximizes coronary and cerebral perfusion pressure.",
    "whyAr": "مجرى الهواء المتقدم يؤمّن التهوية بشكل أكثر موثوقية. التهوية غير المتزامنة مع الضغطات المستمرة تعظّم ضغط التروية التاجية والدماغية."
   },
   {
    "n": 10,
    "en": "Monitor ETCO₂; aim for >10 mmHg during CPR.",
    "ar": "مراقبة ETCO₂؛ استهداف أكثر من 10 ملم زئبق أثناء الإنعاش.",
    "doing": "بأشوف قراءة ETCO₂ على الشاشة وبأتأكد إنها فوق 10 ملم زئبق. ارتفاعها المفاجئ فوق 40 بيدل على ROSC.",
    "whyEn": "ETCO₂ reflects cardiac output during CPR. Values <10 mmHg indicate poor CPR quality; sudden rise >40 indicates ROSC.",
    "whyAr": "ETCO₂ يعكس الناتج القلبي أثناء الإنعاش. قيم أقل من 10 تدل على جودة ضعيفة للإنعاش؛ الارتفاع المفاجئ فوق 40 يدل على ROSC."
   },
   {
    "n": 11,
    "en": "Establish IV or IO access. Epinephrine 1 mg IV/IO every 3–5 minutes.",
    "ar": "تأسيس وصول وريدي أو عظمي. إبينفرين 1 مجم وريدياً/عظمياً كل 3–5 دقائق.",
    "doing": "بأعمل كانيولا وريدية أو وصول عظمي لو الوريد صعب، وبأعطي الإبينفرين 1 مجم كل 3-5 دقائق وبأسجّل وقت كل جرعة.",
    "whyEn": "Epinephrine increases coronary and cerebral perfusion pressure via vasoconstriction, improving the likelihood of ROSC in both shockable and non-shockable rhythms.",
    "whyAr": "الإبينفرين يزيد ضغط التروية التاجية والدماغية عبر تضييق الأوعية، مما يحسن احتمالية عودة الدورة الدموية."
   },
   {
    "n": 12,
    "en": "For VF/pVT: Amiodarone 300 mg IV push (2nd dose: 150 mg) or Lidocaine alternative. Flush line with 20 mL saline after each drug.",
    "ar": "لـ VF/pVT: أميودارون 300 مجم وريدياً سريعاً (الجرعة الثانية: 150 مجم) أو ليدوكائين كبديل. شطف الخط بـ 20 مل سالاين بعد كل دواء.",
    "doing": "لو النظم VF أو pVT ومجاوبتش على الصدمات، بأعطي أميودارون 300 مجم IV سريع. الجرعة التانية 150 مجم. وبأشطف الخط بـ 20 مل سالاين بعد كل دواء.",
    "whyEn": "Amiodarone stabilizes cardiac membranes and suppresses ventricular arrhythmias. Flushing ensures the full drug dose reaches central circulation.",
    "whyAr": "الأميودارون يثبّت أغشية القلب ويقمع اضطرابات النظم البطيني. الشطف يضمن وصول الجرعة الكاملة للدورة الدموية المركزية."
   },
   {
    "n": 13,
    "en": "Identify and treat: Hypoxia · Hypovolemia · Hydrogen ion (acidosis) · Hypo/Hyperkalemia · Hypothermia · Tension pneumothorax · Tamponade · Toxins · Thrombosis (coronary/pulmonary)",
    "ar": "تحديد وعلاج: نقص الأكسجين · نقص حجم الدم · الحماض · اضطراب البوتاسيوم · انخفاض الحرارة · استرواح الصدر التوتري · دكاك القلب · السموم · الجلطة (تاجية/رئوية)",
    "doing": "بأفكر في كل سبب وبتعامل معاه: أكسجين للنقص، سوائل للنقص الحجمي، بيكربونات للحماض، تصريف للاسترواح، إبرة للدكاك، ترياق للسموم، أدوية/تدخل للجلطة.",
    "whyEn": "Cardiac arrest from reversible causes is treatable. Identifying and correcting H's & T's is the key to restoring spontaneous circulation when rhythm interventions alone are insufficient.",
    "whyAr": "توقف القلب من أسباب قابلة للعلاج يمكن علاجه. تحديد H's & T's وتصحيحها هو مفتاح استعادة الدورة عندما لا تكفي تدخلات النظم وحدها."
   },
   {
    "n": 14,
    "en": "Check for pulse and spontaneous breathing.",
    "ar": "التحقق من النبض والتنفس التلقائي.",
    "doing": "بأراقب الشاشة والمريض لعلامات ROSC: نبض ملموس، حركة، ارتفاع في ETCO₂ أو ضغط الدم.",
    "whyEn": "Early recognition of ROSC prevents unnecessary continuation of CPR and allows immediate transition to post-resuscitation care.",
    "whyAr": "التعرف المبكر على ROSC يمنع الاستمرار غير الضروري في الإنعاش ويسمح بالانتقال الفوري لرعاية ما بعد الإنعاش."
   },
   {
    "n": 15,
    "en": "Optimize oxygenation: Maintain SpO₂ 94–99%.",
    "ar": "تحسين الأكسجة: الحفاظ على SpO₂ بين 94–99%.",
    "doing": "بأراقب الـ SpO₂ وبأضبط تدفق الأكسجين عشان يفضل بين 94-99%. مش 100% لأن فرط الأكسجين ضار بالمخ.",
    "whyEn": "Hyperoxia (SpO₂ 100%) causes free radical injury to the reperfused brain. Targeting 94–99% optimizes cerebral protection.",
    "whyAr": "فرط الأكسجين يسبب إصابة جذور حرة للمخ المعاد تروّيه. استهداف 94-99% يحسّن حماية الدماغ."
   },
   {
    "n": 16,
    "en": "Monitor BP; consider fluids or vasopressors. Obtain 12-lead ECG.",
    "ar": "مراقبة ضغط الدم؛ النظر في سوائل أو مقويات وعائية. أخذ تخطيط قلب 12 اتجاه.",
    "doing": "بأقيس ضغط الدم ولو منخفض بأعطي سوائل أو دوبامين/نوريبينفرين. وبأعمل تخطيط 12 اتجاه للكشف عن STEMI.",
    "whyEn": "Hemodynamic support maintains organ perfusion post-ROSC. 12-lead ECG identifies STEMI requiring emergency PCI.",
    "whyAr": "الدعم الديناميكي يحافظ على تروية الأعضاء بعد ROSC. تخطيط 12 اتجاه يحدد STEMI الذي يتطلب تدخل طارئ بالقسطرة."
   },
   {
    "n": 17,
    "en": "Consider Targeted Temperature Management (TTM) 32–36°C for 24 hours.",
    "ar": "النظر في إدارة درجة الحرارة المستهدفة (TTM) 32–36°م لمدة 24 ساعة.",
    "doing": "لو المريض مش واعي بعد ROSC، بأبلّغ الطبيب عشان يقرر تطبيق بروتوكول TTM ويحافظ على الحرارة بين 32-36 درجة لـ 24 ساعة.",
    "whyEn": "TTM reduces cerebral metabolic demand and limits neurological damage from post-cardiac-arrest brain injury.",
    "whyAr": "TTM يقلل الطلب الأيضي الدماغي ويحدّ من الضرر العصبي الناتج عن إصابة الدماغ بعد توقف القلب."
   },
   {
    "n": 18,
    "en": "Transfer to ICU for post-arrest care. Documentation and Communication.",
    "ar": "نقل المريض لوحدة العناية المركزة لرعاية ما بعد الإنعاش. التوثيق والتواصل.",
    "doing": "بأرتب نقل المريض للـ ICU مع تقرير SBAR. وبأوثّق: وقت البدء، الأدوية وتوقيتها، عدد الصدمات، وقت ROSC، وحالة المريض عند النقل.",
    "whyEn": "ICU care provides intensive monitoring and management of post-arrest complications. Documentation ensures legal accountability and continuity of care.",
    "whyAr": "رعاية الـ ICU توفر مراقبة مكثفة وإدارة مضاعفات ما بعد الإنعاش. التوثيق يضمن المساءلة القانونية واستمرارية الرعاية."
   }
  ],
  "groups": [
   {
    "en": "Airway & Ventilation",
    "ar": "مجرى الهواء والتهوية",
    "items": [
     {
      "en": "Bag-Valve-Mask (BVM) with reservoir",
      "ar": "كيس صمام القناع (BVM) مع خزان",
      "use": "للتهوية اليدوية وإعطاء أكسجين عالي التركيز أثناء الإنعاش"
     },
     {
      "en": "Oxygen Supply with regulator / tubing",
      "ar": "مصدر أكسجين مع منظم وأنابيب",
      "use": "لتوفير الأكسجين اللازم للتهوية وعمليات الإنعاش"
     },
     {
      "en": "Suction Device with Catheters",
      "ar": "جهاز شفط مع قساطر",
      "use": "لإزالة الإفرازات والقيء من مجرى الهواء بسرعة أثناء الطوارئ"
     },
     {
      "en": "Oropharyngeal Airway (OPA)",
      "ar": "مجرى الهواء الفموي البلعومي",
      "use": "يُدخل في الفم لمنع انسداد مجرى الهواء باللسان لدى المريض فاقد الوعي"
     },
     {
      "en": "Nasopharyngeal Airway (NPA)",
      "ar": "مجرى الهواء الأنفي البلعومي",
      "use": "يُدخل عبر الأنف لتأمين مجرى هواء لدى المريض شبه الواعي"
     },
     {
      "en": "Endotracheal Tubes (ETT)",
      "ar": "أنابيب القصبة الهوائية",
      "use": "لتأمين مجرى هواء محكم أثناء التنبيب في الطوارئ"
     },
     {
      "en": "Laryngoscope with Blades",
      "ar": "منظار الحنجرة مع الشفرات",
      "use": "لتصوير مجرى الهواء وتوجيه الأنبوب أثناء التنبيب الطارئ"
     },
     {
      "en": "Video Laryngoscope",
      "ar": "منظار الحنجرة بالكاميرا",
      "use": "يوفر رؤية مباشرة محسنة لمجرى الهواء في الحالات الصعبة"
     },
     {
      "en": "Stylet or Bougie",
      "ar": "دليل صلب أو بوجي",
      "use": "لتوجيه الأنبوب في حالات التنبيب الصعب"
     },
     {
      "en": "Capnography (ETCO₂ Monitor)",
      "ar": "جهاز قياس ثاني أكسيد الكربون",
      "use": "للتأكد من الموضع الصحيح للأنبوب ومراقبة فعالية الإنعاش"
     }
    ]
   },
   {
    "en": "Circulation & Defibrillation",
    "ar": "الدورة الدموية والصدمة الكهربائية",
    "items": [
     {
      "en": "Cardiac Monitor / Defibrillator",
      "ar": "جهاز مراقبة القلب / الصدمة الكهربائية",
      "use": "لرصد نظم القلب وإعطاء الصدمة الكهربائية عند الحاجة لتصحيح اضطرابات الإيقاع"
     },
     {
      "en": "ECG Leads and Electrodes",
      "ar": "أسلاك وأقطاب تخطيط القلب",
      "use": "لتسجيل النشاط الكهربائي للقلب وتشخيص النوع المحدد من الاضطراب"
     },
     {
      "en": "Defibrillator Pads (adult / pediatric)",
      "ar": "لاصقات الصدمة (بالغين / أطفال)",
      "use": "توضع على الصدر لإيصال الصدمة الكهربائية بأمان وفعالية"
     },
     {
      "en": "External Pacemaker (transcutaneous)",
      "ar": "ناظم الخطى الخارجي عبر الجلد",
      "use": "لتحفيز القلب كهربائيًا عند حدوث البطء الشديد أو الانسداد الكامل"
     }
    ]
   },
   {
    "en": "Vascular Access",
    "ar": "الوصول الوريدي",
    "items": [
     {
      "en": "IV Cannulas (various sizes)",
      "ar": "إبر الكانيولا الوريدية",
      "use": "لتأسيس وصول وريدي سريع لإعطاء الأدوية والسوائل أثناء الإنعاش"
     },
     {
      "en": "Intraosseous (IO) Needle and Drill",
      "ar": "إبرة وحفار العظام (IO)",
      "use": "للوصول إلى نخاع العظم لإعطاء الأدوية عند فشل الوصول الوريدي"
     },
     {
      "en": "Normal Saline or Ringer's Lactate",
      "ar": "محلول ملحي أو رينجر لاكتات",
      "use": "لتعويض السوائل وتمييع الأدوية ودعم الدورة الدموية"
     },
     {
      "en": "IV Tubing and Extension Sets",
      "ar": "أنابيب وإضافات التسريب الوريدي",
      "use": "لنقل السوائل والأدوية من الكيس إلى وريد المريض"
     },
     {
      "en": "Syringes / Needles",
      "ar": "حقن وإبر",
      "use": "لتحضير وحقن الأدوية الطارئة مثل الأدرينالين والأميودارون"
     },
     {
      "en": "Saline Flushes",
      "ar": "شطف ملحي",
      "use": "للتأكد من وصول الدواء للوريد وعدم ترسبه في الخط"
     }
    ]
   },
   {
    "en": "Monitoring & Miscellaneous",
    "ar": "المراقبة والمتفرقات",
    "items": [
     {
      "en": "Blood Pressure Monitor",
      "ar": "جهاز قياس ضغط الدم",
      "use": "لمراقبة ضغط الدم باستمرار وتقييم مدى استجابة المريض للإنعاش"
     },
     {
      "en": "Pulse Oximeter",
      "ar": "جهاز قياس الأكسجين",
      "use": "لمراقبة تشبع الأكسجين وكشف أي تدهور في الحالة"
     },
     {
      "en": "Thermometer",
      "ar": "ميزان الحرارة",
      "use": "لقياس درجة حرارة المريض لاكتشاف انخفاض الحرارة أو الحمى"
     },
     {
      "en": "Glucometer",
      "ar": "جهاز قياس السكر",
      "use": "للتحقق من مستوى السكر في الدم كأحد أسباب الإغماء والسكتة"
     },
     {
      "en": "Emergency Crash Cart",
      "ar": "عربة الطوارئ",
      "use": "تحتوي على جميع أدوية وأدوات الإنعاش المنظمة في مكان واحد"
     },
     {
      "en": "Trauma Shears / Scissors",
      "ar": "مقص الطوارئ",
      "use": "لقص ملابس المريض بسرعة للوصول للصدر والعروق"
     },
     {
      "en": "Clock or Timer",
      "ar": "ساعة أو مؤقت",
      "use": "لتسجيل توقيت الجرعات وضغطات القلب وعمليات الإنعاش بدقة"
     },
     {
      "en": "Documentation Forms",
      "ar": "نماذج التوثيق",
      "use": "لتسجيل جميع الإجراءات والأدوية والاستجابات أثناء الإنعاش"
     },
     {
      "en": "PPE",
      "ar": "معدات الوقاية الشخصية",
      "use": "لحماية الفريق الطبي من الإفرازات والدماء أثناء الإنعاش"
     }
    ]
   }
  ]
 },
 {
  "id": "tpn",
  "titleEn": "TPN",
  "titleAr": "التغذية الوريدية الكاملة",
  "steps": [
   {
    "n": 1,
    "en": "Verify the physician's TPN order. Perform hand hygiene and don PPE.",
    "ar": "التحقق من أمر الطبيب الخاص بالـ TPN. غسل اليدين وارتداء معدات الوقاية الشخصية.",
    "doing": "بأراجع الأمر الطبي: اسم المريض، نوع المحلول، المعدل، التاريخ. وبأغسل إيدي وبألبس الجوانتي والكمامة.",
    "whyEn": "Verification using the \"5 Rights\" prevents medication errors. PPE reduces infection risk during central line manipulation.",
    "whyAr": "التحقق باستخدام \"5 حقوق الدواء\" يمنع أخطاء الأدوية. PPE يقلل خطر العدوى أثناء التعامل مع الخط المركزي."
   },
   {
    "n": 2,
    "en": "Inspect TPN bag for integrity, clarity, expiration, and label accuracy. Allow TPN solution to warm to room temperature if refrigerated.",
    "ar": "فحص كيس TPN للسلامة، الشفافية، الانتهاء، ودقة البطاقة. السماح للمحلول بالوصول لدرجة حرارة الغرفة إذا كان مبرداً.",
    "doing": "بأفحص الكيس جيداً: سلامته، شفافيته، تاريخ الانتهاء، ودقة البطاقة. وبأتركه يوصل لحرارة الغرفة لو كان في التلاجة.",
    "whyEn": "Detecting cloudiness, particles, or damage prevents administering contaminated solution. Cold solutions cause vein irritation and hypothermia.",
    "whyAr": "اكتشاف العكورة أو الجسيمات أو التلف يمنع إعطاء محلول ملوث. المحاليل الباردة تسبب تهيج الأوردة وانخفاض الحرارة."
   },
   {
    "n": 3,
    "en": "Assess the central line site and patency. Label a dedicated lumen for TPN use only.",
    "ar": "تقييم موضع الخط المركزي وسلامته. تحديد تجويف مخصص للـ TPN فقط.",
    "doing": "بأفحص موضع الخط للاحمرار والتورم والإفرازات، وبأتأكد من سلامته بالشفط. وبأحط بطاقة \"TPN فقط\" على التجويف المخصص.",
    "whyEn": "Site assessment detects early infection. A dedicated lumen prevents drug incompatibility reactions and maintains TPN integrity.",
    "whyAr": "تقييم الموضع يكشف العدوى مبكراً. التجويف المخصص يمنع تفاعلات عدم التوافق الدوائي ويحافظ على تكامل الـ TPN."
   },
   {
    "n": 4,
    "en": "Gather equipment: infusion pump, IV tubing, inline filter, alcohol wipes.",
    "ar": "تجميع الأدوات: مضخة التسريب، أنابيب السيروم، فلتر الخط، المناديل الكحولية.",
    "doing": "بأجهّز المضخة الوريدية وأنابيب السيروم والفلتر والمناديل الكحولية قبل البدء.",
    "whyEn": "Preparation prevents interruptions during the procedure and maintains sterility of the setup.",
    "whyAr": "التحضير يمنع الانقطاعات أثناء الإجراء ويحافظ على معايير التعقيم."
   },
   {
    "n": 5,
    "en": "Prime the tubing with TPN solution using aseptic technique.",
    "ar": "تجهيز الأنبوب بمحلول TPN باستخدام التقنية المعقمة.",
    "doing": "بأملأ الأنبوب بمحلول الـ TPN وبأخرج كل الهواء منه بالكامل قبل التوصيل.",
    "whyEn": "Air in IV tubing can cause potentially fatal air embolism. Aseptic priming maintains solution sterility.",
    "whyAr": "الهواء في أنبوب السيروم قد يسبب انصماماً هوائياً مميتاً. التجهيز المعقم يحافظ على سلامة المحلول."
   },
   {
    "n": 6,
    "en": "Connect tubing to central line using sterile technique. Start infusion at prescribed rate using infusion pump.",
    "ar": "توصيل الأنبوب بالخط المركزي بالتقنية المعقمة. بدء التسريب بالمعدل المحدد باستخدام مضخة التسريب.",
    "doing": "بأنظف رأس الخط بمنديل كحولي وبأوصّل الأنبوب بالتقنية المعقمة، وبأبدأ التسريب بالمعدل المحدد على المضخة.",
    "whyEn": "Sterile connection prevents CLABSI. Infusion pump ensures accurate delivery rate, preventing complications of under- or over-infusion.",
    "whyAr": "التوصيل المعقم يمنع CLABSI. مضخة التسريب تضمن معدل إعطاء دقيق ويمنع مضاعفات زيادة أو نقص التسريب."
   },
   {
    "n": 7,
    "en": "Monitor blood glucose every 4–6 hours. Monitor for complications: infection, fluid overload, electrolyte imbalance, refeeding syndrome.",
    "ar": "مراقبة سكر الدم كل 4–6 ساعات. مراقبة المضاعفات: العدوى، زيادة السوائل، اضطراب الكهارل، متلازمة إعادة التغذية.",
    "doing": "بأقيس سكر الدم كل 4-6 ساعات وبأراقب: الحمى والاحمرار في موضع الخط، وزن الجسم، ضيق التنفس، وقيم الكهارل.",
    "whyEn": "TPN causes hyperglycemia (requiring insulin) and metabolic complications. Early detection and correction prevents serious harm.",
    "whyAr": "الـ TPN يسبب ارتفاع سكر الدم (يتطلب أنسولين) ومضاعفات استقلابية. الكشف والتصحيح المبكران يمنعان الأذى الخطير."
   },
   {
    "n": 8,
    "en": "Assess and document central line site every shift.",
    "ar": "تقييم وتوثيق موضع الخط المركزي كل وردية.",
    "doing": "بأفحص موضع الخط كل وردية وبأوثّق أي احمرار أو تورم أو إفرازات أو ألم عند اللمس.",
    "whyEn": "Central line sites are high-risk for CLABSI; early detection and prompt removal prevents bacteremia and sepsis.",
    "whyAr": "مواضع الخطوط المركزية عالية الخطر لـ CLABSI؛ الكشف المبكر والإزالة الفورية تمنعان الجرثومية والإنتان."
   },
   {
    "n": 9,
    "en": "Check and record intake/output and daily weight. Review daily labs: electrolytes, liver/renal function, glucose, triglycerides.",
    "ar": "متابعة المدخلات والمخرجات والوزن اليومي. مراجعة التحاليل اليومية: الكهارل، وظائف الكبد/الكلى، الجلوكوز، الدهون الثلاثية.",
    "doing": "بأسجّل المدخلات والمخرجات بدقة وبأقيس الوزن يومياً. وبأراجع نتائج التحاليل وبأبلّغ الطبيب عن أي تغيرات.",
    "whyEn": "Daily monitoring detects fluid imbalance, electrolyte disorders, hepatic dysfunction, and hypertriglyceridemia early, enabling formula adjustments.",
    "whyAr": "المراقبة اليومية تكشف مبكراً اختلال السوائل واضطرابات الكهارل وخلل الكبد وارتفاع الدهون الثلاثية لتعديل الوصفة."
   },
   {
    "n": 10,
    "en": "Document all interventions, assessments, and patient responses. If discontinuing TPN, taper gradually and flush the line.",
    "ar": "توثيق كل التدخلات والتقييمات واستجابات المريض. عند إيقاف TPN، التقليل التدريجي وشطف الخط.",
    "doing": "بأوثّق كل حاجة: معدل التسريب، قراءات السكر، حالة الموضع، واستجابة المريض. لو بنوقف، بأقلل المعدل تدريجياً وبأشطف الخط.",
    "whyEn": "Documentation ensures care continuity. Gradual tapering prevents rebound hypoglycemia from sudden discontinuation of the high-glucose infusion.",
    "whyAr": "التوثيق يضمن استمرارية الرعاية. التقليل التدريجي يمنع هبوط السكر المفاجئ من الإيقاف المباشر للتسريب عالي الجلوكوز."
   }
  ],
  "groups": [
   {
    "en": "Infusion Needs",
    "ar": "مستلزمات التسريب",
    "items": [
     {
      "en": "TPN Solution Bag (custom-made)",
      "ar": "كيس محلول التغذية الوريدية (مُعد خصيصًا)",
      "use": "يحتوي على الجلوكوز والأحماض الأمينية والدهون والفيتامينات لتغذية المريض وريديًا"
     },
     {
      "en": "Infusion Pump (for rate control)",
      "ar": "مضخة التسريب",
      "use": "لإعطاء محلول التغذية بمعدل دقيق ومتحكم به لتجنب الارتفاع المفاجئ في السكر"
     },
     {
      "en": "IV Tubing with In-Line Filter",
      "ar": "أنبوب تسريب مع فلتر مدمج",
      "use": "لنقل المحلول للمريض مع تصفيته من أي جسيمات أو ميكروبات"
     }
    ]
   },
   {
    "en": "Access",
    "ar": "الوصول الوريدي المركزي",
    "items": [
     {
      "en": "Central Venous Access Device (PICC / Tunneled Catheter)",
      "ar": "جهاز الوصول الوريدي المركزي (PICC / قسطرة مُنفقة)",
      "use": "لإعطاء محلول التغذية المركزة بأمان في وريد كبير لتجنب تهيج الأوردة الصغيرة"
     }
    ]
   },
   {
    "en": "Site Care",
    "ar": "العناية بموضع القسطرة",
    "items": [
     {
      "en": "Dressing Supplies (for catheter site)",
      "ar": "مستلزمات ضمادة موضع القسطرة",
      "use": "لتغطية وحماية موضع القسطرة من التلوث والعدوى"
     },
     {
      "en": "Alcohol Wipes",
      "ar": "مناديل كحول",
      "use": "لتطهير المنافذ والموصلات قبل الاستخدام لمنع العدوى"
     }
    ]
   },
   {
    "en": "Monitoring",
    "ar": "المراقبة",
    "items": [
     {
      "en": "Blood Sampling Supplies",
      "ar": "مستلزمات سحب الدم",
      "use": "لأخذ عينات دورية لمراقبة الجلوكوز والشوارد والكبد والكلى وتعديل التغذية"
     },
     {
      "en": "PPE",
      "ar": "معدات الوقاية الشخصية",
      "use": "لحماية الممرض عند تحضير المحلول وتغيير الضمادة والتعامل مع القسطرة"
     }
    ]
   }
  ]
 },
 {
  "id": "art",
  "titleEn": "Arterial Catheter",
  "titleAr": "رعاية القسطرة الشريانية",
  "steps": [
   {
    "n": 1,
    "en": "Verify physician order and explain procedure to patient.",
    "ar": "التحقق من الأمر الطبي وشرح الإجراء للمريض.",
    "doing": "بأراجع الأمر الطبي وبأشرح للمريض وظيفة القسطرة الشريانية وأهميتها.",
    "whyEn": "Verification prevents errors. Patient education reduces anxiety, promotes cooperation, and fulfills informed consent requirements.",
    "whyAr": "التحقق يمنع الأخطاء. تثقيف المريض يقلل القلق ويعزز التعاون ويفي بمتطلبات الموافقة المستنيرة."
   },
   {
    "n": 2,
    "en": "Perform hand hygiene and use aseptic technique.",
    "ar": "غسل اليدين واستخدام التقنية المعقمة.",
    "doing": "بأغسل إيدي وبألبس جوانتي معقمة وبأتبع التقنية المعقمة في كل التعامل مع الخط الشرياني.",
    "whyEn": "Arterial line infections can rapidly progress to septicemia; aseptic technique is essential for all access and dressing changes.",
    "whyAr": "عدوى الخط الشرياني يمكن أن تتطور بسرعة إلى إنتان الدم؛ التقنية المعقمة ضرورية لكل وصول وتغيير ضمادة."
   },
   {
    "n": 3,
    "en": "Assess insertion site for redness, swelling, bleeding, or infection.",
    "ar": "تقييم موضع الإدخال للاحمرار والتورم والنزيف أو العدوى.",
    "doing": "بأفحص موضع الخط للاحمرار والتورم والنزيف وأي إفرازات وبأسجّل ما لاحظته.",
    "whyEn": "Early site assessment detects local infection or hematoma before progression to systemic complications.",
    "whyAr": "التقييم المبكر للموضع يكشف العدوى الموضعية أو الورم الدموي قبل التطور إلى مضاعفات جهازية."
   },
   {
    "n": 4,
    "en": "Check arterial waveform and blood pressure accuracy.",
    "ar": "التحقق من الموجة الشريانية ودقة قياس ضغط الدم.",
    "doing": "بأشوف شكل الموجة الشريانية على الشاشة وبأتأكد إنها صح وبأقارنها بقياس ضغط الدم بالكفة.",
    "whyEn": "A normal arterial waveform confirms catheter patency. Comparison with cuff BP validates reading accuracy for clinical decision-making.",
    "whyAr": "الموجة الشريانية الطبيعية تؤكد سلامة الكاتيتر. المقارنة مع كفة ضغط الدم تتحقق من دقة القراءة لاتخاذ القرارات السريرية."
   },
   {
    "n": 5,
    "en": "Maintain pressure bag at 300 mmHg.",
    "ar": "الحفاظ على كيس الضغط عند 300 ملم زئبق.",
    "doing": "بأتأكد إن كيس الضغط مضخوخ لـ 300 ملم زئبق عشان يضمن تدفق 3 مل/ساعة مستمر في الخط.",
    "whyEn": "Maintains continuous 3 mL/hr flush, preventing blood backflow and clot formation in the arterial catheter.",
    "whyAr": "يحافظ على شطف مستمر بـ 3 مل/ساعة، يمنع ارتداد الدم وتكوين الجلطات في القسطرة الشريانية."
   },
   {
    "n": 6,
    "en": "Ensure tubing is free from air bubbles.",
    "ar": "التأكد من خلو الأنابيب من فقاعات الهواء.",
    "doing": "بأفحص الأنابيب كلها وبأشيل أي فقاعات هواء بالطريقة المناسبة (طرد عبر صنبور الثلاثة اتجاهات).",
    "whyEn": "Air bubbles can cause arterial emboli or distort the waveform, leading to inaccurate pressure readings and potential harm.",
    "whyAr": "فقاعات الهواء قد تسبب انصمامات شريانية أو تشوه الموجة مما يؤدي إلى قراءات ضغط غير دقيقة وضرر محتمل."
   },
   {
    "n": 7,
    "en": "Zero and level transducer at phlebostatic axis.",
    "ar": "معايرة ومستوى المحول عند المحور الوريدي الثابت.",
    "doing": "بأحط المحول على مستوى الفراغ الرابع الضلعي عند منتصف الصدر (المحور الوريدي الثابت) وبأعمل له معايرة Zero.",
    "whyEn": "Zeroing at the phlebostatic axis eliminates hydrostatic pressure effects and ensures accurate blood pressure measurements.",
    "whyAr": "المعايرة عند المحور الوريدي الثابت تزيل تأثيرات الضغط الهيدروستاتيكي وتضمن قياسات ضغط دم دقيقة."
   },
   {
    "n": 8,
    "en": "Monitor circulation distal to insertion site (color, pulse, temperature).",
    "ar": "مراقبة الدورة الدموية في الجزء البعيد عن موضع الإدخال (اللون، النبض، الحرارة).",
    "doing": "بأراقب لون وحرارة ونبض اليد أو القدم الأبعد عن موضع الخط وبأقارنها بالجهة التانية.",
    "whyEn": "Arterial catheters can cause distal ischemia from thrombosis or spasm; early detection prevents limb-threatening complications.",
    "whyAr": "القسطرات الشريانية قد تسبب نقص تروية بعيدة من الجلطة أو التشنج؛ الكشف المبكر يمنع المضاعفات المهددة للطرف."
   },
   {
    "n": 9,
    "en": "Change dressing per hospital protocol using sterile technique.",
    "ar": "تغيير الضمادة حسب بروتوكول المستشفى بالتقنية المعقمة.",
    "doing": "بأغير الضمادة الشفافة كل 5-7 أيام وضمادة الشاش كل 24-48 ساعة، كلاهما بالتقنية المعقمة الكاملة.",
    "whyEn": "Regular sterile dressing changes maintain a protective barrier against infection while allowing visual site inspection.",
    "whyAr": "تغيير الضمادة المعقمة المنتظم يحافظ على حاجز واقٍ ضد العدوى مع إتاحة الفحص البصري للموضع."
   },
   {
    "n": 10,
    "en": "Document assessments, readings, and patient response.",
    "ar": "توثيق التقييمات وقراءات الضغط واستجابة المريض.",
    "doing": "بأوثّق كل تقييمات الموضع، قراءات الضغط الشرياني، حالة الدورة البعيدة، وأي تغيرات في حالة المريض.",
    "whyEn": "Accurate documentation allows trend monitoring of hemodynamic status and ensures continuity of critical care management.",
    "whyAr": "التوثيق الدقيق يسمح بمراقبة اتجاهات الحالة الديناميكية ويضمن استمرارية إدارة الرعاية الحرجة."
   }
  ],
  "groups": [
   {
    "en": "Monitoring System",
    "ar": "نظام المراقبة",
    "items": [
     {
      "en": "Arterial Catheter",
      "ar": "القسطرة الشريانية",
      "use": "تُدخل في الشريان لقياس الضغط الشرياني المستمر وسحب عينات الدم"
     },
     {
      "en": "Pressure Transducer",
      "ar": "محول الضغط",
      "use": "يحول إشارة الضغط الشرياني إلى إشارة كهربائية تظهر على شاشة المراقبة"
     },
     {
      "en": "Hemodynamic Monitoring System",
      "ar": "نظام مراقبة الديناميكا الدموية",
      "use": "يعرض ويسجل منحنى الضغط الشرياني والقيم باستمرار لمتابعة حالة المريض"
     }
    ]
   },
   {
    "en": "Pressure Maintenance",
    "ar": "الحفاظ على الضغط",
    "items": [
     {
      "en": "Pressure Bag (maintained at 300 mmHg)",
      "ar": "كيس الضغط (مضبوط على 300 ملم زئبق)",
      "use": "يضغط على كيس المحلول الملحي لضمان تدفق مستمر يمنع رجوع الدم في الخط"
     },
     {
      "en": "Flush System",
      "ar": "نظام الشطف",
      "use": "يشطف الخط بمحلول ملحي باستمرار لمنع التجلط وانسداد القسطرة"
     }
    ]
   },
   {
    "en": "Supplies",
    "ar": "المستلزمات",
    "items": [
     {
      "en": "Sterile Tubing (free from air bubbles)",
      "ar": "أنابيب معقمة (خالية من فقاعات الهواء)",
      "use": "لتوصيل القسطرة بمحول الضغط دون انسداد أو إدخال هواء للدورة الدموية"
     },
     {
      "en": "Sterile Dressing Supplies",
      "ar": "مستلزمات ضمادة معقمة",
      "use": "لتغطية موضع إدخال القسطرة وحمايته من التلوث"
     },
     {
      "en": "Antiseptic (for site cleaning)",
      "ar": "مطهر لتنظيف الموضع",
      "use": "لتعقيم الجلد حول موضع القسطرة ومنع الإنتان"
     }
    ]
   }
  ]
 },
 {
  "id": "pa",
  "titleEn": "PA Catheter",
  "titleAr": "رعاية قسطرة الشريان الرئوي",
  "steps": [
   {
    "n": 1,
    "en": "Perform hand hygiene and apply sterile gloves.",
    "ar": "غسل اليدين وارتداء الجوانتي المعقمة.",
    "doing": "بأغسل إيدي بالمطهر الكحولي أو الماء والصابون وبألبس الجوانتي المعقمة.",
    "whyEn": "PA catheters are invasive central devices; strict hand hygiene and sterile gloves are mandatory to prevent bloodstream infection.",
    "whyAr": "قسطرات PA أجهزة مركزية غازية؛ نظافة اليدين الصارمة والجوانتي المعقمة إلزامية لمنع عدوى مجرى الدم."
   },
   {
    "n": 2,
    "en": "Assess catheter insertion site.",
    "ar": "تقييم موضع إدخال الكاتيتر.",
    "doing": "بأفحص موضع الإدخال للاحمرار والتورم والإفرازات أو الألم عند الضغط.",
    "whyEn": "Early detection of phlebitis or infection at the insertion site allows prompt intervention before systemic spread.",
    "whyAr": "الكشف المبكر عن التهاب الوريد أو العدوى يتيح التدخل السريع قبل الانتشار الجهازي."
   },
   {
    "n": 3,
    "en": "Ensure catheter is secured properly.",
    "ar": "التأكد من تثبيت الكاتيتر بشكل صحيح.",
    "doing": "بأتأكد إن الكاتيتر مثبت باللاصق أو الخيط في مكانه ومش بيتحرك.",
    "whyEn": "Catheter migration can cause arrhythmias, pulmonary infarction, or vessel perforation; secure fixation prevents these serious complications.",
    "whyAr": "تحرك الكاتيتر قد يسبب اضطرابات نظم أو احتشاء رئوي أو انثقاب الأوعية؛ التثبيت الآمن يمنع هذه المضاعفات الخطيرة."
   },
   {
    "n": 4,
    "en": "Clean insertion site with chlorhexidine.",
    "ar": "تنظيف موضع الإدخال بالكلورهيكسيدين.",
    "doing": "بأنظف موضع الإدخال بالكلورهيكسيدين بحركة دائرية للخارج وبأتركه يجف تماماً قبل وضع الضمادة.",
    "whyEn": "Chlorhexidine has superior bactericidal activity compared to other antiseptics, significantly reducing CLABSI risk.",
    "whyAr": "الكلورهيكسيدين له نشاط قاتل للبكتيريا متفوق مقارنةً بالمطهرات الأخرى، مما يقلل بشكل كبير من خطر CLABSI."
   },
   {
    "n": 5,
    "en": "Apply sterile transparent dressing.",
    "ar": "وضع الضمادة الشفافة المعقمة.",
    "doing": "بأضع الضمادة الشفافة المعقمة على موضع الإدخال بشكل محكم وبأسجّل تاريخ التغيير عليها.",
    "whyEn": "Transparent dressings maintain a sterile barrier while allowing continuous visual monitoring of the site without removal.",
    "whyAr": "الضمادات الشفافة تحافظ على حاجز معقم مع إتاحة المراقبة البصرية المستمرة دون الحاجة للإزالة."
   },
   {
    "n": 6,
    "en": "Level transducer at phlebostatic axis.",
    "ar": "مستوى المحول عند المحور الوريدي الثابت.",
    "doing": "بأحط المحول على مستوى الفراغ الرابع الضلعي عند منتصف الصدر (المحور الوريدي الثابت).",
    "whyEn": "Correct transducer positioning eliminates gravitational errors and ensures accurate hemodynamic pressure measurements.",
    "whyAr": "الوضع الصحيح للمحول يزيل أخطاء الجاذبية ويضمن قياسات الضغط الديناميكي الدقيقة."
   },
   {
    "n": 7,
    "en": "Zero the transducer system.",
    "ar": "معايرة نظام المحول (Zeroing).",
    "doing": "بأوصّل المحول للهواء الطلق وبأضغط على زر Zero في الشاشة ثم أوصّله للمريض تاني.",
    "whyEn": "Zeroing eliminates atmospheric pressure effects and establishes the reference point for accurate hemodynamic measurements.",
    "whyAr": "المعايرة تزيل تأثيرات الضغط الجوي وتؤسس نقطة مرجعية لقياسات ديناميكية دقيقة."
   },
   {
    "n": 8,
    "en": "Monitor pulmonary artery pressures.",
    "ar": "مراقبة ضغوط الشريان الرئوي.",
    "doing": "بأراقب قراءات ضغط الشريان الرئوي (systolic/diastolic/mean) وبأسجّلها وبأبلّغ عن أي تغيرات غير طبيعية.",
    "whyEn": "PA pressures reflect right heart function and pulmonary vascular resistance, guiding fluid and vasopressor management.",
    "whyAr": "ضغوط PA تعكس وظيفة القلب الأيمن ومقاومة الأوعية الرئوية، مما يوجّه إدارة السوائل والمقويات الوعائية."
   },
   {
    "n": 9,
    "en": "Inflate balloon only during PCWP measurement.",
    "ar": "نفخ البالونة فقط أثناء قياس ضغط الإسفين الرئوي (PCWP).",
    "doing": "بأنفخ البالونة بهواء لا يتجاوز 1.5 مل فقط أثناء قياس الـ PCWP وبأتأكد من ظهور موجة الإسفين على الشاشة.",
    "whyEn": "Balloon inflation only during PCWP measurement prevents prolonged occlusion that can cause pulmonary artery rupture or infarction.",
    "whyAr": "نفخ البالونة فقط أثناء قياس PCWP يمنع الانسداد المطوّل الذي قد يسبب تمزق الشريان الرئوي أو الاحتشاء."
   },
   {
    "n": 10,
    "en": "Deflate balloon immediately after reading.",
    "ar": "تفريغ البالونة فوراً بعد القراءة.",
    "doing": "بأفرّغ البالونة فوراً بعد قراءة الـ PCWP وبأتأكد إن هواء البالونة رجع في المحقنة وبأرى موجة PA على الشاشة.",
    "whyEn": "Leaving the balloon inflated occludes a pulmonary artery branch, causing ischemia and potentially fatal pulmonary infarction.",
    "whyAr": "ترك البالونة منفوخة يسد فرع الشريان الرئوي مما يسبب نقص التروية واحتشاء رئوي مميت محتمل."
   },
   {
    "n": 11,
    "en": "Flush catheter lumens as prescribed.",
    "ar": "شطف تجاويف الكاتيتر حسب التعليمات الطبية.",
    "doing": "بأشطف التجاويف بالسالاين حسب بروتوكول المستشفى عشان أحافظ على سلامتها وأمنع الجلطات.",
    "whyEn": "Regular flushing prevents thrombus formation within the catheter lumens, maintaining patency for accurate pressure monitoring.",
    "whyAr": "الشطف المنتظم يمنع تكوين الجلطات داخل تجاويف الكاتيتر ويحافظ على سلامتها لمراقبة الضغط الدقيقة."
   },
   {
    "n": 12,
    "en": "Monitor ECG and vital signs continuously.",
    "ar": "المراقبة المستمرة للـ ECG والعلامات الحيوية.",
    "doing": "بأراقب الـ ECG والعلامات الحيوية بشكل مستمر وبأبلّغ فوراً عن أي اضطرابات في النظم أو تغيرات في الضغط.",
    "whyEn": "PA catheters can trigger ventricular arrhythmias; continuous ECG monitoring enables rapid detection and treatment.",
    "whyAr": "قسطرات PA قد تسبب اضطرابات نظم بطينية؛ المراقبة المستمرة للـ ECG تتيح الكشف السريع والعلاج."
   },
   {
    "n": 13,
    "en": "Document all findings and patient response.",
    "ar": "توثيق كل النتائج واستجابة المريض.",
    "doing": "بأوثّق كل قراءات الضغط وحالة الموضع والضمادة وأي تغيرات في الحالة الديناميكية أو أي اضطرابات نظم.",
    "whyEn": "Comprehensive documentation supports hemodynamic trend analysis, clinical decision-making, and ensures legal accountability.",
    "whyAr": "التوثيق الشامل يدعم تحليل اتجاهات الديناميكية واتخاذ القرارات السريرية ويضمن المساءلة القانونية."
   }
  ],
  "groups": [
   {
    "en": "The Kit",
    "ar": "طقم القسطرة",
    "items": [
     {
      "en": "Pulmonary Artery Catheter Kit",
      "ar": "طقم قسطرة الشريان الرئوي",
      "use": "قسطرة متخصصة متعددة الفتحات تُدخل حتى الشريان الرئوي لقياس الضغوط داخل القلب والرئتين"
     },
     {
      "en": "Syringe (1–1.5 mL) for balloon inflation",
      "ar": "حقنة 1–1.5 مل لنفخ البالون",
      "use": "لنفخ البالون الصغير في طرف القسطرة لتطفو بالدم وتصل للشريان الرئوي"
     }
    ]
   },
   {
    "en": "Sterility",
    "ar": "التعقيم",
    "items": [
     {
      "en": "Sterile Gloves",
      "ar": "قفازات معقمة",
      "use": "لضمان التعقيم التام أثناء إدخال القسطرة وتغيير الضمادة"
     },
     {
      "en": "Sterile Gown",
      "ar": "روب معقم",
      "use": "لحماية المريض من التلوث وحماية الفريق أثناء الإجراء الغازي"
     },
     {
      "en": "Chlorhexidine Antiseptic Solution",
      "ar": "محلول الكلوريكسيدين المطهر",
      "use": "لتعقيم موضع الإدخال وتقليل خطر الإنتان المرتبط بالقسطرة"
     }
    ]
   },
   {
    "en": "Monitoring",
    "ar": "المراقبة",
    "items": [
     {
      "en": "Pressure Transducer and Monitoring System",
      "ar": "محول الضغط ونظام المراقبة",
      "use": "لعرض وتسجيل ضغوط الشريان الرئوي والضغط الإسفيني (PCWP) والناتج القلبي"
     },
     {
      "en": "ECG Monitor",
      "ar": "جهاز مراقبة القلب",
      "use": "لرصد أي اضطرابات في نظم القلب قد تحدث أثناء إدخال القسطرة"
     },
     {
      "en": "Hemodynamic Monitor",
      "ar": "جهاز مراقبة الديناميكا الدموية",
      "use": "لعرض مؤشرات الدورة الدموية الدقيقة لتقييم وظيفة القلب وتوجيه العلاج"
     }
    ]
   },
   {
    "en": "Maintenance",
    "ar": "الصيانة",
    "items": [
     {
      "en": "Normal Saline or Heparinized Saline",
      "ar": "محلول ملحي أو ملحي بالهيبارين",
      "use": "لشطف قنوات القسطرة باستمرار لمنع التجلط وانسدادها"
     },
     {
      "en": "Sterile Transparent Dressing",
      "ar": "ضمادة شفافة معقمة",
      "use": "لتغطية موضع القسطرة مع إمكانية المراقبة البصرية دون إزالة الضمادة"
     },
     {
      "en": "Sterile Gauze",
      "ar": "شاش معقم",
      "use": "لتجفيف الموضع وتنظيفه عند تغيير الضمادة"
     },
     {
      "en": "Waste Disposal Bag",
      "ar": "كيس التخلص من النفايات",
      "use": "للتخلص الآمن من المواد الملوثة والمستخدمة وفق بروتوكولات مكافحة العدوى"
     }
    ]
   }
  ]
 },
 {
  "id": "vap",
  "titleEn": "VAP Bundle",
  "titleAr": "حزمة منع الالتهاب الرئوي المرتبط بالمنفسة",
  "steps": [
   {
    "n": 1,
    "en": "Assess readiness for extubation.",
    "ar": "تقييم الاستعداد للفطام من المنفسة كل وردية.",
    "doing": "بأقيّم: هل المريض واعٍ ومستجيب؟ هل قادر على التنفس مستقلاً؟ هل الإفرازات قليلة؟ وبأبلّغ الطبيب بنتائجي.",
    "whyEn": "Daily assessment reduces mechanical ventilation duration, lowering VAP risk and ICU mortality.",
    "whyAr": "التقييم اليومي يقلل مدة التنفس الصناعي مما يخفض خطر VAP والوفيات في الـ ICU."
   },
   {
    "n": 2,
    "en": "Elevate head of bed 30–45°.",
    "ar": "رفع رأس السرير 30–45 درجة كل وردية.",
    "doing": "بأرفع رأس السرير للزاوية المطلوبة وبأتحقق منها بشكل دوري أثناء الوردية، خاصةً بعد أي إجراء يغير وضعية المريض.",
    "whyEn": "Elevation prevents gastric reflux and microaspiration of oropharyngeal secretions, significantly reducing VAP incidence.",
    "whyAr": "الرفع يمنع ارتجاع المعدة والاستنشاق الدقيق للإفرازات البلعومية مما يقلل بشكل كبير من حدوث VAP."
   },
   {
    "n": 3,
    "en": "Assess sedation level and daily sedation vacation.",
    "ar": "تقييم مستوى التخدير وإجازة التخدير اليومية.",
    "doing": "بأقيس مستوى التخدير بمقياس RASS كل ساعة وبأوقف أدوية التخدير يومياً بإذن الطبيب عشان أقيّم وعي المريض.",
    "whyEn": "Minimizing sedation reduces ventilator days, ICU stay, delirium, and neuromuscular weakness while improving extubation success.",
    "whyAr": "تقليل التخدير يقلل أيام المنفسة والإقامة في ICU والهذيان وضعف العضلات مع تحسين نجاح الفطام."
   },
   {
    "n": 4,
    "en": "Oral care with chlorhexidine 0.12%.",
    "ar": "العناية بالفم بالكلورهيكسيدين 0.12% كل 2–4 ساعات.",
    "doing": "بأنظف الفم والأسنان واللسان بفرشة أو أسواب مبللة بالكلورهيكسيدين 0.12% كل 2-4 ساعات وبأشفط الإفرازات بعدها.",
    "whyEn": "Chlorhexidine reduces oral bacterial colonization, the primary source of VAP pathogens in ventilated patients.",
    "whyAr": "الكلورهيكسيدين يقلل التوطن البكتيري الفموي، المصدر الرئيسي لمسببات VAP في المرضى على المنفسة."
   },
   {
    "n": 5,
    "en": "Suction only when needed (not routine).",
    "ar": "الشفط عند الحاجة فقط وليس بشكل روتيني (كل 4 ساعات تقييم).",
    "doing": "بأشفط فقط لو في إفرازات ظاهرة أو أصوات تنفس غير طبيعية أو زيادة في ضغط المنفسة. مش بشفط بشكل روتيني.",
    "whyEn": "Unnecessary suctioning causes mucosal trauma, hypoxia, bronchospasm, and increased infection risk; indication-based suctioning is safer.",
    "whyAr": "الشفط غير الضروري يسبب صدمة للغشاء المخاطي ونقص الأكسجين وتشنج القصبات وزيادة خطر العدوى."
   },
   {
    "n": 6,
    "en": "Check ET tube cuff pressure (20–30 cmH₂O).",
    "ar": "التحقق من ضغط بالونة أنبوب التنبيب (20–30 سم ماء) كل وردية.",
    "doing": "بأقيس ضغط البالونة بالمانوميتر كل وردية وبأتأكد إنها بين 20-30 cmH₂O وبأعدّل لو لازم.",
    "whyEn": "Adequate cuff pressure prevents microaspiration of subglottic secretions (VAP source) while pressures >30 cmH₂O cause tracheal ischemia.",
    "whyAr": "الضغط المناسب يمنع الاستنشاق الدقيق للإفرازات تحت المزمار (مصدر VAP) بينما الضغط فوق 30 يسبب نقص تروية القصبة."
   },
   {
    "n": 7,
    "en": "Spontaneous breathing trial (if appropriate).",
    "ar": "اختبار التنفس التلقائي يومياً (إذا كان مناسباً).",
    "doing": "بأقلل دعم المنفسة لمدة 30-120 دقيقة وبأراقب مدى قدرة المريض على التنفس مستقلاً وبأوثّق النتيجة.",
    "whyEn": "Daily SBT is the most effective method to reduce ventilator duration and facilitate safe, timely extubation.",
    "whyAr": "اختبار التنفس التلقائي اليومي هو الأسلوب الأكثر فاعلية لتقليل مدة التنفس الصناعي وتسهيل الفطام الآمن."
   },
   {
    "n": 8,
    "en": "DVT prophylaxis.",
    "ar": "الوقاية من الجلطات الوريدية العميقة كل وردية.",
    "doing": "بأطبق الجوارب الضاغطة أو الضغط الهوائي المتقطع وبأتأكد من إعطاء الهيبارين لو مقرر من الطبيب.",
    "whyEn": "Immobile ventilated patients are at high DVT and pulmonary embolism risk; prophylaxis significantly reduces thromboembolic events.",
    "whyAr": "المرضى المتنفسين صناعياً الغير متحركين في خطر عالٍ لجلطات وريدية عميقة وانصمام رئوي؛ الوقاية تقلل الأحداث الانصمامية الخثارية."
   },
   {
    "n": 9,
    "en": "Peptic ulcer prophylaxis.",
    "ar": "الوقاية من قرحة المعدة كل وردية.",
    "doing": "بأتأكد من إعطاء الأدوية المقررة للوقاية من قرحة الضغط (مثبطات مضخة البروتون مثل أوميبرازول أو مضادات H2).",
    "whyEn": "Critically ill ventilated patients are at high risk for stress-related mucosal disease and GI bleeding; prophylaxis prevents life-threatening hemorrhage.",
    "whyAr": "المرضى الحرجين على المنفسة في خطر عالٍ لأمراض الغشاء المخاطي المرتبطة بالضغط والنزيف الهضمي."
   }
  ],
  "groups": []
 },
 {
  "id": "cauti",
  "titleEn": "CAUTI Bundle",
  "titleAr": "حزمة منع عدوى المسالك البولية المرتبطة بالقسطرة",
  "steps": [
   {
    "n": 1,
    "en": "Use sterile technique for insertion.",
    "ar": "استخدام تقنية التعقيم عند الإدخال.",
    "doing": "بأستخدم مجموعة القسطرة المعقمة وبألبس الجوانتي المعقمة وبأنظف المنطقة التناسلية بالكلورهيكسيدين قبل الإدخال.",
    "whyEn": "Sterile insertion technique is the primary measure to prevent bacteria from entering the bladder during catheterization.",
    "whyAr": "تقنية الإدخال المعقمة هي الإجراء الأساسي لمنع دخول البكتيريا للمثانة أثناء التقطير البولي."
   },
   {
    "n": 2,
    "en": "Use smallest appropriate catheter size.",
    "ar": "استخدام أصغر حجم مناسب للقسطرة.",
    "doing": "بأختار أصغر حجم قسطرة يضمن التصريف الكافي للبول دون إعاقة.",
    "whyEn": "Smaller catheters cause less urethral trauma and periurethral irritation, reducing the risk of colonization and infection.",
    "whyAr": "القسطرة الأصغر تسبب صدمة أقل للإحليل وتهيجاً حول الإحليل مما يقلل خطر الاستعمار والعدوى."
   },
   {
    "n": 3,
    "en": "Assess continued need for catheter.",
    "ar": "تقييم الحاجة المستمرة للقسطرة كل وردية.",
    "doing": "بأسأل يومياً: هل القسطرة لا تزال ضرورية؟ وبأبلّغ الطبيب عشان نقرر الإزالة لو ممكن وبأوثّق المبرر.",
    "whyEn": "CAUTI risk increases each day the catheter remains; prompt removal when no longer indicated is the most effective prevention strategy.",
    "whyAr": "خطر CAUTI يزداد كل يوم تبقى فيه القسطرة؛ الإزالة الفورية عند انتهاء الحاجة هي الاستراتيجية الأكثر فاعلية."
   },
   {
    "n": 4,
    "en": "Maintain closed drainage system.",
    "ar": "الحفاظ على نظام التصريف المغلق كل وردية.",
    "doing": "بأتأكد إن كل التوصيلات محكمة وما فيش انفصال في النظام وبأحافظ على إغلاقه طول الوقت.",
    "whyEn": "Opening the closed system allows environmental bacteria to enter the urinary system, significantly increasing CAUTI risk.",
    "whyAr": "فتح النظام المغلق يسمح للبكتيريا البيئية بالدخول للجهاز البولي مما يزيد بشكل كبير من خطر CAUTI."
   },
   {
    "n": 5,
    "en": "Keep drainage bag below bladder level.",
    "ar": "الإبقاء على كيس التصريف تحت مستوى المثانة كل وردية.",
    "doing": "بأتأكد إن كيس البول دايماً أسفل مستوى المثانة وبعيد عن الأرض وبأنبّه الفريق لو تغيرت وضعية المريض.",
    "whyEn": "Positioning above bladder level causes urine backflow, introducing bacteria from the bag into the bladder and causing infection.",
    "whyAr": "وضع الكيس فوق مستوى المثانة يسبب ارتداد البول مما يدخل بكتيريا من الكيس للمثانة ويسبب عدوى."
   },
   {
    "n": 6,
    "en": "Secure catheter to prevent movement.",
    "ar": "تثبيت القسطرة لمنع الحركة كل وردية.",
    "doing": "بأثبت القسطرة على فخذ المريض بلاصق خاص وبأتأكد إنها مش شايلة ذيل طويل يتعلق.",
    "whyEn": "Unsecured catheters cause urethral trauma from movement, creating microlesions that facilitate ascending bacterial infection.",
    "whyAr": "القسطرة غير المثبتة تسبب صدمة للإحليل من الحركة مما يخلق تشققات صغيرة تسهّل العدوى البكتيرية الصاعدة."
   },
   {
    "n": 7,
    "en": "Perform perineal hygiene.",
    "ar": "النظافة التناسلية كل وردية.",
    "doing": "بأنظف المنطقة التناسلية بالماء والصابون من الأمام للخلف كل وردية وبعد كل إفراز، مع الانتباه لتنظيف حول مدخل القسطرة.",
    "whyEn": "Perineal hygiene removes periurethral bacteria and soiling, reducing the bacterial load that can ascend along the catheter.",
    "whyAr": "النظافة التناسلية تزيل البكتيريا حول الإحليل والإفرازات مما يقلل الحمل البكتيري الذي قد يصعد على طول القسطرة."
   },
   {
    "n": 8,
    "en": "Empty drainage bag regularly; do not touch spout.",
    "ar": "تفريغ كيس التصريف بانتظام دون لمس الصنبور كل وردية.",
    "doing": "بأفرّغ الكيس كل وردية أو لما يمتلئ لـ 2/3، ومش بالمس صنبور التفريغ بأي سطح وبأستخدم وعاء قياس نظيف.",
    "whyEn": "Overfilling causes backflow into the bladder. Contamination of the drain spout is a major route for bacterial entry into the closed system.",
    "whyAr": "الامتلاء الزائد يسبب الارتداد للمثانة. تلوث صنبور التفريغ هو طريق رئيسي لدخول البكتيريا في النظام المغلق."
   },
   {
    "n": 9,
    "en": "Document indication for catheter.",
    "ar": "توثيق مبرر استخدام القسطرة يومياً.",
    "doing": "بأوثّق السبب الطبي لبقاء القسطرة كل يوم في ملف المريض (مثل: متابعة دقيقة للمخرجات، انسداد بولي، إلخ).",
    "whyEn": "Daily documentation promotes clinical accountability and drives daily review of catheter necessity, facilitating earlier removal.",
    "whyAr": "التوثيق اليومي يعزز المساءلة السريرية ويدفع لمراجعة يومية لضرورة القسطرة مما يسهّل الإزالة المبكرة."
   }
  ],
  "groups": []
 },
 {
  "id": "clabsi",
  "titleEn": "CLABSI Bundle",
  "titleAr": "حزمة منع عدوى مجرى الدم المرتبطة بالخط المركزي",
  "steps": [
   {
    "n": 1,
    "en": "Use maximal sterile barrier precautions.",
    "ar": "استخدام أقصى احتياطات الحاجز المعقم عند الإدخال.",
    "doing": "بأتأكد إن الطبيب يلبس قبعة ومريلة وجوانتي معقمة وكمامة، والمريض مغطى بملاءة معقمة كاملة.",
    "whyEn": "Maximal sterile barrier precautions reduce CLABSI incidence by up to 6-fold compared to minimal precautions during insertion.",
    "whyAr": "احتياطات الحاجز الأقصى تقلل حدوث CLABSI بما يصل إلى 6 أضعاف مقارنةً بالاحتياطات الدنيا أثناء الإدخال."
   },
   {
    "n": 2,
    "en": "Use chlorhexidine skin antisepsis.",
    "ar": "تطهير الجلد بالكلورهيكسيدين عند الإدخال.",
    "doing": "بأنظف موضع الإدخال بالكلورهيكسيدين 2% بحركات دائرية للخارج وبأتركه يجف تماماً (30 ثانية على الأقل) قبل الإدخال.",
    "whyEn": "Chlorhexidine has superior persistent antimicrobial activity and is more effective than povidone-iodine in preventing CLABSI.",
    "whyAr": "الكلورهيكسيدين له نشاط مضاد للميكروبات مستمر ومتفوق وأكثر فاعلية من البوفيدون اليود في منع CLABSI."
   },
   {
    "n": 3,
    "en": "Select optimal catheter site (avoid femoral).",
    "ar": "اختيار أفضل موضع للكاتيتر وتجنب الوريد الفخذي.",
    "doing": "بأفضّل الوريد تحت الترقوة أو الوريد الوداجي الداخلي على الوريد الفخذي وبأبلّغ الطبيب بالأفضلية المدعومة بالدليل.",
    "whyEn": "Femoral sites have the highest infection risk due to proximity to perineal flora and difficulty maintaining sterility.",
    "whyAr": "المواضع الفخذية لها أعلى خطر للعدوى بسبب قربها من بكتيريا منطقة العجان وصعوبة الحفاظ على التعقيم."
   },
   {
    "n": 4,
    "en": "Assess continued need for central line.",
    "ar": "تقييم الحاجة المستمرة للخط المركزي كل وردية.",
    "doing": "بأسأل يومياً: هل يمكن إزالة الخط أو الاستعاضة عنه بخط محيطي؟ وبأوثّق المبرر الطبي للبقاء.",
    "whyEn": "CLABSI risk increases daily; removing the central line as soon as clinically appropriate is the most effective prevention.",
    "whyAr": "خطر CLABSI يزداد يومياً؛ إزالة الخط المركزي فور الاستطاعة السريرية هو أكثر الوقايات فاعلية."
   },
   {
    "n": 5,
    "en": "Perform hand hygiene before accessing line.",
    "ar": "غسل اليدين قبل الوصول للخط كل وردية.",
    "doing": "بأغسل إيدي بالماء والصابون أو المطهر الكحولي قبل كل وصول للخط المركزي بدون استثناء.",
    "whyEn": "Hand hygiene is the single most cost-effective intervention to prevent all healthcare-associated infections including CLABSI.",
    "whyAr": "غسل اليدين هو التدخل الأكثر فاعلية من حيث التكلفة لمنع جميع العدوى المرتبطة بالرعاية الصحية بما فيها CLABSI."
   },
   {
    "n": 6,
    "en": "Inspect insertion site.",
    "ar": "فحص موضع الإدخال كل وردية.",
    "doing": "بأفحص الموضع للاحمرار والتورم والإفرازات وبأبلّغ فوراً عن أي علامات عدوى وبأوثّق ما لاحظته.",
    "whyEn": "Early site infection detection enables prompt line removal and antibiotic initiation before bacteremia and sepsis develop.",
    "whyAr": "الكشف المبكر عن عدوى الموضع يتيح إزالة الخط الفورية وبدء المضادات الحيوية قبل تطور جرثومية الدم والإنتان."
   },
   {
    "n": 7,
    "en": "Scrub the hub 15 seconds before access.",
    "ar": "تنظيف (فرك) رأس الخط 15 ثانية قبل كل وصول.",
    "doing": "بأفرك رأس الخط (Hub) بمنديل كحول أو كلورهيكسيدين لمدة 15 ثانية كاملة وبأتركه يجف قبل الاستخدام.",
    "whyEn": "\"Scrub the hub\" removes biofilm and bacteria from the needleless connector, preventing intraluminal contamination — a major CLABSI pathway.",
    "whyAr": "\"فرك الرأس\" يزيل الغشاء الحيوي والبكتيريا من الموصل مما يمنع التلوث داخل التجويف — وهو المسار الرئيسي لـ CLABSI."
   },
   {
    "n": 8,
    "en": "Change transparent dressing.",
    "ar": "تغيير الضمادة الشفافة كل 5–7 أيام.",
    "doing": "بأغير الضمادة الشفافة كل 5-7 أيام أو فور ما تتسخ أو تنشلخ أو تتلف بالتقنية المعقمة الكاملة.",
    "whyEn": "Transparent dressings maintain an adequate sterile barrier for 5–7 days; more frequent changes increase unnecessary site manipulation risk.",
    "whyAr": "الضمادات الشفافة تحافظ على حاجز معقم كافٍ لـ 5-7 أيام؛ التغيير الأكثر تكراراً يزيد خطر التلاعب غير الضروري بالموضع."
   },
   {
    "n": 9,
    "en": "Change gauze dressing.",
    "ar": "تغيير ضمادة الشاش كل 24 ساعة.",
    "doing": "بأغير ضمادة الشاش كل 24 ساعة لأنها بتمتص الرطوبة بسرعة مما يجعلها أقل فاعلية كحاجز واقٍ.",
    "whyEn": "Gauze dressings absorb moisture rapidly, losing barrier function quickly; daily changes maintain adequate protection.",
    "whyAr": "ضمادات الشاش تمتص الرطوبة بسرعة وتفقد وظيفتها الواقية بسرعة؛ التغيير اليومي يحافظ على الحماية الكافية."
   },
   {
    "n": 10,
    "en": "Change needleless connectors per protocol.",
    "ar": "تغيير الموصلات بدون إبرة حسب البروتوكول.",
    "doing": "بأغير الموصلات حسب بروتوكول المستشفى (عادة كل 72-96 ساعة) مع تطهير الرأس قبل كل وصول.",
    "whyEn": "Needleless connectors accumulate biofilm over time; regular replacement according to protocol minimizes intraluminal bacterial contamination.",
    "whyAr": "الموصلات بدون إبرة تتراكم عليها الأغشية الحيوية مع الوقت؛ الاستبدال المنتظم يقلل التلوث البكتيري داخل التجويف."
   },
   {
    "n": 11,
    "en": "Change IV tubing per protocol.",
    "ar": "تغيير أنابيب السيروم حسب البروتوكول (كل 24–96 ساعة).",
    "doing": "بأغير أنابيب السيروم حسب جدول المستشفى: أنابيب الدم والدهون كل 24 ساعة، والأنابيب العادية كل 72-96 ساعة.",
    "whyEn": "Lipid-containing solutions support bacterial growth, requiring more frequent tubing changes. Regular replacement prevents biofilm accumulation.",
    "whyAr": "المحاليل المحتوية على دهون تدعم نمو البكتيريا مما يتطلب تغيير متكرر. الاستبدال المنتظم يمنع تراكم الأغشية الحيوية."
   },
   {
    "n": 12,
    "en": "Review labs for signs of infection.",
    "ar": "مراجعة التحاليل يومياً لعلامات العدوى.",
    "doing": "بأراجع يومياً: CBC، CRP، PCT، وزراعات الدم وبأبلّغ الطبيب فوراً عن أي ارتفاع في مؤشرات العدوى.",
    "whyEn": "Lab monitoring enables early detection of CLABSI before clinical deterioration, allowing prompt line removal and antibiotic therapy.",
    "whyAr": "مراقبة التحاليل تتيح الكشف المبكر عن CLABSI قبل التدهور السريري مما يتيح إزالة الخط الفورية والعلاج بالمضادات الحيوية."
   }
  ],
  "groups": []
 }
];
