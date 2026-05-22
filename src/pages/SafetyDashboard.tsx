import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Trash2, 
  ArrowLeft,
  LifeBuoy
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

const safetyModules = [
  { 
    title: 'الأمن والسلامة', 
    desc: 'متابعة سجل الحوادث، المعدات وطفيات الحريق.', 
    icon: ShieldAlert, 
    color: 'bg-error/10 text-error', 
    path: '/safety' 
  },
  { 
    title: 'إدارة النفايات الكيميائية', 
    desc: 'نظام للتعامل مع المواد المنتهية والمهملة وفق بروتوكولات التحييد.', 
    icon: Trash2, 
    color: 'bg-surface-container-high', 
    path: '/chemical-waste' 
  },
  { 
    title: 'دليل السلامة', 
    desc: 'دليل شامل لإجراءات الأمن والسلامة في المخابر المدرسية.', 
    icon: LifeBuoy, 
    color: 'bg-primary/10', 
    path: '/safety-guide' 
  }
];

export default function SafetyDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      <div className="flex items-center gap-4 border-b border-outline/10 pb-6 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-surface-container-high rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-on-surface-variant" />
        </button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-l from-primary to-secondary bg-clip-text text-transparent">
            الأمن والسلامة
          </h1>
          <p className="text-on-surface-variant mt-1 text-sm">
            إدارة أمن وحماية العاملين والوسائل العلمية.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safetyModules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div
              key={mod.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              onClick={() => navigate(mod.path)}
              className="bg-surface-container-lowest p-8 rounded-[32px] hover:shadow-ambient-hover hover:-translate-y-1 transition-all duration-300 ease-out group cursor-pointer relative overflow-hidden shadow-ambient border border-outline/5"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mix-blend-overlay" />
              
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", mod.color)}>
                <Icon size={32} />
              </div>
              
              <h3 className="text-2xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">
                {mod.title}
              </h3>
              
              <p className="text-on-surface-variant leading-relaxed opacity-90">
                {mod.desc}
              </p>
              
              <div className="absolute bottom-8 left-8 opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0">
                <ArrowLeft size={24} className="text-primary" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
