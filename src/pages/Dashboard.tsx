import { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, where, doc, writeBatch, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection, auth, checkIsAdmin } from '../firebase';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { ensureApiKey, getEquipmentIntelligence } from '../services/geminiService';
import { 
  FileText, 
  Package, 
  FlaskConical, 
  Wrench, 
  Users, 
  BookOpen, 
  Calendar, 
  ShieldAlert, 
  TrendingUp,
  AlertTriangle,
  Hammer,
  ArrowLeft,
  LayoutDashboard,
  Sparkles,
  MapPin,
  FileUp,
  Database,
  Trash2,
  Map,
  Monitor,
  Beaker,
  RefreshCw,
  Cpu,
  Plus,
  Activity,
  CheckCircle,
  Wallet,
  Scale,
  Archive,
  Server,
  Settings,
  ShieldCheck,
  Bell,
  Clock,
  Atom,
  Binary,
  ExternalLink
} from 'lucide-react';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { cn } from '../lib/utils';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const { schoolId } = useSchool();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [counts, setCounts] = useState({
    reports: 0,
    equipment: 0,
    chemicals: 0,
    teachers: 0,
    incidents: 0,
    lowStock: 0,
    brokenEquip: 0,
    experiments: 0,
    expiringSoon: 0
  });

  const [graphData, setGraphData] = useState<any[]>([]);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [expiringItems, setExpiringItems] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      checkIsAdmin(auth.currentUser).then(setIsAdmin);
    }

    const unsubReports = onSnapshot(getUserCollection(schoolId, 'reports'), (snap) => {
      setCounts(prev => ({ ...prev, reports: snap.size }));
      const reports = snap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        .slice(0, 3);
      setRecentReports(reports);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'reports'));

    const unsubExps = onSnapshot(getUserCollection(schoolId, 'experiment_logs'), (snap) => {
      setCounts(prev => ({ ...prev, experiments: snap.size }));
      
      // Calculate last 7 days chart data
      const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
      const stats = days.map(day => ({ name: day, count: 0 }));
      
      snap.docs.forEach(doc => {
        const d = doc.data().date?.toDate();
        if (d) {
          const dayName = d.toLocaleDateString('ar-DZ', { weekday: 'long' });
          const idx = days.indexOf(dayName);
          if (idx !== -1) stats[idx].count++;
        }
      });
      setGraphData(stats);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'experiment_logs'));

    const unsubEquip = onSnapshot(getUserCollection(schoolId, 'equipment'), (snap) => {
      const broken = snap.docs.filter(doc => ['broken', 'maintenance'].includes(doc.data().status)).length;
      setCounts(prev => ({ ...prev, equipment: snap.size, brokenEquip: broken }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'equipment'));

    const unsubChem = onSnapshot(getUserCollection(schoolId, 'chemicals'), (snap) => {
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);

      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const low = items.filter((d: any) => (d.quantity || 0) < 10).length;
      
      const expiring = items.filter((d: any) => {
        if (!d.expiryDate) return false;
        const expDate = new Date(d.expiryDate);
        return expDate > today && expDate <= nextMonth;
      });

      setCounts(prev => ({ ...prev, chemicals: snap.size, lowStock: low, expiringSoon: expiring.length }));
      setExpiringItems(expiring.slice(0, 5));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'chemicals'));

    const unsubTeachers = onSnapshot(getUserCollection(schoolId, 'teachers'), (snap) => {
      setCounts(prev => ({ ...prev, teachers: snap.size }));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'teachers'));

    const unsubIncidents = onSnapshot(getUserCollection(schoolId, 'safety_incidents'), (snap) => {
      setCounts(prev => ({ ...prev, incidents: snap.size }));
    }, (err) => {
      console.warn('Dashboard: Failed to load incidents', err);
      // Don't crash the whole app if incidents fail
    });

    return () => {
      unsubReports();
      unsubExps();
      unsubEquip();
      unsubChem();
      unsubTeachers();
      unsubIncidents();
    };
  }, [schoolId]);

  const handleImportXLS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary', cellDates: true });
        
        let totalImported = 0;

        for (const sheetName of wb.SheetNames) {
          const ws = wb.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(ws) as any[];
          
          if (data.length === 0) continue;

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

          const CHUNK_SIZE = 450;
          const chunks = [];
          for (let i = 0; i < data.length; i += CHUNK_SIZE) {
            chunks.push(data.slice(i, i + CHUNK_SIZE));
          }

          for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach((item) => {
              // Detailed heuristics for collection detection
              let collectionName = '';
              
              if (item['الاسم'] && item['المادة']) collectionName = 'teachers';
              else if (item['تعيين الجهاز'] || item['النوع'] === 'زجاجيات' || item['النوع'] === 'أجهزة') collectionName = 'equipment';
              else if (item['الاسم'] && (item['الصيغة'] || item['CAS'] || item['الكمية'])) collectionName = 'chemicals';
              
              // Fallback based on sheet name if headers are ambiguous
              if (!collectionName) {
                const normalizedSheet = sheetName.toLowerCase();
                if (normalizedSheet.includes('chem')) collectionName = 'chemicals';
                else if (normalizedSheet.includes('equip')) collectionName = 'equipment';
                else if (normalizedSheet.includes('teach')) collectionName = 'teachers';
              }

              if (!collectionName) return;

              // Use the correct collection reference based on detected name
              const docRef = doc(getUserCollection(schoolId, collectionName));
              
              if (collectionName === 'chemicals') {
                const quantity = Number(item['الكمية'] || 0);
                batch.set(docRef, {
                  nameAr: item['الاسم'] || 'مادة غير مسمى',
                  nameEn: item['Name'] || item['الاسم'] || 'Unnamed Chemical',
                  formula: item['الصيغة'] || '',
                  casNumber: item['CAS'] || '',
                  storageTemp: item['درجة التخزين'] || '',
                  expiryDate: formatDate(item['تاريخ الانتهاء']),
                  quantity: isNaN(quantity) ? 0 : quantity,
                  unit: item['الوحدة'] || 'ml',
                  state: item['الحالة'] || 'solid',
                  hazardClass: String(item['الخطورة'] || '').toLowerCase() === 'danger' ? 'danger' : 'safe',
                  shelf: item['الموقع'] || '',
                  ghs: [],
                  notes: item['ملاحظات'] || '',
                  createdAt: serverTimestamp()
                });
              } else if (collectionName === 'teachers') {
                batch.set(docRef, {
                  name: String(item['الاسم'] || 'أستاذ غير مسمى').trim(),
                  subject: String(item['المادة'] || 'مادة غير محددة').trim(),
                  rank: item['الرتبة'] || '',
                  functionalCode: item['الرمز الوظيفي'] || '',
                  birthDate: formatDate(item['تاريخ الازدياد']),
                  grade: item['الدرجة'] || '',
                  effectiveDate: formatDate(item['تاريخ السريان']),
                  email: item['البريد'] || '',
                  levels: item['الأطوار'] ? String(item['الأطوار']).split(';').map(s => s.trim()) : [],
                  createdAt: serverTimestamp()
                });
              } else if (collectionName === 'equipment') {
                const typeRaw = String(item['النوع'] || '').toLowerCase();
                const statusRaw = String(item['الحالة'] || '').toLowerCase();
                const quantity = Number(item['الكمية الإجمالية'] || 0);
                
                batch.set(docRef, {
                  name: String(item['تعيين الجهاز'] || 'جهاز غير مسمى').trim(),
                  type: typeRaw.includes('زجاج') ? 'glassware' : typeRaw.includes('جهاز') ? 'tech' : 'other',
                  serialNumber: item['رقم الجرد'] || item['الرقم التسلسلي'] || '',
                  status: statusRaw.includes('سليم') ? 'functional' : statusRaw.includes('صيانة') ? 'maintenance' : 'broken',
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
              }
              totalImported++;
            });
            await batch.commit();
          }
        }

        setNotification({ message: `تم استيراد ${totalImported} سجل بنجاح من كافة الصفحات!`, type: 'success' });
      } catch (error) {
        console.error('Error importing XLS:', error);
        setNotification({ message: 'حدث خطأ أثناء استيراد الملف. يرجى التأكد من أن البيانات تطابق النموذج.', type: 'error' });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const stats = [
    { label: 'إجمالي السجلات التقنية', value: (counts.equipment + counts.chemicals).toString(), trend: '+12%', icon: Database, color: 'bg-primary/10', path: '/inventory' },
    { label: 'جلسات العمل والمطالبات', value: counts.reports.toString(), trend: 'نشط', icon: FileText, color: 'bg-secondary-container', path: '/reports' },
    { label: 'تنبيهات النظام الحرجة', value: (counts.lowStock + counts.brokenEquip).toString(), trend: 'تتطلب تدخل', icon: AlertTriangle, color: 'bg-tertiary-container/20 text-tertiary', path: '/safety' },
  ];

  const [isSmartUpdating, setIsSmartUpdating] = useState(false);

  const handleSmartUpdate = async () => {
    // Ensure API key is available before starting
    const hasKey = await ensureApiKey();
    if (!hasKey) {
      setNotification({ message: 'يرجى اختيار مفتاح API الخاص بك لاستخدام ميزة التحديث الذكي.', type: 'error' });
      return;
    }

    setIsSmartUpdating(true);
    try {
      const equipSnap = await getDocs(getUserCollection(schoolId, 'equipment'));
      const chemSnap = await getDocs(getUserCollection(schoolId, 'chemicals'));
      
      const items = [
        ...equipSnap.docs.map((doc: any) => ({ id: doc.id, collection: 'equipment', ...doc.data() })),
        ...chemSnap.docs.map((doc: any) => ({ id: doc.id, collection: 'chemicals', ...doc.data() }))
      ];
      
      if (items.length === 0) {
        setNotification({ message: 'لا توجد تجهيزات لتحديثها.', type: 'error' });
        return;
      }

      // Process in chunks to avoid large payloads
      const CHUNK_SIZE = 10;
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);
        const itemsToProcess = chunk.map(item => ({ id: item.id, name: item.name }));
        
        const enrichedData = await getEquipmentIntelligence(itemsToProcess);
        
        if (!enrichedData) {
          throw new Error('فشل الحصول على بيانات الذكاء الاصطناعي.');
        }

        const batch = writeBatch(db);
        enrichedData.forEach((update: any) => {
          // Find the original item to know its collection
          const originalItem = items.find(it => it.id === update.id);
          const collectionName = originalItem?.collection || 'equipment';
          const docRef = doc(getUserCollection(schoolId, collectionName), update.id);
          batch.update(docRef, {
            smartNameAr: update.smartNameAr,
            smartDescriptionAr: update.smartDescriptionAr,
            imageKeyword: update.imageKeyword,
            lastSmartUpdate: serverTimestamp()
          });
        });
        await batch.commit();
        
        // Small delay between chunks to respect rate limits (15 RPM for free tier)
        if (i + CHUNK_SIZE < items.length) {
          await new Promise(r => setTimeout(r, 5000));
        }
      }

      setNotification({ message: 'تم التحديث الذكي للمخزون بنجاح!', type: 'success' });
    } catch (error) {
      console.error('Error in smart update:', error);
      setNotification({ message: 'حدث خطأ أثناء التحديث الذكي. يرجى المحاولة لاحقاً.', type: 'error' });
    } finally {
      setIsSmartUpdating(false);
    }
  };

  const handleExportTemplate = async () => {
    try {
      const wb = XLSX.utils.book_new();

      // Fetch Real Data for each sheet
      const chemSnap = await getDocs(getUserCollection(schoolId, 'chemicals'));
      const equipSnap = await getDocs(getUserCollection(schoolId, 'equipment'));
      const teachSnap = await getDocs(getUserCollection(schoolId, 'teachers'));

      // Chemicals Data Mapping
      const chemicalData = chemSnap.docs.map(doc => {
        const d = doc.data();
        return {
          'الاسم': d.nameAr || '',
          'Name': d.nameEn || '',
          'الصيغة': d.formula || '',
          'CAS': d.casNumber || '',
          'درجة التخزين': d.storageTemp || '',
          'تاريخ الانتهاء': d.expiryDate || '',
          'الكمية': d.quantity || 0,
          'الوحدة': d.unit || '',
          'الحالة': d.state || '',
          'الخطورة': d.hazardClass || '',
          'الموقع': d.shelf || '',
          'ملاحظات': d.notes || ''
        };
      });

      // Add a placeholder if empty
      if (chemicalData.length === 0) {
        chemicalData.push({ 'الاسم': 'مثال: حمض الكلور', 'Name': 'HCl', 'الصيغة': 'HCl', 'CAS': '7647-01-0', 'درجة التخزين': '25C', 'تاريخ الانتهاء': '2025-12-31', 'الكمية': 500, 'الوحدة': 'ml', 'الحالة': 'liquid', 'الخطورة': 'danger', 'الموقع': 'رف أ', 'ملاحظات': 'مادة أكالة' });
      }
      const wsChem = XLSX.utils.json_to_sheet(chemicalData);
      XLSX.utils.book_append_sheet(wb, wsChem, "Chemicals");

      // Equipment Data Mapping
      const equipmentData = equipSnap.docs.map(doc => {
        const d = doc.data();
        return {
          'تعيين الجهاز': d.name || '',
          'النوع': d.type === 'glassware' ? 'زجاجيات' : d.type === 'tech' ? 'أجهزة' : 'أخرى',
          'رقم الجرد': d.serialNumber || '',
          'الرقم التسلسلي': d.serialNumber || '',
          'الحالة': d.status === 'functional' ? 'سليم' : d.status === 'maintenance' ? 'صيانة' : 'تعطل',
          'الكمية الإجمالية': d.totalQuantity || 0,
          'الممون': d.supplier || '',
          'الموقع': d.location || '',
          'ملاحظات': d.notes || '',
          'الجرد التأسيسي': d.foundationalInventory || '',
          'المراجعة العشرية': d.decennialReview || ''
        };
      });

      if (equipmentData.length === 0) {
        equipmentData.push({ 'تعيين الجهاز': 'مثال: مجهر ضوئي', 'النوع': 'أجهزة', 'رقم الجرد': 'LAB-001', 'الرقم التسلسلي': 'SN12345', 'الحالة': 'سليم', 'الكمية الإجمالية': 5, 'الممون': 'وزارة التربية', 'الموقع': 'الخزانة 1', 'ملاحظات': 'دقة عالية', 'الجرد التأسيسي': 'نعم', 'المراجعة العشرية': '2024' });
      }
      const wsEquip = XLSX.utils.json_to_sheet(equipmentData);
      XLSX.utils.book_append_sheet(wb, wsEquip, "Equipment");

      // Teachers Data Mapping
      const teacherData = teachSnap.docs.map(doc => {
        const d = doc.data();
        return {
          'الاسم': d.name || '',
          'المادة': d.subject || '',
          'الرتبة': d.rank || '',
          'الرمز الوظيفي': d.functionalCode || '',
          'تاريخ الازدياد': d.birthDate || '',
          'الدرجة': d.grade || '',
          'تاريخ السريان': d.effectiveDate || '',
          'البريد': d.email || '',
          'الأطوار': (d.levels || []).join(';')
        };
      });

      if (teacherData.length === 0) {
        teacherData.push({ 'الاسم': 'أحمد محمد', 'المادة': 'علوم طبيعية', 'الرتبة': 'أستاذ تعليم ثانوي', 'الرمز الوظيفي': '987654', 'تاريخ الازدياد': '1985-05-15', 'الدرجة': '6', 'تاريخ السريان': '2023-01-01', 'البريد': 'ahmed@mail.com', 'الأطوار': 'ثانوي' });
      }
      const wsTeachers = XLSX.utils.json_to_sheet(teacherData);
      XLSX.utils.book_append_sheet(wb, wsTeachers, "Teachers");

      XLSX.writeFile(wb, `Lab_Full_Data_Template.xlsx`);
      setNotification({ message: 'تم تحميل كافة البيانات في ملف XLS بنجاح! يمكنك الآن تعديلها وإعادة استيرادها.', type: 'success' });
    } catch (error) {
      console.error('Error exporting data template:', error);
      handleFirestoreError(error, OperationType.LIST, 'export_process');
      setNotification({ message: 'حدث خطأ أثناء تصدير البيانات. يرجى التأكد من اتصالك بالإنترنت وصلاحيات الدخول.', type: 'error' });
    }
  };

  const modules = [
    { title: 'الجرد والمخزون', desc: 'إدارة كافة الممتلكات من كواشف وأجهزة ومراجعة مصفوفات التوافق.', count: (counts.chemicals + counts.equipment).toString(), icon: Database, color: 'bg-primary/10', path: '/inventory' },
    { title: 'المتابعة البيداغوجية', desc: 'تسيير الجداول الزمنية، الأساتذة، الأفواج، والتجارب المخبرية.', count: 'شامل', icon: BookOpen, color: 'bg-primary-container/20 text-primary', path: '/pedagogical' },
    { title: 'الأمن والسلامة', desc: 'إدارة بروتوكولات السلامة والنفايات الكيميائية والإسعافات.', count: counts.incidents.toString(), icon: ShieldAlert, color: 'bg-error/10 text-error', path: '/safety-hub' },
    { title: 'الموارد العلمية', desc: 'استكشاف الجدول الدوري، الخريطة التربوية وأدوات الكيمياء المتقدمة.', count: 'دليل', icon: Atom, color: 'bg-indigo-100 text-indigo-700', path: '/scientific-hub' },
    { title: 'الإدارة والإعدادات', desc: 'تكوين الحساب، الميزانية، ومركز البيانات والنسخ الاحتياطي.', count: 'إعدادات', icon: Settings, color: 'bg-surface-container-high', path: '/settings-hub' },
    ...(isAdmin ? [{ 
      title: 'لوحة الإدارة المركزية', 
      desc: 'إدارة المستخدمين، الصلاحيات، والتحكم الشامل في النظام.', 
      count: 'أدمن', 
      icon: ShieldCheck, 
      color: 'bg-primary text-on-primary', 
      path: '/admin' 
    }] : []),
  ];

  return (
    <div className="space-y-16 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      <Helmet>
        <title>لوحة التحكم | الأرضية الرقمية للمخابر</title>
      </Helmet>
      {/* Notifications */}
      {notification && (
        <div className={cn(
          "fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300",
          notification.type === 'success' ? "bg-primary text-on-primary" : "bg-error text-white"
        )}>
          {notification.type === 'success' ? <Sparkles size={20} /> : <AlertTriangle size={20} />}
          <span className="font-black">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <LayoutDashboard size={14} />
            نظرة عامة على النظام
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">لوحة التحكم</h1>
          <p className="text-on-surface/60 text-lg font-bold">الأرضية الرقمية — <span className="text-primary italic">فضاء موظفوا المخابر</span></p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImportXLS} 
            className="hidden" 
            accept=".xls,.xlsx"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-full text-[0.875rem] font-black flex items-center gap-3 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out active:scale-95 disabled:opacity-50"
          >
            {isImporting ? (
              <div className="w-6 h-6 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
            ) : (
              <FileUp size={20} />
            )}
            استيراد السجلات (XLS)
          </button>

          <button 
            onClick={handleExportTemplate}
            className="bg-secondary-container text-primary-dim px-8 py-4 rounded-full text-[0.875rem] font-bold flex items-center gap-3 shadow-ambient hover:brightness-95 hover:-translate-y-[2px] hover:shadow-ambient-hover transition-all duration-300 ease-out active:scale-95"
          >
            <Database size={20} />
            تصدير الهيكل المرجعي
          </button>

          <button 
            onClick={handleSmartUpdate}
            disabled={isSmartUpdating}
            className="relative z-10 flex items-center gap-4 bg-surface-container-lowest px-8 py-4 rounded-full shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out group active:scale-95 disabled:opacity-50"
          >
            <div className="p-2 bg-primary/10 rounded-full text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
              {isSmartUpdating ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[0.6875rem] font-black text-on-surface-variant uppercase tracking-widest">محرك الذكاء الاصطناعي</span>
              <span className="text-[0.875rem] font-black text-primary leading-tight">تحديث المعرفات</span>
            </div>
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Alerts Bar */}
      {(counts.lowStock > 0 || counts.brokenEquip > 0 || expiringItems.length > 0) && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {counts.lowStock > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-[oklch(0.97_0.02_20)] text-on-error-container p-6 rounded-md3-card flex items-center gap-6 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-error/5 rounded-br-[100px] -ml-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                <div className="bg-error p-5 rounded-[20px] text-white shadow-ambient relative z-10 w-16 h-16 flex items-center justify-center">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 relative z-10">
                  <h4 className="font-bold text-[1.75rem] leading-none mb-2 text-error font-sans">تنبيه حرج</h4>
                  <p className="text-[0.875rem] text-error/80 font-bold">هناك {counts.lowStock} مواد كيميائية وصلت إلى الحد الأدنى.</p>
                </div>
                <button 
                  onClick={() => navigate('/chemicals')}
                  className="relative z-10 bg-error text-white text-[0.875rem] font-bold px-8 py-3 rounded-full shadow-ambient hover:shadow-ambient-hover hover:bg-error/90 transition-all duration-300 ease-out active:scale-95"
                >
                  معالجة المخزون
                </button>
              </motion.div>
            )}
            
            {counts.brokenEquip > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-primary/5 text-primary p-6 rounded-md3-card flex items-center gap-6 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-[100px] -ml-10 -mt-10 group-hover:scale-150 transition-transform duration-700" />
                <div className="bg-primary p-5 rounded-[20px] text-on-primary shadow-ambient relative z-10 w-16 h-16 flex items-center justify-center">
                  <Hammer size={24} />
                </div>
                <div className="flex-1 relative z-10">
                  <h4 className="font-bold text-[1.75rem] leading-none mb-2 text-primary">صيانة مطلوبة</h4>
                  <p className="text-[0.875rem] text-primary/80 font-bold">هناك {counts.brokenEquip} أجهزة تحتاج إلى صيانة فورية.</p>
                </div>
                <button 
                  onClick={() => navigate('/equipment')}
                  className="relative z-10 bg-gradient-to-r from-primary to-primary-container text-on-primary text-[0.875rem] font-bold px-8 py-3 rounded-full shadow-ambient hover:shadow-ambient-hover transition-all duration-300 ease-out active:scale-95"
                >
                  سجل الصيانة
                </button>
              </motion.div>
            )}
          </div>

          {expiringItems.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-orange-600/5 border border-orange-200/50 p-8 rounded-md3-card shadow-ambient relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 text-orange-900">
                <ShieldAlert size={120} />
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[24px] bg-orange-600 text-white flex items-center justify-center shadow-ambient shrink-0">
                    <Bell size={28} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-orange-900 tracking-tight">تنبيهات انتهاء الصلاحية</h3>
                    <p className="text-[0.875rem] font-bold text-orange-800/70">هناك {counts.expiringSoon} مواد ستنتهي صلاحيتها خلال أقل من 30 يوم.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 justify-center">
                  {expiringItems.map((item, i) => (
                    <div key={item.id} className="bg-surface/80 p-3 px-5 rounded-2xl border border-orange-200 flex items-center gap-3">
                      <Clock size={14} className="text-orange-600" />
                      <span className="text-sm font-black text-orange-900">{item.nameAr}</span>
                      <span className="text-[10px] font-black bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{item.expiryDate}</span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate('/chemicals')}
                  className="bg-orange-600 text-white px-8 py-3 rounded-full font-black text-sm shadow-ambient hover:bg-orange-700 transition-all active:scale-95"
                >
                  إدارة المواد
                </button>
              </div>
            </motion.div>
          )}
        </section>
      )}

      {/* Stats Strip */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: "easeOut" }}
              onClick={() => navigate(stat.path + ((stat as any).filter ? `?filter=${(stat as any).filter}` : ''))}
              className={cn(
                "p-8 rounded-md3-card transition-all duration-300 ease-out group relative cursor-pointer shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px]",
                stat.color
              )}
            >
              <div className="absolute top-0 left-0 w-24 h-24 bg-surface/40 rounded-br-[80px] -ml-6 -mt-6 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="p-4 bg-surface rounded-[16px] shadow-sm text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors duration-300">
                  <Icon size={24} />
                </div>
                <span className={cn(
                  "text-[0.6875rem] font-black px-4 py-1.5 rounded-full shadow-sm tracking-widest",
                  stat.label === 'تنبيهات النظام الحرجة' ? "bg-error text-on-error" : "bg-surface text-primary"
                )}>
                  {stat.trend}
                </span>
              </div>
              <div className="relative z-10">
                <p className="text-[0.875rem] text-on-surface/80 font-bold mb-1">{stat.label}</p>
                <span className="text-[3.5rem] leading-none font-black text-primary group-hover:scale-105 transition-transform inline-block origin-right font-sans" dir="ltr">{stat.value}</span>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Recent Activity Feed */}
      {recentReports.length > 0 && (
        <section>
          <div className="flex items-center gap-6 mb-10">
            <div className="w-2 h-8 bg-primary rounded-full shadow-lg shadow-primary/20"></div>
            <h2 className="text-2xl font-black text-primary tracking-tight">آخر النشاطات</h2>
            <div className="flex-1 h-px bg-outline/10"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {recentReports.map((report, i) => (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate('/daily-report')}
                className="bg-surface p-6 rounded-[32px] border border-outline/5 shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h5 className="font-black text-primary">{report.className || 'قسم غير محدد'}</h5>
                    <p className="text-[10px] text-on-surface/40 font-bold">{report.date}</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface/60 line-clamp-2 font-medium mb-4">
                  {report.observations || 'لا توجد ملاحظات مسجلة لهذا التقرير.'}
                </p>
                <div className="flex items-center justify-between text-[10px] font-black text-primary/40 uppercase tracking-widest">
                  <span>{report.teacherName || 'أستاذ غير محدد'}</span>
                  <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Modules Grid */}
      <section>
        <div className="flex items-center gap-6 mb-10">
          <div className="w-2 h-8 bg-primary rounded-full shadow-lg shadow-primary/20"></div>
          <h2 className="text-2xl font-black text-primary tracking-tight">الأقسام والوحدات</h2>
          <div className="flex-1 h-px bg-outline/10"></div>
          <div className="flex items-center gap-2 text-primary/40">
            <Sparkles size={20} />
            <span className="text-xs font-black uppercase tracking-[0.3em]">الوصول السريع</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {modules.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <motion.div
                key={mod.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.3, ease: 'easeOut' }}
                onClick={() => {
                  navigate(mod.path);
                }}
                className="bg-surface-container-lowest p-8 rounded-md3-card hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out group cursor-pointer relative overflow-hidden shadow-ambient"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                
                <div className="flex justify-between items-start mb-10 relative z-10">
                  <div className={cn(
                    "w-20 h-20 rounded-[24px] flex items-center justify-center shadow-sm transition-all duration-500 group-hover:rotate-12 group-hover:scale-110",
                    mod.color
                  )}>
                    <Icon size={36} className="text-primary mix-blend-multiply" />
                  </div>
                  <span className="bg-surface-container-low text-primary px-5 py-2 rounded-full text-[0.6875rem] font-black shadow-sm">{mod.count}</span>
                </div>
                
                <div className="relative z-10">
                  <h4 className="text-[1.75rem] leading-tight font-bold text-primary mb-3 group-hover:text-primary-container transition-colors font-sans">{mod.title}</h4>
                  <p className="text-[0.875rem] text-on-surface/80 mb-10 line-clamp-2 leading-relaxed font-medium">{mod.desc}</p>
                </div>

                <div className="pt-6 flex justify-between items-center text-primary font-black text-sm relative z-10">
                  <span className="group-hover:tracking-[0.2em] transition-all uppercase text-[0.6875rem]">استعراض القسم</span>
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Activity Preview with Recharts */}
      <section className="bg-surface rounded-[50px] p-12 lg:p-16 flex flex-col lg:flex-row gap-16 items-center border border-outline/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full -ml-64 -mt-64 blur-[100px] pointer-events-none" />
        
        <div className="flex-1 space-y-8 relative z-10">
          <div className="inline-flex items-center gap-3 bg-primary/10 text-primary px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.3em]">
            <TrendingUp size={16} />
            تحليل البيانات الذكي
          </div>
          <h2 className="text-[30px] font-black text-primary tracking-tight leading-tight">معدل النشاط البيداغوجي <br/>الأسبوعي</h2>
          
          <div className="space-y-4">
             <div className="flex items-center gap-4 bg-tertiary/5 p-4 rounded-2xl border border-tertiary/10">
                <Sparkles size={20} className="text-tertiary" />
                <p className="text-sm font-bold text-secondary">
                   {counts.experiments > 0 
                    ? `استناداً إلى ${counts.experiments} تجربة مسجلة، نلاحظ كثافة عالية في النشاط العملي خلال منتصف الأسبوع.`
                    : "بادر بتسجيل أول تجربة مخبرية لتفعيل نظام التحليلات الذكي."}
                </p>
             </div>
             
             {counts.lowStock > 0 && (
               <div className="flex items-center gap-4 bg-error/5 p-4 rounded-2xl border border-error/10">
                  <AlertTriangle size={20} className="text-error" />
                  <p className="text-sm font-bold text-error">
                     توصية AI: مراجعة طلبات التموين لـ {counts.lowStock} مواد شارفت على الانتهاء لتفادي انقطاع الدروس.
                  </p>
               </div>
             )}
          </div>

          <div className="flex flex-wrap gap-4 pt-4">
            <button 
              onClick={() => navigate('/lab-experiments')}
              className="bg-primary text-on-primary px-8 py-4 rounded-full font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all text-sm flex items-center gap-2"
            >
              استعراض سجل التجارب
            </button>
          </div>
        </div>
        
        <div className="w-full lg:w-2/5 h-[400px] bg-surface-container-low rounded-[48px] overflow-hidden shadow-2xl border border-outline/10 relative p-8">
           <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
             <BarChart data={graphData}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e2dc" />
               <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#2b3d22', fontWeight: 'bold', fontSize: 12 }} 
                reversed
               />
               <YAxis hide />
               <RechartsTooltip 
                  cursor={{ fill: 'rgba(43, 61, 34, 0.05)' }} 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface p-3 rounded-xl shadow-xl border border-outline/10">
                          <p className="text-[10px] font-black uppercase text-secondary/40 tracking-widest">{payload[0].payload.name}</p>
                          <p className="text-lg font-black text-primary">{payload[0].value} حصص</p>
                        </div>
                      );
                    }
                    return null;
                  }}
               />
               <Bar dataKey="count" radius={[10, 10, 10, 10]} barSize={40}>
                 {graphData.map((entry, index) => (
                   <Cell key={`cell-${index}`} fill={index === 3 ? '#2b3d22' : '#2b3d2266'} />
                 ))}
               </Bar>
             </BarChart>
           </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
