import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSessionDocuments} from '../lib/server/session-documents.js';
const file = (fileName, text = 'Document') => ({fileName, mimeType:'', data:Buffer.from(text).toString('base64')});
test('mixed documents retain order and infer Android missing MIME types', () => {
 const result = validateSessionDocuments([file('cours.DOCX'), file('notes.txt'), file('photo.png'), file('slides.pptx')]);
 assert.deepEqual(result.map(f=>f.fileName), ['cours.DOCX','notes.txt','photo.png','slides.pptx']);
 assert.equal(result[0].mimeType,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 assert.equal(result[1].mimeType,'text/plain');
});
test('documents reject invalid formats, empty selections, excess counts and total bytes', () => {
 for(const docs of [[],[file('virus.exe')],Array.from({length:11},()=>file('a.txt')),[file('a.txt','x'.repeat(1300000)),file('b.txt','x'.repeat(1300000))],[{...file('a.txt'),data:'bad!'}]]) assert.throws(()=>validateSessionDocuments(docs));
});
