import test from 'node:test';
import assert from 'node:assert/strict';
import {courseReadingLines} from '../src/shared/course-reading-lines.js';
const text=lines=>lines.map(parts=>parts.map(p=>p.text).join(''));
test('soft wraps join while original paragraphs and list markers remain',()=>{
 assert.deepEqual(text(courseReadingLines('One sentence\ncontinues here.\n\nNext paragraph.\n1. First item\ncontinues.\n2. Second item\n• Original bullet')),['One sentence continues here.','Next paragraph.','1. First item continues.','2. Second item','• Original bullet']);
});
test('nested parentheses survive joined line wraps',()=>{
 const parts=courseReadingLines('Faith (Ephesians\n2:1–10 (part 1)). End')[0];
 assert.equal(parts.filter(p=>p.parenthetical).map(p=>p.text).join(''),'(Ephesians 2:1–10 (part 1))');
 assert.equal(text([parts])[0],'Faith (Ephesians 2:1–10 (part 1)). End');
});
test('dates are highlighted in French, English and numeric forms without marking verse references',()=>{
 const parts=courseReadingLines('11th November 2026, 23 novembre 2026, 2026-11-23, 23/11/2026; Ephesians 2:1–10.')[0];
 assert.deepEqual(parts.filter(p=>p.date).map(p=>p.text),['11th November 2026','23 novembre 2026','2026-11-23','23/11/2026']);
});
