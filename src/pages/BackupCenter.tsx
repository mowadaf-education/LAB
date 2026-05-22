import React, { useState } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  AlertTriangle, 
  RefreshCw, 
  ShieldCheck, 
  FileJson,
  CheckCircle2,
  XCircle,
  Copy,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { getDocs, writeBatch, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';


const COLLECTIONS_TO_BACKUP = [
  'equipment',
  'chemicals',
  'teachers',
  'incident_logs',
  'experiment_logs',
  'reports',
  'user_documents',
  'student_groups',
  'timetable',
  'lab_schedule'
];

export default function BackupCenter() {
  const { schoolId } = useSchool();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const exportAllData = async () => {
    setLoading(true);
    try {
      const fullData: any = {};
      
      for (const collName of COLLECTIONS_TO_BACKUP) {
        const snap = await getDocs(getUserCollection(schoolId, collName));
        fullData[collName] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Mekhbari_Backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      setStatus({ type: 'success', message: 'تم تصدير كافة البيانات بنجاح في ملف JSON.' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'فشل تصدير البيانات. تحقق من الاتصال.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      try {
        const data = JSON.parse(evt.target?.result as string);
        const batch = writeBatch(db);
        
        let totalRecords = 0;

        for (const [collName, items] of Object.entries(data)) {
          if (!COLLECTIONS_TO_BACKUP.includes(collName)) continue;
          
          (items as any[]).forEach(item => {
            const { id, ...rest } = item;
            const docRef = doc(getUserCollection(schoolId, collName));
            batch.set(docRef, { ...rest, updatedAt: new Date() });
            totalRecords++;
          });
        }

        await batch.commit();
        setStatus({ type: 'success', message: `تم استيراد ${totalRecords} سجل بنجاح من كافة الفئات.` });
      } catch (err) {
        console.error(err);
        setStatus({ type: 'error', message: 'الملف غير صالح أو حدث خطأ أثناء الاستيراد.' });
      } finally {
        setLoading(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const resetAllData = async () => {
    setLoading(true);
    try {
      for (const collName of COLLECTIONS_TO_BACKUP) {
        const snap = await getDocs(getUserCollection(schoolId, collName));
        const chunks = [];
        const items = snap.docs;
        for (let i = 0; i < items.length; i += 400) {
          chunks.push(items.slice(i, i + 400));
        }

        for (const chunk of chunks) {
          const batch = writeBatch(db);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
        }
      }
      setStatus({ type: 'success', message: 'تم تصفير كافة قواعد البيانات بنجاح.' });
      setShowConfirmReset(false);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: 'فشل عملية المسح. يرجى مراجعة الصلاحيات.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 pb-32 rtl space-y-12" dir="rtl">
      

      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Database size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tighter">مركز النسخ والبيانات</h1>
            <p className="text-secondary/70 text-lg font-bold">إدارة النسخ الاحتياطي السحابي، نقل البيانات، وتصفير السجلات السنوية.</p>
          </div>
        </div>
      </header>

      {status && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-6 rounded-[28px] border flex items-center gap-4 shadow-xl",
            status.type === 'success' ? "bg-success/5 border-success/20 text-success" : "bg-error/5 border-error/20 text-error"
          )}
        >
          {status.type === 'success' ? <CheckCircle2 /> : <XCircle />}
          <span className="font-black flex-1">{status.message}</span>
          <button onClick={() => setStatus(null)} className="p-2 hover:bg-black/5 rounded-full"><Trash2 size={18} /></button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Export Card */}
        <section className="bg-surface p-10 rounded-[40px] border border-outline/10 shadow-sm flex flex-col items-center text-center space-y-6 group hover:border-primary/20 transition-all">
          <div className="w-20 h-20 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
            <Download size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-primary">تصدير النسخة الاحتياطية</h3>
            <p className="text-sm font-bold text-secondary/60 leading-relaxed max-w-xs mx-auto">
              تحميل كافة بيانات المخبر (الجرد، الأساتذة، السجلات) في ملف واحد بصيغة JSON لنقلها أو حفظها خارجياً.
            </p>
          </div>
          <button 
            onClick={exportAllData}
            disabled={loading}
            className="w-full bg-primary text-on-primary py-5 rounded-full font-black flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" /> : <FileJson />}
            توليد ملف التصدير
          </button>
        </section>

        {/* Import Card */}
        <section className="bg-surface p-10 rounded-[40px] border border-outline/10 shadow-sm flex flex-col items-center text-center space-y-6 group hover:border-tertiary/20 transition-all">
          <div className="w-20 h-20 rounded-[32px] bg-tertiary/5 flex items-center justify-center text-tertiary group-hover:scale-110 transition-transform">
            <Upload size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-primary">استعادة البيانات</h3>
            <p className="text-sm font-bold text-secondary/60 leading-relaxed max-w-xs mx-auto">
              رفع ملف نسخة احتياطية سابق لدمجه مع القاعدة الحالية. سيتم إضافة السجلات كمدخلات جديدة.
            </p>
          </div>
          <label className="w-full cursor-pointer">
            <input type="file" accept=".json" className="hidden" onChange={handleImportJson} disabled={loading} />
            <div className="bg-tertiary/10 text-tertiary py-5 rounded-full font-black flex items-center justify-center gap-3 border-2 border-dashed border-tertiary/20 hover:bg-tertiary/20 transition-all">
              {loading ? <RefreshCw className="animate-spin" /> : <Upload />}
              اختيار ملف واستيراده
            </div>
          </label>
        </section>
      </div>

      {/* Danger Zone */}
      <section className="bg-error/5 border border-error/10 rounded-[40px] p-10 space-y-8">
        <div className="flex items-center gap-4 text-error">
          <AlertTriangle size={32} />
          <h2 className="text-2xl font-black">منطقة الخطر</h2>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 bg-surface p-8 rounded-3xl border border-error/5 shadow-inner">
          <div className="space-y-1">
             <h4 className="text-xl font-black text-primary">تصفير كافة السجلات</h4>
             <p className="text-sm font-bold text-secondary/60">سيؤدي هذا الإجراء إلى حذف كافة الجرود والنتائج نهائياً. يستخدم غالباً في بداية الموسم الدراسي الجديد.</p>
          </div>
          <button 
            onClick={() => setShowConfirmReset(true)}
            className="px-10 py-4 bg-error text-white rounded-full font-black shadow-xl shadow-error/20 hover:scale-105 active:scale-95 transition-all"
          >
            تصفير كلي للقاعدة
          </button>
        </div>
      </section>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirmReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowConfirmReset(false)} className="absolute inset-0 bg-error/20 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.95 }} 
              className="relative bg-surface w-full max-w-md rounded-[40px] shadow-2xl p-10 text-center space-y-8"
            >
              <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center text-error mx-auto border-4 border-error/5">
                <AlertTriangle size={40} />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black text-primary">هل أنت متأكد؟!</h3>
                <p className="text-secondary font-bold leading-relaxed">
                  هذا الإجراء <span className="text-error underline">لا يمكن التراجع عنه</span>. سيتم مسح كافة البيانات من السحابة للأبد. تأكد من تحميل نسخة احتياطية أولاً.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={resetAllData}
                  disabled={loading}
                  className="bg-error text-white py-5 rounded-full font-black shadow-xl shadow-error/20 hover:bg-error-container transition-all flex items-center justify-center gap-2"
                >
                  {loading && <RefreshCw className="animate-spin size-4" />}
                  نعم، احذف الكل
                </button>
                <button 
                  onClick={() => setShowConfirmReset(false)}
                  className="bg-surface-container text-primary py-5 rounded-full font-black hover:bg-surface-container-high transition-all"
                >
                   إلغاء الأمر
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-primary/5 p-8 rounded-3xl border border-primary/10 flex items-center gap-6">
        <div className="p-4 bg-primary/10 rounded-2xl text-primary">
          <ShieldCheck size={28} />
        </div>
        <div className="space-y-1">
          <h5 className="font-black text-primary">تشفير البيانات وحمايتها</h5>
          <p className="text-xs font-bold text-secondary/60">يتم تخزين بياناتك بصيغة مشفرة على خوادم Google Cloud Firebase المؤمنة بالكامل.</p>
        </div>
      </footer>
    </div>
  );
}
