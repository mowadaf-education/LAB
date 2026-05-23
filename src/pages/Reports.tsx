import { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { 
  FileText, 
  Users, 
  FlaskConical, 
  Activity,
  CheckCircle,
  Clock,
  Printer,
  Save,
  ChevronLeft,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Reports() {
  const { schoolId, schoolName, directorate } = useSchool();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    chemicals: 0,
    equipment: 0,
    teachers: 0,
    incidents: 0
  });
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const chemSnap = await getDocs(getUserCollection(schoolId, 'chemicals'));
        const equipSnap = await getDocs(getUserCollection(schoolId, 'equipment'));
        const teacherSnap = await getDocs(getUserCollection(schoolId, 'teachers'));
        const incidentSnap = await getDocs(getUserCollection(schoolId, 'safety_incidents'));

        setStats({
          chemicals: chemSnap.size,
          equipment: equipSnap.size,
          teachers: teacherSnap.size,
          incidents: incidentSnap.size
        });
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'stats');
      }
    };

    fetchData();
  }, [schoolId]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      await addDoc(getUserCollection(schoolId, 'reports'), {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        stats,
        generatedAt: serverTimestamp(),
        title: `تقرير شهر ${new Date().toLocaleString('ar-DZ', { month: 'long' })} ${new Date().getFullYear()}`
      });
      alert('تم حفظ التقرير في الأرشيف بنجاح');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reports');
    } finally {
      setIsGenerating(false);
    }
  };

  const kpis = [
    { label: 'إجمالي النشاطات', value: '42', trend: '+12%', icon: CheckCircle, color: 'bg-primary/10' },
    { label: 'الأساتذة المسجلون', value: stats.teachers.toString(), trend: 'نشط', icon: Users, color: 'bg-primary/5' },
    { label: 'المواد الكيميائية', value: stats.chemicals.toString(), trend: 'مستقر', icon: FlaskConical, color: 'bg-surface-container-low' },
    { label: 'الحوادث المسجلة', value: stats.incidents.toString(), trend: 'منخفض', icon: Activity, color: 'bg-surface-container-low' },
  ];

  const currentMonth = new Date().toLocaleString('ar-DZ', { month: 'long' });
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative overflow-hidden bg-surface p-12 rounded-[40px] border border-outline/10 shadow-2xl flex justify-between items-start">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-bl-[200px] -mr-20 -mt-20" />
        
        <div className="relative z-10 flex flex-col gap-4 text-right">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <BarChart3 size={14} />
            التحليلات والتقارير
          </div>
          <h2 className="text-3xl font-black text-primary tracking-tight">تقرير النشاط الشهري</h2>
          <p className="text-on-surface/60 font-bold text-lg">الفترة: <span className="text-primary">{currentMonth} {currentYear}</span></p>
          
          <div className="mt-8 grid grid-cols-2 gap-8 text-xs font-black text-on-surface/40 uppercase tracking-widest leading-loose">
            <div className="space-y-1">
              <p>الجمهورية الجزائرية الديمقراطية الشعبية</p>
              <p>وزارة التربية الوطنية</p>
            </div>
            <div className="space-y-1">
              <p>{schoolName}</p>
              <p>{directorate} - الجزائر</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="p-4 bg-surface-container-low rounded-[32px] shadow-xl border border-outline/5">
            <img 
              className="h-28 w-28 object-contain" 
              src="/ministry-logo.png" 
              alt="Logo" 
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="text-[10px] text-on-surface/30 font-black tracking-[0.3em] uppercase">LAB-ID: DZ-42-019</span>
        </div>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-8 rounded-[32px] flex flex-col justify-between transition-all hover:scale-[1.02] border border-outline/5 shadow-xl group cursor-default", 
                kpi.color
              )}
            >
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-surface rounded-2xl shadow-sm text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] bg-surface px-3 py-1 rounded-full shadow-sm">{kpi.trend}</span>
              </div>
              <div>
                <p className="text-5xl font-black text-primary leading-none tracking-tighter mb-2">{loading ? '...' : kpi.value}</p>
                <p className="text-sm font-black text-on-surface/60 uppercase tracking-widest">{kpi.label}</p>
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-surface p-10 rounded-[40px] flex flex-col gap-8 border border-outline/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-primary/5 rounded-br-[100px] -ml-10 -mt-10" />
          <div className="relative z-10 flex justify-between items-center">
            <h3 className="text-2xl font-black text-primary tracking-tight">توزيع النشاطات حسب المادة</h3>
            <TrendingUp size={24} className="text-primary/30" />
          </div>
          <div className="relative z-10 flex items-center justify-center h-72">
            <div className="w-56 h-56 rounded-full border-[32px] border-primary/10 flex items-center justify-center relative shadow-inner">
              <div className="absolute inset-0 border-[32px] border-primary border-t-transparent border-l-transparent rounded-full rotate-45 shadow-lg"></div>
              <div className="text-center">
                <p className="text-4xl font-black text-primary tracking-tighter">42</p>
                <p className="text-[10px] text-on-surface/40 font-black uppercase tracking-widest">إجمالي</p>
              </div>
            </div>
          </div>
          <div className="relative z-10 grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <p className="text-xs font-black text-on-surface/40 uppercase tracking-widest">فيزياء</p>
              <p className="text-lg font-black text-primary">18</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-on-surface/40 uppercase tracking-widest">كيمياء</p>
              <p className="text-lg font-black text-primary">14</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-on-surface/40 uppercase tracking-widest">علوم</p>
              <p className="text-lg font-black text-primary">10</p>
            </div>
          </div>
        </div>

        <div className="bg-surface p-10 rounded-[40px] flex flex-col gap-8 border border-outline/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-[100px] -mr-10 -mt-10" />
          <div className="relative z-10 flex justify-between items-center">
            <h3 className="text-2xl font-black text-primary tracking-tight">حجم التجارب الأسبوعي</h3>
            <Activity size={24} className="text-primary/30" />
          </div>
          <div className="relative z-10 flex items-end justify-between h-72 gap-6 px-4 pt-12">
            {[40, 75, 90, 55].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                <div 
                  className="w-full bg-primary/10 rounded-2xl hover:bg-primary transition-all cursor-pointer relative shadow-inner" 
                  style={{ height: `${h}%` }}
                >
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-on-primary text-[10px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {h}%
                  </div>
                </div>
                <span className="text-[10px] font-black text-on-surface/40 uppercase tracking-widest">أسبوع {i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-center gap-8 pb-12">
        <button 
          onClick={() => navigate(ROUTES.DAILY_REPORT)}
          className="bg-surface text-primary border-2 border-primary/20 font-black py-5 px-10 rounded-full shadow-xl hover:bg-primary/5 hover:border-primary transition-all flex items-center gap-4 active:scale-95"
        >
          <FileText size={22} />
          التقرير اليومي
        </button>
        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="bg-surface-container-low text-primary font-black py-5 px-10 rounded-full shadow-xl hover:bg-surface-container transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95 border border-outline/5"
        >
          {isGenerating ? <Clock className="animate-spin" size={22} /> : <Save size={22} />}
          حفظ في الأرشيف
        </button>
        <button className="bg-primary text-on-primary font-black py-5 px-12 rounded-full shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all flex items-center gap-4 active:scale-95">
          <Printer size={22} />
          طباعة التقرير الرسمي
        </button>
      </div>
    </div>
  );
}
