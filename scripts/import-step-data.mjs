import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const defaultSource = join(root, ".cache", "STEPBible-Data");
const outputPath = join(root, "data", "original-language.json");
const repoUrl = "https://github.com/STEPBible/STEPBible-Data.git";

const bookMap = {
  Gen: "GEN", Exo: "EXO", Lev: "LEV", Num: "NUM", Deu: "DEU",
  Jos: "JOS", Jdg: "JDG", Rut: "RUT", "1Sa": "1SA", "2Sa": "2SA",
  "1Ki": "1KI", "2Ki": "2KI", "1Ch": "1CH", "2Ch": "2CH", Ezr: "EZR",
  Neh: "NEH", Est: "EST", Job: "JOB", Psa: "PSA", Pro: "PRO",
  Ecc: "ECC", Sng: "SNG", Isa: "ISA", Jer: "JER", Lam: "LAM",
  Ezk: "EZK", Dan: "DAN", Hos: "HOS", Jol: "JOL", Amo: "AMO",
  Oba: "OBA", Jon: "JON", Mic: "MIC", Nam: "NAM", Hab: "HAB",
  Zep: "ZEP", Hag: "HAG", Zec: "ZEC", Mal: "MAL",
  Mat: "MAT", Mrk: "MRK", Luk: "LUK", Jhn: "JHN", Act: "ACT",
  Rom: "ROM", "1Co": "1CO", "2Co": "2CO", Gal: "GAL", Eph: "EPH",
  Php: "PHP", Col: "COL", "1Th": "1TH", "2Th": "2TH", "1Ti": "1TI",
  "2Ti": "2TI", Tit: "TIT", Phm: "PHM", Heb: "HEB", Jas: "JAS",
  "1Pe": "1PE", "2Pe": "2PE", "1Jn": "1JN", "2Jn": "2JN", "3Jn": "3JN",
  Jud: "JUD", Rev: "REV",
};

const greekFiles = [
  "Translators Amalgamated OT+NT/TAGNT Mat-Jhn - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
  "Translators Amalgamated OT+NT/TAGNT Act-Rev - Translators Amalgamated Greek NT - STEPBible.org CC-BY.txt",
];

const hebrewFiles = [
  "Translators Amalgamated OT+NT/TAHOT Gen-Deu - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "Translators Amalgamated OT+NT/TAHOT Jos-Est - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "Translators Amalgamated OT+NT/TAHOT Job-Sng - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
  "Translators Amalgamated OT+NT/TAHOT Isa-Mal - Translators Amalgamated Hebrew OT - STEPBible.org CC BY.txt",
];

function getArg(name) {
  const prefix = `${name}=`;
  const arg = process.argv.find((item) => item.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : "";
}

async function ensureSource() {
  const requested = getArg("--source") || process.env.STEP_DATA_PATH;
  if (requested) {
    return requested;
  }

  if (existsSync(defaultSource)) {
    return defaultSource;
  }

  await mkdir(join(root, ".cache"), { recursive: true });
  const result = spawnSync("git", ["clone", "--depth", "1", repoUrl, defaultSource], {
    cwd: root,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error("Could not clone STEPBible-Data.");
  }
  return defaultSource;
}

function getCommit(sourcePath) {
  const result = spawnSync("git", ["-C", sourcePath, "rev-parse", "HEAD"], {
    encoding: "utf8",
  });
  return result.status === 0 ? result.stdout.trim() : "";
}

function verseKey(stepBook, chapter, verse) {
  const bookId = bookMap[stepBook];
  if (!bookId) {
    return "";
  }
  return `${bookId}.${Number(chapter)}.${Number(verse)}`;
}

function clean(value = "") {
  return value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseGreekOriginal(value) {
  const match = value.match(/^(.+?)\s+\((.+)\)$/);
  return {
    word: clean(match ? match[1] : value),
    transliteration: clean(match ? match[2] : ""),
  };
}

function parseGreekLine(line) {
  const columns = line.split("\t");
  const ref = columns[0]?.match(/^([1-3]?[A-Z][a-z]{2})\.(\d+)\.(\d+)#(\d+)=/);
  if (!ref) {
    return null;
  }

  const key = verseKey(ref[1], ref[2], ref[3]);
  if (!key) {
    return null;
  }

  const original = parseGreekOriginal(columns[1] || "");
  const strongGrammar = columns[3] || "";
  const [strong = "", morphology = ""] = strongGrammar.split("=");
  const [lemma = "", lexicalGloss = ""] = (columns[4] || "").split("=");

  return {
    key,
    word: {
      position: Number(ref[4]),
      original: original.word,
      transliteration: original.transliteration,
      english: clean(columns[2] || ""),
      strong: clean(columns[11] || strong),
      morphology: clean(morphology),
      lemma: clean(lemma),
      gloss: clean(columns[9] || lexicalGloss),
      lexicalGloss: clean(lexicalGloss),
      source: clean(columns[5] || ""),
    },
  };
}

function parseHebrewEntry(expanded, preferredStrong) {
  const entries = [...expanded.matchAll(/\{?((?:H|A)\d{4}[A-Z]?)=([^=\/\\{}]+)=([^\/\\{}]+)\}?/g)];
  const preferred = entries.find((entry) => entry[1] === preferredStrong) || entries[0];
  if (!preferred) {
    return { lemma: "", lexicalGloss: "" };
  }

  return {
    lemma: clean(preferred[2]),
    lexicalGloss: clean(preferred[3].split("»")[0].replace(/^:/, "")),
  };
}

function parseHebrewLine(line) {
  const columns = line.split("\t");
  const ref = columns[0]?.match(/^([1-3]?[A-Z][a-z]{2})\.(\d+)\.(\d+)#(\d+)=/);
  if (!ref) {
    return null;
  }

  const key = verseKey(ref[1], ref[2], ref[3]);
  if (!key) {
    return null;
  }

  const strong = clean(columns[8] || (columns[4] || "").match(/[HA]\d{4}[A-Z]?/)?.[0] || "");
  const lexical = parseHebrewEntry(columns[11] || "", strong);

  return {
    key,
    word: {
      position: Number(ref[4]),
      original: clean(columns[1] || ""),
      transliteration: clean(columns[2] || ""),
      english: clean(columns[3] || ""),
      strong,
      morphology: clean(columns[5] || ""),
      lemma: lexical.lemma,
      gloss: clean(lexical.lexicalGloss || columns[3] || ""),
      lexicalGloss: lexical.lexicalGloss,
      source: clean(columns[0].split("=")[1] || ""),
    },
  };
}

async function parseFile(sourcePath, relativePath, language, verses) {
  const text = await readFile(join(sourcePath, relativePath), "utf8");
  const parser = language === "greek" ? parseGreekLine : parseHebrewLine;
  let count = 0;

  for (const line of text.split(/\r?\n/)) {
    if (!/^[1-3]?[A-Z][a-z]{2}\.\d+\.\d+#\d+=/.test(line)) {
      continue;
    }

    const parsed = parser(line);
    if (!parsed) {
      continue;
    }

    verses[parsed.key] ||= { language, words: [] };
    verses[parsed.key].words.push(parsed.word);
    count += 1;
  }

  return count;
}

async function main() {
  const sourcePath = await ensureSource();
  const verses = {};
  let wordCount = 0;

  for (const file of greekFiles) {
    wordCount += await parseFile(sourcePath, file, "greek", verses);
  }
  for (const file of hebrewFiles) {
    wordCount += await parseFile(sourcePath, file, "hebrew", verses);
  }

  for (const verse of Object.values(verses)) {
    verse.words.sort((a, b) => a.position - b.position);
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: {
      name: "STEPBible-Data",
      url: repoUrl,
      commit: getCommit(sourcePath),
      license: "CC BY 4.0",
      credit: "Data created by www.STEPBible.org based on work at Tyndale House Cambridge.",
    },
    verseCount: Object.keys(verses).length,
    wordCount,
    verses,
  };

  await mkdir(join(root, "data"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload)}\n`);
  console.log(`Wrote ${payload.verseCount} verses / ${payload.wordCount} words to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
