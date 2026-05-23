const fs = require('fs');

const file = 'src/pages/DailyReport.tsx';
const content = fs.readFileSync(file, 'utf-8');

const returnStr = '  return (\n';
const idxStart = content.indexOf('export default function DailyReport() {\n') + 'export default function DailyReport() {\n'.length;
const idxEnd = content.indexOf(returnStr);

const logic = content.substring(idxStart, idxEnd);

const hookCode = `import { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, query, where, getDocs, serverTimestamp, orderBy, onSnapshot, addDoc, limit, deleteDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useTimeSlots } from './useTimeSlots';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ReportRow, Teacher, InstitutionSettings, SavedReport } from '../types/reports';

export function useDailyReport() {
` + logic + `
  return {
    schoolId,
    navigate,
    timeSlots,
    loadingTimeSlots,
    isTimeManagerOpen, setIsTimeManagerOpen,
    pickerState, setPickerState,
    resourcePickerState, setResourcePickerState,
    teachers,
    activeTab, setActiveTab,
    date, setDate: handleDateChange,
    reportNumber, setReportNumber,
    rows,
    labNotes, setLabNotes,
    supervisorNotes, setSupervisorNotes,
    directorNotes, setDirectorNotes,
    institution,
    history,
    isSaving,
    signature, setSignature,
    isSignatureModalOpen, setIsSignatureModalOpen,
    signatureCanvasRef,
    isDrawing,
    startDrawing,
    stopDrawing,
    draw,
    clearSignature,
    saveSignature,
    isDeleting, setIsDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    isLoading,
    isLoadingHistory,
    saveSuccess,
    generateNextReportNumber,
    fetchReportForDate,
    addRow,
    updateRow,
    deleteRow,
    handleSave,
    handleDelete,
    printHistoryReport,
    printBlankReport,
    downloadBlankWord
  };
}
`;

fs.writeFileSync('src/hooks/useDailyReport.ts', hookCode);

const newComponentCode = content.substring(0, idxStart).replace(
  "import { ReportRow, Teacher, InstitutionSettings, SavedReport } from '../types/reports';",
  "import { ReportRow, Teacher, InstitutionSettings, SavedReport } from '../types/reports';\nimport { useDailyReport } from '../hooks/useDailyReport';"
) + `  const {
    schoolId,
    navigate,
    timeSlots,
    loadingTimeSlots,
    isTimeManagerOpen, setIsTimeManagerOpen,
    pickerState, setPickerState,
    resourcePickerState, setResourcePickerState,
    teachers,
    activeTab, setActiveTab,
    date, setDate,
    reportNumber, setReportNumber,
    rows,
    labNotes, setLabNotes,
    supervisorNotes, setSupervisorNotes,
    directorNotes, setDirectorNotes,
    institution,
    history,
    isSaving,
    signature, setSignature,
    isSignatureModalOpen, setIsSignatureModalOpen,
    signatureCanvasRef,
    isDrawing,
    startDrawing,
    stopDrawing,
    draw,
    clearSignature,
    saveSignature,
    isDeleting, setIsDeleting,
    showDeleteConfirm, setShowDeleteConfirm,
    isLoading,
    isLoadingHistory,
    saveSuccess,
    generateNextReportNumber,
    fetchReportForDate,
    addRow,
    updateRow,
    deleteRow,
    handleSave,
    handleDelete,
    printHistoryReport,
    printBlankReport,
    downloadBlankWord
  } = useDailyReport();\n\n` + content.substring(idxEnd);

fs.writeFileSync(file, newComponentCode);
console.log('Done extracting Daily Report hook.');
