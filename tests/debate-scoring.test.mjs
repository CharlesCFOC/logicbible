import test from 'node:test';
import assert from 'node:assert/strict';
import { confidenceScoringRows, getConfidenceScoringInstruction, normalizeConfidenceChange } from '../lib/ai/debate-scoring.js';

test('all 17 tiers have descriptions for the four difficulties', () => {
  assert.deepEqual(confidenceScoringRows.map(row => row.points), Array.from({ length: 17 }, (_, i) => 8 - i));
  for (const row of confidenceScoringRows) {
    assert.equal(row.descriptions.length, 4);
    for (const description of row.descriptions) assert.ok(description.length > 0);
  }
});

test('every evaluator uses the descriptions shown in its table column', () => {
  for (const [index, difficulty] of ['Beginner', 'Intermediate', 'Advanced', 'Hostile'].entries()) {
    const instruction = getConfidenceScoringInstruction(difficulty);
    for (const row of confidenceScoringRows) assert.ok(instruction.includes(`${row.points}: ${row.descriptions[index]}`));
  }
});

test('clarification and uncertainty cannot cause a loss', () => {
  for (const difficulty of ['Beginner', 'Intermediate', 'Advanced', 'Hostile']) {
    assert.equal(normalizeConfidenceChange({ change: -8, responseType: 'clarification', usefulClarification: true }, difficulty), 1);
    assert.equal(normalizeConfidenceChange({ change: -8, responseType: 'clarification', repeatedClarification: true }, difficulty), 0);
    assert.equal(normalizeConfidenceChange({ change: -8, responseType: 'uncertainty' }, difficulty), 0);
  }
  assert.equal(normalizeConfidenceChange({ change: -8, responseType: 'clarification' }, 'Beginner'), 1);
  assert.equal(normalizeConfidenceChange({ change: -8, responseType: 'clarification' }, 'Advanced'), 0);
});

test('severe deductions require a previous correction; all levels can earn +8', () => {
  for (const difficulty of ['Beginner', 'Intermediate', 'Advanced', 'Hostile']) {
    assert.equal(normalizeConfidenceChange({ change: -8 }, difficulty), -5);
    assert.equal(normalizeConfidenceChange({ change: -8, previouslyCorrected: true }, difficulty), -8);
    assert.equal(normalizeConfidenceChange({ change: 8 }, difficulty), 8);
    assert.equal(normalizeConfidenceChange({ change: 100 }, difficulty), 8);
    assert.equal(normalizeConfidenceChange({ change: 'invalid' }, difficulty), 0);
  }
});
