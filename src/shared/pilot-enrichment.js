// Additional authored conversations: each scene has its own objection, four
// concrete replies, reactions and teaching notes. No live AI is required.
const reply = (id, text, next, reaction, review, quality = "solid", feeling) => ({ id, text, next, reaction, review, quality, feeling: feeling || (quality === "solid" ? "reassured" : quality === "mixed" ? "uncertain" : "pressured") });
export const pilotEnrichment = {
  "name-the-harm": {
    stage: 1, repair: true, title: "Acknowledge what hurt", reference: "James 1:19",
    cue: "Marc asks you to distinguish an apology from a real correction of your words.",
    line: "I’m still hurt. When you explain the tragedy too quickly, I hear that the victims should have accepted it. What exactly are you taking back?",
    choices: [
      reply("A", "I take back the tone I used. In substance, the victims should still accept the tragedy without asking so many questions.", "separate-causes", "I feel judged on their behalf. You change your tone, but you’re still asking the victims to stay silent.", "Correcting the tone is not enough when the content still dismisses pain and questions.", "risky", "hurt"),
      reply("B", "I take back the idea that I could explain for them why they suffered. I don’t know the reason for this tragedy, and I don’t want to blame them for it.", "presence", "That specific correction reassures me. You’re no longer asking them to justify their grief. But what can your faith offer someone who is still grieving?", "The apology names the claim being withdrawn. It acknowledges a real limit without giving up the possibility of presenting Christian hope."),
      reply("C", "I’m sorry I hurt you. To make a fresh start, I suggest we stop talking about this disaster and look at the beautiful things in life.", "separate-causes", "I’m still puzzled. I accept your apology, but the victims disappear from the conversation just as I bring them up.", "The apology helps, but changing the subject still avoids Marc’s concern.", "mixed"),
      reply("D", "I take back every claim about God. To make you feel respected, I’ll say from now on that your interpretation must be right.", "separate-causes", "I’m still on my guard. I’m not asking you to tell me what I want to hear; I’d like an honest account of your limits and beliefs.", "Respecting an objection does not require pretending to agree. Honesty also matters in rebuilding trust.", "mixed"),
    ],
  },
  "separate-causes": {
    stage: 1, repair: true, title: "Distinguish explanation from justification", reference: "1 Peter 3:15–16",
    cue: "Marc clarifies the difference between understanding a disaster and giving it religious meaning.",
    line: "I’m still worried: explaining how an earthquake happens doesn’t explain why God allows it. Can you acknowledge that difference without presenting the victims’ deaths as necessary?",
    choices: [
      reply("A", "Yes, those are different questions. I don’t know why God allowed this particular tragedy; I can explain what sustains my hope without making it a justification for their deaths.", "presence", "I feel understood. You’re no longer confusing the earthquake’s cause with the meaning of the victims’ deaths. I’m willing to hear where that hope comes from.", "This distinguishes scientific and theological questions, acknowledges what is unknown, and offers a clear transition to hope."),
      reply("B", "The way the earth works is enough of an answer. Since earthquakes have a natural cause, your question about God’s goodness doesn’t really arise anymore.", "name-the-harm", "I’m still frustrated. You’re answering how the disaster works, but my question about God is still there.", "A physical explanation alone does not resolve Marc’s moral or theological objection.", "mixed", "unheard"),
      reply("C", "I think those deaths were necessary to bring about a greater good. We can’t verify it, but you should start from that conclusion.", "name-the-harm", "I feel hurt. Claiming those people had to die is exactly what makes your explanation hard to hear.", "Assigning necessity to a particular tragedy without evidence turns a hypothesis into certainty about the victims’ lives.", "risky", "hurt"),
      reply("D", "First we need to decide that God is good and postpone this objection. Without that prior agreement, no conversation is possible.", "name-the-harm", "I feel pressured. You’re asking me to accept the conclusion before I can ask my question.", "Requiring agreement in advance prevents examination of the very objection that started the conversation.", "risky"),
    ],
  },
  "offer-presence": {
    stage: 2, repair: true, title: "Offer help without conditions", reference: "John 11:32–36",
    cue: "Marc imagines visiting a grieving friend who does not want to talk about religion.",
    line: "I’m still cautious. My friend accepts a meal but doesn’t want to talk about God today. Would you still help her, and what would you say?",
    choices: [
      reply("A", "I’d bring the meal, then start my explanation anyway. She’ll understand later that it was for her good, even though she asked me to wait.", "honest-hope", "I feel pressured on her behalf. Accepting a meal doesn’t mean accepting a discussion she has declined.", "An act of help does not authorize ignoring an expressed boundary. An offered conversation must respect consent.", "risky"),
      reply("B", "I’d respect her refusal and never mention my faith again, even if she asked me a question herself later.", "honest-hope", "I’m still puzzled. She said ‘not today,’ not ‘never.’ Why decide for her that the subject is permanently closed?", "Respecting someone’s current pace does not mean closing a future conversation they freely want.", "mixed"),
      reply("C", "I’d tell her I can bring the meal without expecting anything in return. I’ll respect her silence; if she ever wants to talk about my hope, she can ask me.", "gospel", "I feel reassured. Your help doesn’t depend on her agreeing with you. As for me, I’d like to understand the hope you’re talking about.", "This makes help unconditional and leaves an opening without insistence. Marc can then ask his own question."),
      reply("D", "I’d invite her to pray with us before receiving the meal. It would be a small step to show she accepts our approach.", "honest-hope", "I feel hurt for her. She needs a meal, and you’re making religious participation a condition for receiving it.", "Making practical help conditional on religious participation turns service into pressure.", "risky", "hurt"),
    ],
  },
  "honest-hope": {
    stage: 2, repair: true, title: "Offer hope without impossible promises", reference: "John 11:32–36",
    cue: "Marc wants to know whether Christian hope also allows someone to say the pain remains.",
    line: "I’m still worried. If she prays and her pain doesn’t lessen, will you tell her she lacks faith? What hope can you offer without guaranteeing immediate healing?",
    choices: [
      reply("A", "I’d tell her to pray longer until she feels a change. If her pain continues, she hasn’t persevered enough yet.", "offer-presence", "I feel hurt. You’re making her pain proof that she hasn’t prayed well enough when she’s already suffering.", "Measuring faith by the disappearance of pain adds guilt that the account of grief does not justify.", "risky", "hurt"),
      reply("B", "I’d tell her prayer is mainly a technique for feeling better. Jesus’ death and resurrection don’t really need to be part of the explanation.", "offer-presence", "I’m still puzzled. That may address well-being, but I still don’t understand what makes this hope specifically Christian.", "Reducing prayer to a technique for relief leaves out the message Marc wants to understand.", "mixed"),
      reply("C", "I’d guarantee that if she believes sincerely enough, she’ll never lose another loved one. That would give her a strong reason to believe.", "offer-presence", "I’m still worried. Such an absolute promise could hurt her even more during another hardship.", "A guarantee against future loss is a promise we cannot make.", "risky", "worried"),
      reply("D", "I wouldn’t measure her faith by her pain. Jesus weeps in the face of grief; Christian hope rests on his death and resurrection without guaranteeing our tears will immediately disappear.", "gospel", "I feel reassured. You’re leaving room for grief. Now explain the connection between that hope and what you believe about Jesus’ death.", "This allows present grief and hope to coexist, then names the Christian content still to be explained."),
    ],
  },
  "explain-grace": {
    stage: 3, repair: true, title: "Explain forgiveness without jargon", reference: "Ephesians 2:8–9",
    cue: "Marc asks what a religious word you used actually means.",
    line: "I’m still puzzled by the word ‘grace.’ If I can’t buy forgiveness by doing good, what does receiving it through faith mean? Answer without adding more religious words.",
    choices: [
      reply("A", "It simply means nothing you do matters. You could deliberately hurt others without ever needing to ask their forgiveness.", "examine-claim", "I’m still worried. Forgiveness that makes other people unimportant seems hard to distinguish from indifference.", "Presenting forgiveness as permission to harm distorts grace and removes responsibility toward others.", "risky", "worried"),
      reply("B", "I believe God offers us forgiveness through Jesus. Trusting him means receiving that gift instead of presenting our good deeds as payment; it doesn’t make our actions unimportant.", "invitation", "That’s clearer. You distinguish receiving forgiveness from trying to pay for it. I want time to examine what you claim about Jesus.", "This explains the term in accessible words and distinguishes the gift received from personal responsibility."),
      reply("C", "Grace is justification through redemption and propitiation. Learn those terms first, and you’ll understand what I mean.", "examine-claim", "I’m still puzzled. You’ve added several words to the one I already didn’t understand; could you start with a simpler explanation?", "Precise vocabulary can help, but a pile of unexplained terms does not answer Marc’s request.", "mixed"),
      reply("D", "Receiving this gift means immediately accepting our community’s customs. Once you live like us, we’ll know you understand.", "examine-claim", "I feel pressured. You’re replacing the explanation of forgiveness with an expectation of conformity to the group again.", "Equating community customs with receiving forgiveness maintains the confusion between gift and belonging.", "risky"),
    ],
  },
  "examine-claim": {
    stage: 3, repair: true, title: "Make room to examine the belief", reference: "1 Peter 3:15–16",
    cue: "Marc distinguishes your personal testimony from a reason to explore Jesus’ message.",
    line: "I’m not convinced yet. I can understand that this faith helps you, but why examine what it claims about Jesus rather than just its effect on you?",
    choices: [
      reply("A", "My experience explains why it matters to me, but it doesn’t oblige you to believe me. We can examine an account about Jesus, distinguish its claims from our questions, and discuss them honestly.", "invitation", "I feel free to question. You’re offering something to examine without treating your experience as proof that should be enough for me.", "This distinguishes testimony from examination of the message. It offers a practical approach without promising every question will be resolved."),
      reply("B", "If you trust me as a friend, you should accept my experience as sufficient proof. Asking for more would mean doubting our friendship.", "explain-grace", "I feel pressured. I can believe your experience is sincere without drawing exactly the same conclusion.", "Relational trust must not become an obligation to adopt another person’s belief.", "risky"),
      reply("C", "We can talk about faith’s positive effects and set aside the claims about Jesus. At least that will let us end in agreement.", "explain-grace", "I’m still puzzled. Agreeing on positive effects doesn’t answer my question about what you believe is true.", "Finding common ground helps, but not at the cost of avoiding the specific content someone wants to examine.", "mixed"),
      reply("D", "I’ll show you a text, and you’ll see it’s impossible to keep any objection after reading it. If you do, it must be bad faith.", "explain-grace", "I’m still on my guard. You’re already saying any disagreement will be judged before we’ve even read the text.", "Anticipating and discrediting disagreement prevents free examination. Reading a text does not imply automatic belief.", "risky"),
    ],
  },
  "protect-privacy": {
    stage: 4, repair: true, title: "Keep his words confidential", reference: "1 Peter 3:15–16",
    cue: "Marc wonders what you might tell others about this conversation.",
    line: "I’m still on my guard. If I agree to read with you, will you tell your group I’m converting? I want control over what I share.",
    choices: [
      reply("A", "I’ll say you’re moving closer to our faith without giving all the details. It would only encourage the group, so it’s not really speaking for you.", "accept-disagreement", "I feel betrayed. Even without details, you’d announce a change in my beliefs that I haven’t expressed.", "An encouraging intention does not grant permission to assign someone a belief or share their exploration without consent.", "risky"),
      reply("B", "I won’t give your name, but I’ll include enough details for our friends to know who it is. That will be a good compromise.", "accept-disagreement", "I’m still worried. Removing my name doesn’t protect my words if everyone can recognize me.", "Confidentiality also depends on identifying details, not just omitting a name.", "risky", "worried"),
      reply("C", "I won’t present reading together as a conversion. I won’t share our conversation without your consent; if you want to tell someone, you’ll choose what to say.", "summit", "I feel reassured. I can consider reading without fearing it will become a public testimony without my knowledge.", "This distinguishes exploration from belief and lets Marc control how his experience is shared."),
      reply("D", "I won’t tell anyone, and I’ll ask you never to mention this meeting either. It’s better if everything stays permanently secret.", "accept-disagreement", "I’m still puzzled. I want to choose what I share, not be forced to hide our conversation from people close to me.", "Respecting confidentiality does not require imposing secrecy. Marc’s freedom includes being able to talk about it.", "mixed"),
    ],
  },
  "accept-disagreement": {
    stage: 4, repair: true, title: "Welcome a different response", reference: "1 Peter 3:15–16",
    cue: "Marc checks that another meeting does not depend on guaranteed agreement.",
    line: "I’m not convinced yet. Suppose we read together and I still disagree: will you still be available to talk without starting to push me again?",
    choices: [
      reply("A", "I’ll stay available, but I’ll keep asking the same question until you agree. If we persevere, we’ll eventually reach the expected answer.", "protect-privacy", "I feel pressured. You’re describing repeated demands for agreement, not real room for disagreement.", "Persevering in a relationship differs from repeatedly applying pressure to obtain a predetermined answer.", "risky"),
      reply("B", "We can stay friends, but I’ll refuse all further questions about Jesus. If you disagree after one reading, there’s nothing left to examine.", "protect-privacy", "I’m still disappointed. I might need more than one reading and still have questions without wanting to end the discussion.", "Accepting disagreement does not require ending all exploration. People understand at different paces.", "mixed", "disappointed"),
      reply("C", "I’ll ask you to say you agree in front of our group anyway. You can keep your reservations private so you don’t discourage others.", "protect-privacy", "I feel pressured. You’re asking me to say something publicly that I don’t believe.", "An expected statement to protect the group respects neither the person’s honesty nor their freedom.", "risky"),
      reply("D", "Yes. I can explain why I believe, listen to what you question, and respect a break. If you’d like, let’s start with one account; you don’t have to promise agreement to read it.", "summit", "I feel confident about trying this reading. I know my questions can stay open and I can ask for a break.", "This combines clearly expressed conviction with genuine freedom to examine and disagree."),
    ],
  },
  "repair-impact": {
    stage: 4, repair: true, recovery: true, title: "Repair without defending yourself", reference: "James 1:19",
    cue: "After several missteps, Marc wants to see what will actually change in the way you speak.",
    line: "I’m still hurt despite your good intentions. If I say a sentence pressures me, can you take it back without immediately explaining that I misunderstood it?",
    choices: [
      reply("A", "Yes. I can acknowledge the effect of my words, take the sentence back, and ask what hurt you. You don’t have to defend my good intentions before I listen.", "repair-boundary", "I feel more heard. A specific correction would help me more than another explanation of your intentions.", "This takes responsibility for the impact of words and gives Marc a practical way to flag a problem."),
      reply("B", "I’m willing to apologize, but first you must admit you’re especially sensitive about this. Otherwise my apology wouldn’t be fair to me.", "repair-boundary", "I feel judged. You’re making my reaction the main problem again when I’m talking about your words.", "Making an apology conditional on judging someone’s sensitivity shifts responsibility instead of acknowledging impact.", "risky", "hurt"),
      reply("C", "I’ll take back everything I said about Jesus so I don’t upset you anymore. We can just pretend this conversation never happened.", "repair-patience", "I’m still puzzled. I’m asking you to correct the pressure, not erase what you believe or deny our conversation.", "Repair needs to address the specific problem; erasing every conviction does not replace clarification.", "mixed"),
      reply("D", "I’ll keep the same words but say them with a smile. Then you’ll understand better that I’m not trying to pressure you.", "repair-boundary", "I’m still on my guard. A smile doesn’t change a request that gives me no way to refuse.", "A warm tone does not make a proposal freely chosen when its conditions remain coercive.", "risky"),
    ],
  },
  "repair-boundary": {
    stage: 4, repair: true, recovery: true, title: "Respect a concrete boundary", reference: "1 Peter 3:15–16",
    cue: "Marc suggests a limited framework to check that he can safely resume the conversation.",
    line: "I’m still cautious. I can talk for ten more minutes, but I won’t join in a prayer today. Can you accept both boundaries without trying to negotiate them?",
    choices: [
      reply("A", "Ten minutes is fine, but we’ll use the last one for a very short prayer. It’s not really crossing your boundary if it only takes a moment.", "repair-patience", "I feel pressured. You accept one boundary and immediately work around the other.", "Respect does not depend on duration: an explicit boundary still applies to a brief proposal.", "risky"),
      reply("B", "I’ll present everything I planned for an hour in ten minutes. You can ask questions another time after hearing it all.", "repair-patience", "I’m still puzzled. You may respect the time limit, but you’re not really letting me take part in the conversation.", "Respecting available time also means adapting the content and preserving room for the other person to speak.", "mixed"),
      reply("C", "Yes. No prayer today, and we’ll stop in ten minutes. Let’s choose just one question to explore together; we don’t need to cover everything now.", "repair-understanding", "I feel reassured. You take both my boundaries seriously and let me choose what matters for the immediate next step.", "This makes the framework verifiable, limits content, and gives Marc an active role again."),
      reply("D", "I can’t agree to talk about Jesus if you already refuse to pray. You’ll have to change that condition before we continue.", "repair-impact", "I feel pressured. You’re making my right to ask questions depend on a religious step I don’t want to take.", "A religious practice should not become an imposed prerequisite for an exploratory conversation.", "risky"),
    ],
  },
  "repair-understanding": {
    stage: 4, repair: true, recovery: true, title: "Check what has been understood", reference: "James 1:19 · Ephesians 2:8–9",
    cue: "Marc offers to restate the message without that being taken as agreement.",
    line: "I’m still cautious, but let me check: you believe forgiveness is a gift connected to Jesus, not a reward for joining your group. If I’ve understood that, can you acknowledge it without saying I already believe?",
    choices: [
      reply("A", "If you can restate it that clearly, I’ll consider you a believer already. We don’t need to wait for you to say it yourself.", "repair-patience", "I feel pressured. Understanding your claim doesn’t mean sharing it yet; that’s exactly the distinction I wanted to protect.", "Understanding a proposition is not the same as accepting it. Confusing them takes away Marc’s control over his response.", "risky"),
      reply("B", "Yes, you’ve understood that distinction. I won’t treat it as agreement; you can still explore Jesus’ role and express what troubles you.", "restore-invitation", "I feel understood. I can grow in understanding without having a belief assigned to me at every step.", "This acknowledges real progress in understanding while distinguishing it from a personal decision."),
      reply("C", "You’ve almost understood, but I’d rather you repeated my exact words. Restating it yourself might make our differences too visible.", "repair-impact", "I’m still puzzled. Repeating your sentence wouldn’t necessarily show better what I understood in my own words.", "Restating helps check meaning; requiring word-for-word repetition can hide misunderstandings.", "mixed"),
      reply("D", "We don’t need to check what you understood. If the atmosphere has become more pleasant, the message is clear enough.", "repair-patience", "I’m still worried. We can be calmer and still misunderstand each other on the substance.", "Relational calm is valuable, but it does not replace checking what was understood.", "mixed", "worried"),
    ],
  },
  "repair-patience": {
    stage: 4, repair: true, recovery: true, title: "Let trust take time", reference: "1 Peter 3:15–16",
    cue: "Marc acknowledges recent efforts without pretending the earlier missteps have disappeared.",
    line: "I’m still on my guard. You’re making an effort, but my trust doesn’t return all at once. Can you suggest a small step without demanding I say everything is fine?",
    choices: [
      reply("A", "After my apologies, you should trust me completely now. Continuing to mention what hurt you would stop us moving forward.", "repair-impact", "I feel pressured. Your apologies have become a reason to demand a feeling I don’t have yet.", "An apology does not create a debt of immediate trust. A relationship also rebuilds through consistent actions over time.", "risky"),
      reply("B", "I’ll wait until you feel completely reassured before answering any question. We’ll have nothing to explore until your trust is perfect.", "repair-boundary", "I’m still puzzled. I’d actually like to ask a small question while that trust is rebuilding.", "Waiting for perfect trust can block the small exchanges that would help rebuild it gradually.", "mixed"),
      reply("C", "I suggest telling others our relationship is repaired. That will help both of us behave as if it were true afterward.", "repair-impact", "I’m still worried. I don’t want to make a public statement to try to produce trust I don’t feel yet.", "A public performance of reconciliation does not replace practical repair.", "risky", "worried"),
      reply("D", "We can choose a short reading about Jesus and one question. You can say what remains difficult and then decide whether to continue, without having to declare everything repaired.", "summit", "That small step reassures me. I can try the reading and stay honest about what still needs time.", "This offers a limited, freely chosen action. It imposes neither a declaration of trust nor an immediate spiritual outcome."),
    ],
  },
};

export const pilotEnrichmentFeelings = Object.fromEntries(Object.entries(pilotEnrichment).map(([id, node]) => [id, Object.fromEntries(node.choices.map(choice => [choice.id, choice.feeling]))]));

// Only substitute an already encountered detour. The four-question direct route
// and each scene's first arrival keep their authored order and meaning.
export const pilotSceneFamilies = [
  ["repair-objection", "listen-objection", "name-the-harm", "separate-causes"],
  ["repair-presence", "care-presence", "offer-presence", "honest-hope"],
  ["repair-gospel", "clarify-gospel", "explain-grace", "examine-claim"],
  ["repair-invitation", "freedom-invitation", "protect-privacy", "accept-disagreement"],
  ["restore-listening", "restore-trust", "restore-invitation", "repair-impact", "repair-boundary", "repair-understanding", "repair-patience"],
];

export function nextUnseenPilotScene(target, history) {
  const family = pilotSceneFamilies.find(ids => ids.includes(target));
  if (!family || !history.some(entry => entry.nodeId === target)) return target;
  const alternatives = family.filter(id => id !== history.at(-1)?.nodeId);
  const unseen = alternatives.find(id => !history.some(entry => entry.nodeId === id));
  if (unseen) return unseen;
  // Finite authored scenes: after exhausting a family, revisit the least recent
  // one explicitly, rather than alternating the same pair of menus.
  return alternatives.reduce((oldest, id) => history.findLastIndex(entry => entry.nodeId === id) < history.findLastIndex(entry => entry.nodeId === oldest) ? id : oldest);
}
