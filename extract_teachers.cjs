const fs = require('fs');
const path = require('path');

const file = 'src/pages/Teachers.tsx';
const content = fs.readFileSync(file, 'utf-8');

const returnStr = '  return (\n';
const startMarker = 'export default function Teachers() {\n';
const endMarker = returnStr;

const idxStart = content.indexOf(startMarker) + startMarker.length;
const idxEnd = content.indexOf(endMarker);

const logic = content.substring(idxStart, idxEnd);

const hookCode = `import { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import * as XLSX from 'xlsx';
import { Teacher } from '../types/teachers';

export function useTeachers() {
` + logic + `
  return {
    schoolId,
    teachers,
    loading,
    searchTerm, setSearchTerm,
    selectedRank, setSelectedRank,
    isAddModalOpen, setIsAddModalOpen,
    editingTeacher, setEditingTeacher,
    isImporting,
    newTeacher, setNewTeacher,
    importMessage,
    columnFilters, setColumnFilters,
    activeFilterColumn, setActiveFilterColumn,
    showFilterRow, setShowFilterRow,
    sortConfig, setSortConfig,
    fileInputRef,
    filterRef,
    formatDisplayDate,
    handleAddTeacher,
    handleDeleteTeacher,
    handleXLSImport,
    handleSort,
    filteredTeachers
  };
}
`;

fs.writeFileSync('src/hooks/useTeachers.ts', hookCode);

const newComponentCode = content.substring(0, idxStart).replace(
  "import { Teacher } from '../types/teachers';",
  "import { Teacher } from '../types/teachers';\nimport { useTeachers } from '../hooks/useTeachers';"
) + `  const {
    teachers,
    loading,
    searchTerm, setSearchTerm,
    selectedRank, setSelectedRank,
    isAddModalOpen, setIsAddModalOpen,
    editingTeacher, setEditingTeacher,
    isImporting,
    newTeacher, setNewTeacher,
    importMessage,
    columnFilters, setColumnFilters,
    activeFilterColumn, setActiveFilterColumn,
    showFilterRow, setShowFilterRow,
    sortConfig,
    fileInputRef,
    filterRef,
    formatDisplayDate,
    handleAddTeacher,
    handleDeleteTeacher,
    handleXLSImport,
    handleSort,
    filteredTeachers
  } = useTeachers();\n\n` + content.substring(idxEnd);

fs.writeFileSync(file, newComponentCode);
console.log('Done extracting Teachers hook.');
