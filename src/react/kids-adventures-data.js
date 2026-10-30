import { genesisAdventures } from "./kids-genesis-data.js";
import { exodusAdventures } from "./kids-exodus-data.js";
import { leviticusAdventures } from "./kids-leviticus-data.js";
import { numbersAdventures } from "./kids-numbers-data.js";
import { deuteronomyAdventures } from "./kids-deuteronomy-data.js";
import { joshuaAdventures, judgesAdventures, ruthAdventures } from "./kids-joshua-judges-ruth-data.js";
import { firstSamuelAdventures, secondSamuelAdventures } from "./kids-samuel-data.js";
import { firstKingsAdventures, secondKingsAdventures } from "./kids-kings-data.js";
import { firstChroniclesAdventures, secondChroniclesAdventures } from "./kids-chronicles-data.js";
import { ezraAdventures, nehemiahAdventures, estherAdventures } from "./kids-ezra-nehemiah-esther-data.js";
import { jobAdventures, psalmsAdventures } from "./kids-job-psalms-data.js";
import { proverbsAdventures, ecclesiastesAdventures, songAdventures } from "./kids-wisdom-books-data.js";
import { isaiahAdventures, jeremiahAdventures, lamentationsAdventures } from "./kids-major-prophets-data.js";
import { ezekielAdventures, danielAdventures } from "./kids-ezekiel-daniel-data.js";
import { hoseaAdventures, joelAdventures, amosAdventures, obadiahAdventures, jonahAdventures, micahAdventures, nahumAdventures, habakkukAdventures, zephaniahAdventures, haggaiAdventures, zechariahAdventures, malachiAdventures } from "./kids-minor-prophets-data.js";

export const kidsBooks = [
  { id: "genesis", title: "Genesis", icon: "🌍", subtitle: "Beginnings, promises, and growing families." },
  { id: "exodus", title: "Exodus", icon: "🏜️", subtitle: "Moses, freedom, and a journey through the wilderness." },
  { id: "leviticus", title: "Leviticus", icon: "🕯️", subtitle: "Worship, fairness, and caring for the community." },
  { id: "numbers", title: "Numbers", icon: "🧭", subtitle: "A long wilderness journey toward a new home." },
  { id: "deuteronomy", title: "Deuteronomy", icon: "📜", subtitle: "Moses remembers the journey and prepares Israel for a new home." },
  { id: "joshua", title: "Joshua", icon: "🧭", subtitle: "A new leader and the people’s arrival in Canaan." },
  { id: "judges", title: "Judges", icon: "⚖️", subtitle: "Stories of leaders, hard choices, and a people seeking help." },
  { id: "ruth", title: "Ruth", icon: "🌾", subtitle: "A story of loyalty, generosity, and a new family." },
  { id: "1-samuel", title: "1 Samuel", icon: "🎵", subtitle: "Samuel, Saul, David, and the beginning of Israel’s kings." },
  { id: "2-samuel", title: "2 Samuel", icon: "👑", subtitle: "David’s reign, family struggles, and a promise for the future." },
  { id: "1-kings", title: "1 Kings", icon: "🏛️", subtitle: "Solomon, a divided kingdom, and the prophet Elijah." },
  { id: "2-kings", title: "2 Kings", icon: "🕊️", subtitle: "Elisha, the kings of Israel and Judah, and the exile." },
  { id: "1-chronicles", title: "1 Chronicles", icon: "📜", subtitle: "Families, David’s reign, and preparations for the temple." },
  { id: "2-chronicles", title: "2 Chronicles", icon: "🏛️", subtitle: "Solomon’s temple, Judah’s kings, and a hope of return." },
  { id: "ezra", title: "Ezra", icon: "📚", subtitle: "A return from exile and the rebuilding of the temple." },
  { id: "nehemiah", title: "Nehemiah", icon: "🧱", subtitle: "A city wall rebuilt through courage and teamwork." },
  { id: "esther", title: "Esther", icon: "👑", subtitle: "A queen’s courage helps protect her people." },
  { id: "job", title: "Job", icon: "🌧️", subtitle: "Hard questions, grief, friendship, and hope." },
  { id: "psalms", title: "Psalms", icon: "🎶", subtitle: "Songs and prayers for every kind of feeling." },
  { id: "proverbs", title: "Proverbs", icon: "💡", subtitle: "Practical wisdom for choices, words, work, and friendship." },
  { id: "ecclesiastes", title: "Ecclesiastes", icon: "⏳", subtitle: "Reflections on time, work, change, and what matters." },
  { id: "song-of-songs", title: "Song of Songs", icon: "🌹", subtitle: "Poems celebrating affection, patience, and love." },
  { id: "isaiah", title: "Isaiah", icon: "🕊️", subtitle: "Justice, comfort, peace, and hope for a renewed world." },
  { id: "jeremiah", title: "Jeremiah", icon: "📣", subtitle: "A prophet’s warnings, grief, and promises of a new beginning." },
  { id: "lamentations", title: "Lamentations", icon: "🌧️", subtitle: "Honest poems of grief that hold on to hope." },
  { id: "ezekiel", title: "Ezekiel", icon: "🌊", subtitle: "Visions of return, renewed hearts, and life after exile." },
  { id: "daniel", title: "Daniel", icon: "🦁", subtitle: "Courage, wise choices, and hope while far from home." },
  { id: "hosea", title: "Hosea", icon: "💛", subtitle: "A difficult story about broken trust, love, and returning." },
  { id: "joel", title: "Joel", icon: "🌾", subtitle: "A community faces loss and hopes for renewal." },
  { id: "amos", title: "Amos", icon: "⚖️", subtitle: "A shepherd calls leaders to practice justice." },
  { id: "obadiah", title: "Obadiah", icon: "🏔️", subtitle: "A warning against pride and celebrating a neighbor’s trouble." },
  { id: "jonah", title: "Jonah", icon: "🐟", subtitle: "A reluctant prophet learns about compassion." },
  { id: "micah", title: "Micah", icon: "🤲", subtitle: "Justice, kindness, humility, and a promise of peace." },
  { id: "nahum", title: "Nahum", icon: "🌊", subtitle: "A message that violent power will not last forever." },
  { id: "habakkuk", title: "Habakkuk", icon: "❓", subtitle: "Honest questions and hope while waiting." },
  { id: "zephaniah", title: "Zephaniah", icon: "🌤️", subtitle: "A warning that ends with a promise of joy." },
  { id: "haggai", title: "Haggai", icon: "🔨", subtitle: "Encouragement to rebuild the temple together." },
  { id: "zechariah", title: "Zechariah", icon: "🌙", subtitle: "Strange visions, peaceful leadership, and renewal." },
  { id: "malachi", title: "Malachi", icon: "📣", subtitle: "Questions about fairness and a promise of a new day." },
  { id: "mark", title: "Mark", icon: "⛵", subtitle: "Meet Jesus and his friends." },
];

export const kidsAdventures = [
  ...genesisAdventures,
  ...exodusAdventures,
  ...leviticusAdventures,
  ...numbersAdventures,
  ...deuteronomyAdventures,
  ...joshuaAdventures,
  ...judgesAdventures,
  ...ruthAdventures,
  ...firstSamuelAdventures,
  ...secondSamuelAdventures,
  ...firstKingsAdventures,
  ...secondKingsAdventures,
  ...firstChroniclesAdventures,
  ...secondChroniclesAdventures,
  ...ezraAdventures,
  ...nehemiahAdventures,
  ...estherAdventures,
  ...jobAdventures,
  ...psalmsAdventures,
  ...proverbsAdventures,
  ...ecclesiastesAdventures,
  ...songAdventures,
  ...isaiahAdventures,
  ...jeremiahAdventures,
  ...lamentationsAdventures,
  ...ezekielAdventures,
  ...danielAdventures,
  ...hoseaAdventures,
  ...joelAdventures,
  ...amosAdventures,
  ...obadiahAdventures,
  ...jonahAdventures,
  ...micahAdventures,
  ...nahumAdventures,
  ...habakkukAdventures,
  ...zephaniahAdventures,
  ...haggaiAdventures,
  ...zechariahAdventures,
  ...malachiAdventures,
  {
    id: "storm", bookId: "mark", title: "Jesus Calms the Storm", subtitle: "A boat trip, big waves... and an amazing discovery.",
    theme: "Courage & trust", icon: "⛵", badge: "Brave Captain", reference: "Mark 4:35–41", minutes: 4,
    image: "assets/kids-bible/mark/07.webp", color: "ocean", coverPosition: "22%",
    intro: "Climb into the boat with Jesus and his friends. The lake looks calm... but the wind is picking up! Discover what happens next.",
    scenes: [
      { title: "A Trip Across the Lake", icon: "⛵", position: "0%", text: "In the evening, Jesus invites his disciples to cross the lake. They set out together in a boat. Jesus falls asleep at the back." },
      { title: "The Waves Grow Bigger", icon: "🌊", position: "10%", text: "A strong storm arrives. Waves splash into the boat, and the disciples are afraid. They wake Jesus and ask for help." },
      { title: "The Calm Returns", icon: "☀️", position: "64%", text: "Jesus speaks to the wind and the water. The wind stops, and the lake becomes calm. His friends are amazed by what he has done." },
    ],
    questions: [
      { question: "Where are Jesus and his friends?", choices: [["⛵", "In a boat"], ["🏠", "In a house"], ["🏜️", "In the desert"]], correct: 0, explanation: "They are crossing the lake in a boat." },
      { question: "What do the disciples do when they are afraid?", choices: [["🏊", "They jump into the water"], ["🙋", "They wake Jesus"], ["🍞", "They prepare a meal"]], correct: 1, explanation: "They wake Jesus and ask him for help." },
      { question: "What happens after Jesus speaks to the wind?", choices: [["🌩️", "The storm gets stronger"], ["❄️", "The lake freezes"], ["☀️", "The Calm Returns"]], correct: 2, explanation: "The wind stops, and the lake becomes calm." },
    ],
    order: [["⛵", "The friends set out in a boat"], ["🌊", "The storm arrives"], ["☀️", "Jesus calms the storm"]],
    takeaway: "When I am afraid, I can ask for help and talk to God.",
    mission: "Say something reassuring to someone today. If something scares you, tell a trusted adult.",
    prayer: "God, help me find courage and ask for help when I need it. Amen.",
  },
  {
    id: "seeds", bookId: "mark", title: "The Little Seed", subtitle: "Why do some seeds grow so well?", theme: "Listening & growing", icon: "🌱",
    badge: "Little Gardener", reference: "Mark 4:1–20", minutes: 4,
    image: "assets/kids-bible/mark/06.webp", color: "garden", coverPosition: "20%",
    intro: "Jesus tells a story about seeds and soil. Ready to discover what helps a little seed grow?",
    scenes: [
      { title: "Seeds Everywhere", icon: "🌾", position: "0%", text: "Jesus teaches a large crowd beside the lake. He tells a story about a farmer who goes out to sow seeds. The seeds fall in different places." },
      { title: "Not All Soil Is the Same", icon: "🪨", position: "57%", text: "On the path, birds eat the seeds. On rocky ground, the young plants do not have enough roots. Among the thorns, the plants are choked." },
      { title: "Soil Where Seeds Can Grow", icon: "🌱", position: "67%", text: "Other seeds fall on good soil. They grow and produce lots of grain. Jesus explains that the good soil represents people who listen to his word and accept it." },
    ],
    questions: [
      { question: "What does the farmer do?", choices: [["🎣", "He goes fishing"], ["🌾", "He sows seeds"], ["🏠", "He builds a house"]], correct: 1, explanation: "The farmer goes out to sow seeds." },
      { question: "Where do the seeds grow well?", choices: [["🌱", "In good soil"], ["🪨", "On rocky ground"], ["👣", "On the path"]], correct: 0, explanation: "The seeds that fall on good soil grow and produce lots of grain." },
      { question: "Who does Jesus compare the good soil to?", choices: [["😴", "People who do not listen"], ["🚪", "People who always leave"], ["👂", "People who listen to his word and accept it"]], correct: 2, explanation: "Listening to Jesus’ word and accepting it is like giving a seed good soil." },
    ],
    order: [["🌾", "The farmer sows the seeds"], ["🌱", "Seeds grow in good soil"], ["🌿", "The plants produce lots of grain"]],
    takeaway: "I can listen carefully and put what I learn into practice.",
    mission: "Choose someone in your family and listen without interrupting. Then share one thing you learned.",
    prayer: "God, help me listen carefully and help good things grow around me. Amen.",
  },
];

export const newAdventureProgress = () => ({ version: 1, stage: 0, scene: 0, question: 0, answers: {}, order: [], ordered: false, completed: false });

export function readAdventureProgress(id, storage = window.localStorage) {
  try {
    const p = JSON.parse(storage.getItem(`brother.kidsAdventure.v1.${id}`));
    if (p?.version !== 1 || !Number.isInteger(p.stage) || p.stage < 0 || p.stage > 5) return newAdventureProgress();
    const adventure = kidsAdventures.find(a => a.id === id);
    if ((p.contentRevision || 1) !== (adventure?.contentRevision || 1)) {
      return { ...newAdventureProgress(), completed: p.completed === true || p.stage === 5 };
    }
    return { ...newAdventureProgress(), stage: p.stage,
      scene: Number.isInteger(p.scene) && p.scene >= 0 && p.scene < (adventure?.scenes.length || 3) ? p.scene : 0,
      question: Number.isInteger(p.question) && p.question >= 0 && p.question <= 2 ? p.question : 0,
      answers: Object.fromEntries(Object.entries(p.answers || {}).filter(([k, v]) => ["0", "1", "2"].includes(k) && Number.isInteger(v) && v >= 0 && v <= 2)),
      order: Array.isArray(p.order) ? [...new Set(p.order.filter(n => [0, 1, 2].includes(n)))] : [], ordered: p.ordered === true, completed: p.completed === true || p.stage === 5,
    };
  } catch { return newAdventureProgress(); }
}

export function saveAdventureProgress(id, progress, storage = window.localStorage) {
  try { storage.setItem(`brother.kidsAdventure.v1.${id}`, JSON.stringify({ ...progress, contentRevision: kidsAdventures.find(a => a.id === id)?.contentRevision || 1 })); storage.setItem("brother.kidsAdventure.last", id);
    if (typeof window !== "undefined" && storage === window.localStorage) window.kidsAdventureProgressBridge?.queue(id);
  } catch { /* Reading remains available without storage. */ }
}
