const fs = require('fs');

const file = 'src/pages/Equipment.tsx';
const content = fs.readFileSync(file, 'utf-8');

const returnStr = '  return (\n';
const startMarker = 'export default function Equipment({ isNested = false }: { isNested?: boolean }) {\n';
const idxStart = content.indexOf(startMarker) + startMarker.length;
const idxEnd = content.indexOf(returnStr, idxStart);

const logic = content.substring(idxStart, idxEnd);

// Better regex for declarations
let vars = new Set();
let match;
const varDeclarations = /^\s*const (\[[^\]]+\]|\{[^\}]+\}|[a-zA-Z0-9_]+)\s*=/gm;
while ((match = varDeclarations.exec(logic)) !== null) {
  const dec = match[1];
  if (dec.startsWith('[')) {
    // Array destructuring
    const inside = dec.substring(1, dec.length - 1).split(',').map(s => s.trim());
    inside.forEach(v => {
      if (v) vars.add(v);
    });
  } else if (dec.startsWith('{')) {
    // object destructuring
  } else {
    vars.add(dec);
  }
}

// Ensure contextual variables exist
vars.add('schoolId');
vars.add('schoolName');
vars.add('directorate');

const exportedVars = Array.from(vars).filter(v => v !== '');

// Generate Hook
const hookCode = `import { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, orderBy, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'react-router-dom';
import { getEquipmentIntelligence, EquipmentIntelligence, ensureApiKey } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFService } from '../services/pdfService';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import { Equipment, MaintenanceLog } from '../types/equipment';

export function useEquipmentLogic(isNested = false) {
` + logic + `
  return {
    ` + exportedVars.join(',\n    ') + `
  };
}
`;

fs.writeFileSync('src/hooks/useEquipmentLogic.tsx', hookCode);

const newComponentCode = content.substring(0, idxStart).replace(
  "import { Equipment, MaintenanceLog } from '../types/equipment';",
  "import { Equipment, MaintenanceLog } from '../types/equipment';\nimport { useEquipmentLogic } from '../hooks/useEquipmentLogic';"
) + `  const {
    ` + exportedVars.join(',\n    ') + `
  } = useEquipmentLogic(isNested);\n\n` + content.substring(idxEnd);

fs.writeFileSync(file, newComponentCode);
console.log('Extracted Equipment Logic successfully. Check src/hooks/useEquipmentLogic.tsx');
