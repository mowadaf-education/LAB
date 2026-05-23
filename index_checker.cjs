const fs = require('fs');

const file = 'src/pages/Chemicals.tsx';
const content = fs.readFileSync(file, 'utf-8');

const returnStr = '  return (\n';
const startMarker = "export default function Chemicals({ isNested = false }: { isNested?: boolean }) {\n";
const idxStart = content.indexOf(startMarker) + startMarker.length;
const idxEnd = content.indexOf(returnStr, idxStart);

const logic = content.substring(idxStart, idxEnd);
console.log(logic.substring(0, 100));
console.log("----------------------");
console.log(logic.substring(logic.length - 100));
