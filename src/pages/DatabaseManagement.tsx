import { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Database, 
  Trash2, 
  Download, 
  Upload, 
  RefreshCw, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  ChevronLeft,
  FileJson,
  History,
  Cloud
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db, auth, getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { ROUTES } from '../config/routes';
import { 
  getDocs, 
  writeBatch, 
  doc, 
  getDocFromServer,
  query,
  limit
} from 'firebase/firestore';
import { cn } from '../lib/utils';

interface CollectionStats {
  name: string;
  count: number;
  label: string;
  icon: any;
}

export default function DatabaseManagement() {
  const { schoolId } = useSchool();
  const [stats, setStats] = useState<CollectionStats[]>([
    { name: 'chemicals', count: 0, label: 'المواد الكيميائية', icon: Database },
    { name: 'equipment', count: 0, label: 'الأجهزة والوسائل', icon: Activity },
    { name: 'teachers', count: 0, label: 'الأساتذة', icon: History },
    { name: 'daily_reports', count: 0, label: 'التقارير اليومية', icon: FileJson },
  ]);
  const [loading, setLoading] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchStats = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const newStats = await Promise.all(stats.map(async (stat) => {
        const snapshot = await getDocs(getUserCollection(schoolId, 'equipment'));
        return { ...stat, count: snapshot.size };
      }));
      setStats(newStats);
    } catch (error) {
      console.error('Error fetching database stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionStatus('idle');
    try {
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 5000);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      const allData: any = {};
      await Promise.all(stats.map(async (stat) => {
        const snapshot = await getDocs(getUserCollection(schoolId, 'equipment'));
        allData[stat.name] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }));

      const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lab_database_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('حدث خطأ أثناء تصدير البيانات.');
    }
  };

  const handleResetDatabase = async () => {
    if (!auth.currentUser) return;
    setIsResetting(true);
    try {
      const batch = writeBatch(db);
      await Promise.all(stats.map(async (stat) => {
        const snapshot = await getDocs(getUserCollection(schoolId, 'equipment'));
        snapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });
      }));
      await batch.commit();
      setResetSuccess(true);
      setShowResetConfirm(false);
      fetchStats();
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'bulk_reset');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24" dir="rtl">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <Link to={ROUTES.SETTINGS} className="p-2 hover:bg-primary/10 rounded-full transition-colors">
              <ChevronLeft size={24} />
            </Link>
            <h2 className="text-4xl font-black tracking-tight">إدارة قاعدة البيانات</h2>
          </div>
          <p className="text-secondary/60 text-lg">تحكم كامل في البيانات، النسخ الاحتياطي، وصحة الاتصال بالسحابة.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={checkConnection}
            disabled={isCheckingConnection}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all border",
              connectionStatus === 'success' ? "bg-green-50 text-green-600 border-green-100" :
              connectionStatus === 'error' ? "bg-red-50 text-red-600 border-red-100" :
              "bg-surface text-primary border-primary/10 hover:bg-primary/5"
            )}
          >
            {isCheckingConnection ? <RefreshCw size={18} className="animate-spin" /> : <Cloud size={18} />}
            {connectionStatus === 'success' ? 'متصل بنجاح' : 
             connectionStatus === 'error' ? 'خطأ في الاتصال' : 'فحص الاتصال بالسحابة'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Stats Grid */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-surface-container-lowest p-8 rounded-[32px] border border-outline/10 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-4 bg-primary/5 rounded-2xl text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                    <stat.icon size={24} />
                  </div>
                  <span className="text-xs font-black text-secondary/40 uppercase tracking-widest">إحصائيات</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-secondary mb-1">{stat.label}</h3>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-primary">
                      {loading ? '...' : stat.count}
                    </span>
                    <span className="text-sm text-secondary/40 font-bold">سجل</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Database Health Card */}
          <div className="bg-surface-container-lowest rounded-[32px] p-10 border border-outline/10 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  <Activity size={24} />
                </div>
                <h3 className="text-2xl font-black text-primary">حالة قاعدة البيانات</h3>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-2xl border border-outline/5">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-3 h-3 rounded-full", connectionStatus === 'error' ? "bg-red-500" : "bg-green-500")} />
                    <div>
                      <p className="font-bold text-secondary">اتصال Firestore</p>
                      <p className="text-xs text-secondary/60">حالة الاتصال الفوري بخوادم Google Cloud</p>
                    </div>
                  </div>
                  <span className={cn("px-4 py-1 rounded-full text-xs font-black", connectionStatus === 'error' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
                    {connectionStatus === 'error' ? 'غير متصل' : 'نشط'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-6 bg-surface-container-low rounded-2xl border border-outline/5">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <div>
                      <p className="font-bold text-secondary">المزامنة المحلية</p>
                      <p className="text-xs text-secondary/60">تخزين البيانات محلياً للعمل بدون إنترنت</p>
                    </div>
                  </div>
                  <span className="px-4 py-1 bg-green-100 text-green-600 rounded-full text-xs font-black">مفعلة</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-surface-container-lowest rounded-[32px] p-8 border border-outline/10 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-primary mb-6 flex items-center gap-2">
              <Database size={20} />
              عمليات البيانات
            </h3>
            
            <button 
              onClick={handleExportJSON}
              className="w-full flex items-center justify-between p-5 bg-surface-container-low hover:bg-primary/5 rounded-2xl border border-outline/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-surface rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform">
                  <Download size={20} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary">تصدير كامل (JSON)</p>
                  <p className="text-[10px] text-secondary/40">نسخة احتياطية شاملة</p>
                </div>
              </div>
            </button>

            <button className="w-full flex items-center justify-between p-5 bg-surface-container-low hover:bg-primary/5 rounded-2xl border border-outline/5 transition-all group opacity-50 cursor-not-allowed">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-surface rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform">
                  <Upload size={20} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary">استيراد بيانات</p>
                  <p className="text-[10px] text-secondary/40">دمج سجلات من ملف خارجي</p>
                </div>
              </div>
            </button>

            <Link 
              to={ROUTES.BACKUP_CENTER}
              className="w-full flex items-center justify-between p-5 bg-surface-container-low hover:bg-primary/5 rounded-2xl border border-outline/5 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-surface rounded-xl text-primary shadow-sm group-hover:scale-110 transition-transform">
                  <History size={20} />
                </div>
                <div className="text-right">
                  <p className="font-bold text-secondary">مركز النسخ الاحتياطي</p>
                  <p className="text-[10px] text-secondary/40">إدارة الجدولة والأرشفة</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="bg-red-50 rounded-[32px] p-8 border border-red-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-red-600 mb-6 flex items-center gap-2">
              <ShieldAlert size={20} />
              منطقة الخطر
            </h3>
            
            <p className="text-xs text-red-600/70 font-bold leading-relaxed">
              هذه العمليات لا يمكن التراجع عنها. يرجى التأكد من أخذ نسخة احتياطية قبل البدء.
            </p>

            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 size={18} />
              تفريغ قاعدة البيانات
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-surface rounded-[32px] p-10 max-w-md w-full shadow-2xl border border-outline/10 text-right"
            >
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                <AlertTriangle size={40} className="text-red-600" />
              </div>
              <h3 className="text-3xl font-black text-red-600 mb-4 tracking-tight">تأكيد الحذف النهائي</h3>
              <p className="text-secondary/80 text-lg leading-relaxed mb-10">
                أنت على وشك حذف جميع السجلات من قاعدة البيانات. هذه العملية <span className="font-black text-red-600">نهائية</span> ولا يمكن استعادتها.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={handleResetDatabase}
                  disabled={isResetting}
                  className="flex-1 bg-red-600 text-white py-5 rounded-full font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isResetting ? <RefreshCw className="animate-spin mx-auto" /> : 'نعم، احذف الكل'}
                </button>
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 bg-surface border border-outline/20 text-secondary py-5 rounded-full font-black hover:bg-surface-container-high transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {resetSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-2xl"
          >
            <CheckCircle2 size={24} />
            <span className="font-bold text-lg">تم تفريغ قاعدة البيانات بنجاح</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
