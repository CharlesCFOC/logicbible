// Keep source text intact; formatting is applied only to the reading view.
export function courseReadingLines(text) {
  let depth = 0;
  return String(text).split(/\r\n|\r|\n/).map(line => {
    const parts = [];
    for (const character of line) {
      const parenthetical = depth > 0 || character === '(';
      const last = parts.at(-1);
      if (last?.parenthetical === parenthetical) last.text += character;
      else parts.push({text:character,parenthetical});
      if (character === '(') depth++;
      if (character === ')') depth = Math.max(0, depth - 1);
    }
    return parts;
  }).filter(parts => parts.some(part => part.text.trim()));
}
