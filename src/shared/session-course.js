export function splitCourseText(text, maxLength = 1800) {
  const source = String(text || "");
  const passages = [];
  let start = 0;

  while (start < source.length) {
    let end = Math.min(start + maxLength, source.length);
    if (end < source.length) {
      const fragment = source.slice(start, end);
      const floor = Math.floor(maxLength / 2);
      const paragraphBreaks = [...fragment.matchAll(/\r?\n[ \t]*\r?\n/g)];
      const paragraphBreak = paragraphBreaks.at(-1);
      const paragraphEnd = paragraphBreak ? paragraphBreak.index + paragraphBreak[0].length : -1;
      const lineEnd = fragment.lastIndexOf("\n") + 1;
      const wordEnd = fragment.lastIndexOf(" ") + 1;
      const boundary = paragraphEnd > floor ? paragraphEnd : lineEnd > floor ? lineEnd : wordEnd;
      if (boundary > floor) end = start + boundary;
    }
    passages.push(source.slice(start, end));
    start = end;
  }

  return passages;
}

export function coursePassages(text, passages) {
  const source = String(text || "");
  if (Array.isArray(passages) && passages.length && passages.join("") === source) return passages;
  return splitCourseText(source);
}

export function distributeCourseActivities(activities, pageCount, limit = 8) {
  const input = Array.isArray(activities) ? activities : [];
  const slots = Math.max(0, Math.min(40, Number(pageCount) || 0));
  const count = Math.min(input.length, slots, limit);
  const occupied = new Set();
  return input.slice(0, count).map(activity => {
    const requested = Math.max(0, Math.min(slots - 1, Number(activity?.afterPage) || 0));
    const candidates = Array.from({ length: slots }, (_, index) => index)
      .filter(index => !occupied.has(index))
      .sort((a, b) => Math.abs(a - requested) - Math.abs(b - requested) || b - a);
    const afterPage = candidates[0] ?? requested;
    occupied.add(afterPage);
    return { ...activity, afterPage };
  });
}
