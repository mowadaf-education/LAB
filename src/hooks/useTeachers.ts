import { useState, useEffect, useRef, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import * as XLSX from 'xlsx';
import { Teacher } from '../types/teachers';
import { useVirtualizer } from '@tanstack/react-virtual';

export function useTeachers() {
  const { schoolId } = useSchool();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRank, setSelectedRank] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({
    functionalCode: '',
    firstName: '',
    lastName: '',
    name: '',
    birthDate: '',
    rank: '',
    subject: '',
    grade: '',
    effectiveDate: '',
    email: '',
    levels: []
  });
  const [importMessage, setImportMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({
    functionalCode: '',
    name: '',
    rank: '',
    subject: '',
    birthDate: ''
  });
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(null);
  const [showFilterRow, setShowFilterRow] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Teacher | null, direction: 'asc' | 'desc' | null }>({
    key: null,
    direction: null
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  
  // Virtualization ref
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setActiveFilterColumn(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'غير محدد';
    if (!dateStr.includes('-')) return dateStr; // Already formatted or unknown
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  useEffect(() => {
    if (!schoolId) return;
    const q = query(getUserCollection(schoolId, 'teachers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Teacher));
      setTeachers(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teachers');
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const fullName = `${newTeacher.firstName} ${newTeacher.lastName}`.trim();
      const teacherData = {
        ...newTeacher,
        name: fullName,
        updatedAt: serverTimestamp()
      };

      if (editingTeacher) {
        const { id, ...data } = editingTeacher;
        await updateDoc(doc(getUserCollection(schoolId, 'teachers'), id), teacherData);
      } else {
        await addDoc(getUserCollection(schoolId, 'teachers'), {
          ...teacherData,
          createdAt: serverTimestamp()
        });
      }
      setIsAddModalOpen(false);
      setEditingTeacher(null);
      setNewTeacher({
        functionalCode: '',
        firstName: '',
        lastName: '',
        name: '',
        birthDate: '',
        rank: '',
        subject: '',
        grade: '',
        effectiveDate: '',
        email: '',
        levels: []
      });
    } catch (error) {
      handleFirestoreError(error, editingTeacher ? OperationType.UPDATE : OperationType.CREATE, 'teachers');
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'teachers'), id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `teachers/${id}`);
    }
  };

  const handleXLSImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to array of arrays to find the header row
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
        let headerRowIndex = 3; // Default to 4th row (index 3)
        
        // Search for the header row in the first 10 rows
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const row = rows[i];
          if (row.some(cell => String(cell || '').includes('الرمز الوظيفي') || String(cell || '').includes('اللقب'))) {
            headerRowIndex = i;
            break;
          }
        }

        const data = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex }) as any[];

        if (data.length === 0) {
          setImportMessage({ text: 'لم يتم العثور على بيانات صالحة في الملف. يرجى التأكد من أن البيانات تبدأ من السطر الرابع.', type: 'error' });
          setIsImporting(false);
          return;
        }

        const formatDate = (val: any) => {
          if (!val) return '';
          if (val instanceof Date) {
            return val.toISOString().split('T')[0]; // YYYY-MM-DD
          }
          // If it's a string that looks like a date, try to parse it
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
             return d.toISOString().split('T')[0];
          }
          return String(val).trim();
        };

        const batch = writeBatch(db);
        let count = 0;
        data.forEach((item) => {
          // Helper to find value by key even if there are spaces
          const getValue = (key: string) => {
            const foundKey = Object.keys(item).find(k => k.trim() === key);
            return foundKey ? item[foundKey] : '';
          };

          const firstName = String(getValue('الاسم') || '').trim();
          const lastName = String(getValue('اللقب') || '').trim();
          
          // Only add if we have at least a name
          if (firstName || lastName) {
            count++;
            const functionalCode = String(getValue('الرمز الوظيفي') || '').trim();
            const birthDate = formatDate(getValue('تاريخ الازدياد'));
            const rank = String(getValue('الرتبة') || '').trim();
            const subject = String(getValue('المادة') || '').trim();
            const grade = String(getValue('الدرجة') || '').trim();
            const effectiveDate = formatDate(getValue('تاريخ السريان'));
            
            const docRef = doc(getUserCollection(schoolId, 'teachers'));
            batch.set(docRef, {
              functionalCode,
              lastName,
              firstName,
              name: `${firstName} ${lastName}`.trim(),
              birthDate,
              rank,
              subject,
              grade,
              effectiveDate,
              email: '',
              levels: [],
              createdAt: serverTimestamp()
            });
          }
        });

        if (count > 0) {
          await batch.commit();
          setImportMessage({ text: `تم استيراد ${count} أستاذ بنجاح!`, type: 'success' });
        } else {
          setImportMessage({ text: 'لم يتم العثور على أساتذة صالحين للاستيراد.', type: 'error' });
        }
      } catch (error) {
        console.error('Error importing XLS:', error);
        setImportMessage({ text: 'حدث خطأ أثناء استيراد الملف. يرجى التأكد من صيغة الملف.', type: 'error' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setTimeout(() => setImportMessage(null), 5000);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const batch = writeBatch(db);
      
      // Skip header if exists (simple check)
      const startIdx = lines[0].toLowerCase().includes('name') ? 1 : 0;

      let count = 0;
      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [name, subject, email, levelsStr] = line.split(',').map(s => s.trim());
        if (!name || !subject) continue;

        const newDocRef = doc(getUserCollection(schoolId, 'teachers'));
        batch.set(newDocRef, {
          name,
          subject,
          email: email || '',
          levels: levelsStr ? levelsStr.split(';').map(s => s.trim()) : [],
          createdAt: serverTimestamp()
        });
        count++;
      }

      try {
        await batch.commit();
        setImportMessage({ text: `تم استيراد ${count} أستاذ بنجاح!`, type: 'success' });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'teachers/batch');
        setImportMessage({ text: 'حدث خطأ أثناء استيراد الملف.', type: 'error' });
      } finally {
        setTimeout(() => setImportMessage(null), 5000);
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSort = (key: keyof Teacher) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key: direction ? key : null, direction });
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchesSearch = t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           t.subject?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRank = selectedRank === 'all' || t.rank === selectedRank;
      
      const matchesColumnFilters = Object.entries(columnFilters).every(([key, value]) => {
        if (!value) return true;
        const teacherValue = String((t as any)[key] || '').toLowerCase();
        return teacherValue.includes(value.toLowerCase());
      });

      return matchesSearch && matchesRank && matchesColumnFilters;
    });
  }, [teachers, searchTerm, selectedRank, columnFilters]);

  const sortedTeachers = useMemo(() => {
    const list = [...filteredTeachers];
    if (!sortConfig.key || !sortConfig.direction) return list;
    
    return list.sort((a, b) => {
      const aValue = String(a[sortConfig.key!] || '').toLowerCase();
      const bValue = String(b[sortConfig.key!] || '').toLowerCase();
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTeachers, sortConfig]);

  const stats = {
    total: teachers.length,
    secondaryTeachers: teachers.filter(t => t.rank?.includes('ثانوي')).length,
    labStaff: teachers.filter(t => 
      t.rank?.includes('مخبر') || 
      t.rank?.includes('المخابر')
    ).length,
    ranks: teachers.reduce((acc, t) => {
      acc[t.rank] = (acc[t.rank] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    subjects: teachers.reduce((acc, t) => {
      acc[t.subject] = (acc[t.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const uniqueRanks = Array.from(new Set(teachers.map(t => t.rank).filter(Boolean)));
  const activeFiltersCount = Object.values(columnFilters).filter(Boolean).length;

  const rowVirtualizer = useVirtualizer({
    count: sortedTeachers.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
  });

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
    parentRef,
    rowVirtualizer,
    formatDisplayDate,
    handleAddTeacher,
    handleDeleteTeacher,
    handleXLSImport,
    handleCSVImport,
    handleSort,
    filteredTeachers: sortedTeachers,
    uniqueRanks,
    activeFiltersCount,
    stats
  };
}
