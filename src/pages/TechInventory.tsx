import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Search, 
  Bell, 
  Settings, 
  TrendingUp, 
  Filter, 
  History, 
  Activity,
  ShieldCheck,
  RefreshCw,
  Plus,
  ArrowLeft,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { onSnapshot, query, where } from 'firebase/firestore';
import { getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';

interface Equipment {
  id: string;
  name: string;
  type: 'glassware' | 'tech' | 'other';
  serialNumber: string;
  status: 'functional' | 'maintenance' | 'broken';
  totalQuantity: number;
  availableQuantity: number;
  brokenQuantity: number;
  lastCalibration?: string;
  nextCalibration?: string;
  supplier?: string;
  location?: string;
  notes?: string;
  smartNameAr?: string;
  smartDescriptionAr?: string;
  imageKeyword?: string;
  isSensitive?: boolean;
  specs?: {
    model?: string;
    resolution?: string;
    processor?: string;
    ram?: string;
    storage?: string;
    accuracy?: string;
    range?: string;
    power?: string;
    [key: string]: string | undefined;
  };
}

const getSmartImage = (name: string, keyword?: string) => {
  const searchKey = keyword || name;
  const n = searchKey.toLowerCase();
  
  // High-quality, device-only images (product photography style)
  if (n.includes('microscope') || n.includes('مجهر')) return 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&q=80&w=800';
  if (n.includes('spectro') || n.includes('طيف')) return 'https://images.unsplash.com/photo-1532187875605-2fe358511423?auto=format&fit=crop&q=80&w=800';
  if (n.includes('laptop') || n.includes('محمول')) return 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=800';
  if (n.includes('datashow') || n.includes('projector') || n.includes('عرض')) return 'https://images.unsplash.com/photo-1535016120720-40c646bebbfc?auto=format&fit=crop&q=80&w=800';
  if (n.includes('computer') || n.includes('حاسوب') || n.includes('station')) return 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=800';
  if (n.includes('centrifuge') || n.includes('طرد')) return 'https://images.unsplash.com/photo-1579154235602-3c2c2aa59c1c?auto=format&fit=crop&q=80&w=800';
  if (n.includes('balance') || n.includes('ميزان')) return 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=800';
  if (n.includes('oscilloscope') || n.includes('راسم')) return 'https://images.unsplash.com/photo-1581092335397-9583ee92d03b?auto=format&fit=crop&q=80&w=800';
  
  return `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800&sig=${encodeURIComponent(searchKey)}`;
};

export default function TechInventory({ isNested = false }: { isNested?: boolean }) {
  const navigate = useNavigate();
  const { schoolId } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  const [devices, setDevices] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<Equipment | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'sensitive'>('all');

  useEffect(() => {
    const q = query(getUserCollection(schoolId, 'equipment'), where('type', '==', 'tech'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        // Auto-detect sensitive devices if not explicitly marked
        const sensitiveKeywords = ['مجهر', 'طيف', 'microscope', 'spectro', 'datashow', 'laptop', 'حاسوب', 'راسم', 'oscilloscope', 'عرض'];
        const isSensitive = data.isSensitive || sensitiveKeywords.some(k => data.name.toLowerCase().includes(k));
        
        return { 
          id: doc.id, 
          ...data,
          isSensitive 
        } as Equipment;
      });
      setDevices(items);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'equipment');
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredDevices = devices.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         d.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || (filterType === 'sensitive' && d.isSensitive);
    return matchesSearch && matchesFilter;
  });

  const stats = [
    { 
      label: 'إجمالي الأصول التقنية', 
      value: devices.length.toString(), 
      trend: 'أجهزة مسجلة', 
      icon: Cpu, 
      color: 'bg-primary/10 text-primary' 
    },
    { 
      label: 'الحالة التشغيلية', 
      value: devices.length > 0 ? `${Math.round((devices.filter(d => d.status === 'functional').length / devices.length) * 100)}%` : '0%', 
      trend: 'جاهزية الأجهزة', 
      icon: Activity, 
      color: 'bg-emerald-500/10 text-emerald-500' 
    },
    { 
      label: 'بانتظار الصيانة', 
      value: devices.filter(d => d.status === 'maintenance').length.toString().padStart(2, '0'), 
      trend: 'تنبيه نشط', 
      icon: RefreshCw, 
      color: 'bg-amber-500/10 text-amber-500' 
    },
    { 
      label: 'أجهزة خارج الخدمة', 
      value: devices.filter(d => d.status === 'broken').length.toString().padStart(2, '0'), 
      trend: 'تحتاج إصلاح', 
      icon: AlertTriangle, 
      color: 'bg-error/10 text-error' 
    },
  ];

  return (
    <div className={cn("space-y-12 max-w-7xl mx-auto pb-24 rtl font-sans", !isNested && "px-6")} dir="rtl">
      {/* Header */}
      {!isNested && (
        <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
          <div className="text-right space-y-3 relative z-10">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
              <Monitor size={14} />
              جرد التجهيزات التكنولوجية
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter font-serif">الأجهزة الحساسة</h1>
            <p className="text-on-surface/60 text-xl font-bold">مراقبة حالة <span className="text-primary italic">المعايرة والمواصفات</span> التقنية</p>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex bg-surface/50 backdrop-blur-sm p-1 rounded-full border border-outline/10 shadow-lg">
              <button 
                onClick={() => setFilterType('all')}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-black transition-all",
                  filterType === 'all' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface/40 hover:text-primary"
                )}
              >
                الكل
              </button>
              <button 
                onClick={() => setFilterType('sensitive')}
                className={cn(
                  "px-6 py-2.5 rounded-full text-xs font-black transition-all flex items-center gap-2",
                  filterType === 'sensitive' ? "bg-primary text-on-primary shadow-lg" : "text-on-surface/40 hover:text-primary"
                )}
              >
                <Sparkles size={14} />
                الأجهزة الحساسة
              </button>
            </div>
            <div className="relative group">
              <input 
                className="w-64 bg-surface border border-outline/10 rounded-full px-6 py-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 transition-all shadow-xl"
                placeholder="البحث عن جهاز..." 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
            </div>
            <button 
              onClick={() => navigate(ROUTES.EQUIPMENT)}
              className="bg-primary text-on-primary w-14 h-14 rounded-full font-black flex items-center justify-center shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95"
            >
              <Plus size={28} />
            </button>
          </div>

          {/* Decorative elements */}
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </header>
      )}

      {/* Stats Overview */}
      {!isNested && (
        <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "p-8 rounded-[40px] border border-outline/5 transition-all group relative overflow-hidden shadow-xl",
                stat.color
              )}
            >
              <div className="absolute top-0 left-0 w-24 h-24 bg-surface/40 rounded-br-[80px] -ml-6 -mt-6 group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className="p-4 bg-surface rounded-2xl shadow-sm text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <stat.icon size={24} />
                </div>
              </div>
              <div className="relative z-10">
                <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest mb-1">{stat.label}</p>
                <span className="text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform inline-block">{stat.value}</span>
                <p className="text-[10px] font-bold mt-2 opacity-60">{stat.trend}</p>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-surface-container-low animate-pulse rounded-[40px] h-[500px]" />
            ))
          ) : filteredDevices.length === 0 ? (
            <div className="col-span-full py-20 text-center space-y-4 opacity-40">
              <Monitor size={80} className="mx-auto" />
              <p className="text-2xl font-black">لا توجد أجهزة تقنية مسجلة حالياً</p>
            </div>
          ) : (
            filteredDevices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-surface rounded-[40px] border border-outline/5 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 flex flex-col"
              >
                <div className="relative h-64 overflow-hidden bg-surface-container-low">
                  <img 
                    src={getSmartImage(device.name, device.imageKeyword)} 
                    alt={device.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
                    referrerPolicy="no-referrer"
                  />
                  {device.isSensitive && (
                    <div className="absolute top-6 left-6 bg-primary/90 text-on-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                      <Sparkles size={12} />
                      جهاز حساس
                    </div>
                  )}
                  <div className="absolute top-6 right-6 bg-primary/90 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                    {device.location || 'مخبر غير محدد'}
                  </div>
                  <div className="absolute bottom-6 left-6 bg-surface/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-lg">
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">ID: {device.serialNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="text-2xl font-black text-primary font-serif leading-tight">{device.smartNameAr || device.name}</h3>
                      <div className={cn(
                        "w-4 h-4 rounded-full shadow-[0_0_15px]",
                        device.status === 'functional' ? "bg-green-500 shadow-green-500/50" : 
                        device.status === 'maintenance' ? "bg-orange-400 shadow-orange-400/50" : "bg-red-500 shadow-red-500/50"
                      )} />
                    </div>
                    <p className="text-xs font-bold text-on-surface/40">{device.smartDescriptionAr || device.supplier || 'المورد غير مسجل'}</p>
                  </div>

                  <div className="space-y-4 bg-surface-container-low/30 p-6 rounded-3xl border border-outline/5">
                    <div className="flex justify-between text-sm font-bold">
                      <span className="text-on-surface/40">الرقم التسلسلي:</span>
                      <span className="text-primary font-mono">{device.serialNumber || '---'}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold items-center">
                      <span className="text-on-surface/40">حالة المعايرة:</span>
                      <div className="flex items-center gap-2">
                        {device.nextCalibration && new Date(device.nextCalibration) < new Date() ? (
                          <div className="flex items-center gap-1 text-error text-[10px] font-black animate-pulse">
                            <AlertTriangle size={12} />
                            منتهية
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-primary text-[10px] font-black">
                            <CheckCircle2 size={12} />
                            محدثة
                          </div>
                        )}
                        <span className="text-primary">{device.nextCalibration || 'غير مسجل'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => setSelectedDevice(device)}
                      className="flex-1 bg-surface border-2 border-primary/10 text-primary py-4 rounded-full font-black text-xs hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      المواصفات الكاملة
                    </button>
                    <button 
                      onClick={() => navigate(`${ROUTES.EQUIPMENT}?id=${device.id}`)}
                      className="w-14 h-14 flex items-center justify-center rounded-full bg-surface border-2 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                    >
                      <Settings size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Add New Card */}
        <button 
          onClick={() => navigate(ROUTES.EQUIPMENT)}
          className="group bg-surface-container-low/50 border-4 border-dashed border-outline/10 rounded-[40px] p-12 flex flex-col items-center justify-center gap-6 hover:bg-surface-container-low transition-all duration-500 min-h-[500px]"
        >
          <div className="w-20 h-20 rounded-[28px] bg-surface flex items-center justify-center text-primary shadow-xl group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
            <Plus size={40} />
          </div>
          <div className="text-center space-y-2">
            <h4 className="text-2xl font-black text-primary font-serif">إضافة جهاز جديد</h4>
            <p className="text-sm text-on-surface/40 font-bold">تسجيل عتاد تكنولوجي عالي الدقة</p>
          </div>
        </button>
      </section>

      {/* Footer Info */}
      <footer className="mt-16 pt-8 border-t border-outline/5 flex flex-col md:flex-row justify-between items-center gap-8 text-on-surface/40">
        <div className="flex gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-primary/40" />
            <span className="text-xs font-black uppercase tracking-widest">معايير NF-ISO معتمدة</span>
          </div>
          <div className="flex items-center gap-3 border-r border-outline/10 pr-8">
            <RefreshCw size={20} className="text-primary/40" />
            <span className="text-xs font-black uppercase tracking-widest">مزامنة البيانات تلقائية</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="w-10 h-10 rounded-full border border-outline/10 flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all">
            <ArrowLeft size={20} />
          </button>
          <span className="text-xs font-black uppercase tracking-widest px-4">الصفحة 1 من 5</span>
          <button className="w-10 h-10 rounded-full border border-outline/10 flex items-center justify-center hover:bg-primary hover:text-on-primary transition-all rotate-180">
            <ArrowLeft size={20} />
          </button>
        </div>
      </footer>

      {/* Device Details Modal */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm rtl"
            onClick={() => setSelectedDevice(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surface w-full max-w-4xl rounded-[40px] overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left: Image & Quick Info */}
              <div className="w-full md:w-2/5 relative h-64 md:h-auto bg-surface-container-low">
                <img 
                  src={getSmartImage(selectedDevice.name, selectedDevice.imageKeyword)} 
                  alt={selectedDevice.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 right-8 text-white">
                  <h3 className="text-3xl font-black font-serif leading-tight">{selectedDevice.smartNameAr || selectedDevice.name}</h3>
                  <p className="text-white/70 font-bold">{selectedDevice.serialNumber}</p>
                </div>
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="absolute top-6 right-6 w-12 h-12 bg-surface/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-surface/40 transition-all"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              {/* Right: Specs & Calibration */}
              <div className="flex-1 p-10 overflow-y-auto space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-primary">المواصفات التقنية</h4>
                    <p className="text-sm text-on-surface/40 font-bold">تفاصيل العتاد والأداء</p>
                  </div>
                  <div className={cn(
                    "px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-sm",
                    selectedDevice.status === 'functional' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    {selectedDevice.status === 'functional' ? 'جاهز للعمل' : 'تحت الصيانة'}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'الموديل', value: selectedDevice.specs?.model || 'Standard Edition' },
                    { label: 'الدقة / النطاق', value: selectedDevice.specs?.resolution || selectedDevice.specs?.range || 'عالي الدقة' },
                    { label: 'المعالج / التحكم', value: selectedDevice.specs?.processor || 'Digital Control' },
                    { label: 'الذاكرة / السعة', value: selectedDevice.specs?.ram || selectedDevice.specs?.storage || 'N/A' },
                    { label: 'الطاقة', value: selectedDevice.specs?.power || '220V / 50Hz' },
                    { label: 'المورد', value: selectedDevice.supplier || 'تجهيز مخبري معتمد' },
                  ].map((spec, i) => (
                    <div key={i} className="bg-surface-container-low/50 p-4 rounded-2xl border border-outline/5">
                      <p className="text-[10px] text-on-surface/40 font-black uppercase tracking-widest mb-1">{spec.label}</p>
                      <p className="text-sm font-bold text-primary">{spec.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xl font-black text-primary flex items-center gap-3">
                    <ShieldCheck size={24} />
                    حالة المعايرة والضمان
                  </h4>
                  <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-primary shadow-sm">
                          <Activity size={20} />
                        </div>
                        <div>
                          <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest">تاريخ آخر معايرة</p>
                          <p className="font-bold text-primary">{selectedDevice.lastCalibration || 'غير مسجل'}</p>
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest">الموعد القادم</p>
                        <p className={cn(
                          "font-bold",
                          selectedDevice.nextCalibration && new Date(selectedDevice.nextCalibration) < new Date() ? "text-error" : "text-primary"
                        )}>
                          {selectedDevice.nextCalibration || 'غير محدد'}
                        </p>
                      </div>
                    </div>
                    {selectedDevice.nextCalibration && new Date(selectedDevice.nextCalibration) < new Date() && (
                      <div className="flex items-center gap-3 p-3 bg-error/10 text-error rounded-xl text-xs font-bold">
                        <AlertTriangle size={16} />
                        تنبيه: هذا الجهاز يحتاج إلى معايرة فورية لضمان دقة النتائج.
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button className="flex-1 bg-primary text-on-primary py-4 rounded-full font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-95">
                    تحميل شهادة المعايرة
                  </button>
                  <button className="flex-1 bg-surface-container-low text-primary py-4 rounded-full font-black text-sm hover:bg-surface-container-high transition-all active:scale-95">
                    سجل الصيانة
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
