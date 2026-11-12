const reply = (id, text, next, reaction, review, quality = "solid") => ({ id, text, next, reaction, review, quality });

export const pilotDetours = {
  "listen-objection": {
    stage: 1, repair: true, title: "Hear his real question", reference: "James 1:19",
    cue: "Marc returns to what hurt him: his question seems to have been brushed aside.",
    line: "I don’t feel understood. Can you restate my question about disasters without explaining it as my lack of faith?",
    choices: [
      reply("A", "You want to know why you don’t have enough faith to accept a disaster. It’s mainly a problem of trusting God.", "repair-objection", "I feel judged. My question is about the victims’ suffering, not what might be missing from my faith.", "This restatement attributes a problem to Marc that he never expressed and creates more distance.", "risky"),
      reply("B", "You’re asking an important question. But believers have plenty too; we can move on to something less difficult.", "repair-objection", "I’m still frustrated. Acknowledging that my question matters isn’t enough if we immediately abandon it.", "The verbal welcome is incomplete: changing the subject does not address Marc’s specific concern.", "mixed"),
      reply("C", "You distinguish human actions from natural disasters and ask why a good God allows their suffering. I don’t want to blame the victims or judge you.", "presence", "I feel understood. That is my question. If you don’t have an explanation for every tragedy, what can you tell me about Jesus facing pain?", "This faithfully restates the objection and acknowledges Marc’s dignity. It opens a way forward without claiming to solve the whole problem."),
      reply("D", "You’re looking for proof that God was wrong. If you want to continue, you should first stop asking the question that way.", "repair-objection", "I’m still on my guard. You’re assuming hostility when I’m trying to understand how you see the victims.", "Assuming hostile intent shuts down listening. Marc needs to be able to express his objection before it is answered.", "risky"),
    ],
  },
  "care-presence": {
    stage: 2, repair: true, title: "Make room for tears", reference: "John 11:32–36",
    cue: "Marc is thinking of someone grieving and looking for words they could receive.",
    line: "I’m still worried. If a believing friend loses someone and cries, what would you actually tell her about Jesus?",
    choices: [
      reply("A", "I’d tell her to be strong so she doesn’t discourage other believers. She can talk about her grief when she’s alone.", "repair-presence", "I feel hurt for her. Why should she hide her sadness to protect the image of believers?", "This puts another burden on someone grieving and treats her tears as an inconvenience.", "risky"),
      reply("B", "I’d tell her she can cry and I can stay beside her. In the Gospel, Jesus also weeps in the face of grief; his presence does not deny the pain.", "gospel", "I feel reassured. You’re giving her room to suffer. Now I want to understand how Jesus’ death and resurrection ground your hope.", "This describes practical support and connects it to Jesus’ story without promising protection from every hardship."),
      reply("C", "I’d explain that God will certainly replace what she lost with something better, even if it takes a long time.", "repair-presence", "I’m still worried. How could you guarantee a replacement that makes up for losing someone she loves?", "Promising certain compensation goes beyond what we can tell someone grieving.", "risky"),
      reply("D", "I’d give her a list of verses and let her study them before coming back to talk about her feelings.", "repair-presence", "I’m still puzzled. The texts may matter, but why should she have to study them before being heard?", "Resources can accompany attentive support; they should not become a prerequisite for being heard.", "mixed"),
    ],
  },
  "clarify-gospel": {
    stage: 3, repair: true, title: "Distinguish the gift from the response", reference: "Ephesians 2:8–9",
    cue: "Marc wants to distinguish what you believe from what you are asking of him.",
    line: "I’m still puzzled. Are you asking me to earn a place, join your group, or receive something from God?",
    choices: [
      reply("A", "I’m talking about forgiveness God offers because of Jesus, received through faith. Doing good and joining a community are not the price of that forgiveness.", "invitation", "That’s clearer. I can better distinguish the gift you’re describing from the personal response it involves. How do you suggest I explore it?", "This distinguishes grace, the response of faith, and community life without making community membership a price for forgiveness."),
      reply("B", "First you need to join our group and show you can follow its customs. We’ll explain Jesus’ role afterward.", "repair-gospel", "I’m still on my guard. You’re putting group membership ahead of understanding Jesus’ message again.", "Belonging does not replace explaining the message. Marc wants to understand before considering a personal response.", "risky"),
      reply("C", "Those differences don’t really matter. If you feel something positive during our conversation, that’s already the same as believing.", "repair-gospel", "I’m not convinced. A pleasant feeling still doesn’t tell me what you claim about God and Jesus.", "Positive feelings about the conversation should not be confused with understanding or accepting the message.", "mixed"),
      reply("D", "God offers forgiveness to people who have already changed enough. Start by proving you’re serious, and we’ll see afterward.", "repair-gospel", "I’m still worried. That still sounds like earning forgiveness without knowing what level would be enough.", "This keeps a threshold of prior merit instead of clearly presenting the gift of grace.", "risky"),
    ],
  },
  "freedom-invitation": {
    stage: 4, repair: true, title: "Respect his freedom", reference: "1 Peter 3:15–16",
    cue: "Marc wants to know whether the relationship can continue without you assigning him a belief.",
    line: "I feel pressured. If I keep my objections or don’t share your faith, will you still respect what I say?",
    choices: [
      reply("A", "I’ll respect you, but I’ll tell others our conversation was a conversion to encourage them. We can clarify things later.", "repair-invitation", "I feel betrayed. You wouldn’t be respecting my words if you announced a decision I haven’t made.", "Reporting a belief someone has not expressed damages trust and disregards their consent.", "risky"),
      reply("B", "You can keep your objections for now, but at our next meeting you’ll finally have to give me the answer I’m waiting for.", "repair-invitation", "I still feel pressured. You’re simply postponing the moment when you demand a particular answer from me.", "A delay does not remove pressure when the outcome has already been imposed.", "risky"),
      reply("C", "I respect your questions. So I’ll give you a document and we’ll avoid the subject from now on to prevent further disagreement.", "repair-invitation", "I’m still disappointed. Respecting my questions could also mean being willing to discuss them together, even without agreement.", "This acknowledges a boundary but closes a discussion Marc is still willing to continue.", "mixed"),
      reply("D", "Yes. I won’t speak for you, and I’ll respect your disagreement. If you’d like, we can read an account about Jesus and discuss your questions without an imposed decision.", "summit", "I feel reassured. We can read that account together; I’ll keep my questions and tell you freely what I think.", "The invitation distinguishes listening, exploring the message, and possible personal belief. It allows genuine freedom to respond."),
    ],
  },
  "restore-listening": {
    stage: 4, repair: true, recovery: true, title: "Take time to listen again", reference: "James 1:19",
    cue: "Earlier exchanges have left Marc cautious. He agrees to explain what hurt him.",
    line: "I’m still cautious after our discussion. Before planning what comes next, can you let me explain what hurt me without immediately trying to convince me?",
    choices: [
      reply("A", "We’ve already spent enough time on your reservations. Now I’d rather you hear my explanation to the end without interrupting.", "restore-trust", "I feel brushed aside again. I’d like to know whether my questions really have a place in this discussion.", "This prioritizes the presentation and repeats the listening problem that prevents trust from rebuilding.", "risky"),
      reply("B", "Yes. I’m listening. I want to understand the effect my words had on you; then I’ll restate what I understood, and you can correct me.", "restore-trust", "I feel more heard. What hurt was feeling that my questions or pain came second to your explanation. I need room to express them.", "This offers listening Marc can verify: he can speak, then correct how his words are understood."),
      reply("C", "I’m sorry you took it badly. I meant to help; you can acknowledge that my intentions should be enough.", "restore-trust", "I’m still hurt. Your intentions matter, but they don’t erase the effect of your words. Can you hear that effect too?", "This mentions intention without sufficiently acknowledging the impact of the words.", "mixed"),
      reply("D", "I’ll gladly listen if you first promise to stop questioning what I believe about Jesus.", "restore-invitation", "I’m still on my guard. Being allowed to speak only if I give up my objections wouldn’t let me be honest.", "Listening on condition that objections are abandoned does not let Marc express his thoughts freely.", "risky"),
    ],
  },
  "restore-trust": {
    stage: 4, repair: true, recovery: true, title: "Put listening into practice", reference: "1 Peter 3:15–16",
    cue: "Marc wants a concrete sign that his words will be taken seriously as the conversation continues.",
    line: "I don’t just want to hear that you respect me. If one of my questions bothers you or you don’t know the answer, how will we continue?",
    choices: [
      reply("A", "I’ll acknowledge what I don’t know. We can explore together, leave a question open, and take a break if you need one.", "restore-invitation", "I feel reassured. Being able to leave a question open and take time to explore lets me consider what comes next more freely.", "This offers practical respect and honesty instead of asking for immediate trust without a reason."),
      reply("B", "You’ll have to trust me even if I can’t answer. Continuing to ask the same question would show you refuse to move forward.", "restore-listening", "I feel pressured. You’re turning an unresolved question into another criticism of my attitude.", "This places the problem on Marc and makes progress conditional on abandoning his question.", "risky"),
      reply("C", "I’ll only choose questions I already know how to answer. We’ll leave the others aside to keep the discussion positive.", "restore-listening", "I’m still puzzled. Should a positive discussion exclude precisely what I find difficult?", "Selecting questions protects the presentation but leaves no real space for the other person’s concern.", "mixed"),
      reply("D", "I’ll ask someone else to convince you. If several of us answer, you’ll surely agree eventually.", "restore-invitation", "I’m still on my guard. I want an honest conversation, not to face several people waiting for me to agree.", "Bringing in others as a way to obtain agreement increases pressure instead of clarifying the message.", "risky"),
    ],
  },
  "restore-invitation": {
    stage: 4, repair: true, recovery: true, title: "Choose a freely accepted next step", reference: "John 11:32–36 · 1 Peter 3:15–16",
    cue: "You can suggest a practical next step that respects Marc’s pace and questions.",
    line: "I want to explore what you believe without pretending to be convinced. What next step do you suggest while leaving me the choice?",
    choices: [
      reply("A", "Read the passage and we can say you’ve chosen to believe. Presenting it that way will be more encouraging for both of us.", "restore-listening", "I don’t agree. Reading a text would not authorize you to assign me a belief I haven’t expressed.", "This confuses exploration with belief and weakens trust again.", "risky"),
      reply("B", "I suggest setting your objections aside while we read. We’ll discuss only the parts that help us agree.", "restore-trust", "I’m still puzzled. My objections are part of my thinking; excluding them wouldn’t help me examine the text honestly.", "A practical next step remains incomplete if difficult questions have no place in it.", "mixed"),
      reply("C", "If you’d like, let’s read the account where Jesus meets people who are grieving. Then we’ll take your questions one at a time, and you’ll remain free to continue or stop.", "summit", "I feel confident about continuing. Let’s read it together, then talk about what I understand and the questions I still have.", "This connects the original topic to a specific text, with room for questions and genuine freedom to continue."),
      reply("D", "I suggest joining a gathering tomorrow where you’ll tell everyone how our conversation has changed your faith.", "restore-listening", "I feel pressured. You’re already asking for a public statement when I’m still trying to understand your faith.", "Expecting a public statement imposes a step that does not match Marc’s still exploratory position.", "risky"),
    ],
  },
};

export const pilotDetourRoutes = {
  objection: { B: "listen-objection" },
  "repair-objection": { A: "listen-objection", C: "listen-objection", D: "listen-objection" },
  presence: { C: "care-presence" },
  "repair-presence": { B: "care-presence", C: "care-presence", D: "care-presence" },
  gospel: { C: "clarify-gospel", D: "clarify-gospel" },
  "repair-gospel": { A: "clarify-gospel", B: "clarify-gospel", D: "clarify-gospel" },
  invitation: { B: "freedom-invitation" },
  "repair-invitation": { B: "freedom-invitation", C: "freedom-invitation", D: "freedom-invitation" },
};

export const pilotDetourFeelings = {
  "listen-objection": { A: "hurt", B: "unheard", C: "heard", D: "hurt" },
  "care-presence": { A: "hurt", B: "reassured", C: "worried", D: "uncertain" },
  "clarify-gospel": { A: "curious", B: "pressured", C: "uncertain", D: "worried" },
  "freedom-invitation": { A: "pressured", B: "pressured", C: "disappointed", D: "trusting" },
  "restore-listening": { A: "unheard", B: "heard", C: "hurt", D: "pressured" },
  "restore-trust": { A: "reassured", B: "pressured", C: "uncertain", D: "pressured" },
  "restore-invitation": { A: "pressured", B: "uncertain", C: "trusting", D: "pressured" },
};
