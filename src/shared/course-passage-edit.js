export function replaceCoursePassage(course, index, editedText) {
  if (!Array.isArray(course.passages) || index < 0 || index >= course.passages.length) return course;
  const passages = [...course.passages];
  const old = passages[index];
  const leading = old.match(/^\s*/)[0];
  const trailing = old.match(/\s*$/)[0];
  passages[index] = leading + editedText.trim() + (trailing || (index < passages.length - 1 ? '\n\n' : ''));
  return {...course, passages, sourceText:passages.join('')};
}
