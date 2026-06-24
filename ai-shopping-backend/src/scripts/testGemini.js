import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Accept key as CLI argument OR fall back to .env
const key = process.argv[2] || process.env.GEMINI_API_KEY;

if (!key || key === 'your_gemini_api_key_here') {
  console.error(' No key provided. Pass it as: node src/scripts/testGemini.js YOUR_KEY_HERE');
  process.exit(1);
}

console.log('Key prefix:', key.substring(0, 15) + '...');
console.log('Key length:', key.length);
console.log('');

const genAI = new GoogleGenerativeAI(key);

const models = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
];

for (const modelName of models) {
  try {
    process.stdout.write(`Testing ${modelName} ... `);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Reply with only the word: WORKING');
    console.log('', result.response.text().trim());
    console.log(`\n Working key! Set this in your .env:\nGEMINI_MODEL=${modelName}`);
    break;
  } catch (err) {
    const status = err.status || '???';
    const short = err.message?.match(/\[(\d+)[^\]]*\]\s*([^\n*]+)/)?.[0] || err.message?.substring(0, 120);
    console.log(` HTTP ${status} — ${short}`);
  }
}
