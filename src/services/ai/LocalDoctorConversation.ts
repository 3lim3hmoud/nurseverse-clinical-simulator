import { medById, reviewOrder, type MedId } from '../../domain/medications';
import { t } from '../../i18n';
import { normalize } from './intents';
import type { ChatTurn, DoctorChatContext, DoctorChatReply, DoctorChatService } from './types';

/** Keywords are substrings of the normalised text (English + Arabic). */
const MED_WORDS: Record<MedId, string[]> = {
  paracetamol: ['paracetamol', 'acetaminophen', 'tylenol', 'panadol', 'antipyretic', 'باراسيتامول', 'بنادول', 'خافض حرار', 'خافض للحرار'],
  salbutamol: ['salbutamol', 'albuterol', 'ventolin', 'nebuli', 'inhaler', 'سالبوتامول', 'فنتولين', 'نيبيولايزر', 'بخاخ', 'جلسه بخار'],
  ondansetron: ['ondansetron', 'zofran', 'antiemetic', 'anti-emetic', 'اوندانسيترون', 'زوفران', 'مضاد قيء', 'مضاد للقيء', 'مضاد استفراغ'],
  ceftriaxone: ['ceftriaxone', 'rocephin', 'antibiotic', 'سيفترياكسون', 'مضاد حيوي', 'مضاد حيوى', 'مضادات حيويه'],
  morphine: ['morphine', 'opioid', 'مورفين', 'مسكن قوي'],
  furosemide: ['furosemide', 'lasix', 'diuretic', 'فيوروسيمايد', 'لازكس', 'مدر للبول', 'مدر بول'],
  insulin: ['insulin', 'انسولين'],
};

const TOPIC_WORDS = {
  advice: ['what should i do', 'what do you want', 'what now', 'next step', 'orders', 'advice', 'plan', 'instruction', 'what to do', 'اعمل ايه', 'اعمل اي', 'اوامر', 'تعليمات', 'الخطوه', 'ايه المطلوب', 'ماذا افعل', 'ماذا يجب', 'نصيحه', 'اتصرف'],
  report: ['spo2', 'saturation', 'oxygen level', 'blood pressure', ' bp ', 'heart rate', 'pulse', 'vitals', 'sugar is', 'glucose is', 'report', 'update', 'اكسجين', 'ضغط', 'نبض', 'سكر', 'علامات حيويه', 'تقرير', 'حالته', 'حالتها'],
  arrive: ['come', 'coming', 'arrive', 'when will you', 'how long will', 'on your way', 'تيجي', 'هتيجي', 'تحضر', 'متي', 'امتي', 'وصلت', 'حضور'],
  urgent: ['urgent', 'emergency', 'critical', 'deteriorat', 'getting worse', 'worse', 'help', 'عاجل', 'طارئ', 'تدهور', 'اسوا', 'سيئه', 'ساعد', 'حرجه', 'حرج'],
  thanks: ['thank', 'شكرا', 'تسلم', 'ممنون'],
  greeting: ['^hello', '^hi', '^hey', 'good morning', 'good evening', 'مرحبا', 'اهلا', 'سلام', 'صباح', 'مساء'],
} as const;

type Topic = keyof typeof TOPIC_WORDS;

const has = (text: string, kw: string) => (kw.startsWith('^') ? new RegExp(`(^|\\s)${kw.slice(1)}(\\s|$)`).test(text) : text.includes(kw));
const matches = (text: string, words: readonly string[]) => words.some((w) => has(text, w));

/** The medication the message is about (the first one mentioned), if any. */
export function detectMedication(question: string): MedId | null {
  const text = ` ${normalize(question)} `;
  for (const id of Object.keys(MED_WORDS) as MedId[]) if (matches(text, MED_WORDS[id])) return id;
  return null;
}

function detectTopics(question: string): Topic[] {
  const text = ` ${normalize(question)} `;
  return (Object.keys(TOPIC_WORDS) as Topic[]).filter((k) => matches(text, TOPIC_WORDS[k]));
}

/** What the doctor would tell the nurse to do next in this case, from what has been done so far. */
function guidanceKey(ctx: DoctorChatContext): string {
  switch (ctx.scenario.id) {
    case 'respiratory':
      if (!ctx.oxygenOn) return 'dchat.g.respiratory.o2';
      return ctx.vitals.spo2 < 94 ? 'dchat.g.respiratory.titrate' : 'dchat.g.respiratory.ok';
    case 'shock':
      return ctx.ivOn ? 'dchat.g.shock.recheck' : 'dchat.g.shock.fluids';
    case 'hypoglycemia':
      if (ctx.glucose === undefined) return 'dchat.g.hypoglycemia.ok';
      if (!ctx.glucoseTreated) return 'dchat.g.hypoglycemia.treat';
      return 'dchat.g.hypoglycemia.recheck';
  }
}

/** Offline on-call doctor: understands medication requests, advice/orders, reports, urgency and small talk. */
export class LocalDoctorConversation implements DoctorChatService {
  async ask(ctx: DoctorChatContext, question: string, _history?: readonly ChatTurn[]): Promise<DoctorChatReply> {
    const med = detectMedication(question);
    if (med) {
      const review = reviewOrder(ctx.scenario.id, med);
      const name = t(medById(med).nameKey);
      const head = review.approved ? t('dchat.order.yes', { med: name }) : t('dchat.order.no', { med: name });
      return { text: `${head} ${t(review.reasonKey)}`, order: { medId: med, approved: review.approved }, source: 'local' };
    }

    const topics = detectTopics(question);
    const wantsAdvice = topics.includes('advice') || topics.includes('report') || topics.includes('urgent');
    if (wantsAdvice) {
      if (!ctx.assessed) return { text: t('dchat.assessFirst'), source: 'local' };
      const lead = topics.includes('urgent') ? `${t('dchat.urgent')} ` : '';
      return { text: lead + t(guidanceKey(ctx)), source: 'local' };
    }
    if (topics.includes('arrive')) return { text: t('dchat.arrive'), source: 'local' };
    if (topics.includes('thanks')) return { text: t('dchat.thanks'), source: 'local' };
    if (topics.includes('greeting')) return { text: t('dchat.greeting'), source: 'local' };
    return { text: t('dchat.unknown'), source: 'local' };
  }
}
