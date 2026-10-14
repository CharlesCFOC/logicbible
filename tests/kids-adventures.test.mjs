import test from "node:test";
import assert from "node:assert/strict";
import { kidsAdventures, kidsBooks, newAdventureProgress, readAdventureProgress, saveAdventureProgress } from "../src/react/kids-adventures-data.js";

const memory = () => {
  const data = new Map();
  return { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
};

test("malformed saved progress cannot break the adventure screen", () => {
  const storage = memory();
  for (const value of ["{broken", "null", '{"version":1,"stage":99}']) {
    storage.setItem("brother.kidsAdventure.v1.storm", value);
    assert.deepEqual(readAdventureProgress("storm", storage), newAdventureProgress());
  }
  storage.setItem("brother.kidsAdventure.v1.storm", JSON.stringify({ version: 1, stage: 2, question: -1, answers: { 0: 0, 1: 9, invalid: 2 }, order: [2, 2, 1, -1] }));
  const restored = readAdventureProgress("storm", storage);
  assert.equal(restored.question, 0);assert.deepEqual(restored.answers, { 0: 0 });assert.deepEqual(restored.order, [2, 1]);
});

test("both adventures keep independent progress and a resume pointer", () => {
  const storage = memory();
  saveAdventureProgress("storm", { ...newAdventureProgress(), stage: 1, scene: 2 }, storage);
  saveAdventureProgress("seeds", { ...newAdventureProgress(), stage: 2, question: 1 }, storage);
  assert.equal(readAdventureProgress("storm", storage).scene, 2);
  assert.equal(readAdventureProgress("seeds", storage).question, 1);
  assert.equal(storage.getItem("brother.kidsAdventure.last"), "seeds");
});

test("earned badges survive replay and unavailable storage does not block reading", () => {
  const storage = memory();
  saveAdventureProgress("storm", { ...newAdventureProgress(), completed: true }, storage);
  assert.equal(readAdventureProgress("storm", storage).completed, true);
  const denied = { getItem() { throw new Error("Unavailable"); }, setItem() { throw new Error("Unavailable"); } };
  assert.deepEqual(readAdventureProgress("storm", denied), newAdventureProgress());
  assert.doesNotThrow(() => saveAdventureProgress("storm", newAdventureProgress(), denied));
});

test("each curated story has three scenes, three unambiguous question choices and a three-event ordering game", () => {
  for (const a of kidsAdventures) {
    assert.equal(a.scenes.length, 3);assert.equal(a.questions.length, 3);assert.equal(a.order.length, 3);
    for (const q of a.questions) {
      assert.equal(q.choices.length, 3);assert.equal(new Set(q.choices.map(c => c[1])).size, 3);
      assert.ok(Number.isInteger(q.correct) && q.correct >= 0 && q.correct < 3);
    }
  }
});

test("book navigation includes four Genesis stories and preserves the existing Mark progress IDs", () => {
  assert.equal(new Set(kidsAdventures.map(a => a.id)).size, kidsAdventures.length);
  assert.equal(kidsAdventures.filter(a => a.bookId === "genesis").length, 4);
  assert.deepEqual(kidsAdventures.filter(a => a.bookId === "mark").map(a => a.id), ["storm", "seeds"]);
  for (const a of kidsAdventures) assert.ok(kidsBooks.some(b => b.id === a.bookId));
});
