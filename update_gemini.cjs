const fs = require('fs');
const file = 'src/services/geminiService.ts';
let content = fs.readFileSync(file, 'utf-8');

// Add sanitizeInput function
const sanitizeFunc = `
function sanitizeInput(input: string, maxLength: number = 1000): string {
  if (!input) return "";
  return input.slice(0, maxLength).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
`;

content = content.replace("async function callGeminiAPI(reqBody: any) {", sanitizeFunc + "\nasync function callGeminiAPI(reqBody: any) {");

// Update getChemicalIntelligence
content = content.replace(
  'Provide detailed chemical information for: "${name}".',
  'Provide detailed chemical information for: \\`<input>\\${sanitizeInput(name, 200)}</input>\\`.'
);

// Update analyzeChemicalStorage
content = content.replace(
  'const compactInventory = inventory.map(c => ({',
  'const compactInventory = inventory.slice(0, 150).map(c => ({' 
);

content = content.replace(
  'Inventory Items: \\${JSON.stringify(compactInventory)}',
  'Inventory Items: \\n<data>\\${JSON.stringify(compactInventory)}</data>'
);

// Update getEquipmentIntelligence
content = content.replace(
  'Items: \\${JSON.stringify(items)}',
  'Items: \\n<data>\\${JSON.stringify(items.slice(0, 50).map((i: any) => ({id: i.id, name: sanitizeInput(i.name, 200)})))}</data>'
);

// Update analyzeMaintenance
content = content.replace(
  'const compactLogs = logs.map(l => ({',
  'const compactLogs = logs.slice(0, 100).map((l: any) => ({'
);

content = content.replace(
  'Logs: \\${JSON.stringify(compactLogs)}',
  'Logs: \\n<data>\\${JSON.stringify(compactLogs)}</data>'
);

// Update findSmartForm
content = content.replace(
  'User query: "${query}"',
  'User query: "${sanitizeInput(query, 500)}"'
);

// Update analyzePedagogicalTracking
content = content.replace(
  'const compactEntries = entries.map(e => ({',
  'const compactEntries = entries.slice(0, 100).map((e: any) => ({'
);

content = content.replace(
  'Tracking Data: \\${JSON.stringify(compactEntries)}',
  'Tracking Data: \\n<data>\\${JSON.stringify(compactEntries)}</data>'
);

// Update analyzeIncident
content = content.replace(
  'Incident: \\${JSON.stringify(incident)}',
  'Incident: \\n<data>\\${JSON.stringify({ ...incident, description: sanitizeInput(incident.description, 2000) })}</data>'
);

// Update analyzeExperiment
content = content.replace(
  'Experiment Data: \\${JSON.stringify(expData)}',
  'Experiment Data: \\n<data>\\${JSON.stringify({ ...expData, notes: sanitizeInput(expData.notes, 2000) })}</data>'
);

// Update chatWithLabAssistant
content = content.replace(
  'const fullPrompt = `${systemPrompt}\\n\\nUser Chat:\\n${messages.map(m => `${m.role}: ${m.parts}`).join(\'\\n\')}`;',
  'const limitedMessages = messages.slice(-10); // keep only last 10 messages\\n    const fullPrompt = `${systemPrompt}\\n\\nUser Chat:\\n${limitedMessages.map(m => `${m.role}: ${sanitizeInput(m.parts, 2000)}`).join(\'\\n\')}`;'
);

fs.writeFileSync(file, content);
console.log('Done updating geminiService.ts');
