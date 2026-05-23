import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, updateDoc, doc, collection } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { 
  Printer, 
  Search, 
  Plus, 
  Database, 
  ArrowRight,
  FileText,
  QrCode,
  Trash2,
  Package,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import logo from '/ministry-logo.png';

interface InventoryItem {
  id: string;
  serialNumber: string;
  name: string;
  foundationalInventory: string;
  decennialReview: string;
  totalQuantity: number;
  supplier: string;
  status: string;
  notes: string;
}

type SortField = keyof InventoryItem | 'index';
type SortDirection = 'asc' | 'desc' | null;

export default function InventoryCardsRegistry() {
  const { schoolId, schoolName, directorate } = useSchool();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [printingItem, setPrintingItem] = useState<InventoryItem | null>(null);
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    const handleAfterPrint = () => setPrintingItem(null);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  useEffect(() => {
    // Listen to equipment collection
    const q = query(getUserCollection(schoolId, 'equipment'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const equipmentItems = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          serialNumber: data.serialNumber || '',
          name: data.name || '',
          foundationalInventory: data.foundationalInventory || '',
          decennialReview: data.decennialReview || '',
          totalQuantity: data.totalQuantity || 0,
          supplier: data.supplier || '',
          status: data.status === 'functional' ? 'جيدة' : 
                  data.status === 'maintenance' ? 'تحتاج صيانة' : 
                  data.status === 'broken' ? 'عاطلة' : data.status || 'جيدة',
          notes: data.notes || ''
        } as InventoryItem;
      });
      setItems(equipmentItems);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'equipment');
    });

    return () => unsubscribe();
  }, []);

  const handleUpdateItem = async (id: string, field: string, value: any) => {
    try {
      let finalValue = value;
      let finalField = field;

      // Map back status labels if needed
      if (field === 'status') {
          if (value === 'جيدة') finalValue = 'functional';
          else if (value === 'تحتاج صيانة' || value === 'في الإصلاح') finalValue = 'maintenance';
          else if (value === 'عاطلة' || value === 'مفقودة') finalValue = 'broken';
      }

      await updateDoc(doc(getUserCollection(schoolId, 'equipment'), id), {
        [finalField]: finalValue
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `equipment/${id}`);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortDirection || sortField === 'index') return 0;
    
    const aValue = a[sortField as keyof InventoryItem];
    const bValue = b[sortField as keyof InventoryItem];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue, 'ar') 
        : bValue.localeCompare(aValue, 'ar');
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  const filteredItems = sortedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: items.length,
    good: items.filter(i => i.status === 'جيدة' || i.status === 'functional').length,
    maintenance: items.filter(i => i.status === 'تحتاج صيانة' || i.status === 'maintenance').length,
    broken: items.filter(i => i.status === 'عاطلة' || i.status === 'broken' || i.status === 'مفقودة').length
  };

  const handlePrint = () => {
    setPrintingItem(null);
    setTimeout(() => window.print(), 100);
  };

  const handlePrintIndividual = (item: InventoryItem) => {
    setPrintingItem(item);
    setTimeout(() => window.print(), 100);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronsUpDown size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Printable Cards Layout (Hidden on screen) */}
      <div className="hidden print:block font-sans rtl" dir="rtl">
        <style>
          {`
            @media print {
              @page {
                size: A5 portrait;
                margin: 5mm;
              }
              body { background: white !important; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
              .pcard {
                background: white;
                border: 1.5px solid #000;
                padding: 4mm 5mm;
                width: 100%;
                height: calc(148mm - 10mm);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                box-shadow: none;
                margin: 0;
                page-break-after: always;
                break-after: page;
                page-break-inside: avoid;
                break-inside: avoid;
                gap: 1.5mm;
              }
              .pcard:last-child {
                page-break-after: avoid;
                break-after: avoid;
              }
              .ph {
                display: grid; grid-template-columns: 1fr 1.5fr 1fr;
                border-bottom: 1px solid #000;
                padding-bottom: 1.5mm; margin-bottom: 0;
                font-size: 6pt; gap: 2px; align-items: start;
                flex-shrink: 0;
              }
              .ph-r { text-align: right; font-weight: bold; line-height: 1.45; }
              .ph-c { text-align: center; font-weight: bold; line-height: 1.45; }
              .ph-l { text-align: left; font-size: 5.5pt; line-height: 1.45; }
              .pcard-title {
                text-align: center; font-size: 9pt; font-weight: 800;
                text-decoration: underline; text-underline-offset: 1.5px;
                flex-shrink: 0; padding: 0.5mm 0;
              }
              .ic-years {
                display: flex; justify-content: space-between;
                font-size: 6pt; flex-shrink: 0;
              }
              .ic-meta {
                display: grid; grid-template-columns: repeat(4,1fr);
                border: 1px solid #000; flex-shrink: 0;
              }
              .ic-mf { padding: 1mm 2mm; border-left: 1px solid #000; font-size: 6pt; }
              .ic-mf:last-child { border-left: none; }
              .ml { font-weight: bold; font-size: 5.5pt; color: #333; }
              .mv { border-bottom: 1px solid #777; min-height: 8mm; padding: 0.5mm 1mm; font-size: 6.5pt; }
              .ic-serial { font-weight: 800; font-size: 8pt; }
              .ic-stamp { min-height: 10mm; }
              .ic-sec { flex-shrink: 0; }
              .ist { font-weight: bold; font-size: 6pt; margin-bottom: 0.5mm; }
              .idl { border-bottom: 1px dotted #666; min-height: 5mm; padding: 0.5mm 1mm; font-size: 6pt; margin-bottom: 1mm; }
              .ic-name { font-weight: 800; font-size: 7.5pt; }
              .ic-row2 { display: flex; gap: 3mm; flex-shrink: 0; }
              .ic-col { flex: 1; }
              .ic-tbl {
                width: 100%; border-collapse: collapse;
                font-size: 6pt; flex-shrink: 0;
                table-layout: fixed;
              }
              .ic-tbl th, .ic-tbl td { border: 1px solid #000; padding: 0.5mm 1mm; text-align: center; }
              .ic-tbl th { background: #f0f0f0 !important; font-size: 5.5pt; white-space: nowrap; }
              .ic-tbl td { height: 5mm; }
              .back-title {
                text-align: center; font-weight: bold; font-size: 7pt;
                border-bottom: 1.5px solid #000;
                padding-bottom: 1.5mm; margin-bottom: 1.5mm;
                flex-shrink: 0;
              }
              .ic-bsec { flex-shrink: 0; margin-bottom: 2mm; }
              .ic-btitle {
                font-weight: bold; font-size: 6pt;
                background: #f0f0f0 !important; border: 1px solid #000; border-bottom: none;
                padding: 1mm 3mm; text-align: center;
              }
            }
          `}
        </style>

        {/* Individual Card or All Cards based on state */}
        {(printingItem ? [printingItem] : filteredItems).map((item) => (
          <React.Fragment key={item.id}>
            {/* Front of Card */}
            <div className="pcard">
              <div className="ph">
                <div className="ph-r">مديرية التربية لولاية: {directorate}<br />ثانوية: {schoolName}</div>
                <div className="ph-c">الجمهورية الجزائرية الديمقراطية الشعبية<br />وزارة التربية الوطنية</div>
                <div className="ph-l">السنة الدراسية: 2025/2026</div>
              </div>
              <div className="pcard-title">بطاقة الجرد</div>
              <div className="ic-years">
                <span><b>الجرد التأسيسي لسنة :</b> {item.foundationalInventory || '2015-10-15'}</span>
                <span><b>المراجعة العشرية لسنة :</b> {item.decennialReview || '2025-10-15'}</span>
              </div>
              <div className="ic-meta">
                <div className="ic-mf"><div className="ml">الفهرس</div><div className="mv"></div></div>
                <div className="ic-mf"><div className="ml">الفرع</div><div className="mv">مخبر الوسائل التعليمية</div></div>
                <div className="ic-mf"><div className="ml">رقم الجرد</div><div className="mv ic-serial">{item.serialNumber}</div></div>
                <div className="ic-mf"><div className="ml">ختم المؤسسة</div><div className="mv ic-stamp"></div></div>
              </div>
              <div className="ic-sec">
                <div className="ist">التـعيـيـن :</div>
                <div className="idl ic-name">{item.name}</div>
                <div className="idl">{item.notes}</div>
              </div>
              <div className="ic-sec">
                <div className="ist">خصـائــص :</div>
                <div className="idl"></div>
                <div className="idl"></div>
                <div className="idl"></div>
              </div>
              <div className="ic-row2">
                <div className="ic-col">
                  <div className="ist">تاريخ الدخول :</div>
                  <div className="idl"></div>
                </div>
                <div className="ic-col" style={{ flex: 1.8 }}>
                  <div className="ist">اللواحق :</div>
                  <div className="idl"></div>
                </div>
              </div>
              <table className="ic-tbl">
                <thead>
                  <tr>
                    <th>تاريخ الدخول</th>
                    <th>الكمية</th>
                    <th>سعر الوحدة</th>
                    <th>المبلغ</th>
                    <th>الممون</th>
                    <th>التعيين الجديد</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td></td>
                    <td>{item.totalQuantity}</td>
                    <td></td>
                    <td></td>
                    <td>{item.supplier}</td>
                    <td>مخبر الوسائل التعليمية</td>
                  </tr>
                  <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                  <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                </tbody>
              </table>
            </div>

            {/* Back of Card */}
            <div className="pcard">
              <div className="back-title">
                التكفل المستمر &nbsp;|&nbsp; رقم الجرد: <u>{item.serialNumber}</u> &nbsp;|&nbsp; {item.name}
              </div>
              <div className="ic-bsec">
                <div className="ic-btitle">التكفل المستمر</div>
                <table className="ic-tbl">
                  <thead>
                    <tr>
                      <th style={{ width: '28%' }}>التاريخ</th>
                      <th style={{ width: '44%' }}>إسم الموظف المسؤول</th>
                      <th style={{ width: '28%' }}>الإمضاء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...Array(6)].map((_, i) => (
                      <tr key={i}><td></td><td></td><td></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ic-bsec">
                <div className="ic-btitle">تغيير التعيين</div>
                <table className="ic-tbl">
                  <thead>
                    <tr>
                      <th rowSpan={2}>تاريخ القرار</th>
                      <th rowSpan={2}>الكمية</th>
                      <th colSpan={2}>الإمضاء</th>
                      <th rowSpan={2}>رقم الجرد</th>
                      <th rowSpan={2}>التعيين الجديد</th>
                    </tr>
                    <tr><th>المقتصد</th><th>العون المسؤول</th></tr>
                  </thead>
                  <tbody>
                    {[...Array(3)].map((_, i) => (
                      <tr key={i}><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="ic-bsec">
                <div className="ic-btitle">الإتلاف</div>
                <table className="ic-tbl">
                  <thead>
                    <tr>
                      <th rowSpan={2}>تاريخ القرار</th>
                      <th rowSpan={2}>الكمية</th>
                      <th colSpan={2}>الإمضاء</th>
                      <th rowSpan={2}>رقم الجرد</th>
                      <th rowSpan={2}>ملاحظة</th>
                    </tr>
                    <tr><th>المقتصد</th><th>العون المسؤول</th></tr>
                  </thead>
                  <tbody>
                    {[...Array(2)].map((_, i) => (
                      <tr key={i}><td></td><td></td><td></td><td></td><td></td><td></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 bg-surface shadow-2xl rounded-[40px] my-8 font-sans transition-all duration-500 no-print" dir="rtl">
      {/* Official Algeria Header */}
      <div className="border-b-4 border-double border-primary/20 pb-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 text-sm font-bold text-on-surface/80">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              مديرية التربية لولاية: {directorate}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              المؤسسة: {schoolName}
            </div>
          </div>
          
          <div className="text-center space-y-2 flex-1">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Ministry Logo" className="h-20 w-auto object-contain" />
            </div>
            <p className="text-xl font-black text-primary tracking-tight">الجمهورية الجزائرية الديمقراطية الشعبية</p>
            <p className="text-lg font-bold">وزارة التربية الوطنية</p>
          </div>

          <div className="space-y-2 text-left md:text-right">
            <p className="bg-primary/5 px-4 py-1.5 rounded-full inline-block">
              السنة الدراسية: <span className="font-black">2025 - 2026</span>
            </p>
          </div>
        </div>
        
        <div className="mt-12 text-center relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-primary/10"></div>
          </div>
          <h2 className="relative inline-block bg-surface px-8 text-3xl font-black text-primary tracking-tighter decoration-primary decoration-4 underline-offset-8">
            سجل بطاقات الجرد - مخبر الوسائل التعليمية
          </h2>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap justify-between items-center gap-6 mb-12 no-print">
        <div className="flex gap-4">
          <button 
            onClick={() => navigate(ROUTES.EQUIPMENT)}
            className="group flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-[24px] font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-500" />
            إضافة تجهيز
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-3 px-8 py-4 bg-secondary text-white rounded-[24px] font-black shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Printer size={20} />
            طباعة بطاقات الجرد
          </button>
          <button className="flex items-center gap-3 px-8 py-4 bg-surface-container-high text-on-surface rounded-[24px] font-black shadow-lg hover:bg-surface-container-highest transition-all">
            <QrCode size={20} />
            ملصقات QR
          </button>
        </div>

        <div className="relative flex-1 max-w-sm group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors" size={20} />
          <input
            type="text"
            placeholder="بحث في السجل..."
            className="w-full pr-14 pl-6 py-4 bg-surface-container-low border-2 border-transparent focus:border-primary/20 focus:bg-surface rounded-[24px] font-bold text-sm shadow-inner transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 no-print">
        {[
          { label: 'إجمالي بطاقات الجرد', value: stats.total, color: 'border-primary', icon: Database },
          { label: 'في حالة جيدة', value: stats.good, color: 'border-success', icon: Package },
          { label: 'تحتاج صيانة', value: stats.maintenance, color: 'border-warning', icon: Package },
          { label: 'عاطلة / مفقودة', value: stats.broken, color: 'border-error', icon: Trash2 }
        ].map((stat, i) => (
          <div key={i} className={cn("p-6 bg-surface-container-low rounded-[32px] border-t-8 shadow-sm group hover:shadow-md transition-all", stat.color)}>
            <div className="flex justify-between items-center mb-4">
              <stat.icon size={24} className="text-on-surface/40 group-hover:text-primary transition-colors" />
              <div className="text-3xl font-black text-on-surface group-hover:scale-110 transition-transform">{stat.value}</div>
            </div>
            <div className="text-sm font-black text-on-surface/60 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto rounded-[32px] border border-primary/10 shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 w-[60px] cursor-pointer group"
                onClick={() => handleSort('index')}
              >
                <div className="flex items-center justify-center gap-1">
                  رقم
                  <SortIcon field="index" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 cursor-pointer group"
                onClick={() => handleSort('serialNumber')}
              >
                <div className="flex items-center justify-center gap-1">
                  رقم الجرد
                  <SortIcon field="serialNumber" />
                </div>
              </th>
              <th 
                className="p-5 text-right font-black text-xs uppercase tracking-widest border-l border-white/10 w-[25%] text-center cursor-pointer group"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center justify-center gap-1">
                  تعيين الجهاز
                  <SortIcon field="name" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 cursor-pointer group"
                onClick={() => handleSort('foundationalInventory')}
              >
                <div className="flex items-center justify-center gap-1">
                  الجرد التأسيسي
                  <SortIcon field="foundationalInventory" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 cursor-pointer group"
                onClick={() => handleSort('decennialReview')}
              >
                <div className="flex items-center justify-center gap-1">
                  المراجعة العشرية
                  <SortIcon field="decennialReview" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 cursor-pointer group"
                onClick={() => handleSort('totalQuantity')}
              >
                <div className="flex items-center justify-center gap-1">
                  الكمية
                  <SortIcon field="totalQuantity" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 cursor-pointer group"
                onClick={() => handleSort('supplier')}
              >
                <div className="flex items-center justify-center gap-1">
                  الممون
                  <SortIcon field="supplier" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 cursor-pointer group"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center justify-center gap-1">
                  الحالة
                  <SortIcon field="status" />
                </div>
              </th>
              <th 
                className="p-5 text-center font-black text-xs uppercase tracking-widest border-l border-white/10 w-[15%] cursor-pointer group"
                onClick={() => handleSort('notes')}
              >
                <div className="flex items-center justify-center gap-1">
                  ملاحظات
                  <SortIcon field="notes" />
                </div>
              </th>
              <th className="p-5 text-center font-black text-xs uppercase tracking-widest no-print w-[80px]">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
            {filteredItems.map((item, index) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
                className="border-b border-primary/5 hover:bg-primary/[0.02] transition-colors group"
              >
                <td className="p-4 text-center font-bold text-xs text-on-surface/40 border-l border-primary/5">{index + 1}</td>
                <td className="p-4 border-l border-primary/5">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 rounded px-2 font-bold text-xs text-center transition-all underline decoration-dotted decoration-primary/20"
                    value={item.serialNumber}
                    onChange={(e) => handleUpdateItem(item.id, 'serialNumber', e.target.value)}
                  />
                </td>
                <td className="p-4 border-l border-primary/5">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 rounded px-2 font-bold text-xs transition-all decoration-primary/20"
                    value={item.name}
                    onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                  />
                </td>
                <td className="p-4 text-center text-xs font-bold border-l border-primary/5 whitespace-nowrap">
                   <input 
                    type="date" 
                    className="w-full bg-transparent border-none focus:outline-none text-center font-bold text-xs"
                    value={item.foundationalInventory}
                    onChange={(e) => handleUpdateItem(item.id, 'foundationalInventory', e.target.value)}
                  />
                </td>
                <td className="p-4 text-center text-xs font-bold border-l border-primary/5 whitespace-nowrap">
                   <input 
                    type="date" 
                    className="w-full bg-transparent border-none focus:outline-none text-center font-bold text-xs"
                    value={item.decennialReview}
                    onChange={(e) => handleUpdateItem(item.id, 'decennialReview', e.target.value)}
                  />
                </td>
                <td className="p-4 border-l border-primary/5">
                  <input 
                    type="number" 
                    className="w-16 bg-transparent border-none focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 rounded px-2 font-bold text-xs text-center transition-all"
                    value={item.totalQuantity}
                    onChange={(e) => handleUpdateItem(item.id, 'totalQuantity', parseInt(e.target.value) || 0)}
                  />
                </td>
                <td className="p-4 border-l border-primary/5">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 rounded px-2 font-bold text-xs text-center transition-all"
                    value={item.supplier}
                    onChange={(e) => handleUpdateItem(item.id, 'supplier', e.target.value)}
                  />
                </td>
                <td className="p-4 border-l border-primary/5">
                  <select 
                    className="bg-transparent border-none focus:outline-none font-bold text-xs p-1 rounded-lg cursor-pointer"
                    value={item.status}
                    onChange={(e) => handleUpdateItem(item.id, 'status', e.target.value)}
                  >
                    <option value="جيدة">جيدة</option>
                    <option value="تحتاج صيانة">تحتاج صيانة</option>
                    <option value="عاطلة">عاطلة</option>
                    <option value="في الإصلاح">في الإصلاح</option>
                    <option value="مفقودة">مفقودة</option>
                  </select>
                </td>
                <td className="p-4 border-l border-primary/5">
                  <input 
                    type="text" 
                    className="w-full bg-transparent border-none focus:outline-none focus:bg-surface focus:ring-2 focus:ring-primary/20 rounded px-2 font-bold text-xs transition-all"
                    value={item.notes}
                    onChange={(e) => handleUpdateItem(item.id, 'notes', e.target.value)}
                  />
                </td>
                <td className="p-4 text-center no-print">
                  <button 
                    onClick={() => handlePrintIndividual(item)}
                    title="طباعة بطاقة فردية"
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors inline-flex items-center justify-center bg-primary/5 border border-primary/10 hover:border-primary/30"
                  >
                    <Printer size={16} />
                  </button>
                </td>
              </motion.tr>
            ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      <div className="mt-8 flex justify-between items-center text-sm font-black text-on-surface/40 no-print">
        <div className="flex items-center gap-2">
          <Database size={16} />
          عدد التجهيزات في السجل: {filteredItems.length} من أصل {items.length}
        </div>
        <div className="italic text-[10px]">
          هذا السجل يعتبر وثيقة رسمية لجرد الوسائل التعليمية
        </div>
      </div>
      
      {/* Decorative Stamp for Print */}
      <div className="hidden print:flex justify-between mt-20 px-12 pb-12 font-black text-sm text-on-surface/80">
        <div className="text-center space-y-16">
          <p>المقتصد / مسير المصالح الاقتصادية</p>
          <div className="w-48 border-b-2 border-black/20 mx-auto" />
        </div>
        <div className="text-center space-y-16">
          <p>مسؤول المخبر الرئيسي</p>
          <div className="w-48 border-b-2 border-black/20 mx-auto" />
        </div>
        <div className="text-center space-y-16">
          <p>مدير المؤسسة</p>
          <div className="w-48 border-b-2 border-black/20 mx-auto" />
        </div>
      </div>
    </div>
    </>
  );
}
