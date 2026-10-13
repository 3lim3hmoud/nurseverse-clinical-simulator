/**
 * MV Care, from Critical_procedures.html and Critical_Equipment.html (course CLN2424).
 * The other procedures (tracheostomy, ACLS, TPN, arterial / PA catheter, VAP / CAUTI / CLABSI bundles) are parked in
 * docs/future-procedures.json, to be added back one at a time (see docs/ROADMAP.md).
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
 }
];
