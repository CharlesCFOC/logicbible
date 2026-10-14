import test from "node:test";
import assert from "node:assert/strict";
import { generateChapterQuiz, validateChapterQuiz, validateQuizSource } from "../lib/bible/chapter-quiz.js";

const source = { reference: "Genesis 1", version: "KJV", verses: [{ number: 1, text: "In the beginning God created the heaven and the earth." }] };
const makeQuiz = () => ({ questions: Array.from({ length: 10 }, (_, i) => ({ question: `Question ${i + 1} ?`, options: ["Dieu", "Moïse", "David", "Paul"], correctAnswer: i % 4, explanation: "Le texte décrit la création.", verse: 1, quote: "God created" })) });

test("requires complete, bounded chapter input with distinct verse numbers", () => {
  assert.deepEqual(validateQuizSource(source), source);
  for (const verses of [[], [...source.verses, ...source.verses], [{ number: 0, text: "Text" }], [{ number: 1, text: "x".repeat(4001) }]]) {
    assert.throws(() => validateQuizSource({ ...source, verses }));
  }
});

test("accepts exactly ten questions with four unique choices and source evidence", () => {
  assert.equal(validateChapterQuiz(makeQuiz(), source).length, 10);
  const q = makeQuiz(); q.questions.pop(); assert.throws(() => validateChapterQuiz(q, source));
});

test("rejects duplicate answers, invalid correct indexes, duplicate questions and invented evidence", () => {
  for (const patch of [{ options: ["A", "a", "B", "C"] }, { correctAnswer: 4 }, { correctAnswer: "0" }, { verse: 2 }, { quote: "Moses created" }, { question: "Question 2 ?" }]) {
    const q = makeQuiz();Object.assign(q.questions[0], patch);
    assert.throws(() => validateChapterQuiz(q, source));
  }
});

test("retries malformed generated output once instead of returning broken questions", async () => {
  let calls = 0;
  const result = await generateChapterQuiz(source, async () => ({ text: ++calls === 1 ? "not JSON" : JSON.stringify(makeQuiz()) }));
  assert.equal(result.questions.length, 10);assert.equal(calls, 2);
});

test("does not repeat provider failures or silently accept a permanently invalid quiz", async () => {
  let calls = 0;
  await assert.rejects(generateChapterQuiz(source, async () => {calls++;throw Object.assign(new Error("Provider unavailable"), { status: 503 });}));
  assert.equal(calls, 1);
  await assert.rejects(generateChapterQuiz(source, async () => ({ text: JSON.stringify({ questions: [] }) })));
});
