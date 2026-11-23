import test from 'node:test';
import assert from 'node:assert/strict';
import {courseReadingLines} from '../src/shared/course-reading-lines.js';
test('simple line breaks and paragraphs each produce separated reading blocks',()=>{
 const lines=courseReadingLines('Introduction\nPart 1\r\n\r\nPart 2');
 assert.deepEqual(lines.map(parts=>parts.map(p=>p.text).join('')),['Introduction','Part 1','Part 2']);
});
test('parentheses are highlighted including nested and multiline content',()=>{
 const lines=courseReadingLines('Faith (Ephesians\n2:1–10 (part 1)). End');
 assert.deepEqual(lines[0],[{text:'Faith ',parenthetical:false},{text:'(Ephesians',parenthetical:true}]);
 assert.deepEqual(lines[1],[{text:'2:1–10 (part 1))',parenthetical:true},{text:'. End',parenthetical:false}]);
});
