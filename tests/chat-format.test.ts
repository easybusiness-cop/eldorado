import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatAiReply } from '../src/components/chat/formatAiReply.ts';

test('formats structured model JSON as readable markdown without losing fields', () => {
  const reply = formatAiReply(JSON.stringify({
    final_answer: 'The task is complete.',
    recommendations: ['Review the result', 'Run the tests'],
    code: 'const answer = 42;\nconsole.log(answer);',
  }));

  assert.match(reply, /\*\*Final Answer:\*\*/);
  assert.match(reply, /The task is complete\./);
  assert.match(reply, /- Review the result/);
  assert.match(reply, /```[\s\S]*const answer = 42;/);
});

test('preserves markdown code blocks and formats escaped plain-text line breaks', () => {
  const codeBlock = '```ts\nconst value = 1;\n```';
  assert.equal(formatAiReply(codeBlock), codeBlock);

  const reply = formatAiReply('First line\\nSecond line');
  assert.equal(reply, 'First line  \nSecond line');
});

test('leaves invalid JSON readable instead of partially transforming it', () => {
  const reply = '{not valid JSON';
  assert.equal(formatAiReply(reply), reply);
});
