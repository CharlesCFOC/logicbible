import React, { useState } from "react";

const debateThemes = [
  {
    id: "islam",
    label: "Islam",
    questions: [
      "How should Christians understand the differences between the Bible and the Quran?",
      "Who is Jesus according to the Bible and according to Islam?",
      "Can the Trinity be understood as biblical monotheism?",
      "Was Jesus crucified, and why does it matter?",
      "How should we evaluate claims that the Bible was corrupted?",
      "What does the Bible teach about the identity of the Messiah?",
      "Can salvation be grounded in both faith and works?",
      "What do Christians mean when they call Jesus the Son of God?",
      "How reliable are the earliest witnesses to Jesus?",
      "What is the role of prophecy in comparing the Bible and the Quran?",
      "How should Christians respond to questions about biblical violence?",
      "Does the Quran confirm or correct the message of the Bible?",
      "What does forgiveness reveal about the character of God?",
      "How should Christians explain the resurrection to a Muslim friend?",
      "Can Christians and Muslims use the word God while meaning different things?",
    ],
  },
  {
    id: "jehovahs-witnesses",
    label: "Jehovah's Witnesses",
    questions: [
      "What does the Bible teach about the identity of Jesus?",
      "Is the Holy Spirit a person or only a force?",
      "How should Christians understand the Trinity?",
      "What does John 1:1 communicate about the Word?",
      "Who alone is worthy of worship according to Scripture?",
      "How should we understand the deity of Christ in the Old Testament?",
      "What does the resurrection of Jesus say about his nature?",
      "Is the New World Translation consistent with the earliest manuscripts?",
      "What does the Bible teach about salvation and the 144,000?",
      "Should Christians pray to Jesus?",
      "What does the Bible mean by eternal life?",
      "How should Christians respond to the claim that Michael the archangel is Jesus?",
      "What authority should guide Christian doctrine?",
      "How should we interpret passages where Jesus is subject to the Father?",
      "What does the Bible teach about the visible and invisible church?",
    ],
  },
  {
    id: "mormonism",
    label: "Mormonism",
    questions: [
      "Who is God according to the Bible?",
      "How should Christians understand the nature of the Trinity?",
      "Is the Bible sufficient for Christian doctrine?",
      "What authority do later scriptures have beside the Bible?",
      "Who is Jesus according to the Bible and the Book of Mormon?",
      "What does salvation mean, and is it earned or received?",
      "Can human beings become gods?",
      "How should Christians evaluate the reliability of prophetic revelation?",
      "What does the Bible teach about life before birth?",
      "How should we understand baptism for the dead?",
      "What does grace accomplish in the life of a believer?",
      "How should Christians respond to the claim that God was once a man?",
      "What makes a text genuinely inspired by God?",
      "How should Christians compare biblical covenants with temple practices?",
      "What does the resurrection promise to every believer?",
    ],
  },
  {
    id: "unbeliever",
    label: "Unbeliever",
    questions: [
      "Can belief in God be rational?",
      "How can a good God allow suffering?",
      "Does science make faith unnecessary?",
      "What is the evidence for the resurrection of Jesus?",
      "Can morality exist without God?",
      "Why trust the Bible as a historical document?",
      "How should Christians respond to apparent contradictions in Scripture?",
      "Does evolution rule out a Creator?",
      "What does human consciousness reveal about reality?",
      "Is religious experience evidence for God?",
      "How can Christians claim truth while religions disagree?",
      "What does Christianity offer that secular humanism does not?",
      "Can objective meaning exist in a material universe?",
      "How should Christians answer the problem of divine hiddenness?",
      "What would count as evidence that Christianity is true?",
    ],
  },
];

const generalQuestion = "What is the strongest reason to believe the Christian message is true?";

export function ApologeticsDebatePage() {
  const [themeId, setThemeId] = useState("");
  const [question, setQuestion] = useState("");
  const theme = debateThemes.find((item) => item.id === themeId);

  const goBack = () => window.appNavigate?.("apologetics");
  const questions = theme ? [generalQuestion, ...theme.questions] : [];

  return (
    <div className="apologetics-debate-content">
      <header className="apologetics-debate-header">
        <button className="apologetics-debate-back" type="button" onClick={goBack} aria-label="Back to Apologetics">←</button>
        <div>
          <span className="eyebrow">Debat room</span>
          <h1>Program your room</h1>
          <p>Choose a theme and a central question to guide the conversation.</p>
        </div>
      </header>

      <section className="apologetics-debate-step" aria-labelledby="debate-theme-title">
        <div className="apologetics-debate-step-heading">
          <span>01</span>
          <div>
            <h2 id="debate-theme-title">Choose a debate theme</h2>
            <p>Select the perspective you want to explore.</p>
          </div>
        </div>
        <div className="apologetics-debate-theme-list">
          {debateThemes.map((item) => (
            <button className={themeId === item.id ? "is-selected" : ""} key={item.id} type="button" onClick={() => { setThemeId(item.id); setQuestion(""); }} aria-pressed={themeId === item.id}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {theme ? (
        <section className="apologetics-debate-step" aria-labelledby="debate-question-title">
          <div className="apologetics-debate-step-heading">
            <span>02</span>
            <div>
              <h2 id="debate-question-title">Choose the central question</h2>
              <p>General is always available, or pick a focused question for {theme.label}.</p>
            </div>
          </div>
          <div className="apologetics-debate-question-list">
            {questions.map((item, index) => (
              <button className={question === item ? "is-selected" : ""} key={item} type="button" onClick={() => setQuestion(item)} aria-pressed={question === item}>
                <span>{index === 0 ? "General" : `Question ${index}`}</span>
                <strong>{item}</strong>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <p className="apologetics-debate-empty">Choose a theme to unlock the debate questions.</p>
      )}
    </div>
  );
}
