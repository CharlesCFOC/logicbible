import { genesisAdventures } from "./kids-genesis-data.js";

export const kidsBooks = [
  { id: "genesis", title: "Genesis", icon: "🌍", subtitle: "Beginnings, promises, and growing families." },
  { id: "mark", title: "Mark", icon: "⛵", subtitle: "Meet Jesus and his friends." },
];

export const kidsAdventures = [
  ...genesisAdventures,
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
    return { ...newAdventureProgress(), stage: p.stage,
      scene: Number.isInteger(p.scene) && p.scene >= 0 && p.scene <= 2 ? p.scene : 0,
      question: Number.isInteger(p.question) && p.question >= 0 && p.question <= 2 ? p.question : 0,
      answers: Object.fromEntries(Object.entries(p.answers || {}).filter(([k, v]) => ["0", "1", "2"].includes(k) && Number.isInteger(v) && v >= 0 && v <= 2)),
      order: Array.isArray(p.order) ? [...new Set(p.order.filter(n => [0, 1, 2].includes(n)))] : [], ordered: p.ordered === true, completed: p.completed === true || p.stage === 5,
    };
  } catch { return newAdventureProgress(); }
}

export function saveAdventureProgress(id, progress, storage = window.localStorage) {
  try { storage.setItem(`brother.kidsAdventure.v1.${id}`, JSON.stringify(progress)); storage.setItem("brother.kidsAdventure.last", id); } catch { /* Reading remains available without storage. */ }
}
