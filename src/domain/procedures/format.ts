/**
 * The course steps are long ("Perform Endotracheal Suctioning (insert catheter without suction, ...). Assess Breath
 * Sounds bilaterally."). The compact list shows just the name of the step; the full text appears on the step to do now.
 */
export function shortTitle(text: string, max = 60): string {
  let s = text.replace(/\s*[(（][^)）]*[)）]/g, ''); // drop (...) groups
  s = s.split(/[.。]\s/)[0].replace(/[.。]$/, ''); // first sentence only
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}
