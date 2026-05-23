import { useState, useEffect, useRef, useMemo } from 'react';
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
import { ChevronUp, ChevronDown, ArrowUp, ArrowDown } from 'lucide-react';

export function useChemicalsLogic(isNested = false) {
  const { schoolId, schoolName, directorate: stateName } = useSchool();
  const [searchParams] = useSearchParams();
  const [chemicals, setChemicals] = useState<Chemical[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(searchParams.get('filter') === 'low');
  const [selectedChemical, setSelectedChemical] = useState<Chemical | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChemical, setEditingChemical] = useState<Chemical | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [suggestedUpdate, setSuggestedUpdate] = useState<ChemicalIntelligence | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Chemical; direction: 'asc' | 'desc' } | null>(null);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'غير محدد';
    if (!dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    if (!year || !month || !day) return dateStr;
    return `${day}/${month}/${year}`;
  };

  const [newChemical, setNewChemical] = useState<Partial<Chemical>>({
    nameEn: '',
    nameAr: '',
    formula: '',
    casNumber: '',
    storageTemp: '',
    unit: 'g',
    quantity: 0,
    state: 'solid',
    hazardClass: 'safe',
    ghs: [],
    shelf: '',
    expiryDate: '',
    notes: ''
  });

  const { data: chemicalsList, loading: chemicalsLoading, error } = useFirestoreCollection(
    query(getUserCollection(schoolId, 'chemicals')),
    doc => ({ id: doc.id, ...doc.data() } as Chemical),
    [schoolId]
  );
  
  useEffect(() => {
    if (!chemicalsLoading) {
      setChemicals(chemicalsList);
      setLoading(false);
      
      const targetId = searchParams.get('id');
      if (targetId) {
        let actualId = targetId;
        if (targetId.startsWith('APP_ID_')) {
          const parts = targetId.split('_');
          actualId = parts.slice(2, -1).join('_');
        }
        setSearchTerm(actualId);
        const item = chemicalsList.find(e => e.id === targetId || e.id === actualId);
        if (item) {
          setSelectedChemical(item);
        } else if (chemicalsList.length > 0 && !selectedChemical) {
          setSelectedChemical(chemicalsList[0]);
        }
      } else if (chemicalsList.length > 0 && !selectedChemical) {
        setSelectedChemical(chemicalsList[0]);
      }
    }
  }, [chemicalsList, chemicalsLoading, searchParams]);

  const handleAddChemical = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChemical) {
        const { id } = editingChemical;
        await updateDoc(doc(getUserCollection(schoolId, 'chemicals'), id), {
          ...newChemical,
          updatedAt: serverTimestamp()
        });
        await logActivity(schoolId, LogAction.UPDATE, LogModule.CHEMICALS, `تعديل بيانات المادة: ${newChemical.nameAr}`, id);
      } else {
        const docRef = await addDoc(getUserCollection(schoolId, 'chemicals'), {
          ...newChemical,
          createdAt: serverTimestamp()
        });
        await logActivity(schoolId, LogAction.CREATE, LogModule.CHEMICALS, `إضافة مادة جديدة: ${newChemical.nameAr}`, docRef.id);
      }
      setIsAddModalOpen(false);
      setEditingChemical(null);
      setNewChemical({
        nameEn: '',
        nameAr: '',
        formula: '',
        casNumber: '',
        storageTemp: '',
        unit: 'g',
        quantity: 0,
        state: 'solid',
        hazardClass: 'safe',
        ghs: [],
        shelf: '',
        expiryDate: '',
        notes: ''
      });
    } catch (error) {
      handleFirestoreError(error, editingChemical ? OperationType.UPDATE : OperationType.CREATE, 'chemicals');
    }
  };

  const handleSmartFill = async () => {
    const nameToUse = newChemical.nameEn || newChemical.nameAr;
    if (!nameToUse) {
      alert('يرجى إدخال اسم المادة أولاً (بالعربية أو الإنجليزية)');
      return;
    }

    setIsGenerating(true);
    try {
      const info = await getChemicalIntelligence(nameToUse);
      if (info) {
        // Calculate expiry date based on expiryYears
        let expiryDate = '';
        if (info.expiryYears > 0) {
          const date = new Date();
          date.setFullYear(date.getFullYear() + info.expiryYears);
          expiryDate = date.toISOString().split('T')[0];
        }

        setNewChemical(prev => ({
          ...prev,
          nameEn: info.nameEn || prev.nameEn,
          nameAr: info.nameAr || prev.nameAr,
          formula: info.formula || prev.formula,
          casNumber: info.casNumber || prev.casNumber,
          storageTemp: info.storageTemp || prev.storageTemp,
          hazardClass: info.hazardClass || prev.hazardClass,
          ghs: info.ghs || prev.ghs,
          expiryDate: expiryDate || prev.expiryDate,
          notes: info.notes || prev.notes
        }));
      } else {
        alert('لم نتمكن من الحصول على معلومات دقيقة لهذه المادة. يرجى إدخالها يدوياً.');
      }
    } catch (error) {
      console.error('Smart fill error:', error);
      alert('حدث خطأ أثناء محاولة الحصول على المعلومات الذكية.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestSmartUpdate = async (chemical?: Chemical) => {
    const target = chemical || selectedChemical;
    if (!target) return;
    
    setIsGenerating(true);
    try {
      const info = await getChemicalIntelligence(target.nameEn || target.nameAr);
      if (info) {
        setSuggestedUpdate(info);
        if (chemical) setSelectedChemical(chemical);
        setIsReviewModalOpen(true);
      } else {
        alert('لم نتمكن من الحصول على اقتراحات تحديث لهذه المادة.');
      }
    } catch (error) {
      console.error('Smart update request error:', error);
      alert('حدث خطأ أثناء طلب التحديث الذكي.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveUpdate = async () => {
    if (!selectedChemical || !suggestedUpdate) return;

    try {
      let expiryDate = selectedChemical.expiryDate;
      if (suggestedUpdate.expiryYears > 0) {
        const date = new Date();
        date.setFullYear(date.getFullYear() + suggestedUpdate.expiryYears);
        expiryDate = date.toISOString().split('T')[0];
      }

      await updateDoc(doc(getUserCollection(schoolId, 'chemicals'), selectedChemical.id), {
        nameEn: suggestedUpdate.nameEn,
        nameAr: suggestedUpdate.nameAr,
        formula: suggestedUpdate.formula,
        casNumber: suggestedUpdate.casNumber,
        storageTemp: suggestedUpdate.storageTemp,
        hazardClass: suggestedUpdate.hazardClass,
        ghs: suggestedUpdate.ghs,
        expiryDate: expiryDate,
        notes: suggestedUpdate.notes,
        updatedAt: serverTimestamp()
      });
      
      setIsReviewModalOpen(false);
      setSuggestedUpdate(null);
      alert('تم تحديث معلومات المادة بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chemicals/${selectedChemical.id}`);
    }
  };

  const handleBulkSmartUpdate = async () => {
    setIsBulkConfirmOpen(false);
    
    // Ensure API key is available before starting
    const hasKey = await ensureApiKey();
    if (!hasKey) {
      alert('يرجى اختيار مفتاح API الخاص بك لاستخدام ميزة التحديث الذكي.');
      return;
    }

    setIsBulkUpdating(true);
    setBulkProgress({ current: 0, total: chemicals.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < chemicals.length; i++) {
      const c = chemicals[i];
      setBulkProgress({ current: i + 1, total: chemicals.length });

      try {
        const info = await getChemicalIntelligence(c.nameEn || c.nameAr);
        if (info) {
          let expiryDate = c.expiryDate;
          if (info.expiryYears > 0) {
            const date = new Date();
            date.setFullYear(date.getFullYear() + info.expiryYears);
            expiryDate = date.toISOString().split('T')[0];
          }

          await updateDoc(doc(getUserCollection(schoolId, 'chemicals'), c.id), {
            nameEn: info.nameEn || c.nameEn,
            nameAr: info.nameAr || c.nameAr,
            formula: info.formula || c.formula,
            casNumber: info.casNumber || c.casNumber,
            storageTemp: info.storageTemp || c.storageTemp,
            hazardClass: info.hazardClass || c.hazardClass,
            ghs: info.ghs || c.ghs,
            expiryDate: expiryDate || c.expiryDate,
            notes: info.notes || c.notes,
            updatedAt: serverTimestamp()
          });
          successCount++;
        } else {
          failCount++;
          // If we get null back, it might be a hard quota limit. 
          // We can't be 100% sure without changing the service return type, 
          // but we can check if the console logged a hard quota error.
        }
      } catch (error: any) {
        console.error(`Error updating chemical ${c.nameEn}:`, error);
        failCount++;
        
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes("quota") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
          alert("تم إيقاف التحديث التلقائي بسبب تجاوز حصة الاستخدام المسموح بها (Quota Exceeded). يرجى المحاولة لاحقاً أو التحقق من حساب Gemini API الخاص بك.");
          break; // Stop the loop
        }
      }
      
      // Increase delay to 5 seconds to stay well within the 15 RPM limit for Gemini 3 Flash
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    setIsBulkUpdating(false);
    alert(`اكتمل التحديث الذكي!\nتم تحديث: ${successCount} مادة بنجاح\nفشل: ${failCount} مادة`);
  };

  const handleDeleteChemical = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'chemicals'), id));
      await logActivity(schoolId, LogAction.DELETE, LogModule.CHEMICALS, `حذف المادة: ${name}`, id);
      if (selectedChemical?.id === id) {
        setSelectedChemical(chemicals.find(c => c.id !== id) || null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chemicals/${id}`);
    }
  };

  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة القائمة');
      return;
    }

    const hazardousCount = sortedChemicals.filter(c => (c.ghs && c.ghs.length > 0) || c.hazardClass === 'danger').length;
    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-DZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const academicYear = "2025/2026";

    const tableRows = sortedChemicals.map((c, index) => {
      const isHazardous = (c.ghs && c.ghs.length > 0) || c.hazardClass === 'danger';
      const ghsPictograms = (c.ghs || []).map(code => 
        `<div class="ghs-pic"><img src="${GHS_ICONS[code]}" alt="${code}" /></div>`
      ).join('');

      return `
        <tr class="${isHazardous ? 'hazardous-row' : ''}">
          <td class="text-center">${index + 1}</td>
          <td class="font-bold text-lg">${c.nameAr}</td>
          <td class="text-sm en-font">${c.nameEn}</td>
          <td class="mono-font">${c.formula || '—'}</td>
          <td class="text-center">${c.unit}</td>
          <td class="text-center font-bold">${c.quantity}</td>
          <td class="text-center">${c.state === 'solid' ? 'صلب' : c.state === 'liquid' ? 'سائل' : 'غاز'}</td>
          <td class="text-center">${c.shelf || '—'}</td>
          <td><div class="ghs-container">${ghsPictograms}</div></td>
          <td class="notes-cell">${c.notes || '—'}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>سجل المواد الكيميائية — ${schoolName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #006494;
              --on-primary: #ffffff;
              --primary-container: #cbe6ff;
              --secondary: #50606e;
              --surface: #fdfcff;
              --surface-variant: #dee3eb;
              --outline: #71787e;
              --error: #ba1a1a;
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Cairo', sans-serif; 
              direction: rtl; 
              background: #f8f9fb; 
              color: #1a1c1e;
              padding: 20px;
            }

            #toolbar {
              position: fixed; top: 0; left: 0; right: 0; 
              z-index: 100; background: #1a1c1e; color: white;
              padding: 12px 24px; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            #toolbar h3 { flex: 1; font-weight: 800; font-size: 16px; }
            .tb-btn { 
              padding: 10px 20px; border: none; border-radius: 20px; 
              cursor: pointer; font-weight: 700; font-size: 13px; font-family: Cairo;
              transition: all 0.2s;
            }
            .tb-print { background: #00b894; color: white; }
            .tb-close { background: #e74c3c; color: white; }

            .page-sheet {
              background: white;
              width: 297mm;
              min-height: 210mm;
              margin: 60px auto 20px;
              padding: 15mm;
              box-shadow: 0 10px 30px rgba(0,0,0,0.1);
              display: flex;
              flex-direction: column;
            }

            /* --- Header Layout --- */
            .official-header {
              display: grid;
              grid-template-columns: 1fr 2fr 1fr;
              margin-bottom: 20px;
              padding-bottom: 15px;
              border-bottom: 2px solid var(--primary);
              align-items: start;
            }
            .oh-right { text-align: right; line-height: 1.6; font-size: 10pt; }
            .oh-center { text-align: center; line-height: 1.5; font-size: 11pt; font-weight: 800; }
            .oh-left { text-align: left; line-height: 1.6; font-size: 10pt; }
            .oh-center img { height: 50px; margin-bottom: 5px; }

            .main-title {
              text-align: center;
              font-size: 22pt;
              font-weight: 900;
              color: var(--primary);
              margin: 10px 0;
              letter-spacing: -0.5px;
              text-shadow: 1px 1px 0 rgba(0,0,0,0.05);
            }

            .registry-meta {
              display: flex;
              justify-content: center;
              gap: 30px;
              margin-bottom: 20px;
              padding: 10px;
              background: var(--primary-container);
              border-radius: 12px;
              font-weight: 700;
              color: var(--on-primary-container);
            }

            /* --- Table Design --- */
            .registry-table {
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
              font-size: 10pt;
              margin-bottom: 20px;
            }
            .registry-table th {
              background: #f0f4f8;
              color: var(--secondary);
              font-weight: 800;
              padding: 12px 8px;
              border: 1px solid #d1d5db;
              text-align: center;
              font-size: 9pt;
            }
            .registry-table td {
              padding: 10px 8px;
              border: 1px solid #e5e7eb;
              line-height: 1.4;
            }
            .registry-table tr:nth-child(even) { background: #fafbfc; }
            .hazardous-row { background-color: #fff1f2 !important; }
            .hazardous-row td:first-child { border-right: 4px solid var(--error); }

            .text-center { text-align: center; }
            .font-bold { font-weight: 800; }
            .mono-font { font-family: 'JetBrains Mono', monospace; font-size: 9pt; }
            .en-font { font-family: sans-serif; color: var(--secondary); }
            .notes-cell { font-size: 9pt; color: #444; font-style: italic; }

            .ghs-container { display: flex; gap: 4px; justify-content: center; flex-wrap: wrap; }
            .ghs-pic { 
              width: 32px; height: 32px; border: 1px solid #ddd; 
              border-radius: 4px; background: white; padding: 2px;
              display: flex; align-items: center; justify-content: center;
            }
            .ghs-pic img { width: 100%; height: 100%; object-fit: contain; }

            /* --- Footer --- */
            .registry-footer {
              margin-top: auto;
              padding-top: 30px;
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            .sign-box {
              text-align: center;
              border: 1px solid #eee;
              padding: 15px;
              border-radius: 12px;
              background: #fafafa;
            }
            .sign-box h4 { margin-bottom: 50px; font-weight: 800; text-decoration: underline; color: var(--secondary); }
            
            .inst-stamp {
              width: 40mm;
              height: 25mm;
              border: 2px dashed #ccc;
              border-radius: 12px;
              margin: 10px auto;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8pt;
              color: #999;
            }

            @media print {
              #toolbar { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              .page-sheet { 
                margin: 0 !important; box-shadow: none !important; 
                width: 100% !important; padding: 10mm !important;
                border-radius: 0 !important;
              }
              @page { size: A4 landscape; margin: 0; }
              .registry-table th { background: #eee !important; -webkit-print-color-adjust: exact; }
              .hazardous-row { background-color: #fff1f1 !important; -webkit-print-color-adjust: exact; }
              .registry-meta { background: #eee !important; color: black !important; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div id="toolbar">
              <h3>📄 جرد المواد الكيميائية — سجل المخبر</h3>
              <button class="tb-btn tb-print" onclick="window.print()">🖨️ طباعة السجل</button>
              <button class="tb-btn tb-close" onclick="window.close()">✕ إغلاق</button>
          </div>

          <div class="page-sheet">
            <header class="official-header">
              <div class="oh-right">
                <div>وزارة التربية الوطنية</div>
                <div>مديرية التربية لولاية: ${stateName}</div>
                <div>المؤسسة: ${schoolName}</div>
              </div>
              <div class="oh-center">
                <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
                <div class="main-title">سجل جرد المواد الكيميائية للمخبر</div>
              </div>
              <div class="oh-left">
                <div>السنة الدراسية: ${academicYear}</div>
                <div>تاريخ الطباعة: ${formattedDate}</div>
                <div class="inst-stamp">ختم المؤسسة</div>
              </div>
            </header>

            <div class="registry-meta">
              <span>إجمالي المواد: ${sortedChemicals.length}</span>
              <span style="border-right: 2px solid rgba(0,0,0,0.1); padding-right: 20px;">المواد الخطرة: ${hazardousCount}</span>
            </div>

            <table class="registry-table">
              <thead>
                <tr>
                  <th width="40">رقم</th>
                  <th>الاسم العربي للمادة</th>
                  <th>Désignation (En)</th>
                  <th width="120">الصيغة</th>
                  <th width="60">الوحدة</th>
                  <th width="60">الكمية</th>
                  <th width="70">الحالة</th>
                  <th width="60">الرف</th>
                  <th width="100">GHS Pictograms</th>
                  <th>ملاحظات إضافية</th>
                </tr>
              </thead>
              <tbody>
                ${tableRows}
              </tbody>
            </table>

            <footer class="registry-footer">
              <div class="sign-box"><h4>المخبري الرئيسي</h4></div>
              <div class="sign-box"><h4>المقتصد</h4></div>
              <div class="sign-box"><h4>مدير المؤسسة</h4></div>
              <div class="sign-box"><h4>مفتش التربية الوطنية</h4></div>
            </footer>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };


  const handleExportPDF = async () => {
    const headers = ['#', 'الاسم العلمي', 'الاسم العربي', 'الصيغة', 'الكمية', 'الرف', 'تاريخ الصلاحية'];
    const tableData = filteredChemicals.map((c, index) => [
      index + 1,
      c.nameEn || '',
      c.nameAr || '',
      c.formula || '',
      `${c.quantity} ${c.unit}`,
      c.shelf || '',
      formatDisplayDate(c.expiryDate)
    ]);

    await PDFService.generateTablePDF(
      'تقرير جرد المواد الكيميائية',
      headers,
      tableData,
      `chemicals_inventory_${new Date().toISOString().split('T')[0]}.pdf`
    );
  };

  const handleExportXLS = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredChemicals.map(c => ({
      'الاسم (EN)': c.nameEn,
      'الاسم (AR)': c.nameAr,
      'الصيغة': c.formula,
      'رقم CAS': c.casNumber,
      'الكمية': c.quantity,
      'الوحدة': c.unit,
      'الحالة': c.state,
      'الخطورة': c.hazardClass,
      'الرف': c.shelf,
      'تاريخ الصلاحية': c.expiryDate,
      'ملاحظات': c.notes
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
    XLSX.writeFile(workbook, `chemical_inventory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleImportXLS = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const formatDate = (val: any) => {
          if (!val) return '';
          if (val instanceof Date) {
            return val.toISOString().split('T')[0];
          }
          const d = new Date(val);
          if (!isNaN(d.getTime())) {
            return d.toISOString().split('T')[0];
          }
          return String(val).trim();
        };

        const getVal = (item: any, keys: string[]) => {
          const itemKeys = Object.keys(item);
          for (const key of keys) {
            const foundKey = itemKeys.find(k => k.toLowerCase().trim() === key.toLowerCase().trim());
            if (foundKey) return item[foundKey];
          }
          return undefined;
        };

        const batch = writeBatch(db);
        data.forEach((item) => {
          const nameEn = getVal(item, ['PRODUIT CHIMIQUE', 'Name', 'nameEn', 'Product', 'Chemical']) || 'Unnamed Chemical';
          const nameAr = getVal(item, ['الاسم العربي', 'الاسم', 'Arabic Name', 'nameAr', 'Arabic']) || '';
          const rawQuantity = getVal(item, ['الكمية', 'Quantity', 'quantity', 'Qty', 'Amount']);
          const quantity = typeof rawQuantity === 'number' ? rawQuantity : parseFloat(String(rawQuantity || '0').replace(/[^0-9.]/g, ''));
          
          // Map Arabic state to English values
          let rawState = String(getVal(item, ['الحالة', 'State', 'state', 'Status']) || 'solid').trim();
          let state = 'solid';
          if (rawState === 'صلب' || rawState.toLowerCase() === 'solid') state = 'solid';
          else if (rawState === 'سائل' || rawState.toLowerCase() === 'liquid') state = 'liquid';
          else if (rawState === 'غاز' || rawState.toLowerCase() === 'gas') state = 'gas';

          // Map Arabic hazard to English values
          let rawHazard = String(getVal(item, ['الخطورة', 'Hazard', 'hazardClass', 'Danger']) || 'safe').trim();
          let hazard = 'safe';
          if (rawHazard === 'خطر' || rawHazard.toLowerCase() === 'danger') hazard = 'danger';
          else if (rawHazard === 'آمن' || rawHazard.toLowerCase() === 'safe') hazard = 'safe';

          const docRef = doc(getUserCollection(schoolId, 'chemicals'));
          batch.set(docRef, {
            nameEn: String(nameEn).trim(),
            nameAr: String(nameAr).trim(),
            formula: getVal(item, ['الصيغة', 'Formula', 'formula']) || '',
            unit: getVal(item, ['الوحدة', 'Unit', 'unit']) || 'g',
            quantity: isNaN(quantity) ? 0 : quantity,
            state: state,
            hazardClass: hazard,
            ghs: Array.isArray(item['GHS']) ? item['GHS'] : (item['GHS'] ? String(item['GHS']).split(',').map(s => s.trim()) : []),
            shelf: getVal(item, ['الرف', 'Shelf', 'shelf']) || '',
            expiryDate: formatDate(getVal(item, ['الصلاحية', 'Expiry', 'تاريخ الانتهاء', 'expiryDate'])),
            notes: getVal(item, ['ملاحظات', 'Notes', 'notes']) || '',
            createdAt: serverTimestamp()
          });
        });

        await batch.commit();
        alert(`تم استيراد ${data.length} مادة بنجاح!`);
      } catch (error) {
        console.error('Error importing XLS:', error);
        alert('حدث خطأ أثناء استيراد الملف. يرجى التأكد من صيغة الملف.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handlePrintInventoryCards = (items: Chemical[]) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة البطاقات');
      return;
    }

    const today = new Date();
    const academicYear = "2025/2026"; 

    const cardsHtml = items.map((c, index) => {
      const stateAr = c.state === 'solid' ? 'صلب' : c.state === 'liquid' ? 'سائل' : 'غاز';
      const hazardAr = c.hazardClass === 'danger' ? (c.ghs?.[0] ? GHS_LABELS[c.ghs[0]] : 'خطر') : 'آمن';
      const ghsIcon = c.ghs?.[0] ? '☠️' : '—'; 

      return `
        <div class="pcard">
          <div class="ph-container">
            <div class="ph">
              <div class="ph-r">مديرية التربية لولاية: ${stateName}<br>ثانوية: ${schoolName}</div>
              <div class="ph-c">الجمهورية الجزائرية الديمقراطية الشعبية<br>وزارة التربية الوطنية</div>
              <div class="ph-l">
                <div>السنة الدراسية: ${academicYear}</div>
                <div class="header-stamp">ختم المؤسسة</div>
              </div>
            </div>
          </div>

          <div class="pcard-badge">رقم البطاقة: ${index + 1}</div>
          <h1 class="pcard-title">بطاقة مخزون مادة كيميائية</h1>
          
          <div class="ic-meta-expressive">
             <div class="ic-field main">
                <span class="l">اسم المادة (AR)</span>
                <span class="v">${c.nameAr}</span>
             </div>
             <div class="ic-field sub">
                <span class="l">NOM DU PRODUIT</span>
                <span class="v en">${c.nameEn}</span>
             </div>
          </div>

          <div class="ic-grid-info">
             <div class="ic-info-box">
                <span class="l">الصيغة</span>
                <span class="v en-bold">${c.formula || '—'}</span>
             </div>
             <div class="ic-info-box">
                <span class="l">الحالة</span>
                <span class="v">${stateAr}</span>
             </div>
             <div class="ic-info-box">
                <span class="l">الرف</span>
                <span class="v">${c.shelf || '—'}</span>
             </div>
             <div class="ic-info-box danger">
                <span class="l">GHS</span>
                <span class="v emoji">${ghsIcon}</span>
             </div>
          </div>

          <div class="ic-safety-strip">
             <b>طبيعة الخطورة:</b> ${hazardAr} 
             <span style="margin-right: 15px">|</span> 
             <b>وحدة القياس:</b> ${c.unit}
          </div>

          <div class="ic-table-container">
            <table class="ic-tbl">
              <thead>
                <tr>
                  <th rowspan="2" width="12%">التاريخ</th>
                  <th colspan="2">سند الطلب</th>
                  <th rowspan="2">المصدر</th>
                  <th rowspan="2" width="10%">الثمن</th>
                  <th colspan="3">الكمية</th>
                  <th rowspan="2">ملاحظات</th>
                </tr>
                <tr><th>خروج</th><th>دخول</th><th>خروج</th><th>دخول</th><th>المخزون</th></tr>
              </thead>
              <tbody>
                <tr class="initial-stock">
                  <td>${today.toLocaleDateString('en-GB')}</td>
                  <td>-</td><td>-</td>
                  <td>رصيد أول المدة</td>
                  <td>-</td>
                  <td>-</td><td>${c.quantity}</td><td>${c.quantity}</td>
                  <td>رصيد ابتدائي</td>
                </tr>
                ${Array(14).fill('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
                <tr class="carry-over">
                  <td colspan="5">الرصيد المنقول لظهر البطاقة</td>
                  <td></td><td></td><td class="bold">..........</td>
                  <td>ينقل ←</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="pcard back">
          <div class="back-header">
             <span>تتمة حركة المخزون — ${c.nameAr}</span>
             <span class="ref">REF: ${index + 1}</span>
          </div>

          <div class="ic-table-container">
            <table class="ic-tbl">
              <thead>
                <tr>
                  <th rowspan="2" width="12%">التاريخ</th>
                  <th colspan="2">سند الطلب</th>
                  <th rowspan="2">المصدر</th>
                  <th rowspan="2" width="10%">الثمن</th>
                  <th colspan="3">الكمية</th>
                  <th rowspan="2">ملاحظات</th>
                </tr>
                <tr><th>خروج</th><th>دخول</th><th>خروج</th><th>دخول</th><th>المخزون</th></tr>
              </thead>
              <tbody>
                <tr class="initial-stock">
                  <td colspan="5">المجموع المنقول من وجه البطاقة</td>
                  <td></td><td></td><td>..........</td>
                  <td>نقل ←</td>
                </tr>
                ${Array(22).fill('<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>').join('')}
              </tbody>
            </table>
          </div>

          <div class="ic-safety-rules">
             <h3>⚠️ تعليمات السلامة الخاصة بالتخزين</h3>
             <div class="rules-box">
                ${c.notes || 'يجب حفظ هذه المادة في ظروف ملائمة بعيداً عن الرطوبة والحرارة ووفق معايير السلامة المنصوص عليها في دليل المختبرات.'}
             </div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <title>بطاقة مخزون</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
          <style>
            :root {
              --primary: #006494;
              --on-primary: #ffffff;
              --primary-container: #cbe6ff;
              --on-primary-container: #001e30;
              --secondary: #50606e;
              --tertiary: #65587b;
              --error: #ba1a1a;
              --outline: #71787e;
              --surface: #fdfcff;
              --surface-variant: #dee3eb;
            }

            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: 'Cairo', sans-serif; 
              direction: rtl; 
              background: #f0f2f5; 
              color: #1a1c1e;
              padding: 20px;
            }

            #toolbar {
              position: fixed; top: 0; left: 0; right: 0; 
              z-index: 100; background: #1a1c1e; color: white;
              padding: 12px 24px; display: flex; align-items: center; gap: 15px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            #toolbar h3 { flex: 1; font-weight: 800; font-size: 16px; }
            .tb-btn { 
              padding: 10px 20px; border: none; border-radius: 20px; 
              cursor: pointer; font-weight: 700; font-size: 13px; font-family: Cairo;
              transition: all 0.2s;
            }
            .tb-print { background: #00b894; color: white; }
            .tb-close { background: #e74c3c; color: white; }

            #body { padding-top: 60px; max-width: 900px; margin: 0 auto; }

            .pcard {
              background: white;
              width: 148mm;
              height: 210mm;
              margin: 20px auto;
              padding: 8mm;
              border-radius: 24px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.08);
              display: flex;
              flex-direction: column;
              border: 1px solid rgba(0,0,0,0.05);
              position: relative;
              overflow: hidden;
            }

            .pcard.back { border-style: dashed; }

            .ph-container {
              background: var(--surface-variant);
              margin: -8mm -8mm 4mm -8mm;
              padding: 6mm 8mm;
              border-radius: 0 0 24px 24px;
            }
            .ph {
              display: grid; grid-template-columns: 1fr 1.5fr 1fr;
              font-size: 7.5pt; gap: 4px; align-items: start; color: var(--secondary);
            }
            .ph-r { text-align: right; line-height: 1.5; }
            .ph-c { text-align: center; font-weight: 800; line-height: 1.5; }
            .ph-l { text-align: left; line-height: 1.5; }

            .header-stamp {
              margin-top: 5px;
              width: 35mm;
              height: 20mm;
              border: 1px dashed var(--outline);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 6pt;
              color: var(--outline);
              font-weight: 400;
            }

            .pcard-badge {
              position: absolute; top: 12mm; left: 8mm;
              background: var(--primary-container); color: var(--on-primary-container);
              padding: 2px 12px; border-radius: 12px; font-size: 8pt; font-weight: 700;
            }

            .pcard-title {
              text-align: center; font-size: 14pt; font-weight: 900;
              color: var(--primary); margin: 4mm 0;
            }

            .ic-meta-expressive { display: flex; flex-direction: column; gap: 4px; margin-bottom: 6mm; }
            .ic-field { border-radius: 12px; padding: 6px 12px; display: flex; align-items: center; justify-content: space-between; }
            .ic-field.main { background: #f0f4f9; border-right: 4px solid var(--primary); }
            .ic-field.sub { background: #fafbfc; border-right: 4px solid var(--outline); font-size: 9pt; }
            .ic-field .l { font-weight: 700; color: var(--secondary); font-size: 8.5pt; }
            .ic-field .v { font-weight: 800; font-size: 11pt; }
            .ic-field .v.en { font-family: sans-serif; font-size: 9pt; text-transform: uppercase; }

            .ic-grid-info { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 6mm; }
            .ic-info-box { background: #fff; border: 1px solid var(--surface-variant); border-radius: 12px; padding: 6px; text-align: center; }
            .ic-info-box .l { display: block; font-size: 7pt; font-weight: 700; color: var(--tertiary); margin-bottom: 2px; }
            .ic-info-box .v { font-weight: 800; font-size: 9.5pt; }
            .ic-info-box .v.en-bold { font-family: monospace; font-weight: 900; font-size: 10pt; }
            .ic-info-box.danger { border-color: var(--error); background: #fff8f8; }

            .ic-safety-strip { background: var(--on-primary-container); color: white; border-radius: 8px; padding: 5px 12px; font-size: 8.5pt; margin-bottom: 6mm; }

            .ic-table-container { flex: 1; margin-bottom: 4mm; }
            .ic-tbl { width: 100%; border-collapse: collapse; font-size: 8pt; table-layout: fixed; }
            .ic-tbl th, .ic-tbl td { border: 0.5pt solid var(--surface-variant); padding: 4px; text-align: center; }
            .ic-tbl th { background: #e8ecef; color: var(--secondary); font-weight: 800; font-size: 7pt; }
            .ic-tbl td { height: 6mm; }
            tr.initial-stock { background: #f0fdf4; font-weight: 600; }
            .bold { font-weight: 900; }

            .back-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--primary); padding-bottom: 5px; margin-bottom: 6mm; font-weight: 900; font-size: 11pt; color: var(--primary); }
            .rules-box { background: #fffafa; border: 1px solid #ffeded; padding: 10px; border-radius: 12px; font-size: 8.5pt; color: #444; line-height: 1.6; }

            @media print {
              #toolbar { display: none !important; }
              body { background: white !important; padding: 0 !important; }
              @page { size: A5 portrait; margin: 3mm; }
              .pcard {
                width: 100% !important; height: calc(210mm - 6mm) !important;
                margin: 0 !important; border: 1px solid #000 !important;
                border-radius: 0 !important; box-shadow: none !important;
                page-break-after: always !important; padding: 5mm !important;
              }
              .ph-container { border-radius: 0 !important; margin-bottom: 2mm !important; }
              .ic-meta-expressive .ic-field { background: white !important; border: 1px solid #eee !important; box-shadow: none !important; }
              .ic-tbl th { background: #f0f0f0 !important; border: 0.5pt solid #000 !important; print-color-adjust: exact; }
              .ic-tbl td { border: 0.5pt solid #000 !important; }
            }
          </style>
        </head>
        <body>
          <div id="toolbar">
              <h3>🎨 جرد كيميائي — ${items.length} عنصر</h3>
              <button class="tb-btn tb-print" onclick="window.print()">🖨️ بدء الطباعة</button>
              <button class="tb-btn tb-close" onclick="window.close()">✕ إغلاق المعاينة</button>
          </div>
          <div id="body">
            ${cardsHtml}
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrint = (c: Chemical) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>بطاقة مادة - ${c.nameEn}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            .header { text-align: center; border-bottom: 2px solid #2b3d22; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #2b3d22; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .item { border-bottom: 1px solid #eee; padding: 10px 0; }
            .label { font-weight: bold; color: #5c6146; }
            .hazard { color: #e11d48; font-weight: bold; }
            .footer { margin-top: 50px; text-align: left; font-size: 12px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">بطاقة تعريف مادة كيميائية</div>
            <div>نظام تسيير المخابر المدرسية</div>
          </div>
          <div class="details">
            <div class="item"><span class="label">PRODUIT CHIMIQUE:</span> ${c.nameEn}</div>
            <div class="item"><span class="label">الاسم العربي:</span> ${c.nameAr}</div>
            <div class="item"><span class="label">الصيغة الكيميائية:</span> ${c.formula}</div>
            <div class="item"><span class="label">رقم CAS:</span> ${c.casNumber || 'غير متوفر'}</div>
            <div class="item"><span class="label">درجة التخزين:</span> ${c.storageTemp || 'غير متوفر'}</div>
            <div class="item"><span class="label">الحالة:</span> ${c.state}</div>
            <div class="item"><span class="label">الكمية الحالية:</span> ${c.quantity} ${c.unit}</div>
            <div class="item"><span class="label">الرف:</span> ${c.shelf}</div>
            <div class="item"><span class="label">الصلاحية:</span> ${c.expiryDate || 'غير محدد'}</div>
            <div class="item" style="grid-column: span 2;">
              <span class="label">رموز السلامة GHS:</span>
              <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
                ${(c.ghs || []).map(code => `
                  <div style="display: flex; flex-direction: column; align-items: center; border: 1px solid #ccc; padding: 5px; border-radius: 8px; width: 70px; background: #fff;">
                    <img src="${GHS_ICONS[code]}" style="width: 40px; height: 40px;" />
                    <span style="font-size: 9px; margin-top: 4px; text-align: center; font-weight: bold;">${GHS_LABELS[code] || code}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="item"><span class="label">تصنيف الخطورة:</span> <span class="${c.hazardClass === 'danger' ? 'hazard' : ''}">${c.hazardClass === 'danger' ? 'خطر' : 'آمن'}</span></div>
            <div class="item" style="grid-column: span 2;"><span class="label">ملاحظات:</span> ${c.notes || 'لا توجد'}</div>
          </div>
          <div class="footer">طبع بتاريخ: ${new Date().toLocaleString('ar-DZ')}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSort = (key: keyof Chemical) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredChemicals.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredChemicals.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} مادة؟`)) return;
    
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(getUserCollection(schoolId, 'chemicals'), id));
      });
      await batch.commit();
      await logActivity(schoolId, LogAction.DELETE, LogModule.CHEMICALS, `حذف جماعي لـ ${selectedIds.length} مادة`);
      setSelectedIds([]);
      alert('تم الحذف بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'chemicals/bulk');
    }
  };

  const filteredChemicals = chemicals.filter(c => {
    const matchesSearch = c.nameEn?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.nameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.formula?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !filterLowStock || c.quantity < 10;
    return matchesSearch && matchesLowStock;
  });

  const sortedChemicals = useMemo(() => {
    const sortableItems = [...filteredChemicals];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue === undefined || bValue === undefined) return 0;
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredChemicals, sortConfig]);

  const getSortIcon = (key: keyof Chemical) => {
    if (sortConfig?.key === key) {
      return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="mr-1" /> : <ChevronDown size={14} className="mr-1" />;
    }
    return <div className="w-[14px] mr-1" />;
  };

  const lowStockCount = chemicals.filter(c => c.quantity < 10).length;

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: sortedChemicals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });


  return {
    searchParams,
    chemicals,
    setChemicals,
    loading,
    setLoading,
    searchTerm,
    setSearchTerm,
    filterLowStock,
    setFilterLowStock,
    selectedChemical,
    setSelectedChemical,
    isAddModalOpen,
    setIsAddModalOpen,
    editingChemical,
    setEditingChemical,
    fileInputRef,
    isImporting,
    setIsImporting,
    isGenerating,
    setIsGenerating,
    isBulkUpdating,
    setIsBulkUpdating,
    isBulkConfirmOpen,
    setIsBulkConfirmOpen,
    bulkProgress,
    setBulkProgress,
    selectedIds,
    setSelectedIds,
    suggestedUpdate,
    setSuggestedUpdate,
    isReviewModalOpen,
    setIsReviewModalOpen,
    sortConfig,
    setSortConfig,
    isQRScannerOpen,
    setIsQRScannerOpen,
    formatDisplayDate,
    newChemical,
    setNewChemical,
    handleAddChemical,
    handleSmartFill,
    handleRequestSmartUpdate,
    handleApproveUpdate,
    handleBulkSmartUpdate,
    handleDeleteChemical,
    handlePrintList,
    handleExportPDF,
    handleExportXLS,
    handleImportXLS,
    handlePrintInventoryCards,
    handlePrint,
    handleSort,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    filteredChemicals,
    sortedChemicals,
    getSortIcon,
    lowStockCount,
    parentRef,
    rowVirtualizer,
    chemicalsList,
    chemicalsLoading,
    error,
    schoolId,
    schoolName,
    stateName
  };
}
