const frenchBibleBooks = {
  genese: "GEN", exode: "EXO", levitique: "LEV", nombres: "NUM", deuteronome: "DEU",
  josue: "JOS", juges: "JDG", ruth: "RUT", "1 samuel": "1SA", "premier samuel": "1SA", "2 samuel": "2SA", "deuxieme samuel": "2SA",
  "1 rois": "1KI", "2 rois": "2KI", "1 chroniques": "1CH", "2 chroniques": "2CH",
  esdras: "EZR", nehemie: "NEH", esther: "EST", job: "JOB", psaumes: "PSA", psaume: "PSA",
  proverbes: "PRO", ecclesiaste: "ECC", "cantique des cantiques": "SNG", esaie: "ISA", jeremie: "JER",
  lamentations: "LAM", ezechiel: "EZK", daniel: "DAN", osee: "HOS", joel: "JOL", amos: "AMO",
  abdias: "OBA", jonas: "JON", michee: "MIC", nahum: "NAM", habacuc: "HAB", sophonie: "ZEP",
  aggee: "HAG", zacharie: "ZEC", malachie: "MAL", matthieu: "MAT", mathieu: "MAT", marc: "MRK", luc: "LUK",
  jean: "JHN", actes: "ACT", romains: "ROM", "1 corinthiens": "1CO", "2 corinthiens": "2CO",
  galates: "GAL", ephesiens: "EPH", philippiens: "PHP", colossiens: "COL", "1 thessaloniciens": "1TH",
  "2 thessaloniciens": "2TH", "1 timothee": "1TI", "2 timothee": "2TI", tite: "TIT", philemon: "PHM",
  hebreux: "HEB", jacques: "JAS", "1 pierre": "1PE", "2 pierre": "2PE", "1 jean": "1JN", "2 jean": "2JN",
  "3 jean": "3JN", jude: "JUD", apocalypse: "REV", revelation: "REV",
};

const spokenNumberWords = {
  zero: 0, un: 1, une: 1, deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8, neuf: 9,
  dix: 10, onze: 11, douze: 12, treize: 13, quatorze: 14, quinze: 15, seize: 16, vingt: 20, trente: 30,
  quarante: 40, cinquante: 50, soixante: 60, one: 1, two: 2, three: 3, four: 4, five: 5, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, thirty: 30, forty: 40, fifty: 50,
  sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const spokenNumberPattern = new RegExp(`\\b\\d+\\b|\\b(?:${Object.keys(spokenNumberWords).sort((a, b) => b.length - a.length).join("|")}|et|and)\\b`, "g");

function normalizeSpeech(value) {
  return String(value).toLocaleLowerCase("fr-CA").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
}

function parseSpokenNumber(value) {
  const text = normalizeSpeech(value);
  if (/^\d+$/.test(text)) return Number(text);
  const words = text.split(" ").filter(Boolean);
  if (!words.length) return NaN;
  if (words[0] === "quatre" && words[1] === "vingt") {
    const suffix = words.filter(word => word !== "et" && word !== "and").slice(2).map(word => spokenNumberWords[word]);
    return 80 + suffix.reduce((sum, number) => sum + (number || 0), 0);
  }
  let total = 0;
  for (const word of words) {
    if (word === "cent" || word === "hundred") { total = (total || 1) * 100; continue; }
    if (word === "et" || word === "and") continue;
    const number = spokenNumberWords[word];
    if (number === undefined) return NaN;
    total += number;
  }
  return total;
}

export function parseBibleReference(transcript, books) {
  const spoken = normalizeSpeech(transcript);
  const aliases = [...Object.entries(frenchBibleBooks), ...books.map(book => [normalizeSpeech(book.name), book.id])]
    .sort((a, b) => b[0].length - a[0].length);
  const match = aliases.find(([name]) => name && new RegExp(`(?:^| )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: |$)`).test(spoken));
  if (!match) return null;
  const rest = spoken.replace(new RegExp(`(?:^| )${match[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: |$)`), " ").trim();
  const chapterMarker = /\b(?:chapter|chapitre)\b/.exec(rest);
  const verseMarker = /\b(?:verse|verset)\b/.exec(rest);
  const book = books.find(item => item.id === match[1]);
  if (chapterMarker && verseMarker && verseMarker.index > chapterMarker.index) {
    const chapterWords = rest.slice(chapterMarker.index + chapterMarker[0].length, verseMarker.index).match(spokenNumberPattern) || [];
    const verseWords = rest.slice(verseMarker.index + verseMarker[0].length).match(spokenNumberPattern) || [];
    const chapter = parseSpokenNumber(chapterWords.join(" "));
    const verse = parseSpokenNumber(verseWords.join(" "));
    if (book && Number.isInteger(chapter) && chapter > 0 && Number.isInteger(verse) && verse > 0) {
      return { bookId: book.id, chapter, verse, bookName: book.name };
    }
  }
  const numbers = rest.match(spokenNumberPattern) || [];
  const values = [];
  for (let index = 0; index < numbers.length && values.length < 2; index++) {
    let part = numbers[index];
    if (part === "quatre" && numbers[index + 1] === "vingt") {
      part += ` ${numbers[++index]}`;
      if (numbers[index + 1] === "et" && numbers[index + 2]) part += ` et ${numbers[index += 2]}`;
      else if (/^(dix|onze|douze|treize|quatorze|quinze|seize|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf)$/.test(numbers[index + 1] || "")) part += ` ${numbers[++index]}`;
    } else if (/^(vingt|trente|quarante|cinquante|soixante|twenty|thirty|forty|fifty|sixty)$/.test(part) && numbers[index + 1] === "et" && numbers[index + 2]) part += ` et ${numbers[index += 2]}`;
    else if (/^(vingt|trente|quarante|cinquante|soixante|twenty|thirty|forty|fifty|sixty)$/.test(part) && numbers[index + 1] && /^(un|une|deux|trois|quatre|cinq|six|sept|huit|neuf|dix|onze|douze|treize|quatorze|quinze|seize|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)$/.test(numbers[index + 1])) part += ` ${numbers[++index]}`;
    values.push(parseSpokenNumber(part));
  }
  if (values.length < 2 || values.some(number => !Number.isInteger(number) || number < 1)) return null;
  return book ? { bookId: book.id, chapter: values[0], verse: values[1], bookName: book.name } : null;
}
