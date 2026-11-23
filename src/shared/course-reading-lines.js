const listMarker = /^\s*(?:[•●▪◦‣*–-]\s+|\d+[.)]\s+|[a-zA-Z][.)]\s+)/;
const months = 'janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|january|february|march|april|may|june|july|august|september|october|november|december';
const datePattern = new RegExp(`\\b(?:\\d{4}-\\d{2}-\\d{2}|\\d{1,2}[/.]\\d{1,2}[/.]\\d{2,4}|\\d{1,2}(?:st|nd|rd|th|er)?\\s+(?:${months})\\s+\\d{4}|(?:${months})\\s+\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+\\d{4})\\b`, 'giu');

// Blank lines retain source paragraphs; soft line wraps are joined for reading.
// List markers stay exactly as supplied, with continuation lines in the same item.
export function courseReadingLines(text) {
  const blocks = [];
  for (const paragraph of String(text).replace(/\r\n?/g, '\n').split(/\n[ \t]*\n+/)) {
    let current = '';
    for (const line of paragraph.split('\n')) {
      if (!line.trim()) continue;
      if (listMarker.test(line) && current) { blocks.push(current); current = ''; }
      current += (current ? ' ' : '') + line.trim();
    }
    if (current) blocks.push(current);
  }
  let depth = 0;
  return blocks.map(block => {
    const dates = [...block.matchAll(datePattern)];
    const parts = [];
    for (let index = 0; index < block.length; index++) {
      const character = block[index];
      const parenthetical = depth > 0 || character === '(';
      const date = dates.some(match => index >= match.index && index < match.index + match[0].length);
      const last = parts.at(-1);
      if (last?.parenthetical === parenthetical && last?.date === date) last.text += character;
      else parts.push({text:character,parenthetical,date});
      if (character === '(') depth++;
      if (character === ')') depth = Math.max(0, depth - 1);
    }
    return parts;
  });
}
