import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { 
  FlaskConical, 
  Beaker, 
  Monitor, 
  Package, 
  Trash2, 
  Database,
  ArrowLeft,
  Sparkles,
  Wrench,
  ShieldCheck,
  RefreshCw,
  Printer,
  Camera,
  X,
  Bot,
  ShieldAlert,
  Search
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { analyzeLabImage } from '../services/geminiService';

const inventoryModules = [
  { 
    title: 'المخزن الكيميائي', 
    desc: 'تتبع المحاليل، تواريخ الصلاحية، ودرجات الخطورة Safety Data.', 
    icon: FlaskConical, 
    color: 'bg-primary/10', 
    path: ROUTES.CHEMICALS 
  },
  { 
    title: 'بطاقات الجرد', 
    desc: 'سجل رسمي لبطاقات الجرد يتضمن الأرقام التسلسلية والمراجعات العشرية.', 
    icon: Database, 
    color: 'bg-primary/20', 
    path: ROUTES.INVENTORY_CARDS 
  },
  { 
    title: 'الزجاجيات والعتاد', 
    desc: 'قاعدة بيانات شاملة للأجهزة والمعدات الزجاجية والميكانيكية.', 
    icon: Beaker, 
    color: 'bg-secondary-container/50', 
    path: ROUTES.EQUIPMENT 
  },
  { 
    title: 'مصفوفة التوافق', 
    desc: 'قواعد تخزين المواد الكيميائية وتفادي التفاعلات الخطرة.', 
    icon: ShieldCheck, 
    color: 'bg-surface-container-high', 
    path: ROUTES.CHEMICAL_STORAGE 
  },
  { 
    title: 'جرد التجهيزات التقنية', 
    desc: 'واجهة عرض للأجهزة الحساسة تظهر حالة المعايرة.', 
    icon: Monitor, 
    color: 'bg-tertiary-container/20', 
    path: ROUTES.TECH_INVENTORY 
  },
  { 
    title: 'جرد المستهلكات و SDS', 
    desc: 'سجل متقدم يربط كل مادة مستهلكة بملف بيانات السلامة الخاص بها.', 
    icon: Package, 
    color: 'bg-surface-container-low', 
    path: ROUTES.CONSUMABLES_SDS 
  },
  { 
    title: 'جرد الزجاجيات والكسور', 
    desc: 'سجل متتابع للأدوات الزجاجية وحساب القيمة المالية للفواقد والكسور.', 
    icon: Beaker, 
    color: 'bg-primary/5', 
    path: ROUTES.GLASSWARE_BREAKAGE 
  },
  { 
    title: 'إدارة النفايات الكيميائية', 
    desc: 'نظام للتعامل مع المواد المنتهية وفق بروتوكولات التحييد.', 
    icon: Trash2, 
    color: 'bg-error-container text-on-error-container', 
    path: ROUTES.CHEMICAL_WASTE 
  },
  { 
    title: 'الصيانة والإصلاح', 
    desc: 'سجلات صيانة الأجهزة المعطلة وطلبات التصليح.', 
    icon: Wrench, 
    color: 'bg-surface-container-high', 
    path: ROUTES.MAINTENANCE 
  },
  { 
    title: 'إسقاط التجهيزات', 
    desc: 'إسقاط وتكهين فني للمعدات التالفة وغير القابلة للإصلاح.', 
    icon: Trash2, 
    color: 'bg-error-container text-on-error-container', 
    path: ROUTES.SCRAPPING 
  },
  { 
    title: 'إعارة الوسائل', 
    desc: 'إدارة وتوثيق طلبات الإعارة بين الأقسام والمخابر.', 
    icon: RefreshCw, 
    color: 'bg-primary/10', 
    path: ROUTES.LOAN_REQUEST 
  },
  { 
    title: 'مركز الطباعة (QR)', 
    desc: 'توليد وطباعة ملصقات QR Code لكافة المواد والأجهزة.', 
    icon: Printer, 
    color: 'bg-secondary-container/50 text-secondary', 
    path: ROUTES.QR_PRINT_CENTER 
  },
];

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanResult(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const base64 = (evt.target?.result as string).split(',')[1];
      try {
        const result = await analyzeLabImage(base64);
        setScanResult(result);
      } catch (err) {
        console.error(err);
      } finally {
        setScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 sm:gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-[0.6875rem] font-black uppercase tracking-widest mb-2">
            <Database size={14} />
            إدارة المخزون الشاملة
          </div>
          <h1 className="text-[3.5rem] leading-none font-black text-primary tracking-tighter">لوحة الجرد</h1>
          <p className="text-on-surface/80 text-[1.25rem] font-bold">تسيير ومتابعة كافة ممتلكات المخبر المادية والكيميائية</p>
        </div>
        
        <div className="flex gap-4 relative z-10">
          <button 
            onClick={() => setIsScannerOpen(true)}
            className="bg-primary text-on-primary px-8 py-4 rounded-full text-[0.875rem] font-bold flex items-center gap-3 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out active:scale-95"
          >
            <Camera size={20} />
            المساعد البصري الذكي
          </button>
          <button 
            onClick={() => navigate(ROUTES.HOME)}
            className="bg-surface-container-lowest text-primary px-8 py-4 rounded-full text-[0.875rem] font-bold flex items-center gap-3 shadow-ambient hover:shadow-ambient-hover hover:-translate-y-[2px] transition-all duration-300 ease-out active:scale-95"
          >
            <ArrowLeft size={20} />
            العودة للرئيسية
          </button>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
        {inventoryModules.map((mod, i) => {
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
                <span className="group-hover:tracking-[0.2em] transition-all uppercase text-[0.6875rem]">فتح السجل</span>
                <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-all shadow-sm">
                  <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Vision Scanner Modal */}
      <AnimatePresence>
        {isScannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsScannerOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-surface w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10 text-right"
              dir="rtl"
            >
              <div className="p-8 border-b border-outline/5 flex justify-between items-center bg-surface-container-low/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-primary">المساعد البصري Mekhbari Vision</h3>
                    <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">مدعوم بـ Gemini 1.5 Flash</p>
                  </div>
                </div>
                <button onClick={() => setIsScannerOpen(false)} className="p-2.5 hover:bg-surface-container-high rounded-full transition-all"><X size={24} /></button>
              </div>

              <div className="p-10 space-y-8">
                {!scanResult && !scanning ? (
                  <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-outline/10 rounded-[40px] space-y-6">
                    <div className="w-24 h-24 rounded-full bg-surface-container flex items-center justify-center text-secondary/30">
                      <Camera size={48} />
                    </div>
                    <div className="text-center space-y-2">
                       <h4 className="text-xl font-black text-primary italic">التقط صورة للوسيلة أو المادة</h4>
                       <p className="text-sm font-bold text-secondary/60 max-w-sm">سيقوم المختبر الذكي بالتعرف على الأداة المخبرية وتزويدك بتقرير سريع حول استخدامها وسلامتها.</p>
                    </div>
                    <label className="cursor-pointer">
                      <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageUpload} />
                      <div className="bg-primary text-on-primary px-10 py-5 rounded-full font-black shadow-2xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3">
                        <Camera size={24} />
                        التقاط صورة الآن
                      </div>
                    </label>
                  </div>
                ) : scanning ? (
                  <div className="flex flex-col items-center justify-center py-32 space-y-8">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-primary">
                        <Bot size={40} className="animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h4 className="text-2xl font-black text-primary animate-pulse">جاري التحليل المعمق...</h4>
                      <p className="text-sm font-bold text-secondary/60">يتم مقارنة الصورة مع قاعدة البيانات العالمية للوسائل التعليمية.</p>
                    </div>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="space-y-8"
                  >
                    <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10 flex items-start gap-6">
                       <div className="w-20 h-20 rounded-3xl bg-surface shadow-xl flex items-center justify-center text-primary border border-outline/10">
                         <Bot size={44} />
                       </div>
                       <div className="space-y-2">
                         <h4 className="text-3xl font-black text-primary tracking-tight">{scanResult.nameAr}</h4>
                         <div className="flex items-center gap-2 text-primary/40 font-black text-xs">
                            <Sparkles size={16} />
                            نتيجة تحليل الذكاء الاصطناعي
                         </div>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                       <div className="bg-surface-container-low p-8 rounded-[32px] border border-outline/5 space-y-4">
                          <h5 className="flex items-center gap-2 text-primary font-black uppercase text-xs tracking-widest">
                            <Beaker size={18} />
                            الاستخدام البيداغوجي
                          </h5>
                          <p className="text-sm font-bold text-secondary leading-relaxed">{scanResult.primaryUse}</p>
                       </div>
                       <div className="bg-error/5 p-8 rounded-[32px] border border-error/10 space-y-4">
                          <h5 className="flex items-center gap-2 text-error font-black uppercase text-xs tracking-widest">
                            <ShieldAlert size={18} />
                            تحذيرات السلامة
                          </h5>
                          <p className="text-sm font-bold text-secondary leading-relaxed">{scanResult.safetyWarnings}</p>
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        onClick={() => { setScanResult(null); setScanning(false); }}
                        className="flex-1 py-5 bg-surface-container hover:bg-surface-container-high rounded-full font-black text-primary transition-all"
                      >
                         مسح وإعادة المحاولة
                      </button>
                      <button 
                        onClick={() => {
                           setIsScannerOpen(false);
                           navigate(ROUTES.INVENTORY_DASHBOARD);
                        }}
                        className="flex-1 py-5 bg-primary text-on-primary rounded-full font-black shadow-xl shadow-primary/20 hover:scale-105 transition-all text-center"
                      >
                         إضافة لبطاقة الجرد
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
