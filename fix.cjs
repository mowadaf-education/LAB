const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Chemicals.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

content = content.replace(/<AnimatePresence>\s*\{\/\* Add \/ Edit Modal \*\/\}/g, '{/* Add / Edit Modal */}');
content = content.replace(/<AnimatePresence>\s*\{\/\* Bulk Update Confirmation Modal \*\/\}/g, '{/* Bulk Update Confirmation Modal */}');
content = content.replace(/<AnimatePresence>\s*\{\/\* Review Update Modal \*\/\}/g, '{/* Review Update Modal */}');

fs.writeFileSync(filePath, content);
console.log('Fixed tags in Chemicals.tsx');
