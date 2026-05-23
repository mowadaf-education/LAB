const fs = require('fs');

const file = 'src/pages/Chemicals.tsx';
const content = fs.readFileSync(file, 'utf-8');

const returnStr = '  return (\n';
const startMarker = "export default function Chemicals({ isNested = false }: { isNested?: boolean }) {\n";
const idxStart = content.indexOf(startMarker) + startMarker.length;
const idxEnd = content.indexOf(returnStr, idxStart);

const logic = content.substring(idxStart, idxEnd);

// Find all top-level declarations in logic string
const declarationsLineRegex = /^\s*(const|let) (\[?[a-zA-Z0-9_, \{\}]+\]?) = .*$/gm;
const functionsRegex = /^\s*const ([a-zA-Z0-9_]+) = (async )?\(.*\).*$/gm;

// Better regex for declarations
let vars = new Set();
let match;
const varDeclarations = /^\s*const (\[[^\]]+\]|\{[^\}]+\}|[a-zA-Z0-9_]+)\s*=/gm;
while ((match = varDeclarations.exec(logic)) !== null) {
  const dec = match[1];
  if (dec.startsWith('[')) {
    // Array destructuring, mostly state
    const inside = dec.substring(1, dec.length - 1).split(',').map(s => s.trim());
    inside.forEach(v => {
      if (v) vars.add(v);
    });
  } else if (dec.startsWith('{')) {
    // skip object destructuring for variables like { data: chemicalsList }
  } else {
    vars.add(dec);
  }
}

// Special additions:
vars.add('chemicalsList');
vars.add('chemicalsLoading');
vars.add('error');
vars.add('schoolId');
vars.add('schoolName');
vars.add('stateName');
vars.add('searchParams');


const exportedVars = Array.from(vars).filter(v => v !== '');

// Generate Hook
const hookCode = `import { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'react-router-dom';
import { getChemicalIntelligence, ChemicalIntelligence, ensureApiKey } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import { PDFService } from '../services/pdfService';
import { Chemical, GHS_ICONS, GHS_LABELS } from '../types/chemicals';

export function useChemicalsLogic(isNested = false) {
` + logic + `
  return {
    ` + exportedVars.join(',\n    ') + `
  };
}
`;

fs.writeFileSync('src/hooks/useChemicalsLogic.ts', hookCode);

const newComponentCode = content.substring(0, idxStart).replace(
  "import { Chemical, GHS_ICONS, GHS_LABELS } from '../types/chemicals';",
  "import { Chemical, GHS_ICONS, GHS_LABELS } from '../types/chemicals';\nimport { useChemicalsLogic } from '../hooks/useChemicalsLogic';"
) + `  const {
    ` + exportedVars.join(',\n    ') + `
  } = useChemicalsLogic(isNested);\n\n` + content.substring(idxEnd);

fs.writeFileSync(file, newComponentCode);
console.log('Extracted Chemicals Logic successfully. Check src/hooks/useChemicalsLogic.ts');

