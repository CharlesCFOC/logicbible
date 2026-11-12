import { discussionRefuges, refugeProgress, refugeNextScene } from "./discussion-refuges.js";
import { debateThemes } from "../../lib/ai/debate-topics.js";
import { pilotEnrichment, pilotEnrichmentFeelings, nextUnseenPilotScene } from "./pilot-enrichment.js";
import { pilotDetours, pilotDetourRoutes, pilotDetourFeelings } from "./pilot-detours.js";
import { pilotReactionContent } from './pilot-dialogue.js';

const existingTheme = debateThemes.find(theme => theme.id === "unbeliever");
const sourceQuestionIndex = 1;
export const pilotSourceQuestion = { themeId: existingTheme.id, theme: existingTheme.label, number: sourceQuestionIndex + 1, topic: existingTheme.topics[sourceQuestionIndex], question: existingTheme.questions[sourceQuestionIndex] };
const answer = (id, text, next, reaction, review, quality = "solid") => ({ id, text, next, reaction, review, quality });

export const evangelismPilot = {
  id: "suffering-v1", topicId: pilotSourceQuestion.themeId, topicQuestion: pilotSourceQuestion.question,
  completionNode: "summit", pauseAfterSetbacks: 3,
  refuges: discussionRefuges.map((refuge, index) => ({ ...refuge, entry: ["objection", "presence", "gospel", "invitation"][index] })),
  title: "If God is good…", question: "Why does he allow suffering?", duration: "15–20 min", first: "objection",
  character: { name: "Marc", initial: "M", description: "A colleague who does not believe in God", detail: "Moved by the victims’ stories, he wants to feel heard before discussing arguments." },
  context: "After a fundraiser for earthquake victims, you have coffee with Marc. One family’s story has shaken him. He knows you are a Christian and wants to understand how you can believe in a good God in the face of this pain.",
  opening: "Human freedom might explain wars. But an earthquake is nobody’s choice. If God could stop it, why wouldn’t he?",
  goal: "Share Christian hope clearly and gently, listen to what Marc is experiencing, and build a peaceful conversation where he remains free to question.",
  summit: { name: "An open door", line: "I’m not convinced yet. But I’m willing to read this passage with you and keep asking my questions.", detail: "Marc has heard what you believe and chooses to continue the discussion. The summit marks this workshop’s goal: a clear message and a respectful invitation." },
  nodes: {
    objection: {
      stage: 1, title: "Welcoming the objection", cue: "At the café · Marc distinguishes human violence from natural disasters.",
      line: "Human freedom might explain wars. But an earthquake is nobody’s choice. If God could stop it, why wouldn’t he?",
      reference: "John 9:1–3", point: [156, 490],
      choices: [
        answer("A", "Disasters are punishments from God. The people affected are suffering the consequences of their wrongdoing.", "repair-objection", "So you think the victims deserved what happened to them? That is exactly the picture of God I find unfair.", "This reply blames the victims without justification. John 9:1–3 challenges the assumption that suffering is automatically a result of personal guilt.", "risky"),
        answer("B", "Freedom explains human violence. That is enough to show that God can be good despite suffering.", "repair-objection", "But you just answered the question about wars. My objection was about disasters. I feel you’re avoiding it.", "The argument addresses part of the problem but misses the specific distinction Marc raised.", "mixed"),
        answer("C", "I don’t want to minimize these families’ pain. You’re right: human freedom doesn’t explain earthquakes. I acknowledge the limits of my argument.", "presence", "Thank you for not reducing their experience to a ready-made explanation. I feel more heard. So what does your faith offer someone who is suffering?", "This reply acknowledges the pain and the limits of an argument. It builds trust without claiming to have solved the whole problem."),
        answer("D", "Every disaster must bring about a greater good. Even if we can’t see it, it was necessary.", "repair-objection", "How can you say this tragedy was necessary? It sounds like you’re justifying the suffering instead of taking my objection seriously.", "The possibility of reasons beyond our understanding does not justify claiming that a particular disaster was necessary.", "risky"),
      ],
    },
    "repair-objection": {
      stage: 1, repair: true, title: "Reopening the conversation", cue: "Marc is waiting for you to correct your claim without changing the subject.",
      line: "I’m willing to continue, but can you acknowledge the limits of what you just claimed? I don’t want a tragedy explained by blaming the victims.",
      reference: "John 9:1–3", point: [65, 435],
      choices: [
        answer("A", "I stand by my answer. If it upsets you, it’s because you’re not looking at things through faith.", "repair-objection", "You’re putting my reaction down to a lack of faith. But I’m asking you to respond to what I actually said.", "Blaming disagreement on a lack of faith closes down the conversation without addressing the objection.", "risky"),
        answer("B", "I claimed more than I could justify. I take back that generalization: I don’t know why this particular tragedy happened.", "presence", "That changes how I hear you. You can tell me about your faith without claiming to explain everything. What does it offer in the face of suffering?", "The correction is clear and specific. Acknowledging a mistake helps make room for conversation again."),
        answer("C", "I understand that it’s difficult to hear. Still, many Christians share my view.", "repair-objection", "Other people agreeing with you doesn’t tell me why the claim would be right.", "The number of people who share a belief does not establish that the belief is true.", "mixed"),
        answer("D", "Let’s forget about disasters. I’d rather tell you about the happy experiences I’ve had with God.", "repair-objection", "Your experiences matter to you, but my question is still there. I’d like us not to brush it aside.", "A personal story can help, but changing the subject here leaves the objection unanswered.", "mixed"),
      ],
    },
    presence: {
      stage: 2, title: "Talking about Jesus", cue: "Marc agrees to continue. He wants to understand what faith offers in the face of real pain.",
      line: "If you don’t know why every tragedy happens, what does your faith actually offer a person who is suffering?",
      reference: "John 11:32–36", point: [290, 365],
      choices: [
        answer("A", "Believing in Jesus guarantees protection from serious suffering. That is the protection I’m offering you.", "repair-presence", "But I know Christians who are ill or grieving. Was their faith not strong enough?", "Christian faith does not guarantee a life without suffering. This promise can add to the burden of people facing hardship.", "risky"),
        answer("B", "It helps you think about something else. What matters is feeling better, even if the story of Jesus were only symbolic.", "repair-presence", "A story can bring comfort. But you spoke about Jesus as a real person. Does that still matter to your faith?", "Comfort alone does not explain Christian faith, which also makes claims about Jesus and his life.", "mixed"),
        answer("C", "Jesus mainly teaches us to stay strong. The right response to pain is to hide our sadness and move on.", "repair-presence", "I don’t think a grieving person needs to be told to hide their sadness. Is that really what Jesus did?", "John 11 shows Jesus moved by grief. It does not treat tears as a failure.", "risky"),
        answer("D", "In the Gospels, Jesus comes close to people who are suffering and weeps in the face of grief. Christian faith speaks of a God who meets us in our pain.", "gospel", "Jesus weeping speaks to me more. But why do you also emphasize his death and resurrection? What difference does that make?", "This reply presents a concrete aspect of Christian faith without promising that pain will immediately disappear."),
      ],
    },
    "repair-presence": {
      stage: 2, repair: true, title: "Clarifying the hope", cue: "Marc asks you to distinguish Christian hope from a promise you cannot keep.",
      line: "Can you clarify what you’re saying about Jesus without promising an end to suffering or asking people to hide their pain?",
      reference: "John 11:32–36", point: [393, 355],
      choices: [
        answer("A", "I’m not promising a life without pain. I believe Jesus meets people in their suffering, and that his death and resurrection are the foundation of hope.", "gospel", "I understand the difference better now. Then explain what his death and resurrection would change in our relationship with God.", "This reply corrects the excessive promise and connects hope to Jesus while acknowledging the reality of suffering."),
        answer("B", "People who truly believe will always end up protected. They just have to keep going long enough.", "repair-presence", "That is still a guarantee of protection. What would you say to someone who persevered and still lost a loved one?", "Postponing a guarantee does not make it justified. The excessive promise remains a problem.", "risky"),
        answer("C", "The resurrection is a beautiful picture of courage. Whether it actually happened makes no difference to my message.", "repair-presence", "So we’re talking about a philosophy of life? I’m trying to understand what you believe about Jesus himself.", "This reply reduces a central part of the Christian message to a metaphor. See 1 Corinthians 15:3–4.", "mixed"),
        answer("D", "I’d rather not explain further. You’ll understand the difference once you’ve become a Christian.", "repair-presence", "But I need to understand what you’re offering before I can respond to it.", "Understanding the message should not depend on agreeing with it beforehand.", "risky"),
      ],
    },
    gospel: {
      stage: 3, title: "Explaining the Gospel", cue: "Marc gives you room to explain your belief. He asks what reconciliation with God means.",
      line: "You talk about Jesus’ death and resurrection. What does that actually change in our relationship with God?",
      reference: "Ephesians 2:8–9 · 1 Corinthians 15:3–4", point: [190, 255],
      choices: [
        answer("A", "Jesus shows us how to become good enough. If our good deeds outweigh our wrongdoing, God will accept us.", "repair-gospel", "So we have to earn our way to God? I thought you were talking about grace. How can we know when we’ve done enough?", "This reply presents salvation as a balance of merits, whereas Ephesians 2:8–9 presents it as a gift of grace.", "risky"),
        answer("B", "I believe Jesus died for our sins and rose again. God offers forgiveness and reconciliation by grace, to be received through faith.", "invitation", "I understand better: you’re talking about a gift, not a standard to achieve. I’m not convinced yet, but I’m willing to explore what you’re saying.", "This reply presents the heart of the Christian message and distinguishes grace from moral achievement. Marc remains free to respond."),
        answer("C", "Jesus mainly builds self-confidence. Forgiveness means the moment when we stop feeling guilty.", "repair-gospel", "Feeling better can help. But you were talking about a relationship with God. Is it just a change in my emotions?", "Emotions may accompany faith, but they do not fully explain the forgiveness and reconciliation proclaimed in the Gospel.", "mixed"),
        answer("D", "You just need to join our church and follow its customs. Belonging to the group restores your relationship with God.", "repair-gospel", "So you’re mainly inviting me to join a community? Where does Jesus fit into what you just explained?", "Church life can support a journey of faith, but group membership does not replace the message of grace in Jesus Christ.", "risky"),
      ],
    },
    "repair-gospel": {
      stage: 3, repair: true, title: "Clarifying grace", cue: "Marc has noticed some confusion. You can restate your belief more clearly.",
      line: "Can you clearly distinguish what you believe Jesus has done for us from what you expect me to do?",
      reference: "Ephesians 2:8–9", point: [75, 260],
      choices: [
        answer("A", "You must change your life enough first. Then God will decide whether Jesus can forgive you.", "repair-gospel", "That still means having to earn forgiveness. I still don’t understand where grace comes in.", "This explanation continues to confuse a changed life with supposedly earning forgiveness.", "risky"),
        answer("B", "It doesn’t matter what you believe about Jesus. The main thing is that our conversation makes you feel good.", "repair-gospel", "I appreciate the conversation, but I’m looking for an explanation of your belief, not just a pleasant feeling.", "The relationship matters, but that does not remove the need to explain the content of the faith clearly.", "mixed"),
        answer("C", "I didn’t explain that well. According to the Gospel, forgiveness is God’s gift through Jesus, received through faith. We cannot buy it through our deeds or our membership.", "invitation", "That’s clearer. I still have questions, but I can now understand the belief you want to share with me.", "This correction distinguishes God’s gift from the human response and returns to the heart of the Christian message."),
        answer("D", "I don’t need to explain further. Just repeat the same words as me and everything will be settled.", "repair-gospel", "Repeating words I don’t understand would not be a sincere response.", "Repeating a formula without understanding does not replace a personal and freely chosen response to the message.", "risky"),
      ],
    },
    invitation: {
      stage: 4, title: "Offering a next step", cue: "Marc has heard the Gospel. He remains skeptical but is willing to examine the message.",
      line: "I’m not convinced yet. I’d like to understand more, but I don’t want to be asked to pretend to believe. What are you expecting from me?",
      reference: "1 Peter 3:15–16", point: [290, 160],
      choices: [
        answer("A", "You need to decide now. Repeat this prayer with me, even if you’re not convinced yet.", "repair-invitation", "I just told you I don’t want to pretend. This pressure makes me want to stop the conversation.", "This reply does not respect Marc’s stated position and confuses spoken words with sincere belief.", "risky"),
        answer("B", "Since you’re willing to talk about it, I’ll consider you a Christian now. We can sort out your questions later.", "repair-invitation", "No, agreeing to a conversation is not the same as believing. I’d like you to respect that difference.", "Interest in a discussion does not give us permission to assign a belief to someone.", "risky"),
        answer("C", "I’ll give you a book. You can explore it on your own; we don’t need to come back to your questions together.", "repair-invitation", "The book could help. But part of what interested me was being able to talk with you about what I don’t understand.", "A resource can be useful, but this suggestion unnecessarily closes off the support Marc is willing to continue receiving.", "mixed"),
        answer("D", "I suggest we read a passage about Jesus together and discuss it freely. You can keep your questions and take time to reflect.", "summit", "Yes, I’d like that. Let’s start with the account of Jesus facing grief. And I’ll tell you honestly what I think.", "This invitation is specific, relational and respectful of Marc’s freedom. The aim is a faithful explanation and an open next step, not a forced conversion."),
      ],
    },
    "repair-invitation": {
      stage: 4, repair: true, title: "Respecting his response", cue: "Marc values his freedom. He gives you a chance to rethink your invitation.",
      line: "I can examine your faith without pretending to share it. Can we continue on that basis?",
      reference: "1 Peter 3:15–16", point: [393, 185],
      choices: [
        answer("A", "Yes. I respect what you’ve just said. If you’d like, let’s read a passage together and keep talking without assuming you hold a belief you haven’t expressed.", "summit", "In that case, I’m interested. I want to understand what Jesus says and does, and still be able to ask my questions.", "This reply acknowledges Marc’s freedom and offers a step that matches his actual interest."),
        answer("B", "If you won’t decide right now, I don’t see any point in continuing to talk.", "repair-invitation", "Then it feels as though my interest and questions don’t count unless I give the answer you want.", "Making the relationship depend on an immediate decision turns an invitation into pressure.", "risky"),
        answer("C", "All right, but I’ll still tell the others that you now share our faith.", "repair-invitation", "I don’t agree to you telling them that. It’s not what I said.", "This reply attributes a belief to Marc that he has not expressed and weakens trust.", "risky"),
        answer("D", "We can continue, but only if you avoid difficult objections at our next meeting.", "repair-invitation", "My objections are part of my thinking. Setting them aside won’t help me believe sincerely.", "An open conversation makes real room for questions and disagreement.", "mixed"),
      ],
    },
  },
};

// Preserve historical routes when replaying saved conversations.
const legacyRoutes = Object.fromEntries(Object.entries(evangelismPilot.nodes).map(([id, node]) => [id, Object.fromEntries(node.choices.map(choice => [choice.id, choice.next]))]));
Object.assign(evangelismPilot.nodes, pilotDetours);
for (const [id, routes] of Object.entries(pilotDetourRoutes)) {
  for (const choice of evangelismPilot.nodes[id].choices) if (routes[choice.id]) choice.next = routes[choice.id];
}

const versionTwoNodes = new Set(Object.keys(evangelismPilot.nodes));
Object.assign(evangelismPilot.nodes, pilotEnrichment);
// Adapt the existing authored scenes to explicit objectives. Future scenarios
// can declare completesRefuge directly on their successful choices.
for (const node of Object.values(evangelismPilot.nodes)) {
  for (const choice of node.choices) {
    if (choice.quality === "solid" && (choice.next === "summit" || evangelismPilot.nodes[choice.next]?.stage > node.stage)) choice.completesRefuge = node.stage;
  }
}

// These are authored states of a fictional character, not psychological scores
// or estimates of a real participant's feelings or beliefs.
const feelings = {
  initial: { feeling: "Moved, but guarded", expression: "worried", signal: "Marc speaks slowly. The victims’ story moves him, and his eyes seek an attentive response.", need: "For these families’ pain to be taken seriously before any explanation.", relationship: "Room for trust to begin" },
  hurt: { feeling: "Hurt by what he hears", expression: "hurt", signal: "His expression closes. He pauses, wondering whether the victims have just been judged.", need: "To have his concern acknowledged without blame or justification of suffering.", relationship: "Trust has been weakened" },
  unheard: { feeling: "Frustrated at not being heard", expression: "tense", signal: "Marc frowns and returns to his question. He is waiting for his words to be truly heard.", need: "An answer to his specific concern rather than a change of subject.", relationship: "The conversation needs listening" },
  worried: { feeling: "Worried about the promises", expression: "worried", signal: "He hesitates and seeks clarification. He does not want someone suffering to carry extra guilt.", need: "Honest words that do not promise what they cannot guarantee.", relationship: "He remains cautious" },
  uncertain: { feeling: "Puzzled, seeking clarity", expression: "guarded", signal: "Marc tilts his head slightly. He is trying to understand what you really believe.", need: "Clear words, with room to ask for an explanation.", relationship: "Trust needs clarity" },
  pressured: { feeling: "Pressured, ready to withdraw", expression: "tense", signal: "He looks away and gives shorter answers. He wants to be able to disagree freely.", need: "To regain the freedom to reflect and say no without losing the relationship.", relationship: "Trust needs respect" },
  disappointed: { feeling: "Disappointed, still willing to talk", expression: "hurt", signal: "Marc lowers his eyes for a moment. He had hoped to keep exploring his questions with you.", need: "Someone willing to stay involved and suggest a practical next step.", relationship: "The relationship still needs care" },
  heard: { feeling: "Heard, still cautious", expression: "calm", signal: "His shoulders relax a little. He speaks more calmly, though his questions remain.", need: "To continue at his own pace, with genuine attention to the suffering discussed.", relationship: "Trust is beginning to grow" },
  reassured: { feeling: "Reassured by your honesty", expression: "calm", signal: "Marc looks at you again. He welcomes the clarification and seems more comfortable continuing.", need: "To explore the message without hiding what he does not understand.", relationship: "A calmer conversation" },
  curious: { feeling: "Curious, free to question", expression: "open", signal: "He turns toward you and asks with interest. He remains free not to share your belief.", need: "To understand what you are presenting and keep real room for his objections.", relationship: "Trust grows through conversation" },
  trusting: { feeling: "Confident about continuing", expression: "open", signal: "Marc relaxes and accepts a next step. His curiosity does not erase his doubts, but he feels respected.", need: "A practical, freely chosen next step, with time to reflect.", relationship: "A trusting relationship to nurture" },
};
const feelingByChoice = {
  ...pilotDetourFeelings,
  ...pilotEnrichmentFeelings,
  objection: { A: "hurt", B: "unheard", C: "heard", D: "hurt" },
  "repair-objection": { A: "hurt", B: "reassured", C: "unheard", D: "unheard" },
  presence: { A: "worried", B: "uncertain", C: "hurt", D: "curious" },
  "repair-presence": { A: "reassured", B: "worried", C: "uncertain", D: "unheard" },
  gospel: { A: "worried", B: "curious", C: "uncertain", D: "uncertain" },
  "repair-gospel": { A: "worried", B: "unheard", C: "reassured", D: "pressured" },
  invitation: { A: "pressured", B: "pressured", C: "disappointed", D: "trusting" },
  "repair-invitation": { A: "trusting", B: "pressured", C: "pressured", D: "unheard" },
};

// Internal story variables, never presented as measurements of a real person.
// Replaying the full history makes repair gradual and undo deterministic.
const relationalEffects = {
  hurt: [-18, 24], unheard: [-12, 18], worried: [-8, 10], uncertain: [-5, 7],
  pressured: [-22, 30], disappointed: [-10, 12], heard: [10, -10],
  reassured: [10, -10], curious: [12, -12], trusting: [12, -12],
};
const initialJourney = () => ({ trust: 44, frustration: 20, distanceBelowRidge: 0 });
export const pilotRidge = [[90, 365], [275, 300], [470, 225], [665, 150], [860, 75]];
export const pilotVersion = 4;

export function createPilotEngine(scenario = evangelismPilot) {
  const custom = scenario.generated === true;
  function choiceFeeling(entry) {
    if (!custom) return feelingByChoice[entry.nodeId][entry.choiceId];
    const quality = scenario.nodes[entry.nodeId].choices.find(choice => choice.id === entry.choiceId).quality;
    return quality === "solid" ? "heard" : quality === "mixed" ? "uncertain" : "pressured";
  }
  function journeyStep(journey, entry) {
    const node = scenario.nodes[entry.nodeId];
    const choice = node.choices.find(item => item.id === entry.choiceId);
    const feeling = choiceFeeling(entry);
    const [trust, frustration] = relationalEffects[feeling];
    const distanceBelowRidge = choice.quality === "solid"
      ? Math.max(0, journey.distanceBelowRidge - (node.recovery ? 32 : node.repair ? 28 : 24))
      : Math.min(200, journey.distanceBelowRidge + (choice.quality === "mixed" ? 28 : feeling === "pressured" ? 64 : 52));
    return { trust: Math.max(0, Math.min(100, journey.trust + trust)), frustration: Math.max(0, Math.min(100, journey.frustration + frustration)), distanceBelowRidge };
  }
  function pilotJourneyState(history) { return history.reduce(journeyStep, initialJourney()); }

  function nextNodeFor(entry, journey, history = []) {
    const choice = scenario.nodes[entry.nodeId].choices.find(item => item.id === entry.choiceId);
    if (custom) return refugeNextScene(scenario, entry, history);
    let next = entry.routeVersion === 1 ? legacyRoutes[entry.nodeId]?.[entry.choiceId] : choice.next;
    if (![1, 2, 3].includes(entry.routeVersion)) return nextUnseenPilotScene(refugeNextScene(scenario, entry, history), history);
    if (next === "summit") next = journey.distanceBelowRidge === 0 && journey.trust >= 65 && journey.frustration <= 20 ? "summit" : "restore-listening";
    return [1, 2].includes(entry.routeVersion) ? next : nextUnseenPilotScene(next, history);
  }
  function pilotNextNode(state, index = state.history.length - 1) {
    const entry = state.history[index];
    return entry ? nextNodeFor(entry, pilotJourneyState(state.history.slice(0, index + 1)), state.history.slice(0, index + 1)) : null;
  }

  function pilotEmotionalState(state) {
    const last = state.history.at(-1);
    const relation = pilotJourneyState(state.history);
    if (custom) {
      const positive = !last || lastPilotChoice(state)?.quality === "solid";
      return { feeling: positive ? "Listening, free to question" : "Guarded after this exchange", expression: positive ? "calm" : "worried",
        signal: "The character’s attitude changes in response to the group’s replies.", need: "An honest, attentive answer that respects their freedom.",
        relationship: positive ? "Trust is building" : "The relationship needs care",
        attitude: relation.frustration >= 60 ? "Defensive" : positive ? "Listening" : "Guarded",
        frustrationLabel: relation.frustration >= 60 ? "High" : relation.frustration >= 35 ? "Noticeable" : "Contained",
        trustLabel: relation.trust < 45 ? "Fragile" : "Building" };
    }
    let mood = last ? feelings[feelingByChoice[last.nodeId]?.[last.choiceId]] || feelings.initial : feelings.initial;
    const positive = lastPilotChoice(state)?.quality === "solid";
    if (positive && relation.frustration >= 60) mood = { ...mood, feeling: "Still frustrated, despite your effort", expression: "tense", signal: "Marc acknowledges the correction, but his face remains tense. Earlier missteps still weigh on the conversation.", relationship: "Trust is rebuilding slowly" };
    else if (positive && relation.frustration >= 40) mood = { ...mood, feeling: "He sees the effort, but stays guarded", expression: "guarded", signal: "He receives your response cautiously. He still needs consistency and time to feel trust.", relationship: "Trust is rebuilding slowly" };
    else if (!positive && relation.frustration >= 70) mood = { ...mood, feeling: "Frustrated, increasingly defensive", expression: "tense", signal: "His answers grow shorter. He feels increasingly unheard and withdraws further.", relationship: "Trust is seriously weakened" };
    else if (positive && lastPilotChoice(state)?.next === "summit" && pilotNextNode(state) !== "summit") mood = { ...mood, feeling: "Willing to talk, still cautious", expression: "guarded", relationship: "Trust still needs time" };
    const repaired = scenario.nodes[last?.nodeId]?.repair && lastPilotChoice(state)?.quality === "solid";
    return {
      ...mood,
      ...(repaired && relation.frustration < 40 ? { relationship: "Trust is rebuilding" } : {}),
      attitude: relation.frustration >= 60 ? "Defensive" : relation.frustration >= 40 ? "Tense, cautious" : relation.frustration >= 22 ? "Reserved" : relation.trust >= 65 ? "Open to conversation" : "Cautious, listening",
      frustrationLabel: relation.frustration >= 60 ? "High" : relation.frustration >= 35 ? "Noticeable" : relation.frustration >= 18 ? "Contained" : "Calm",
      trustLabel: relation.trust < 25 ? "Very fragile" : relation.trust < 45 ? "Fragile" : relation.trust < 65 ? "Building" : relation.trust < 80 ? "Strengthening" : "Established in conversation",
    };
  }

  function pilotSpokenReaction(state, index = state.history.length - 1) {
    const entry = state.history[index];
    if (!entry) return "";
    if (custom) return scenario.nodes[entry.nodeId].choices.find(choice => choice.id === entry.choiceId).reaction;
    if (entry.aiReaction && entry.aiLanguage === "en") return entry.aiReaction;
    const choice = scenario.nodes[entry.nodeId].choices.find(item => item.id === entry.choiceId);
    const relation = pilotJourneyState(state.history.slice(0, index + 1));
    if (choice.next === "summit" && pilotNextNode(state, index) !== "summit") return "I appreciate you leaving me the choice. But I still need time to trust you after our conversation. Before planning that reading, I’d like us to return to what hurt me.";
    if (choice.quality === "solid" && relation.frustration >= 60) return `I hear your correction, but the earlier exchanges still leave me tense. ${choice.reaction}`;
    if (choice.quality === "solid" && relation.frustration >= 40) return `I appreciate that clarification, although I still need time to trust you. ${choice.reaction}`;
    if (choice.quality !== "solid" && relation.frustration >= 70) return `This discussion is becoming really difficult for me. ${choice.reaction}`;
    return choice.reaction;
  }

  function pilotReactionParts(state, index = state.history.length - 1) {
    const entry = state.history[index];
    const choice = entry && scenario.nodes[entry.nodeId]?.choices.find(item => item.id === entry.choiceId);
    return pilotReactionContent(pilotSpokenReaction(state, index), scenario.character.name, choice?.reactionNarration || '');
  }



  // Good replies follow the ridge. Imperfect replies descend from the current
  // altitude; subsequent good replies recover some lost ground rather than reset.
  function pilotTrail(state) {
    let current = [...pilotRidge[0]];
    let journey = initialJourney();
    let atSummit = false;
    const segments = state.history.map((entry, index) => {
      const node = scenario.nodes[entry.nodeId];
      const choice = node.choices.find(item => item.id === entry.choiceId);
      const from = current;
      journey = journeyStep(journey, entry);
      atSummit = nextNodeFor(entry, journey, state.history.slice(0, index + 1)) === "summit";
      if (choice.quality === "solid") {
        const altitude = pilotRidge[node.stage][1] + journey.distanceBelowRidge;
        current = atSummit ? [...pilotRidge[4]] : ![1, 2, 3].includes(entry.routeVersion) && choice.completesRefuge
          ? [...pilotRidge[choice.completesRefuge]] : node.stage === 4
          ? [840, Math.min(75 + (from[1] - 75) * .85, Math.max(85, altitude))]
          : [pilotRidge[node.stage][0], Math.min(from[1] - 8, altitude)];
      } else {
        const drop = choice.quality === "mixed" ? 28 : choiceFeeling(entry) === "pressured" ? 64 : 52;
        current = [Math.min(from[0] + 30, pilotRidge[node.stage][0] - 20), Math.min(480, from[1] + drop)];
      }
      return { from, to: current, choiceId: choice.id, quality: choice.quality, direction: current[1] < from[1] ? "up" : current[1] > from[1] ? "down" : "level", id: `${index}-${entry.choiceId}` };
    });
    const last = state.history.at(-1);
    const completedObjective = last && ![1, 2, 3].includes(last.routeVersion) && lastPilotChoice(state)?.completesRefuge;
    return { current, segments, belowRidge: Boolean(!atSummit && !completedObjective && (journey.distanceBelowRidge > 0 || (last && scenario.nodes[last.nodeId].stage === 4))), atSummit };
  }

  function pilotRefuges(state) {
    // Old saves may contain an invitation accepted before the former score gate.
    // Keep those historical detours intact; don't display refuge 4 as earned early.
    const history = state.history.filter((entry, index) => {
      const choice = scenario.nodes[entry.nodeId]?.choices.find(item => item.id === entry.choiceId);
      return choice?.completesRefuge !== 4 || pilotNextNode(state, index) === "summit";
    });
    return refugeProgress(scenario, history);
  }

  function pilotTranscript(state) {
    const transcript = [{ id: "opening", role: "marc", text: scenario.opening }];
    const marc = (id, text) => { if (transcript.at(-1)?.text !== text) transcript.push({ id, role: "marc", text }); };
    state.history.forEach((entry, index) => {
      const node = scenario.nodes[entry.nodeId];
      const choice = node.choices.find(item => item.id === entry.choiceId);
      marc(`${index}-question`, node.line);
      transcript.push({ id: `${index}-us`, role: "us", text: choice.text });
      const reaction = pilotReactionParts(state, index);
      transcript.push({ id: `${index}-narration`, role: 'narrator', text: reaction.narration || 'The group has shared its response.' });
      const phase = state.phase === 'debrief' ? state.returnPhase : state.phase;
      // Confirmation reveals the commentator first. The character's words are
      // sent only when the facilitator continues to the next exchange.
      const waitingForContinue = phase === 'reaction' && index === state.history.length - 1;
      if (reaction.speech && !waitingForContinue) marc(`${index}-reaction`, reaction.speech);
    });
    const phase = state.phase === "debrief" ? state.returnPhase : state.phase;
    if (phase === "decision" && state.history.length) marc(`current-${state.nodeId}`, pilotNode(state).line);
    return transcript;
  }


  function newPilotState() {
    return { version: pilotVersion, scenarioId: scenario.id, nodeId: scenario.first, phase: "context", selected: null, sideSlide: "mountain", mountainExpanded: false, history: [] };
  }

  function pilotNode(state) { return scenario.nodes[state.nodeId] || null; }
  function lastPilotChoice(state) {
    const entry = state.history.at(-1);
    return entry ? scenario.nodes[entry.nodeId]?.choices.find(choice => choice.id === entry.choiceId) || null : null;
  }

  function pilotReducer(state, action) {
    const node = pilotNode(state);
    if (action.type === "restart") return newPilotState();
    if (action.type === "mountain-view" && typeof action.expanded === "boolean") return { ...state, mountainExpanded: action.expanded };
    if (action.type === "side-slide" && ["mountain", "conversation"].includes(action.slide)) return { ...state, sideSlide: action.slide };
    if (action.type === "start" && state.phase === "context") return { ...state, phase: "decision" };
    if (action.type === "select" && state.phase === "decision" && node?.choices.some(choice => choice.id === action.id)) return { ...state, selected: state.selected === action.id ? null : action.id };
    if (action.type === "confirm" && state.phase === "decision") {
      const choice = node?.choices.find(choice => choice.id === state.selected);
      if (choice) return { ...state, phase: "reaction", selected: null, history: [...state.history, { nodeId: state.nodeId, choiceId: choice.id }] };
    }
    if (action.type === "advance" && state.phase === "reaction") {
      const next = pilotNextNode(state);
      if (next) return { ...state, nodeId: next, phase: next === "summit" ? "complete" : "decision", selected: null };
    }
    if (action.type === "undo" && state.history.length) {
      const previous = state.history.at(-1);
      return { ...state, nodeId: previous.nodeId, selected: previous.choiceId, phase: "decision", history: state.history.slice(0, -1) };
    }
    if (action.type === "debrief" && state.phase !== "debrief" && state.history.length) return { ...state, phase: "debrief", returnPhase: state.phase };
    if (action.type === "close-debrief" && state.phase === "debrief") return { ...state, phase: state.returnPhase || "decision", returnPhase: undefined };
    if (action.type === "ai-reaction" && state.phase === "reaction" && action.historyLength === state.history.length && action.nodeId === state.nodeId && typeof action.text === "string") {
      return { ...state, history: state.history.map((entry, index) => index === state.history.length - 1 ? { ...entry, aiReaction: action.text.trim().slice(0, 420), aiLanguage: "en" } : entry) };
    }
    return state;
  }

  // Replay the path rather than trusting a saved node, outcome or selected score.
  function normalizePilotState(saved) {
    if (![1, 2, 3, pilotVersion].includes(saved?.version) || saved.scenarioId !== scenario.id || !Array.isArray(saved.history)) return newPilotState();
    let state = pilotReducer(newPilotState(), { type: "start" });
    for (const entry of saved.history) {
      if (!entry || state.nodeId !== entry.nodeId || !pilotNode(state)?.choices.some(choice => choice.id === entry.choiceId)) return newPilotState();
      state = pilotReducer(pilotReducer(state, { type: "select", id: entry.choiceId }), { type: "confirm" });
      if (custom && entry.routeVersion) return newPilotState();
      if (!custom && (saved.version === 1 || entry.routeVersion === 1)) {
        if (!legacyRoutes[entry.nodeId]?.[entry.choiceId]) return newPilotState();
        state.history[state.history.length - 1].routeVersion = 1;
      } else if (!custom && (saved.version === 2 || entry.routeVersion === 2)) {
        if (!versionTwoNodes.has(entry.nodeId)) return newPilotState();
        state.history[state.history.length - 1].routeVersion = 2;
      } else if (!custom && (saved.version === 3 || entry.routeVersion === 3)) {
        state.history[state.history.length - 1].routeVersion = 3;
      }
      if (typeof entry.aiReaction === "string") state.history[state.history.length - 1].aiReaction = entry.aiReaction.slice(0, 420);
      if (entry.aiLanguage === "en") state.history[state.history.length - 1].aiLanguage = "en";
      state = pilotReducer(state, { type: "advance" });
    }
    const phase = saved.phase === "debrief" ? saved.returnPhase : saved.phase;
    if (phase === "context" && !state.history.length) state = newPilotState();
    else if (phase === "reaction" && state.history.length) state = { ...state, nodeId: state.history.at(-1).nodeId, phase: "reaction" };
    else if (phase === "complete" && saved.version === 1 && state.nodeId === "restore-listening") state = { ...state, phase: "decision" };
    else if (!["decision", "complete"].includes(phase) || (phase === "complete" && state.nodeId !== "summit") || (phase === "decision" && state.nodeId === "summit")) return newPilotState();
    if (phase === "decision" && pilotNode(state)?.choices.some(choice => choice.id === saved.selected)) state.selected = saved.selected;
    if (saved.phase === "debrief" && state.history.length) state = { ...state, returnPhase: state.phase, phase: "debrief" };
    state.sideSlide = saved.sideSlide === "conversation" ? "conversation" : "mountain";
    state.mountainExpanded = saved.mountainExpanded === true;
    return state;
  }

  function pilotReactionPrompt(state) {
    const entry = state.history.at(-1);
    const choice = lastPilotChoice(state);
    if (state.phase !== "reaction" || !entry || !choice) return "";
    const mood = pilotEmotionalState(state);
    return `Evangelism workshop, educational fiction in English. You play ${scenario.character.name}, an adult colleague who is skeptical, direct, and respectful. Context: ${scenario.context}\nMarc just said: ${scenario.nodes[entry.nodeId].line}\nThe group chose this exact reply: ${choice.text}\nPrepared reaction: ${pilotSpokenReaction(state)}\nMarc’s feelings in this scene: ${mood.feeling}. Cumulative attitude: ${mood.attitude}. Frustration: ${mood.frustrationLabel}. Trust: ${mood.trustLabel}. What he needs: ${mood.need}\nRephrase only the prepared reaction in English, in 2 or 3 sentences, no more than 420 characters. Preserve its meaning and Marc’s position. Express his emotion through his words without adding narration. Trust and calm do not mean agreement or conversion: he remains free to question. Do not make him automatically calm down after blame or pressure: the entire conversation influences his attitude. Respond specifically to the chosen reply. Do not change the scenario or add a new objection, fact, Bible quotation, or conversion decision. Stay in dialogue without notes, scores, advice, analysis, or labels of good or bad answers. Return only Marc’s words.`;
  }

  return { scenario, pilotJourneyState, pilotNextNode, pilotEmotionalState, pilotSpokenReaction, pilotReactionParts, pilotTrail, pilotRefuges, pilotTranscript, newPilotState, pilotNode, lastPilotChoice, pilotReducer, normalizePilotState, pilotReactionPrompt };
}

export const { pilotJourneyState, pilotNextNode, pilotEmotionalState, pilotSpokenReaction, pilotTrail, pilotRefuges, pilotTranscript, newPilotState, pilotNode, lastPilotChoice, pilotReducer, normalizePilotState, pilotReactionPrompt } = createPilotEngine();
