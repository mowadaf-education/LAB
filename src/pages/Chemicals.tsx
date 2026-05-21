import React, { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import { useFirestoreCollection } from '../hooks/useFirestoreCollection';
import * as XLSX from 'xlsx';
import { useSearchParams } from 'react-router-dom';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  FileUp,
  History, 
  AlertTriangle,
  ShieldAlert,
  QrCode,
  Trash2,
  Edit,
  X,
  Printer,
  Bell,
  Sparkles,
  Wand2,
  Check,
  RotateCcw,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getChemicalIntelligence, ChemicalIntelligence, ensureApiKey } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import { PDFService } from '../services/pdfService';
import QRScanner from '../components/QRScanner';

interface Chemical {
  id: string;
  nameEn: string;
  nameAr: string;
  formula: string;
  casNumber?: string;
  storageTemp?: string;
  unit: string;
  quantity: number;
  state: string;
  hazardClass: string;
  ghs: string[];
  shelf: string;
  expiryDate: string;
  notes: string;
}

const GHS_ICONS: Record<string, string> = {
  'GHS01': '/ghs/GHS01.png',
  'GHS02': '/ghs/GHS02.png',
  'GHS03': '/ghs/GHS03.png',
  'GHS04': '/ghs/GHS04.png',
  'GHS05': '/ghs/GHS05.png',
  'GHS06': '/ghs/GHS06.png',
  'GHS07': '/ghs/GHS07.png',
  'GHS08': '/ghs/GHS08.png',
  'GHS09': '/ghs/GHS09.png',
};

const GHS_LABELS: Record<string, string> = {
  'GHS01': 'متفجرات',
  'GHS02': 'قابل للاشتعال',
  'GHS03': 'مؤكسد',
  'GHS04': 'غاز تحت الضغط',
  'GHS05': 'أكال / مسبب للتآكل',
  'GHS06': 'سمية حادة (قاتل)',
  'GHS07': 'تهيج / تحسس / خطر',
  'GHS08': 'خطر صحي جسيم',
  'GHS09': 'خطر بيئي',
};

export default function Chemicals({ isNested = false }: { isNested?: boolean }) {
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

  const sortedChemicals = React.useMemo(() => {
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

  return (
    <div className={cn("space-y-10 max-w-7xl mx-auto pb-20", !isNested && "px-4")}>
      {/* Header */}
      {!isNested && (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
          <div className="text-right space-y-1">
            <h1 className="text-4xl font-black text-primary tracking-tighter">المخزن الكيميائي</h1>
            <p className="text-secondary/80 text-base font-medium">إدارة وتتبع المحاليل والكواشف الكيميائية</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportXLS} 
              className="hidden" 
              accept=".xls,.xlsx"
            />
            <button 
              onClick={() => setIsQRScannerOpen(true)}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <QrCode size={20} />
              مسح QR
            </button>
            <button 
              onClick={handlePrintList}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <Printer size={20} />
              طباعة القائمة
            </button>
            <button 
              onClick={() => handlePrintInventoryCards(sortedChemicals)}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <Printer size={20} className="text-primary" />
              طباعة بطاقات المخزون
            </button>
            <button 
              onClick={handleExportPDF}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <FileText size={20} />
              تصدير PDF
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm disabled:opacity-50"
            >
              {isImporting ? (
                <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
              ) : (
                <FileUp size={20} />
              )}
              استيراد XLS
            </button>
            <button 
              onClick={handleExportXLS}
              className="bg-surface text-secondary border border-outline/10 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high transition-all active:scale-95 shadow-sm"
            >
              <Download size={20} />
              تصدير الجرد
            </button>
            <button 
              onClick={() => setIsBulkConfirmOpen(true)}
              disabled={isBulkUpdating || chemicals.length === 0}
              className="bg-primary text-on-primary px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
              title="تحديث ذكي لجميع المواد في القائمة"
            >
              {isBulkUpdating ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="text-xs">{bulkProgress.current}/{bulkProgress.total}</span>
                </div>
              ) : (
                <Sparkles size={20} />
              )}
              تحديث ذكي للكل
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-on-primary px-8 py-3.5 rounded-full flex items-center gap-2 font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all active:scale-95"
            >
              <Plus size={20} />
              إضافة مادة
            </button>
          </div>
        </header>
      )}

      {/* Stats */}
      {!isNested && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-surface-container-low p-7 rounded-[32px] border border-outline/5 hover:border-outline/20 transition-all group">
            <p className="text-xs text-secondary/60 font-black uppercase tracking-widest mb-3">إجمالي المواد</p>
            <h3 className="text-4xl font-black text-primary group-hover:scale-110 transition-transform origin-right">{chemicals.length}</h3>
          </div>
          <div className="bg-error-container/40 p-7 rounded-[32px] border border-error/10 hover:border-error/20 transition-all group">
            <p className="text-xs text-on-error-container/60 font-black uppercase tracking-widest mb-3">مواد خطرة</p>
            <h3 className="text-4xl font-black text-error group-hover:scale-110 transition-transform origin-right">
              {chemicals.filter(c => (c.ghs && c.ghs.length > 0) || c.hazardClass === 'danger').length}
            </h3>
          </div>
          <div className="bg-tertiary-fixed/40 p-7 rounded-[32px] border border-tertiary/10 hover:border-tertiary/20 transition-all group">
            <p className="text-xs text-on-tertiary-fixed/60 font-black uppercase tracking-widest mb-3">تنتهي قريباً</p>
            <h3 className="text-4xl font-black text-tertiary group-hover:scale-110 transition-transform origin-right">
              {chemicals.filter(c => {
                if (!c.expiryDate) return false;
                const expiry = new Date(c.expiryDate);
                const threeMonthsFromNow = new Date();
                threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
                return expiry < threeMonthsFromNow && expiry > new Date();
              }).length.toString().padStart(2, '0')}
            </h3>
          </div>
          <div className="bg-primary p-7 rounded-[32px] text-on-primary shadow-xl shadow-primary/20 hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-surface/10 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <p className="text-white/60 text-xs font-black uppercase tracking-widest mb-3">سعة التخزين</p>
              <h3 className="text-4xl font-black">68%</h3>
            </div>
          </div>
        </section>
      )}

      {lowStockCount > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-error-container/30 backdrop-blur-sm text-on-error-container p-5 rounded-[32px] flex items-center justify-between border border-error/10 shadow-lg shadow-error/5"
        >
          <div className="flex items-center gap-4 text-error">
            <div className="bg-error p-3 rounded-2xl text-white shadow-lg shadow-error/20">
              <Bell size={20} />
            </div>
            <span className="font-black text-base">تنبيه: يوجد {lowStockCount} مواد منخفضة المخزون!</span>
          </div>
          <button 
            onClick={() => setFilterLowStock(!filterLowStock)}
            className="text-sm font-black underline underline-offset-4 text-error px-6 py-2.5 hover:bg-error/10 rounded-full transition-all active:scale-95"
          >
            {filterLowStock ? 'عرض الكل' : 'عرض المواد المنخفضة'}
          </button>
        </motion.div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface-container-lowest rounded-[32px] overflow-hidden border border-outline/10 shadow-sm">
            <div className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-low/30 border-b border-outline/5">
              <div className="relative w-full md:w-80">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-outline/60" size={20} />
                <input 
                  className="w-full bg-surface-container-low border border-outline/10 rounded-full pr-12 pl-6 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all"
                  placeholder="بحث عن مادة (اسم أو صيغة)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFilterLowStock(!filterLowStock)}
                  className={cn(
                    "p-3 border rounded-full transition-all active:scale-90",
                    filterLowStock 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-low hover:bg-surface-container-high border-outline/10 text-secondary"
                  )}
                  title={filterLowStock ? "عرض الكل" : "تصفية المواد المنخفضة"}
                >
                  <Filter size={22} />
                </button>
              </div>
            </div>

            <div 
              ref={parentRef}
              className="overflow-auto scrollbar-hide relative max-h-[700px] w-full"
            >
              <table className="w-full text-right border-collapse table-auto relative">
                <thead className="sticky top-0 z-20 bg-surface-container-lowest">
                  <tr className="bg-surface-container-low/50 text-secondary/60 text-[11px] font-black uppercase tracking-widest">
                    <th className="px-3 py-5 text-right w-12">
                      <div 
                        onClick={handleSelectAll}
                        className={cn(
                          "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all",
                          selectedIds.length === filteredChemicals.length && filteredChemicals.length > 0
                            ? "bg-primary border-primary text-white" 
                            : "border-outline/30 hover:border-primary/50"
                        )}
                      >
                        {selectedIds.length === filteredChemicals.length && filteredChemicals.length > 0 && <Check size={12} />}
                      </div>
                    </th>
                    <th className="px-3 py-5 text-right w-10">#</th>
                    <th 
                      className="px-3 py-5 text-right min-w-[140px] cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('nameEn')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('nameEn')}
                        المادة (EN/AR)
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-16 hidden sm:table-cell cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('formula')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('formula')}
                        الصيغة
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-20 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('quantity')}
                        الكمية
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-14 hidden lg:table-cell cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('state')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('state')}
                        الحالة
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-18 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('hazardClass')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('hazardClass')}
                        الخطورة
                      </div>
                    </th>
                    <th className="px-3 py-5 text-right w-20 hidden xl:table-cell">GHS</th>
                    <th 
                      className="px-3 py-5 text-right w-14 hidden md:table-cell cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('shelf')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('shelf')}
                        الرف
                      </div>
                    </th>
                    <th 
                      className="px-3 py-5 text-right w-24 cursor-pointer hover:text-primary transition-colors"
                      onClick={() => handleSort('expiryDate')}
                    >
                      <div className="flex items-center">
                        {getSortIcon('expiryDate')}
                        الصلاحية
                      </div>
                    </th>
                    <th className="px-3 py-5 text-right hidden 2xl:table-cell">ملاحظات</th>
                    <th className="px-3 py-5 text-center w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/5 relative w-full">
                  {loading ? (
                    <tr>
                      <td colSpan={12} className="px-8 py-20 text-center text-outline/60 font-bold">جاري التحميل...</td>
                    </tr>
                  ) : sortedChemicals.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="px-8 py-20 text-center text-outline/60 font-bold">لا توجد مواد مطابقة للبحث</td>
                    </tr>
                  ) : (
                    <>
                      {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getVirtualItems()[0].start > 0 && (
                        <tr><td style={{ padding: 0, height: `${rowVirtualizer.getVirtualItems()[0].start}px` }} colSpan={12} /></tr>
                      )}
                      {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const index = virtualRow.index;
                        const c = sortedChemicals[index];
                        return (
                          <tr 
                            key={c.id} 
                            onClick={() => setSelectedChemical(c)}
                            ref={rowVirtualizer.measureElement}
                            data-index={index}
                            className={cn(
                          "hover:bg-surface-container-low/40 transition-all group cursor-pointer text-base",
                          selectedChemical?.id === c.id && "bg-surface-container-low/60 border-r-4 border-primary"
                        )}
                      >
                        <td className="px-3 py-4">
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(c.id);
                            }}
                            className={cn(
                              "w-5 h-5 rounded border-2 cursor-pointer flex items-center justify-center transition-all",
                              selectedIds.includes(c.id) 
                                ? "bg-primary border-primary text-white scale-110" 
                                : "border-outline/30 group-hover:border-primary/50"
                            )}
                          >
                            {selectedIds.includes(c.id) && <Check size={12} />}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-bold text-secondary/60">{index + 1}</td>
                        <td className="px-3 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-primary break-words leading-tight">{c.nameEn}</span>
                            <span className="text-xs text-secondary/60 break-words mt-0.5">{c.nameAr}</span>
                          </div>
                        </td>
                        <td className="px-3 py-4 font-mono font-bold text-secondary/80 hidden sm:table-cell text-xs">{c.formula}</td>
                        <td className="px-3 py-4 font-black text-primary whitespace-nowrap">{c.quantity} <span className="text-[10px] text-secondary/60">{c.unit}</span></td>
                        <td className="px-3 py-4 font-bold text-secondary/80 hidden lg:table-cell text-xs">{c.state === 'solid' ? 'صلب' : c.state === 'liquid' ? 'سائل' : 'غاز'}</td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm",
                            c.hazardClass === 'danger' ? "bg-error-container text-on-error-container" : "bg-primary-fixed/40 text-primary"
                          )}>
                            {c.hazardClass === 'danger' ? 'خطر' : 'آمن'}
                          </span>
                        </td>
                        <td className="px-3 py-4 hidden xl:table-cell">
                          <div className="flex gap-1.5">
                            {c.ghs?.slice(0, 3).map((g, i) => (
                              <div 
                                key={i} 
                                className="w-9 h-9 bg-surface rounded-lg flex items-center justify-center border border-outline/20 p-1 shadow-sm hover:scale-125 transition-transform z-10 relative group/ghs" 
                                title={GHS_LABELS[g] || g}
                              >
                                {GHS_ICONS[g] ? (
                                  <img src={GHS_ICONS[g]} alt={g} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <span className="text-[8px] font-black">{g}</span>
                                )}
                                <div className="absolute bottom-full mb-2 hidden group-hover/ghs:block bg-secondary text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-xl">
                                  {GHS_LABELS[g] || g}
                                </div>
                              </div>
                            ))}
                            {c.ghs && c.ghs.length > 3 && <span className="text-[10px] text-secondary/40 self-center font-bold">+{c.ghs.length - 3}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-bold text-primary hidden md:table-cell text-xs">{c.shelf}</td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "font-bold whitespace-nowrap text-xs",
                            c.expiryDate && new Date(c.expiryDate) < new Date() ? "text-error flex items-center gap-1" : "text-secondary/80"
                          )}>
                            {formatDisplayDate(c.expiryDate)}
                            {c.expiryDate && new Date(c.expiryDate) < new Date() && <AlertTriangle size={14} />}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-xs text-secondary/60 hidden 2xl:table-cell min-w-[200px] leading-relaxed break-words">{c.notes}</td>
                        <td className="px-3 py-4 text-center">
                          <div className="flex gap-1 justify-center">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRequestSmartUpdate(c);
                              }}
                              disabled={isGenerating}
                              className="p-1.5 text-outline/40 hover:text-primary hover:bg-primary/10 transition-all rounded-full active:scale-90"
                              title="تحديث ذكي"
                            >
                              <Sparkles size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChemical(c);
                                setNewChemical({
                                  nameEn: c.nameEn,
                                  nameAr: c.nameAr,
                                  formula: c.formula,
                                  casNumber: c.casNumber || '',
                                  storageTemp: c.storageTemp || '',
                                  unit: c.unit,
                                  quantity: c.quantity,
                                  state: c.state,
                                  hazardClass: c.hazardClass,
                                  ghs: c.ghs,
                                  shelf: c.shelf,
                                  expiryDate: c.expiryDate,
                                  notes: c.notes
                                });
                                setIsAddModalOpen(true);
                              }}
                              className="p-1.5 text-outline/40 hover:text-primary hover:bg-primary/10 transition-all rounded-full active:scale-90"
                              title="تعديل"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteChemical(c.id, c.nameAr);
                              }}
                              className="p-1.5 text-outline/40 hover:text-error hover:bg-error/10 transition-all rounded-full active:scale-90"
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })}
                    {rowVirtualizer.getVirtualItems().length > 0 && rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0) > 0 && (
                      <tr><td style={{ padding: 0, height: `${rowVirtualizer.getTotalSize() - (rowVirtualizer.getVirtualItems()?.at(-1)?.end || 0)}px` }} colSpan={12} /></tr>
                    )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Details Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {selectedChemical ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              key={selectedChemical.id}
              className="bg-surface-container-lowest rounded-[32px] p-10 relative overflow-hidden border border-outline/10 shadow-sm"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-bl-[120px] -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-700"></div>
              <div className="relative z-10 space-y-8">
                <div className="flex items-start justify-between">
                  <span className={cn(
                    "text-[11px] px-4 py-1.5 rounded-[28px_28px_4px_28px] font-black uppercase tracking-widest shadow-sm",
                    selectedChemical.hazardClass === 'danger' ? "bg-error-container text-on-error-container" : "bg-tertiary-fixed/60 text-tertiary"
                  )}>
                    {selectedChemical.hazardClass === 'danger' ? 'مادة خطرة' : 'مادة آمنة'}
                  </span>
                  {selectedChemical.hazardClass === 'danger' && (
                    <div className="flex gap-2 text-error animate-pulse">
                      <AlertTriangle size={28} />
                    </div>
                  )}
                </div>
                
                <div>
                  <h2 className="text-3xl font-black text-primary mb-1 tracking-tight">{selectedChemical.nameEn}</h2>
                  <h3 className="text-xl font-bold text-secondary mb-2 tracking-tight">{selectedChemical.nameAr}</h3>
                  <p className="text-lg font-mono font-bold text-secondary/60">{selectedChemical.formula}</p>
                </div>

                <div className="space-y-5 pt-8 border-t border-outline/5">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">رقم CAS</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.casNumber || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">درجة التخزين</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.storageTemp || 'غير متوفر'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">الحالة</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.state === 'solid' ? 'صلب' : selectedChemical.state === 'liquid' ? 'سائل' : 'غاز'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">الرف</span>
                    <span className="font-black text-primary text-lg">{selectedChemical.shelf}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">الصلاحية</span>
                    <span className={cn(
                      "font-black text-lg",
                      selectedChemical.expiryDate && new Date(selectedChemical.expiryDate) < new Date() ? "text-error" : "text-primary"
                    )}>
                      {formatDisplayDate(selectedChemical.expiryDate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start">
                    <span className="text-base font-bold text-secondary/60 uppercase tracking-widest">ملاحظات</span>
                    <span className="font-black text-primary text-sm text-left flex-1 mr-4 leading-relaxed break-words">{selectedChemical.notes || 'لا توجد'}</span>
                  </div>

                  {selectedChemical.ghs && selectedChemical.ghs.length > 0 && (
                    <div className="pt-6 border-t border-outline/5">
                      <span className="text-[11px] font-black text-secondary/40 uppercase tracking-[0.2em] block mb-4">رموز السلامة GHS</span>
                      <div className="grid grid-cols-3 gap-4">
                        {selectedChemical.ghs.map((g, i) => (
                          <div 
                            key={i} 
                            className="bg-surface p-3 rounded-2xl border border-outline/10 shadow-md hover:shadow-lg hover:border-primary/30 transition-all flex flex-col items-center gap-2 group/card"
                          >
                            <div className="w-16 h-16 flex items-center justify-center group-hover/card:scale-110 transition-transform">
                              {GHS_ICONS[g] ? (
                                <img src={GHS_ICONS[g]} alt={g} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-black bg-surface-container-high rounded-xl">{g}</div>
                              )}
                            </div>
                            <span className="text-[10px] font-black text-secondary text-center leading-tight">
                              {GHS_LABELS[g] || g}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-black text-primary uppercase tracking-widest">مستوى المخزون</span>
                      <span className="text-2xl font-black text-primary">{selectedChemical.quantity} <span className="text-sm text-secondary/60">{selectedChemical.unit}</span></span>
                    </div>
                    <div className="h-3 w-full bg-surface-container rounded-full overflow-hidden border border-outline/5 shadow-inner">
                      <div className="h-full bg-primary rounded-full shadow-sm" style={{ width: '70%' }}></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => handlePrint(selectedChemical)}
                    className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90"
                    title="طباعة تعريفية"
                  >
                    <Printer size={22} />
                  </button>
                  <button 
                    onClick={() => handlePrintInventoryCards([selectedChemical])}
                    className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90"
                    title="طباعة بطاقة المخزون"
                  >
                    <FileText size={22} />
                  </button>
                  <button 
                    onClick={() => handleRequestSmartUpdate()}
                    disabled={isGenerating}
                    className="p-3 bg-primary-container hover:bg-primary/20 border border-primary/10 rounded-full text-primary transition-all active:scale-90 disabled:opacity-50" 
                    title="تحديث ذكي للمعلومات"
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={22} />
                    )}
                  </button>
                  <button className="p-3 bg-surface-container-low hover:bg-surface-container-high border border-outline/10 rounded-full text-primary transition-all active:scale-90" title="توليد رمز QR">
                    <QrCode size={22} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-surface-container-lowest rounded-[32px] p-12 text-center text-outline/60 font-bold border border-outline/10 border-dashed">
              اختر مادة من القائمة لعرض تفاصيلها المخبرية
            </div>
          )}

          <div className="bg-primary-container/30 backdrop-blur-sm p-8 rounded-[32px] text-on-primary-container border border-primary/10 relative overflow-hidden group shadow-sm">
            <div className="relative z-10">
              <h4 className="font-black text-lg mb-3 flex items-center gap-2 text-primary">
                <ShieldAlert size={20} />
                تعليمات السلامة
              </h4>
              <p className="text-sm font-medium text-primary/80 leading-relaxed">
                {selectedChemical?.hazardClass === 'danger' 
                  ? 'يجب ارتداء القفازات والنظارات الواقية عند التعامل مع هذه المادة. يحفظ في مكان بارد وجيد التهوية بعيداً عن مصادر الحرارة.'
                  : 'يرجى اتباع بروتوكولات المختبر القياسية عند التعامل مع هذه المادة لضمان سلامتك وسلامة الزملاء.'}
              </p>
            </div>
            <AlertTriangle className="absolute -bottom-6 -left-6 text-primary/5 w-32 h-32 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
          </div>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-10 min-w-[500px]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-black">{selectedIds.length} مادة مختارة</span>
              <span className="text-[10px] text-white/60 font-bold">يمكنك إجراء عمليات جماعية على هذه المواد</span>
            </div>

            <div className="h-10 w-px bg-surface/10" />

            <div className="flex gap-4">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-error/20 text-error-container hover:bg-error hover:text-white transition-all font-black text-sm"
              >
                <Trash2 size={18} />
                حذف المختار
              </button>
              
              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-sm"
                onClick={() => {
                  const items = chemicals.filter(c => selectedIds.includes(c.id));
                  const worksheet = XLSX.utils.json_to_sheet(items.map(c => ({
                    'Chemical': c.nameEn,
                    'Arabic': c.nameAr,
                    'Formula': c.formula,
                    'Qty': c.quantity,
                    'Unit': c.unit
                  })));
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "SelectedItems");
                  XLSX.writeFile(workbook, `selected_chemicals_${new Date().getTime()}.xlsx`);
                }}
              >
                <Download size={18} />
                تصدير المختار
              </button>

              <button 
                onClick={() => {
                  const items = chemicals.filter(c => selectedIds.includes(c.id));
                  handlePrintInventoryCards(items);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/20 text-primary-container hover:bg-primary hover:text-white transition-all font-black text-sm"
              >
                <Printer size={18} />
                بطاقات المختار
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="p-2.5 hover:bg-surface/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10"
            >
              <div className="p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5">
                <h3 className="text-2xl font-black text-primary">
                  {editingChemical ? 'تعديل بيانات المادة' : 'إضافة مادة كيميائية جديدة'}
                </h3>
                <button 
                  onClick={() => {
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
                  }} 
                  className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
              <form onSubmit={handleAddChemical} className="p-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                <div className="md:col-span-2 flex items-end gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">PRODUIT CHIMIQUE</label>
                    <input 
                      required
                      className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                      value={newChemical.nameEn || ''}
                      onChange={e => setNewChemical({...newChemical, nameEn: e.target.value})}
                    />
                  </div>
                  <button 
                    type="button"
                    onClick={handleSmartFill}
                    disabled={isGenerating}
                    className="bg-primary-container text-primary px-6 py-4 rounded-2xl flex items-center gap-2 font-black hover:bg-primary/10 transition-all active:scale-95 disabled:opacity-50 h-[58px]"
                    title="تعبئة ذكية للمعلومات"
                  >
                    {isGenerating ? (
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <Wand2 size={20} />
                    )}
                    <span className="hidden md:inline">تعبئة ذكية</span>
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الاسم العربي</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    value={newChemical.nameAr || ''}
                    onChange={e => setNewChemical({...newChemical, nameAr: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الصيغة الكيميائية</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    value={newChemical.formula || ''}
                    onChange={e => setNewChemical({...newChemical, formula: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">رقم CAS</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    value={newChemical.casNumber || ''}
                    onChange={e => setNewChemical({...newChemical, casNumber: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">درجة حرارة التخزين</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    value={newChemical.storageTemp || ''}
                    onChange={e => setNewChemical({...newChemical, storageTemp: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الحالة</label>
                  <select 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer"
                    value={newChemical.state || 'solid'}
                    onChange={e => setNewChemical({...newChemical, state: e.target.value})}
                  >
                    <option value="solid">صلب (Solid)</option>
                    <option value="liquid">سائل (Liquid)</option>
                    <option value="gas">غاز (Gas)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الكمية</label>
                  <div className="flex gap-3">
                    <input 
                      type="number"
                      required
                      className="flex-1 bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                      value={newChemical.quantity || 0}
                      onChange={e => setNewChemical({...newChemical, quantity: Number(e.target.value)})}
                    />
                    <select 
                      className="bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer"
                      value={newChemical.unit || 'g'}
                      onChange={e => setNewChemical({...newChemical, unit: e.target.value})}
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="L">L</option>
                      <option value="unit">Unit</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">تصنيف الخطورة</label>
                  <select 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer"
                    value={newChemical.hazardClass || 'safe'}
                    onChange={e => setNewChemical({...newChemical, hazardClass: e.target.value})}
                  >
                    <option value="safe">آمن</option>
                    <option value="danger">خطر</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">GHS (فواصل بين الرموز)</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    placeholder="GHS01, GHS02..."
                    value={newChemical.ghs?.join(', ') || ''}
                    onChange={e => setNewChemical({...newChemical, ghs: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الرف</label>
                  <input 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    value={newChemical.shelf || ''}
                    onChange={e => setNewChemical({...newChemical, shelf: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الصلاحية ⚠</label>
                  <input 
                    type="date"
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold"
                    value={newChemical.expiryDate || ''}
                    onChange={e => setNewChemical({...newChemical, expiryDate: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">ملاحظات</label>
                  <textarea 
                    className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold min-h-[100px]"
                    value={newChemical.notes || ''}
                    onChange={e => setNewChemical({...newChemical, notes: e.target.value})}
                  />
                </div>
                <div className="md:col-span-2 pt-6">
                  <button type="submit" className="w-full bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95">
                    {editingChemical ? 'حفظ التعديلات' : 'تأكيد إضافة المادة للمخزن'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Update Confirmation Modal */}
      <AnimatePresence>
        {isBulkConfirmOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBulkConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface-container-lowest rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-outline/10 text-right"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
                <Sparkles size={40} className="text-primary" />
              </div>
              <h3 className="text-3xl font-black text-primary mb-4 tracking-tight">تحديث ذكي شامل</h3>
              <p className="text-secondary/80 text-lg leading-relaxed mb-10">
                هل أنت متأكد من رغبتك في تحديث معلومات <span className="font-black text-primary">{chemicals.length}</span> مادة ذكياً؟ 
                <br /><br />
                قد تستغرق هذه العملية بعض الوقت. سيتم تحديث البيانات تلقائياً بناءً على اقتراحات الذكاء الاصطناعي.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleBulkSmartUpdate}
                  className="flex-1 bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95"
                >
                  بدء التحديث
                </button>
                <button 
                  onClick={() => setIsBulkConfirmOpen(false)}
                  className="flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Update Modal */}
      <AnimatePresence>
        {isReviewModalOpen && suggestedUpdate && selectedChemical && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute inset-0 bg-primary/20 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-surface w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10"
            >
              <div className="p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-2xl text-primary">
                    <Sparkles size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-primary">مراجعة التحديث الذكي</h3>
                </div>
                <button 
                  onClick={() => setIsReviewModalOpen(false)} 
                  className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-10 space-y-8 max-h-[70vh] overflow-y-auto no-scrollbar">
                <p className="text-secondary/80 font-bold text-center bg-surface-container-low p-4 rounded-2xl border border-outline/5">
                  تم العثور على معلومات أكثر دقة لهذه المادة. يرجى مراجعة التغييرات المقترحة أدناه قبل الموافقة.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Current Data */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-secondary/40 uppercase tracking-widest border-b border-outline/5 pb-2">المعلومات الحالية</h4>
                    <div className="space-y-4">
                      <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">الاسم</label>
                        <p className="font-bold text-secondary">{selectedChemical.nameEn} / {selectedChemical.nameAr}</p>
                      </div>
                      <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">الصيغة</label>
                        <p className="font-mono font-bold text-secondary">{selectedChemical.formula}</p>
                      </div>
                      <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">رقم CAS</label>
                        <p className="font-bold text-secondary">{selectedChemical.casNumber || 'غير متوفر'}</p>
                      </div>
                      <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">درجة التخزين</label>
                        <p className="font-bold text-secondary">{selectedChemical.storageTemp || 'غير متوفر'}</p>
                      </div>
                      <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">الخطورة</label>
                        <p className="font-bold text-secondary">{selectedChemical.hazardClass === 'danger' ? 'خطر' : 'آمن'}</p>
                      </div>
                      <div className="bg-surface-container-low/50 p-4 rounded-2xl">
                        <label className="text-[10px] font-black text-secondary/40 uppercase block mb-1">ملاحظات</label>
                        <p className="text-xs text-secondary/60">{selectedChemical.notes || 'لا توجد'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Data */}
                  <div className="space-y-6">
                    <h4 className="text-sm font-black text-primary uppercase tracking-widest border-b border-primary/10 pb-2">المعلومات المقترحة ✨</h4>
                    <div className="space-y-4">
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all",
                        (suggestedUpdate.nameEn !== selectedChemical.nameEn || suggestedUpdate.nameAr !== selectedChemical.nameAr) 
                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                          : "bg-surface-container-low/50 border-transparent"
                      )}>
                        <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">الاسم</label>
                        <p className="font-bold text-primary">{suggestedUpdate.nameEn} / {suggestedUpdate.nameAr}</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all",
                        suggestedUpdate.formula !== selectedChemical.formula 
                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                          : "bg-surface-container-low/50 border-transparent"
                      )}>
                        <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">الصيغة</label>
                        <p className="font-mono font-bold text-primary">{suggestedUpdate.formula}</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all",
                        suggestedUpdate.casNumber !== selectedChemical.casNumber 
                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                          : "bg-surface-container-low/50 border-transparent"
                      )}>
                        <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">رقم CAS</label>
                        <p className="font-bold text-primary">{suggestedUpdate.casNumber}</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all",
                        suggestedUpdate.storageTemp !== selectedChemical.storageTemp 
                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                          : "bg-surface-container-low/50 border-transparent"
                      )}>
                        <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">درجة التخزين</label>
                        <p className="font-bold text-primary">{suggestedUpdate.storageTemp}</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all",
                        suggestedUpdate.hazardClass !== selectedChemical.hazardClass 
                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                          : "bg-surface-container-low/50 border-transparent"
                      )}>
                        <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">الخطورة</label>
                        <p className="font-bold text-primary">{suggestedUpdate.hazardClass === 'danger' ? 'خطر' : 'آمن'}</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-2xl border transition-all",
                        suggestedUpdate.notes !== selectedChemical.notes 
                          ? "bg-primary/5 border-primary/20 shadow-sm" 
                          : "bg-surface-container-low/50 border-transparent"
                      )}>
                        <label className="text-[10px] font-black text-primary/40 uppercase block mb-1">ملاحظات</label>
                        <p className="text-xs text-primary/80">{suggestedUpdate.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-surface-container-low border-t border-outline/5 flex gap-4">
                <button 
                  onClick={handleApproveUpdate}
                  className="flex-1 bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <Check size={24} />
                  موافقة وتحديث البيانات
                </button>
                <button 
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <RotateCcw size={24} />
                  إلغاء التغييرات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQRScannerOpen && (
          <QRScanner
            onClose={() => setIsQRScannerOpen(false)}
            onScan={(data) => {
              setIsQRScannerOpen(false);
              let actualId = data;
              if (data.startsWith('APP_ID_')) {
                const parts = data.split('_');
                actualId = parts.slice(2, -1).join('_');
              }
              setSearchTerm(actualId);
              // Find item
              const item = chemicals.find(e => e.id === actualId || e.id === data);
              if (item) {
                setSelectedChemical(item);
                setEditingChemical(item);
                setIsAddModalOpen(true);
                // Also scroll top or let modal show
              } else {
                alert('عذراً، لم يتم العثور على المادة بهذه الشيفرة.');
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
