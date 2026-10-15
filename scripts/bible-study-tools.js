// Shared, dependency-free helpers for the chapter study UI and its API.
export function limitStudySections(study, tab) {
  const maximum = { biblical:2, historical:3, summary:1, veracity:3, manuscripts:2 }[tab] || 3;
  let cards = (Array.isArray(study.cards) ? study.cards : []).filter(card=>card && typeof card==='object');
  if (cards.length > maximum) {
    const relevant = {
      biblical:/biblical context|genre|form|role.*book/i,
      historical:/historical context|setting|people|culture/i,
      summary:/summary|central idea|main idea|core idea/i,
      veracity:/veracity|text.s claim|independent evidence|open question/i,
      manuscripts:/manuscript|papyrus|codex|witness/i,
    }[tab];
    const matching = cards.filter(card=>relevant.test(card.label || ''));
    if(matching.length)cards=matching;
  }
  return {...study,cards:cards.slice(0,maximum),steps:['veracity','manuscripts'].includes(tab)?[]:(study.steps || []).filter(step=>step && typeof step==='object').slice(0,3)};
}

export function parseStudyReference(value, books, activeBook) {
  const text = String(value || '').trim().replace(/[–—]/g, '-');
  const match = text.match(/^(?:(.+?)\s+)?(\d{1,3})(?::(\d{1,3})(?:-(\d{1,3}))?(?:\s*[,;]\s*\d{1,3}(?:-\d{1,3})?)*)?$/);
  if (!match) return null;
  const normalize = name => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');
  const name = normalize(match[1] || activeBook);
  const aliases = { psalm: 'psalms', songofsolomon: 'songofsongs' };
  const book = books.find(book => {
    const candidates = [normalize(book.name), normalize(book.id)];
    return candidates.some(candidate => candidate === name || (aliases[candidate] || candidate) === (aliases[name] || name));
  });
  if (!book) return null;
  const chapter = Number(match[2]);
  const start = match[3] ? Number(match[3]) : null;
  const ranges = start === null ? [] : text.slice(text.indexOf(':') + 1).split(/\s*[,;]\s*/).map(part => {
    const [from, to = from] = part.split('-').map(Number);
    return { start: from, end: to };
  });
  if (chapter < 1 || chapter > book.chapters || ranges.some(range => range.start < 1 || range.end < range.start || range.end > 200)) return null;
  return { bookId: book.id, bookName: book.name, chapter, ranges, reference: text };
}

export function selectStudyVerses(verses, reference) {
  return (verses || []).filter(verse => Number(verse.number) > 0 && verse.text
    && (!reference.ranges.length || reference.ranges.some(range => Number(verse.number) >= range.start && Number(verse.number) <= range.end)));
}

const sourceRecords = [
  { match: /\b(?:p\s*52|papyrus\s*52|rylands.*457)\b/i, title: 'Papyrus P52 · digital manuscript', url: 'https://manuscripts.csntm.org/manuscript/Group/GA_P52', kind: 'Manuscript record' },
  { match: /\b(?:p\s*90|papyrus\s*90|oxy\.?\s*3523)\b/i, title: 'Papyrus P90 · digital manuscript', url: 'https://manuscripts.csntm.org/manuscript/Group/GA_P90', kind: 'Manuscript record' },
  { match: /\b(?:p\s*66|papyrus\s*66|bodmer\s*ii)\b/i, title: 'Papyrus P66 · digital manuscript', url: 'https://manuscripts.csntm.org/Manuscript/Group/GA_P66_Bodmer', kind: 'Manuscript record' },
  { match: /sinaiticus|add\s*ms\s*43725/i, title: 'Codex Sinaiticus · digital manuscript', url: 'https://codexsinaiticus.org/en/manuscript.aspx', kind: 'Digital collection' },
  { match: /vaticanus|vat\.?\s*gr\.?\s*1209/i, title: 'Codex Vaticanus · Vatican Library', url: 'https://digi.vatlib.it/view/MSS_Vat.gr.1209', kind: 'Digital collection' },
  { match: /(?:tacitus.*annals|annals.*tacitus)/i, title: 'Tacitus · Annals', url: 'https://penelope.uchicago.edu/Thayer/E/Roman/Texts/Tacitus/home.html', kind: 'Primary text · translation' },
  { match: /(?:josephus.*antiquities|antiquities.*josephus)/i, title: 'Josephus · Jewish Antiquities', url: 'https://beta.perseus.tufts.edu/urn:cts:greekLit:tlg0526.tlg001.perseus-eng2/', kind: 'Primary text · translation' },
];

export function studySourceLinks(card) {
  const sources = Array.isArray(card.sources) ? card.sources.filter(source => source && typeof source === 'object').slice(0, 3) : [];
  const links = [];
  const add = record => { if (!links.some(link => link.url === record.url)) links.push(record); };
  // Match a witness only against its identity, never against an entire generated claim.
  const witness = [card.title, card.manuscript?.witness].filter(Boolean).join(' ');
  sourceRecords.filter(record => record.match.test(witness)).forEach(add);
  for (const source of sources) {
    const identity = [source.author, source.title].filter(Boolean).join(' ');
    const direct = sourceRecords.find(record => record.match.test(identity));
    if (direct) add({ ...direct, why: source.why || '' });
    else if (source.title) add({ title: source.title, author: source.author || '', why: source.why || '', kind: 'Research lead · search', url: `https://www.google.com/search?q=${encodeURIComponent(identity)}` });
  }
  return links.slice(0, 4);
}

export function studyEvidenceLabel(card) {
  const labels = { textual: 'In the text', contextual: 'Historical context', debated: 'Debated', interpretive: 'Interpretation', unverified: 'Needs verification' };
  return labels[card.evidenceKind] || (/open question|uncertain|debat/i.test(`${card.label} ${card.status}`) ? 'Debated' : /text.s claim/i.test(card.label) ? 'In the text' : 'Source to check');
}

export function studyReflectionPrompt(study, reference) {
  return String(study.reflection || `What stands out to you in ${reference}, and how might you respond?`).slice(0, 240);
}

export function mergeStudyReflection(existing, { tab, question, answer, reference }) {
  const escape = value => String(value || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const previous = existing.studyReflections?.[tab];
  const heading = `Reflection · ${reference} · ${tab}`;
  const text = `${heading}\n${question}\n${answer}`;
  const html = `<p><strong>${escape(heading)}</strong></p><p>${escape(question)}</p><p>${escape(answer).replace(/\n/g,'<br>')}</p>`;
  const baseText = (previous ? String(existing.note || '').replace(previous.text,'') : String(existing.note || '')).trim();
  const baseHtml = existing.noteHtml || (baseText ? `<p>${escape(baseText).replace(/\n/g,'<br>')}</p>` : '');
  return {
    note: [baseText,text].filter(Boolean).join('\n\n'),
    noteHtml: `${previous ? baseHtml.replace(previous.html,'') : baseHtml}${html}`,
    studyReflections: { ...existing.studyReflections, [tab]: { question,answer,text,html } },
  };
}

export function studyMapSvg(geography, places) {
  if (!places.length) return '';
  const lats = places.map(place => place[1]), lons = places.map(place => place[2]);
  const centreLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const cos = Math.max(.25, Math.cos(centreLat * Math.PI / 180));
  const spanX = Math.max(4, (Math.max(...lons) - Math.min(...lons)) * cos + 3);
  const spanY = Math.max(3, Math.max(...lats) - Math.min(...lats) + 2);
  const scale = Math.min(280 / spanX, 140 / spanY);
  const centreLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const project = ([lon, lat]) => [160 + (lon - centreLon) * cos * scale, 90 - (lat - centreLat) * scale];
  const path = geography.land.map(ring => ring.map((point, i) => `${i ? 'L' : 'M'}${project(point).map(v => v.toFixed(1)).join(',')}`).join('') + 'Z').join('');
  const pins = places.map((place, i) => {
    const [x,y] = project([place[2],place[1]]);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7"/><text x="${x.toFixed(1)}" y="${(y + 2.5).toFixed(1)}">${i + 1}</text>`;
  }).join('');
  return `<svg class="study-place-map" viewBox="0 0 320 180" role="img" aria-label="Approximate locations of places mentioned in this chapter"><path d="${path}"/><g>${pins}</g></svg>`;
}
