/**
 * What the student is asking the patient. Matching is keyword-based (English + Arabic), so it works offline
 * and for free. An LLM (see RemotePatientConversation) can replace the wording of the answers, but the intents
 * are always detected here so they can be logged, scored and shown in the debrief.
 */
export const INTENTS = [
  'allergies',
  'diabetes',
  'meds',
  'pmh',
  'social',
  'lastmeal',
  'intake',
  'gi',
  'urine',
  'sweating',
  'cough',
  'fever',
  'pain',
  'breathing',
  'dizzy',
  'onset',
  'name',
  'complaint',
  'thanks',
  'greeting',
] as const;

export type Intent = (typeof INTENTS)[number];

/** Keywords are substrings. A leading "^" means a whole word. Arabic keywords are normalised at load time. */
const RAW: Record<Intent, string[]> = {
  allergies: ['allerg', 'حساسي'],
  diabetes: ['diabet', 'sugar', 'glucose', 'سكر'],
  meds: ['medication', 'medicine', 'tablet', 'pill', 'drug', 'insulin', 'prescri', 'دواء', 'ادوي', 'حبوب', 'اقراص', 'قرص', 'انسولين', 'علاج'],
  pmh: ['history', 'condition', 'illness', 'disease', 'diagnos', 'surgery', 'operation', 'chronic', 'hypertens', 'امراض', 'مرض', 'تاريخ', 'عملي', 'جراح', 'مزمن', 'ضغط'],
  social: ['smok', 'cigar', 'tobacco', 'alcohol', 'تدخن', 'سجاير', 'سيجار', 'كحول', 'تبغ'],
  lastmeal: ['last meal', 'last ate', 'last eat', 'when did you eat', 'lunch', 'breakfast', 'dinner', 'اخر اكل', 'اخر وجب', 'اكلت امتي', 'غدا', 'فطار', 'عشا'],
  intake: ['eat', 'food', 'appetite', 'drink', 'fluid', 'thirst', 'water', 'اكل', 'تاكل', 'شرب', 'تشرب', 'ماي', 'ميه', 'عطش', 'سوائل', 'شهي'],
  gi: ['vomit', 'nausea', 'diarrh', 'stool', 'bowel', 'throw up', 'استفراغ', 'ترجيع', 'رجع', 'غثيان', 'اسهال', 'براز'],
  urine: ['urin', '^pee', 'toilet', 'bladder', 'بول', 'تبول', 'حمام'],
  sweating: ['sweat', 'shak', 'tremor', 'tremb', 'clammy', 'عرق', 'تعرق', 'رعش', 'ارتعاش', 'رجف'],
  cough: ['cough', 'phlegm', 'sputum', 'mucus', 'كح', 'بلغم'],
  fever: ['fever', 'chills', 'feverish', 'حرار', 'سخون', 'سخن', 'حمي'],
  pain: ['pain', 'hurt', 'ache', '^sore', 'وجع', 'الم', 'يوجع', 'بيوجع'],
  breathing: ['breath', 'short of', 'cannot get air', 'نفس', 'تنفس', 'ضيق'],
  dizzy: ['dizz', 'faint', 'lighthead', 'spinning', 'black out', 'blackout', 'دوخ', 'دايخ', 'دوار', 'اغماء', 'هتقع'],
  onset: ['when did', 'how long', 'since when', 'when does', 'started', 'begin', 'began', 'onset', 'how many days', 'من امتي', 'امتي بدا', 'متي بدا', 'منذ متي', 'من متي', 'بدات', 'من كام يوم', 'كام يوم', 'ابتدا'],
  name: ['your name', 'who are you', 'what is your name', "what's your name", 'اسمك', 'ما اسمك', 'انت مين'],
  complaint: [
    'how are you', 'how do you feel', 'feeling', 'what is wrong', "what's wrong", 'what happened', 'what brought', 'the problem', 'complain', 'why are you here', 'symptom', 'tell me',
    'ازيك', 'عامل ايه', 'عامله ايه', 'حاسس', 'حاسه', 'بتحس', 'تحس', 'مالك', 'ايه حصل', 'ايه المشكل', 'ما المشكل', 'كيف حالك', 'تشعر', 'ايه اللي جابك', 'تشتكي', 'بتشتكي', 'شكوي', 'مشكلتك', 'احكيلي',
  ],
  thanks: ['thank', 'dont worry', "don't worry", 'it will be ok', 'it will be okay', 'we will help', 'we are here', 'relax', 'calm down', 'شكرا', 'متقلق', 'ما تقلق', 'هتبقي كويس', 'هنساعدك', 'اهدا', 'اهدي'],
  greeting: ['^hello', '^hi', '^hey', 'good morning', 'good evening', 'good afternoon', 'مرحبا', 'اهلا', 'سلام', 'صباح', 'مساء', 'هاي'],
};

/** Lower-case, strip Arabic diacritics and unify letter variants so spelling differences do not matter. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/ء/g, '')
    .replace(/[؟?!.,،؛:;"()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Matcher {
  word: boolean;
  kw: string;
}

const MATCHERS: Record<Intent, Matcher[]> = Object.fromEntries(
  (Object.keys(RAW) as Intent[]).map((intent) => [
    intent,
    RAW[intent].map((k) => (k.startsWith('^') ? { word: true, kw: normalize(k.slice(1)) } : { word: false, kw: normalize(k) })),
  ]),
) as Record<Intent, Matcher[]>;

const matches = (padded: string, words: string[], m: Matcher) => (m.word ? words.includes(m.kw) : padded.includes(m.kw));

/** All intents found in the question, in the fixed priority order of INTENTS. */
export function detectIntents(question: string): Intent[] {
  const text = normalize(question);
  if (!text) return [];
  const padded = ` ${text} `;
  const words = text.split(' ');
  let found = INTENTS.filter((intent) => MATCHERS[intent].some((m) => matches(padded, words, m)));

  // Generic intents give way to specific ones ("Hello, any allergies?" is about allergies)
  if (found.some((i) => !GENERIC.includes(i) && i !== 'name')) found = found.filter((i) => !GENERIC.includes(i));
  // "When did you last eat?" is one question, not three
  if (found.includes('lastmeal')) found = found.filter((i) => i !== 'intake' && i !== 'onset');
  return found;
}

const GENERIC: readonly Intent[] = ['complaint', 'thanks', 'greeting'];

/** Intents that do not count as history-taking (small talk). */
export const SMALL_TALK: readonly Intent[] = ['thanks', 'greeting', 'name'];
