import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Map, 
  BookOpen, 
  RefreshCw, 
  PlusCircle,
  ArrowLeft,
  Sparkles,
  GraduationCap,
  Users,
  Calculator,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const pedagogicalModules = [
  { 
    title: 'التقارير اليومية', 
    desc: 'تسجيل ومتابعة النشاطات اليومية للمخبر والحصص التطبيقية.', 
    icon: FileText, 
    color: 'bg-primary/10', 
    path: '/daily-report' 
  },
  { 
    title: 'فريق الأساتذة', 
    desc: 'قائمة أساتذة العلوم والفيزياء والجداول الزمنية للفريق التربوي.', 
    icon: Users, 
    color: 'bg-secondary-container/50', 
    path: '/teachers' 
  },
  { 
    title: 'جدولة الحصص', 
    desc: 'تسيير الجدول الزمني للمؤسسة وتوزيع الفترات الدراسية.', 
    icon: Calendar, 
    color: 'bg-primary/5', 
    path: '/timetable' 
  },
  { 
    title: 'حصص المخبر', 
    desc: 'جدولة استخدام المخابر وتفادي التضارب بين الأفواج التربوية.', 
    icon: Clock, 
    color: 'bg-tertiary-container/30', 
    path: '/lab-schedule' 
  },
  { 
    title: 'المتابعة البيداغوجية', 
    desc: 'متابعة تنفيذ البرامج الدراسية والدروس التطبيقية المنجزة.', 
    icon: GraduationCap, 
    color: 'bg-surface-container-high', 
    path: '/pedagogical-tracking' 
  },
  { 
    title: 'سجل المتابعة', 
    desc: 'سجل رقمي متكامل يضم استعمال الوسائل، وحصيلة الأعمال.', 
    icon: BookOpen, 
    color: 'bg-secondary/10', 
    path: '/follow-up-registry' 
  },
  { 
    title: 'تسيير الأفواج', 
    desc: 'إدارة وتنظيم أفواج التلاميذ ضمن الأقسام والمخابر.', 
    icon: Users, 
    color: 'bg-surface-container-low', 
    path: '/student-groups' 
  },
  { 
    title: 'إدارة الخريطة التربوية', 
    desc: 'توزيع التلاميذ والأقسام على القاعات والمخابر المتاحة.', 
    icon: Map, 
    color: 'bg-tertiary-container/20', 
    path: '/educational-map' 
  },
  { 
    title: 'التحضير الذكي للنماذج', 
    desc: 'توليد النماذج الرقمية باستخدام مساعد الذكاء الاصطناعي.', 
    icon: Sparkles, 
    color: 'bg-primary/10', 
    path: '/smart-forms' 
  },
  { 
    title: 'طلب نشاط تطبيقي', 
    desc: 'تقديم ومتابعة طلبات التجارب والنشاطات العلمية.', 
    icon: PlusCircle, 
    color: 'bg-error-container text-on-error-container', 
    path: '/activity-request' 
  },
  { 
    title: 'مزامنة الحصص', 
    desc: 'ربط التحضير الذكي بجدول الحصص الفعلي لضمان الجاهزية.', 
    icon: RefreshCw, 
    color: 'bg-surface-container-high', 
    path: '/sync' 
  },
  { 
    title: 'الحاسبة المخبرية', 
    desc: 'أدوات وحسابات سريعة لتحضير المحاليل وإدارة التراكيز.', 
    icon: Calculator, 
    color: 'bg-primary/5 text-primary', 
    path: '/calculators' 
  },
];

export default function PedagogicalDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-[0.6875rem] font-black uppercase tracking-widest mb-2">
            <GraduationCap size={14} />
            الفضاء البيداغوجي الرقمي
          </div>
          <h1 className="text-[3.5rem] leading-none font-black text-primary tracking-tighter">اللوحة البيداغوجية</h1>
          <p className="text-on-surface/80 text-[1.25rem] font-bold">تسيير الجداول الزمنية والنشاطات العلمية والفريق التربوي</p>
        </div>
        
        <button 
          onClick={() => navigate('/')}
          className="bg-surface-container-lowest text-primary px-8 py-4 rounded-full text-[0.875rem] font-bold flex items-center gap-3 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out active:scale-95"
        >
          <ArrowLeft size={20} />
          العودة للرئيسية
        </button>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        {pedagogicalModules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
              onClick={() => navigate(mod.path)}
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
                <div className="bg-surface-container-low text-primary p-2 rounded-full shadow-sm">
                  <Sparkles size={16} />
                </div>
              </div>
              
              <div className="relative z-10">
                <h4 className="text-[1.75rem] leading-tight font-bold text-primary mb-3 group-hover:text-primary-container transition-colors font-sans">{mod.title}</h4>
                <p className="text-[0.875rem] text-on-surface/80 mb-10 line-clamp-3 leading-relaxed font-medium">{mod.desc}</p>
              </div>

              <div className="pt-6 flex justify-between items-center text-primary font-black text-sm relative z-10">
                <span className="group-hover:tracking-[0.2em] transition-all uppercase text-[0.6875rem]">فتح القسم</span>
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
