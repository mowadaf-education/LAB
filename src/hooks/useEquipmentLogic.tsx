import { useState, useEffect, useRef } from 'react';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, updateDoc, writeBatch, orderBy, where, getDocs, limit } from 'firebase/firestore';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import * as XLSX from 'xlsx';
import { getEquipmentIntelligence, EquipmentIntelligence, ensureApiKey } from '../services/geminiService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFService } from '../services/pdfService';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import { Equipment, MaintenanceLog } from '../types/equipment';

export function useEquipmentLogic(isNested = false) {
  const { schoolId, schoolName, directorate } = useSchool();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('filter') || 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [isSmartUpdating, setIsSmartUpdating] = useState(false);
  const [isSmartUpdateConfirmOpen, setIsSmartUpdateConfirmOpen] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [sortField, setSortField] = useState<keyof Equipment | 'none'>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [qrCodeItem, setQrCodeItem] = useState<Equipment | null>(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const targetId = searchParams.get('id');
    if (targetId && equipment.length > 0) {
      let actualId = targetId;
      if (targetId.startsWith('APP_ID_')) {
        const parts = targetId.split('_');
        actualId = parts.slice(2, -1).join('_');
      }
      setSearchTerm(actualId);
      
      const item = equipment.find(e => e.id === targetId || e.id === actualId);
      if (item) {
        setEditingEquipment(item);
        setNewEquipment({
          name: item.name,
          type: item.type,
          serialNumber: item.serialNumber,
          status: item.status,
          totalQuantity: item.totalQuantity,
          availableQuantity: item.availableQuantity,
          brokenQuantity: item.brokenQuantity,
          supplier: item.supplier || '',
          location: item.location || '',
          notes: item.notes || '',
          foundationalInventory: item.foundationalInventory || '',
          decennialReview: item.decennialReview || ''
        });
        setIsAddModalOpen(true);
      }
    }
  }, [searchParams, equipment]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedEquipHistory, setSelectedEquipHistory] = useState<MaintenanceLog[]>([]);
  const [currentEquipName, setCurrentEquipName] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [suggestedUpdate, setSuggestedUpdate] = useState<any>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  const [newEquipment, setNewEquipment] = useState<Partial<Equipment>>({
    name: '',
    type: 'glassware',
    serialNumber: '',
    status: 'functional',
    totalQuantity: 0,
    availableQuantity: 0,
    brokenQuantity: 0,
    supplier: '',
    location: '',
    notes: '',
    foundationalInventory: '',
    decennialReview: ''
  });

  useEffect(() => {
    if (!schoolId) return;
    const q = query(getUserCollection(schoolId, 'equipment'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Equipment));
      setEquipment(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'equipment');
    });
    return () => unsubscribe();
  }, [schoolId]);

  const handleAddEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquipment) {
        const { id } = editingEquipment;
        await updateDoc(doc(getUserCollection(schoolId, 'equipment'), id), {
          ...newEquipment,
          updatedAt: serverTimestamp()
        });
        await logActivity(schoolId, LogAction.UPDATE, LogModule.EQUIPMENT, `تعديل بيانات الجهاز: ${newEquipment.name}`, id);
      } else {
        const docRef = await addDoc(getUserCollection(schoolId, 'equipment'), {
          ...newEquipment,
          createdAt: serverTimestamp()
        });
        await logActivity(schoolId, LogAction.CREATE, LogModule.EQUIPMENT, `إضافة جهاز جديد: ${newEquipment.name}`, docRef.id);
      }
      setIsAddModalOpen(false);
      setEditingEquipment(null);
      setNewEquipment({
        name: '',
        type: 'glassware',
        serialNumber: '',
        status: 'functional',
        totalQuantity: 0,
        availableQuantity: 0,
        brokenQuantity: 0
      });
    } catch (error) {
      handleFirestoreError(error, editingEquipment ? OperationType.UPDATE : OperationType.CREATE, 'equipment');
    }
  };

  const handleDeleteEquipment = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'equipment'), id));
      await logActivity(schoolId, LogAction.DELETE, LogModule.EQUIPMENT, `حذف الجهاز: ${name}`, id);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `equipment/${id}`);
    }
  };

  const handleImportXLS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const batch = writeBatch(db);
        data.forEach((item) => {
          const docRef = doc(getUserCollection(schoolId, 'equipment'));
          const type = (item['النوع'] || item['Type'] || 'other').toLowerCase();
          const status = (item['الحالة'] || item['Status'] || 'functional').toLowerCase();
          const name = item['تعيين الجهاز'] || item['الاسم'] || item['Name'] || 'جهاز غير مسمى';
          const quantity = Number(item['الكمية'] || item['الكمية الإجمالية'] || item['Total'] || 0);
          
          batch.set(docRef, {
            name: String(name).trim() || 'جهاز غير مسمى',
            type: type === 'زجاجيات' || type === 'glassware' ? 'glassware' : type === 'أجهزة' || type === 'tech' ? 'tech' : 'other',
            serialNumber: item['رقم الجرد'] || item['الرقم التسلسلي'] || item['Serial'] || '',
            status: status === 'سليم' || status === 'functional' ? 'functional' : status === 'صيانة' || status === 'maintenance' ? 'maintenance' : 'broken',
            totalQuantity: isNaN(quantity) ? 0 : quantity,
            availableQuantity: isNaN(quantity) ? 0 : quantity,
            brokenQuantity: 0,
            supplier: item['الممون'] || '',
            location: item['الموقع'] || '',
            notes: item['ملاحظات'] || '',
            foundationalInventory: item['الجرد التأسيسي'] || '',
            decennialReview: item['المراجعة العشرية'] || '',
            createdAt: serverTimestamp()
          });
        });

        await batch.commit();
        alert(`تم استيراد ${data.length} صنف بنجاح!`);
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

  const handleUpdateStatus = async (id: string, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;
    try {
      await updateDoc(doc(getUserCollection(schoolId, 'equipment'), id), { status: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `equipment/${id}`);
    }
  };

  const fetchHistory = async (id: string, name: string) => {
    setCurrentEquipName(name);
    try {
      const q = query(
        getUserCollection(schoolId, 'equipment'), 
        orderBy('date', 'desc'),
        limit(20)
      );
      const snapshot = await getDocs(q);
      const logs = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as MaintenanceLog))
        .filter(log => log.equipmentId === id);
      setSelectedEquipHistory(logs);
      setIsHistoryModalOpen(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'maintenance_logs');
    }
  };

  const handleExportXLS = () => {
    if (equipment.length === 0) {
      alert('لا توجد بيانات لتصديرها.');
      return;
    }

    const exportData = equipment.map(e => ({
      'رقم الجرد': e.serialNumber || '---',
      'تعيين الجهاز': e.name,
      'النوع': e.type === 'glassware' ? 'زجاجيات' : e.type === 'tech' ? 'أجهزة تقنية' : 'أخرى',
      'الكمية': e.totalQuantity,
      'الممون': e.supplier || '---',
      'الموقع': e.location || '---',
      'الحالة': e.status === 'functional' ? 'سليم' : e.status === 'maintenance' ? 'صيانة' : 'تالف',
      'الجرد التأسيسي': e.foundationalInventory || '---',
      'المراجعة العشرية': e.decennialReview || '---',
      'ملاحظات': e.notes || '---'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment");
    XLSX.writeFile(workbook, `جرد_العتاد_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة القائمة');
      return;
    }

    const today = new Date();
    const formattedDate = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

    const tableRows = filteredEquipment.map((e, index) => `
      <tr>
        <td style="text-align: center;">${(index + 1).toString().padStart(2, '0')}</td>
        <td style="font-weight: 600;">${e.name}</td>
        <td style="text-align: center;">${e.type === 'glassware' ? 'زجاجيات' : e.type === 'tech' ? 'أجهزة تقنية' : 'أخرى'}</td>
        <td style="text-align: center; font-weight: 600;">${e.totalQuantity}</td>
        <td style="text-align: center;">${e.availableQuantity}</td>
        <td style="text-align: center;">${e.brokenQuantity}</td>
        <td style="text-align: center;">${e.status === 'functional' ? 'سليم' : e.status === 'maintenance' ? 'صيانة' : 'تالف'}</td>
        <td>${e.location || '-'}</td>
        <td style="font-size: 0.85em;">${e.notes || '-'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>سجل جرد العتاد والزجاجيات - ${formattedDate}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            @page { size: A4 landscape; margin: 10mm; }
            body { 
              font-family: 'Cairo', sans-serif; 
              margin: 0; 
              padding: 10px; 
              color: #1a1a1a;
              line-height: 1.4;
            }
            .official-header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #000;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .header-right { text-align: right; font-size: 12px; font-weight: bold; }
            .header-center { text-align: center; }
            .header-center p { margin: 2px 0; font-weight: bold; }
            .header-center .republic { font-size: 14px; font-weight: 900; }
            .header-left { text-align: left; font-size: 12px; font-weight: bold; }
            
            .doc-title { 
              text-align: center; 
              font-size: 22px; 
              font-weight: 900; 
              text-decoration: underline;
              margin: 20px 0;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              font-size: 11px;
            }
            th, td { 
              border: 1px solid #000; 
              padding: 8px 4px; 
              text-align: right; 
            }
            th { 
              background-color: #f3f4f6; 
              font-weight: 700; 
              text-align: center;
            }
            .footer {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              padding: 0 50px;
            }
            .sig-box { text-align: center; width: 200px; }
            .sig-box p { margin-bottom: 50px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="official-header">
            <div class="header-right">
              <p>مديرية التربية لولاية: ${directorate}</p>
              <p>المؤسسة: ${schoolName}</p>
            </div>
            <div class="header-center">
              <p class="republic">الجمهورية الجزائرية الديمقراطية الشعبية</p>
              <p>وزارة التربية الوطنية</p>
            </div>
            <div class="header-left">
              <p>السنة الدراسية: 2025 - 2026</p>
            </div>
          </div>

          <h2 class="doc-title">سجل جرد العتاد والزجاجيات المخبرية</h2>
          
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">رقم</th>
                <th>تعيين الجهاز / الأداة</th>
                <th style="width: 80px;">النوع</th>
                <th style="width: 50px;">الإجمالي</th>
                <th style="width: 50px;">السليم</th>
                <th style="width: 50px;">التالف</th>
                <th style="width: 60px;">الحالة</th>
                <th style="width: 100px;">الموقع</th>
                <th>ملاحظات</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            <div class="sig-box"><p>المقتصد / مسير المصالح الاقتصادية</p>..........................</div>
            <div class="sig-box"><p>مسؤول المخبر</p>..........................</div>
            <div class="sig-box"><p>مدير المؤسسة</p>..........................</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintInventoryCards = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة بطاقات الجرد');
      return;
    }

    const cardsHtml = filteredEquipment.map((e) => `
      <div class="card">
        <div class="card-header">
          <div class="ministry">وزارة التربية الوطنية</div>
          <div class="institution">${schoolName}</div>
        </div>
        <div class="card-title">بطاقة جرد العتاد</div>
        <div class="card-body">
          <div class="field"><span class="label">تعيين الجهاز:</span> <span class="value">${e.smartNameAr || e.name}</span></div>
          <div class="field"><span class="label">رقم الجرد:</span> <span class="value">${e.serialNumber || '---'}</span></div>
          <div class="field"><span class="label">النوع:</span> <span class="value">${e.type === 'glassware' ? 'زجاجيات' : e.type === 'tech' ? 'أجهزة تقنية' : 'أخرى'}</span></div>
          <div class="field"><span class="label">الموقع:</span> <span class="value">${e.location || '---'}</span></div>
        </div>
        <div class="card-qr">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(JSON.stringify({ id: e.id, type: 'equipment', name: e.name }))}" alt="QR Code" />
        </div>
        <div class="card-footer">نظام تسيير المخابر - الأرضية الرقمية</div>
      </div>
    `).join('');

    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>طباعة بطاقات الجرد</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
            body { 
              font-family: 'Cairo', sans-serif; 
              margin: 0; 
              padding: 20px; 
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
              gap: 20px;
              background: #f5f5f5;
            }
            @media print {
              body { background: white; padding: 0; }
              .card { break-inside: avoid; margin-bottom: 10px; }
            }
            .card {
              background: white;
              border: 2px solid #1a2744;
              border-radius: 12px;
              padding: 15px;
              position: relative;
              height: 180px;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .card-header {
              text-align: center;
              font-size: 10px;
              font-weight: bold;
              border-bottom: 1px solid #eee;
              padding-bottom: 5px;
              margin-bottom: 5px;
            }
            .card-title {
              text-align: center;
              font-size: 14px;
              font-weight: 900;
              color: #1a2744;
              margin-bottom: 10px;
            }
            .card-body {
              font-size: 11px;
              flex-grow: 1;
            }
            .field { margin-bottom: 4px; display: flex; gap: 5px; }
            .label { font-weight: 900; color: #1a2744; min-width: 70px; }
            .value { font-weight: bold; color: #333; }
            .card-qr {
              position: absolute;
              bottom: 15px;
              left: 15px;
            }
            .card-qr img { width: 60px; height: 60px; }
            .card-footer {
              text-align: center;
              font-size: 8px;
              color: #999;
              border-top: 1px solid #eee;
              padding-top: 5px;
              margin-top: 5px;
            }
          </style>
        </head>
        <body>
          ${cardsHtml}
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportPDF = async () => {
    const headers = ['#', 'تعيين الجهاز', 'النوع', 'الكمية', 'رقم الجرد', 'الموقع', 'الحالة'];
    const tableData = filteredEquipment.map((e, index) => [
      index + 1,
      e.smartNameAr || e.name,
      e.type === 'glassware' ? 'زجاجيات' : e.type === 'tech' ? 'أجهزة تقنية' : 'أخرى',
      e.totalQuantity,
      e.serialNumber || '---',
      e.location || '---',
      e.status === 'functional' ? 'سليم' : e.status === 'maintenance' ? 'صيانة' : 'تالف'
    ]);

    await PDFService.generateTablePDF(
      'تقرير جرد العتاد والزجاجيات المخبرية',
      headers,
      tableData,
      `equipment_inventory_${new Date().toISOString().split('T')[0]}`
    );
  };

  const handleSmartUpdate = async () => {
    if (equipment.length === 0) {
      alert('لا توجد بيانات لتحديثها.');
      return;
    }

    setIsSmartUpdateConfirmOpen(false);

    // Ensure API key is available before starting
    const hasKey = await ensureApiKey();
    if (!hasKey) {
      alert('يرجى اختيار مفتاح API الخاص بك لاستخدام ميزة التحديث الذكي.');
      return;
    }

    setIsSmartUpdating(true);
    setBulkProgress({ current: 0, total: equipment.length });

    try {
      // Process in chunks to avoid large payloads
      const CHUNK_SIZE = 10;
      for (let i = 0; i < equipment.length; i += CHUNK_SIZE) {
        const chunk = equipment.slice(i, i + CHUNK_SIZE);
        const itemsToProcess = chunk.map(item => ({ id: item.id, name: item.name }));
        
        const enrichedData = await getEquipmentIntelligence(itemsToProcess);
        
        if (!enrichedData) {
          throw new Error('فشل الحصول على بيانات الذكاء الاصطناعي.');
        }

        const batch = writeBatch(db);
        enrichedData.forEach((update: any) => {
          const docRef = doc(getUserCollection(schoolId, 'equipment'), update.id);
          batch.update(docRef, {
            smartNameAr: update.smartNameAr,
            smartDescriptionAr: update.smartDescriptionAr,
            imageKeyword: update.imageKeyword,
            lastSmartUpdate: serverTimestamp()
          });
        });
        
        await batch.commit();
        setBulkProgress({ current: Math.min(i + CHUNK_SIZE, equipment.length), total: equipment.length });
        
        // Small delay between chunks to respect rate limits (15 RPM for free tier)
        if (i + CHUNK_SIZE < equipment.length) {
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      alert('تم التحديث الذكي لجميع التجهيزات بنجاح!');
    } catch (error: any) {
      console.error('Error in smart update:', error);
      const errorMsg = error.message || '';
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        alert('تم تجاوز حد الاستخدام المسموح به للذكاء الاصطناعي (Quota Exceeded). يرجى الانتظار قليلاً ثم المحاولة مرة أخرى.');
      } else {
        alert('حدث خطأ أثناء التحديث الذكي. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setIsSmartUpdating(false);
      setBulkProgress({ current: 0, total: 0 });
    }
  };

  const handlePrint = (e: Equipment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>بطاقة تقنية - ${e.name}</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 40px; background: #fdfdfb; }
            .header { text-align: center; border-bottom: 3px solid #1a2744; padding-bottom: 30px; margin-bottom: 40px; }
            .title { font-size: 32px; font-weight: 900; color: #1a2744; margin-bottom: 10px; }
            .subtitle { font-size: 14px; color: #666; font-weight: bold; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
            .item { border-bottom: 1px solid #eee; padding: 15px 0; display: flex; justify-content: space-between; }
            .label { font-weight: 900; color: #1a2744; }
            .value { font-weight: bold; color: #444; }
            .footer { margin-top: 80px; text-align: left; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">بطاقة تقنية للعتاد المخبري</div>
            <div class="subtitle">نظام تسيير المخابر المدرسية — الأرضية الرقمية</div>
          </div>
          <div class="details">
            <div class="item"><span class="label">اسم الصنف:</span> <span class="value">${e.name}</span></div>
            <div class="item"><span class="label">النوع:</span> <span class="value">${e.type === 'glassware' ? 'زجاجيات' : e.type === 'tech' ? 'أجهزة تقنية' : 'أخرى'}</span></div>
            <div class="item"><span class="label">الرقم التسلسلي:</span> <span class="value">${e.serialNumber || 'N/A'}</span></div>
            <div class="item"><span class="label">الحالة الحالية:</span> <span class="value">${e.status === 'functional' ? 'سليم' : e.status === 'maintenance' ? 'صيانة' : 'تالف'}</span></div>
            <div class="item"><span class="label">الكمية الإجمالية:</span> <span class="value">${e.totalQuantity}</span></div>
            <div class="item"><span class="label">الكمية المتوفرة:</span> <span class="value">${e.availableQuantity}</span></div>
            <div class="item"><span class="label">الكمية التالفة:</span> <span class="value">${e.brokenQuantity}</span></div>
          </div>
          <div class="footer">طبع بتاريخ: ${new Date().toLocaleString('ar-DZ')}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSort = (field: keyof Equipment) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredEquipment.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredEquipment.map(e => e.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} صنف؟`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(getUserCollection(schoolId, 'equipment'), id));
      });
      await batch.commit();
      await logActivity(schoolId, LogAction.DELETE, LogModule.EQUIPMENT, `حذف جماعي لـ ${selectedIds.length} صنف`);
      setSelectedIds([]);
      alert('تم الحذف بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'equipment/bulk');
    }
  };

  const handleBulkStatusUpdate = async (status: Equipment['status']) => {
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.update(doc(getUserCollection(schoolId, 'equipment'), id), { 
          status,
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      await logActivity(schoolId, LogAction.UPDATE, LogModule.EQUIPMENT, `تحديث حالة جماعي (${status}) لـ ${selectedIds.length} صنف`);
      setSelectedIds([]);
      alert('تم تحديث الحالة بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'equipment/bulk-status');
    }
  };

  const handleRequestSmartUpdate = async (item: Equipment) => {
    const hasKey = await ensureApiKey();
    if (!hasKey) {
      alert('يرجى تهيئة مفتاح API لاستخدام الميزات الذكية.');
      return;
    }

    setIsAnalyzing(true);
    setSelectedEquipment(item);
    try {
      const result = await getEquipmentIntelligence([{ id: item.id, name: item.name }]);
      if (result && result.length > 0) {
        setSuggestedUpdate(result[0]);
        setIsReviewModalOpen(true);
      } else {
        alert('فشل الذكاء الاصطناعي في تحليل هذا الصنف.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApproveUpdate = async () => {
    if (!suggestedUpdate || !selectedEquipment) return;
    try {
      await updateDoc(doc(getUserCollection(schoolId, 'equipment'), selectedEquipment.id), {
        smartNameAr: suggestedUpdate.smartNameAr,
        smartDescriptionAr: suggestedUpdate.smartDescriptionAr,
        imageKeyword: suggestedUpdate.imageKeyword,
        updatedAt: serverTimestamp()
      });
      setIsReviewModalOpen(false);
      setSuggestedUpdate(null);
      setSelectedEquipment(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `equipment/${selectedEquipment.id}`);
    }
  };

  const handleBulkSmartUpdate = async () => {
    setIsBulkConfirmOpen(false);
    const hasKey = await ensureApiKey();
    if (!hasKey) {
      alert('يرجى تهيئة مفتاح API لاستخدام الميزات الذكية.');
      return;
    }

    setIsBulkUpdating(true);
    const CHUNK_SIZE = 5;
    let processed = 0;
    const total = equipment.length;
    setBulkProgress({ current: 0, total });

    try {
      for (let i = 0; i < total; i += CHUNK_SIZE) {
        const chunk = equipment.slice(i, i + CHUNK_SIZE);
        const chunkResults = await getEquipmentIntelligence(chunk.map(e => ({ id: e.id, name: e.name })));
        
        if (chunkResults) {
          const batch = writeBatch(db);
          chunkResults.forEach(res => {
            batch.update(doc(getUserCollection(schoolId, 'equipment'), res.id), {
              smartNameAr: res.smartNameAr,
              smartDescriptionAr: res.smartDescriptionAr,
              imageKeyword: res.imageKeyword,
              updatedAt: serverTimestamp()
            });
          });
          await batch.commit();
        }
        
        processed += chunk.length;
        setBulkProgress({ current: processed, total });
      }
      alert('تم تحديث جميع العتاد ذكياً بنجاح!');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء التحديث الجماعي.');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const filteredEquipment = equipment
    .filter(e => {
      const matchesSearch = 
        e.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.smartNameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || 
                         (filterType === 'smart' ? !!e.smartNameAr : e.type === filterType);
      
      const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'none') return 0;
      
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (aValue === undefined || bValue === undefined) return 0;

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  const rowVirtualizer = useVirtualizer({
    count: filteredEquipment.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
    overscan: 10,
  });

  const totalPieces = equipment.reduce((acc, curr) => acc + (Number(curr.totalQuantity) || 0), 0);
  const totalAvailable = equipment.reduce((acc, curr) => acc + (Number(curr.availableQuantity) || 0), 0);
  const totalBroken = equipment.reduce((acc, curr) => acc + (Number(curr.brokenQuantity) || 0), 0);
  const totalTypes = equipment.length;

  return {
    schoolId,
    schoolName,
    directorate,
    searchParams,
    navigate,
    equipment,
    loading,
    searchTerm, setSearchTerm,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    isAddModalOpen, setIsAddModalOpen,
    editingEquipment, setEditingEquipment,
    isSmartUpdating,
    isSmartUpdateConfirmOpen, setIsSmartUpdateConfirmOpen,
    bulkProgress,
    sortField,
    sortDirection,
    qrCodeItem, setQrCodeItem,
    isQRModalOpen, setIsQRModalOpen,
    isQRScannerOpen, setIsQRScannerOpen,
    selectedIds, setSelectedIds,
    fileInputRef,
    isImporting,
    isHistoryModalOpen, setIsHistoryModalOpen,
    selectedEquipHistory,
    currentEquipName,
    isAnalyzing,
    isBulkUpdating,
    suggestedUpdate, setSuggestedUpdate,
    isReviewModalOpen, setIsReviewModalOpen,
    isBulkConfirmOpen, setIsBulkConfirmOpen,
    selectedEquipment,
    newEquipment, setNewEquipment,
    handleAddEquipment,
    handleDeleteEquipment,
    handleImportXLS,
    handleUpdateStatus,
    fetchHistory,
    handleExportXLS,
    handlePrintList,
    handlePrintInventoryCards,
    handleExportPDF,
    handleSmartUpdate,
    handlePrint,
    handleSort,
    handleToggleSelect,
    handleSelectAll,
    handleBulkDelete,
    handleBulkStatusUpdate,
    handleRequestSmartUpdate,
    handleApproveUpdate,
    handleBulkSmartUpdate,
    filteredEquipment,
    rowVirtualizer,
    parentRef,
    totalPieces,
    totalAvailable,
    totalBroken,
    totalTypes
  };
}
