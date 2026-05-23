const fs = require('fs');
const file = 'src/services/geminiService.ts';
let content = fs.readFileSync(file, 'utf-8');

content = content.replace(
  "const contents = messages.map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${m.parts}`).join('\\n');",
  "const contents = messages.slice(-10).map(m => `${m.role === 'user' ? 'User' : 'Model'}: ${sanitizeInput(m.parts, 2000)}`).join('\\n');"
);

fs.writeFileSync(file, content);
console.log('Done fixing chatWithLabAssistant messages map');
