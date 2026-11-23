import test from 'node:test';
import assert from 'node:assert/strict';
import {replaceCoursePassage} from '../src/shared/course-passage-edit.js';
test('inline edits update the source and preserve other cards and activities',()=>{
 const course={sourceText:'First.\n\nSecond.\n\nLast.',passages:['First.\n\n','Second.\n\n','Last.'],activities:[{afterPage:1,prompt:'Question'}]};
 const edited=replaceCoursePassage(course,1,'Changed.\n\nNew paragraph.');
 assert.equal(edited.sourceText,'First.\n\nChanged.\n\nNew paragraph.\n\nLast.');
 assert.deepEqual(edited.passages,['First.\n\n','Changed.\n\nNew paragraph.\n\n','Last.']);
 assert.equal(edited.activities,course.activities);
 assert.equal(course.passages[1],'Second.\n\n');
});
