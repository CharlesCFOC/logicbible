// Apply to escaped, formatted HTML; only text segments receive markup.
const books = [
  "Genesis", "Gen", "Exodus", "Exod", "Ex", "Leviticus", "Lev", "Numbers", "Num",
  "Deuteronomy", "Deut", "Joshua", "Josh", "Judges", "Judg", "Ruth",
  "[12]\\s+Samuel", "[12]\\s+Sam", "[12]\\s+Kings", "[12]\\s+Kgs",
  "[12]\\s+Chronicles", "[12]\\s+Chron", "[12]\\s+Chr", "Ezra", "Nehemiah", "Neh",
  "Esther", "Esth", "Job", "Psalms?", "Ps", "Proverbs", "Prov", "Ecclesiastes", "Eccl",
  "Song of (?:Solomon|Songs)", "Song", "Isaiah", "Isa", "Jeremiah", "Jer",
  "Lamentations", "Lam", "Ezekiel", "Ezek", "Daniel", "Dan", "Hosea", "Hos",
  "Joel", "Amos", "Obadiah", "Obad", "Jonah", "Micah", "Mic", "Nahum", "Nah",
  "Habakkuk", "Hab", "Zephaniah", "Zeph", "Haggai", "Hag", "Zechariah", "Zech",
  "Malachi", "Mal", "Matthew", "Matt", "Mark", "Mk", "Luke", "Lk",
  "[123]\\s+John", "[123]\\s+Jn", "John", "Jn", "Acts", "Romans", "Rom",
  "[12]\\s+Corinthians", "[12]\\s+Cor", "Galatians", "Gal", "Ephesians", "Eph",
  "Philippians", "Phil", "Colossians", "Col", "[12]\\s+Thessalonians", "[12]\\s+Thess",
  "[12]\\s+Timothy", "[12]\\s+Tim", "Titus", "Philemon", "Philem", "Hebrews", "Heb",
  "James", "Jas", "[12]\\s+Peter", "[12]\\s+Pet", "Jude", "Revelation", "Rev",
];
const verseRange = String.raw`\d{1,3}(?:\s*[-–—]\s*(?:\d{1,3}:)?\d{1,3})?`;
const passage = String.raw`\d{1,3}:${verseRange}(?:\s*,\s*(?:\d{1,3}:)?${verseRange})*`;
const citation = new RegExp(`\\b(?:${books.join("|")})\\.?\\s+${passage}(?:\\s*;\\s*${passage})*\\b`, "gi");

export function highlightBibleCitations(html, { clickable = false } = {}) {
  return html.split(/(<[^>]*>)/g).map((segment) => segment.startsWith("<")
    ? segment
    : segment.replace(citation, (reference) => {
      if (!clickable) return `<span class="debate-bible-citation">${reference}</span>`;
      const book = reference.match(/^(.+?)\s+\d{1,3}:/)[1];
      return reference.split(/(\s*;\s*)/).map((part, index) => {
        if (index % 2) return `<span class="debate-bible-citation">${part}</span>`;
        const fullReference = index ? `${book} ${part}` : part;
        return `<a href="#bible" class="debate-bible-citation" data-bible-reference="${fullReference}">${part}</a>`;
      }).join("");
    })).join("");
}
