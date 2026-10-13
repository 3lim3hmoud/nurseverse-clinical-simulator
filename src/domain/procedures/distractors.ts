/**
 * Things that do NOT belong to MV Care. The exam mixes them in (extra items on the tables, extra steps in the list)
 * so the student has to choose. Taken from the other course procedures (see docs/future-procedures.json).
 */
export interface Distractor {
  en: string;
  ar: string;
  use: string;
}
export interface DistractorStep {
  en: string;
  ar: string;
}

export const DISTRACTOR_ITEMS: Distractor[] = [
  {
    "en": "Defibrillator Pads (adult / pediatric)",
    "ar": "لاصقات الصدمة (بالغين / أطفال)",
    "use": "توضع على الصدر لإيصال الصدمة الكهربائية بأمان وفعالية"
  },
  {
    "en": "Video Laryngoscope",
    "ar": "منظار الحنجرة بالكاميرا",
    "use": "يوفر رؤية مباشرة محسنة لمجرى الهواء في الحالات الصعبة"
  },
  {
    "en": "Pressure Transducer",
    "ar": "محول الضغط",
    "use": "يحول إشارة الضغط الشرياني إلى إشارة كهربائية تظهر على شاشة المراقبة"
  },
  {
    "en": "TPN Solution Bag (custom-made)",
    "ar": "كيس محلول التغذية الوريدية (مُعد خصيصًا)",
    "use": "يحتوي على الجلوكوز والأحماض الأمينية والدهون والفيتامينات لتغذية المريض وريديًا"
  },
  {
    "en": "Sterile Tracheostomy Dressing",
    "ar": "ضمادة الرغامى المعقمة",
    "use": "توضع حول فتحة الرغامى لامتصاص الإفرازات وحماية الجلد"
  },
  {
    "en": "Hydrogen Peroxide (if policy allows)",
    "ar": "ماء أوكسجين (حسب السياسة)",
    "use": "لإذابة الإفرازات المتكلسة الصعبة من الكانيولا الداخلية"
  },
  {
    "en": "Oropharyngeal Airway (OPA)",
    "ar": "مجرى الهواء الفموي البلعومي",
    "use": "يُدخل في الفم لمنع انسداد مجرى الهواء باللسان لدى المريض فاقد الوعي"
  },
  {
    "en": "Flush System",
    "ar": "نظام الشطف",
    "use": "يشطف الخط بمحلول ملحي باستمرار لمنع التجلط وانسداد القسطرة"
  }
];

export const DISTRACTOR_STEPS: DistractorStep[] = [
  {
    "en": "Remove and discard soiled tracheostomy dressing. Remove gloves, wash hands, and wear another pair of gloves.",
    "ar": "إزالة الضمادة المتسخة والتخلص منها. خلع الجوانتي وغسل اليدين وارتداء جوانتي جديدة."
  },
  {
    "en": "Begin chest compressions: depth 5–6 cm, rate 100–120/min, full recoil. Use 30:2 ratio if no advanced airway.",
    "ar": "بدء ضغطات الصدر: عمق 5–6 سم، معدل 100–120/دقيقة، مع الارتداد الكامل. نسبة 30:2 إن لم يكن هناك مجرى هواء متقدم."
  },
  {
    "en": "Assess the central line site and patency. Label a dedicated lumen for TPN use only.",
    "ar": "تقييم موضع الخط المركزي وسلامته. تحديد تجويف مخصص للـ TPN فقط."
  },
  {
    "en": "Maintain pressure bag at 300 mmHg.",
    "ar": "الحفاظ على كيس الضغط عند 300 ملم زئبق."
  },
  {
    "en": "Insert the inner cannula and lock it into place.",
    "ar": "إدخال القنية الداخلية وتثبيتها في مكانها."
  }
];
