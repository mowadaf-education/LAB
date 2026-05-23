import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, 
  ClipboardList, 
  TrendingUp, 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  Plus,
  Wrench,
  FileText,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { cn } from '../lib/utils';
import { onSnapshot, query } from 'firebase/firestore';
import { getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { useSchool } from '../context/SchoolContext';
import { useTimeSlots } from '../hooks/useTimeSlots';
import TimeSlotManager from '../components/TimeSlotManager';
import ClassPicker from '../components/ClassPicker';
import { Clock } from 'lucide-react';

type RegistryTab = 'tools' | 'practical' | 'progress';

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

interface ToolUsageEntry {
  id: string;
  date: string;
  time: string;
  classGroup: string;
  labNumber: string;
  teacherName: string;
  subject: string;
  lessonTitle: string;
  requestedTools: string;
  notes: string;
  status: 'returned' | 'in-use' | 'pending';
  actions: string;
}

export default function FollowUpRegistry() {
  const navigate = useNavigate();
  const { schoolId } = useSchool();
  const [activeTab, setActiveTab] = useState<RegistryTab>('tools');
  const [searchTerm, setSearchTerm] = useState('');
  const [isTimeManagerOpen, setIsTimeManagerOpen] = useState(false);

  const tabs = [
    { id: 'tools', title: 'سجل استعمال الوسائل', icon: Wrench },
    { id: 'practical', title: 'حصيلة الأعمال التطبيقية', icon: ClipboardList },
    { id: 'progress', title: 'التقدم في البرنامج', icon: TrendingUp },
  ];

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-secondary/10 rounded-full text-secondary text-xs font-black uppercase tracking-widest mb-2">
            <BookOpen size={14} />
            سجل المتابعة الرقمي
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter font-serif">سجل المتابعة</h1>
          <p className="text-on-surface/60 text-xl font-bold">التوثيق الشامل للنشاطات البيداغوجية والوسائل التعليمية.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <button 
            onClick={() => setIsTimeManagerOpen(true)}
            className="bg-surface text-primary border border-outline/10 px-6 py-4 rounded-[24px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/5 transition-all active:scale-95"
          >
            <Clock size={20} />
            تعديل المواقيت
          </button>
          <button 
            onClick={() => navigate(ROUTES.PEDAGOGICAL_DASHBOARD)}
            className="bg-surface text-primary border border-outline/10 px-8 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/5 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
            العودة للفضاء البيداغوجي
          </button>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Time Slot Manager Modal */}
      <TimeSlotManager 
        isOpen={isTimeManagerOpen} 
        onClose={() => setIsTimeManagerOpen(false)} 
      />

      {/* Tabs Navigation */}
      <nav className="flex flex-wrap gap-4 p-2 bg-surface-container-low rounded-[40px] border border-outline/5 shadow-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as RegistryTab)}
              className={cn(
                "flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[32px] font-black transition-all duration-500 relative overflow-hidden",
                isActive 
                  ? "bg-primary text-on-primary shadow-2xl shadow-primary/20 scale-105 z-10" 
                  : "text-on-surface/40 hover:text-primary hover:bg-primary/5"
              )}
            >
              <Icon size={24} />
              <span className="text-lg">{tab.title}</span>
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface/30 group-focus-within:text-primary transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="البحث في السجلات..." 
            className="w-full bg-surface border border-outline/10 rounded-[32px] pr-16 pl-8 py-5 text-lg font-bold focus:ring-4 focus:ring-primary/10 transition-all shadow-xl"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-4">
          <button className="p-5 bg-surface border border-outline/10 rounded-[28px] text-primary hover:bg-primary/5 transition-all shadow-xl">
            <Filter size={24} />
          </button>
          <button className="p-5 bg-surface border border-outline/10 rounded-[28px] text-primary hover:bg-primary/5 transition-all shadow-xl">
            <Download size={24} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="min-h-[400px]"
        >
          {activeTab === 'tools' && <ToolsRegistry searchTerm={searchTerm} />}
          {activeTab === 'practical' && <PracticalWorkRegistry searchTerm={searchTerm} />}
          {activeTab === 'progress' && <ProgramProgressRegistry searchTerm={searchTerm} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components for each registry ---

function ToolsRegistry({ searchTerm }: { searchTerm: string }) {
  const { schoolId } = useSchool();
  const { timeSlots } = useTimeSlots();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [data, setData] = useState<ToolUsageEntry[]>([
    { 
      id: '1', 
      date: '2024-03-20', 
      time: '08:30',
      classGroup: '1 ج م ع ت 1', 
      labNumber: '01',
      teacherName: 'أ. سمير بن علي', 
      subject: 'العلوم الفيزيائية',
      lessonTitle: 'تحضير المحاليل',
      requestedTools: 'مجهر ضوئي رقمي، أنابيب اختبار، كؤوس بيشر', 
      notes: 'الوسائل بحالة جيدة',
      status: 'returned',
      actions: 'تم تنظيف الوسائل بعد الاستعمال'
    },
    { 
      id: '2', 
      date: '2024-03-19', 
      time: '10:15',
      classGroup: '2 ع ت 2', 
      labNumber: '03',
      teacherName: 'أ. ليلى منصور', 
      subject: 'علوم الطبيعة والحياة',
      lessonTitle: 'الانقسام الخلوي',
      requestedTools: 'طقم المعايرة الحجمية، شرائح مجهرية', 
      notes: 'نقص في الكواشف الملونة',
      status: 'returned',
      actions: 'تم تسجيل النقص في سجل الاستهلاك'
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClassPickerOpen, setIsClassPickerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ToolUsageEntry | null>(null);

  useEffect(() => {
    const q = query(getUserCollection(schoolId, 'teachers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name,
        subject: doc.data().subject 
      } as Teacher));
      setTeachers(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'teachers');
    });
    return () => unsubscribe();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.teacherName.includes(searchTerm) || 
      item.subject.includes(searchTerm) || 
      item.lessonTitle.includes(searchTerm) ||
      item.classGroup.includes(searchTerm)
    );
  }, [data, searchTerm]);

  const handleAdd = () => {
    setEditingEntry({
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      classGroup: '',
      labNumber: '',
      teacherName: '',
      subject: '',
      lessonTitle: '',
      requestedTools: '',
      notes: '',
      status: 'pending',
      actions: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (entry: ToolUsageEntry) => {
    setEditingEntry({ ...entry });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingEntry) {
      setData(prev => {
        const exists = prev.find(e => e.id === editingEntry.id);
        if (exists) {
          return prev.map(e => e.id === editingEntry.id ? editingEntry : e);
        }
        return [editingEntry, ...prev];
      });
      setIsModalOpen(false);
      setEditingEntry(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleAdd}
          className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-primary-container transition-all active:scale-95"
        >
          <Plus size={20} />
          تسجيل استعمال جديد
        </button>
      </div>

      <div className="bg-surface rounded-[40px] border border-outline/10 shadow-2xl overflow-x-auto custom-scrollbar">
        <table className="w-full text-right min-w-[1400px]">
          <thead className="bg-surface-container-low/50 border-b border-outline/5">
            <tr>
              <th className="px-6 py-6 font-black text-primary">التاريخ / الساعة</th>
              <th className="px-6 py-6 font-black text-primary">الأستاذ / المادة</th>
              <th className="px-6 py-6 font-black text-primary">القسم / المخبر</th>
              <th className="px-6 py-6 font-black text-primary">عنوان الدرس</th>
              <th className="px-6 py-6 font-black text-primary">الوسائل المطلوبة</th>
              <th className="px-6 py-6 font-black text-primary">ملاحظات</th>
              <th className="px-6 py-6 font-black text-primary">الحالة</th>
              <th className="px-6 py-6 font-black text-primary">الإجراءات</th>
              <th className="px-6 py-6 font-black text-primary text-center">تعديل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/5">
            {filteredData.map((row) => (
              <tr key={row.id} className="hover:bg-primary/5 transition-colors group">
                <td className="px-6 py-6">
                  <div className="font-black text-on-surface">{row.date}</div>
                  <div className="text-xs font-bold text-on-surface/40">{row.time}</div>
                </td>
                <td className="px-6 py-6">
                  <div className="font-black text-on-surface">{row.teacherName}</div>
                  <div className="text-xs font-bold text-primary">{row.subject}</div>
                </td>
                <td className="px-6 py-6">
                  <div className="font-black text-on-surface">{row.classGroup}</div>
                  <div className="text-xs font-bold text-on-surface/40">مخبر رقم: {row.labNumber}</div>
                </td>
                <td className="px-6 py-6 font-bold text-on-surface/80">{row.lessonTitle}</td>
                <td className="px-6 py-6">
                  <p className="text-sm font-medium text-on-surface/60 max-w-[200px] line-clamp-2">{row.requestedTools}</p>
                </td>
                <td className="px-6 py-6">
                  <p className="text-sm italic text-on-surface/40 max-w-[150px] truncate">{row.notes || '-'}</p>
                </td>
                <td className="px-6 py-6">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    row.status === 'returned' ? "bg-success/10 text-success" : 
                    row.status === 'in-use' ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                  )}>
                    {row.status === 'returned' ? 'تم الإرجاع' : row.status === 'in-use' ? 'قيد الاستعمال' : 'قيد الطلب'}
                  </span>
                </td>
                <td className="px-6 py-6">
                  <p className="text-sm font-bold text-primary/80 max-w-[150px] truncate">{row.actions || '-'}</p>
                </td>
                <td className="px-6 py-6 text-center">
                  <button 
                    onClick={() => handleEdit(row)}
                    className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
                  >
                    <FileText size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Adding/Editing */}
      <AnimatePresence>
        {isModalOpen && editingEntry && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <ClassPicker 
              isOpen={isClassPickerOpen}
              onClose={() => setIsClassPickerOpen(false)}
              onSelect={(className) => {
                if (editingEntry) {
                  setEditingEntry({ ...editingEntry, classGroup: className });
                }
              }}
              initialValue={editingEntry?.classGroup}
            />
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-on-surface/20 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface rounded-[48px] shadow-2xl w-full max-w-4xl relative z-10 overflow-hidden border border-outline/5"
            >
              <div className="p-8 border-b border-outline/5 bg-surface-container-low/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                    <Wrench size={24} />
                  </div>
                  <h2 className="text-3xl font-black text-primary tracking-tight">سجل استعمال الوسائل</h2>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-outline/10 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">التاريخ</label>
                    <input 
                      type="date" 
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={editingEntry.date}
                      onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">الساعة</label>
                    <input 
                      type="text" 
                      list="followup-time-slots"
                      placeholder="مثال: 08:00 - 10:00"
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={editingEntry.time}
                      onChange={(e) => setEditingEntry({ ...editingEntry, time: e.target.value })}
                    />
                    <datalist id="followup-time-slots">
                      {timeSlots.map(slot => (
                        <option key={slot} value={slot} />
                      ))}
                    </datalist>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">إسم ولقب الأستاذ</label>
                    <select 
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      value={editingEntry.teacherName}
                      onChange={(e) => {
                        const selectedTeacher = teachers.find(t => t.name === e.target.value);
                        setEditingEntry({ 
                          ...editingEntry, 
                          teacherName: e.target.value,
                          subject: selectedTeacher?.subject || ''
                        });
                      }}
                    >
                      <option value="">اختر الأستاذ...</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">المادة</label>
                    <input 
                      type="text" 
                      placeholder="المادة..."
                      readOnly
                      className="w-full bg-surface-container-low/50 border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all opacity-70 cursor-not-allowed"
                      value={editingEntry.subject}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">القسم أو الفوج</label>
                    <input 
                      type="text" 
                      placeholder="اضغط للاختيار..."
                      readOnly
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                      value={editingEntry.classGroup}
                      onClick={() => setIsClassPickerOpen(true)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">رقم المخبر</label>
                    <input 
                      type="text" 
                      placeholder="رقم المخبر..."
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={editingEntry.labNumber}
                      onChange={(e) => setEditingEntry({ ...editingEntry, labNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">عنوان الدرس</label>
                  <input 
                    type="text" 
                    placeholder="عنوان الدرس..."
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={editingEntry.lessonTitle}
                    onChange={(e) => setEditingEntry({ ...editingEntry, lessonTitle: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">الوسائل المطلوبة</label>
                  <textarea 
                    rows={3}
                    placeholder="قائمة الوسائل..."
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    value={editingEntry.requestedTools}
                    onChange={(e) => setEditingEntry({ ...editingEntry, requestedTools: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">ملاحظات</label>
                    <input 
                      type="text" 
                      placeholder="أي ملاحظات إضافية..."
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={editingEntry.notes}
                      onChange={(e) => setEditingEntry({ ...editingEntry, notes: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-on-surface/60 mr-2">الإجراءات</label>
                    <input 
                      type="text" 
                      placeholder="الإجراءات المتخذة..."
                      className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                      value={editingEntry.actions}
                      onChange={(e) => setEditingEntry({ ...editingEntry, actions: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">الحالة</label>
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={editingEntry.status}
                    onChange={(e) => setEditingEntry({ ...editingEntry, status: e.target.value as any })}
                  >
                    <option value="pending">قيد الطلب</option>
                    <option value="in-use">قيد الاستعمال</option>
                    <option value="returned">تم الإرجاع</option>
                  </select>
                </div>
              </div>

              <div className="p-8 bg-surface-container-low/50 border-t border-outline/5 flex gap-4">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-primary text-on-primary py-5 rounded-[24px] font-black text-xl shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-95"
                >
                  حفظ البيانات
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-surface border border-outline/10 text-on-surface py-5 rounded-[24px] font-black text-xl hover:bg-surface-container-high transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PracticalWorkRegistry({ searchTerm }: { searchTerm: string }) {
  const data = [
    { id: 1, subject: 'العلوم الفيزيائية', level: '1 ج م ع ت', experiment: 'تحضير محاليل مائية بتركيز معلوم', date: '2024-03-15', results: 'ناجحة بنسبة 95%' },
    { id: 2, subject: 'علوم الطبيعة والحياة', level: '2 ع ت', experiment: 'استخلاص الـ DNA من البصل', date: '2024-03-18', results: 'نتائج واضحة لجميع الأفواج' },
    { id: 3, subject: 'هندسة طرائق', level: '3 ت ر', experiment: 'صناعة الصابون التقليدي', date: '2024-03-20', results: 'تم إنتاج عينات بجودة عالية' },
  ];

  const filteredData = data.filter(item => 
    item.subject.includes(searchTerm) || 
    item.experiment.includes(searchTerm) || 
    item.level.includes(searchTerm)
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredData.map((item) => (
        <div key={item.id} className="bg-surface p-8 rounded-[40px] border border-outline/10 shadow-xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-secondary/20 group-hover:bg-secondary transition-colors" />
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-secondary/10 rounded-2xl text-secondary">
              <ClipboardList size={24} />
            </div>
            <span className="text-xs font-black text-on-surface/40">{item.date}</span>
          </div>
          <h3 className="text-2xl font-black text-primary mb-2">{item.subject}</h3>
          <p className="text-sm font-bold text-on-surface/60 mb-4">{item.level}</p>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-low rounded-2xl border border-outline/5">
              <span className="text-xs font-black text-on-surface/40 block mb-1">التجربة المنجزة</span>
              <span className="font-bold text-on-surface">{item.experiment}</span>
            </div>
            <div className="p-4 bg-success/5 rounded-2xl border border-success/10">
              <span className="text-xs font-black text-success/60 block mb-1">الحصيلة والنتائج</span>
              <span className="font-bold text-success">{item.results}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ProgramProgressRegistry({ searchTerm }: { searchTerm: string }) {
  const data = [
    { id: 1, subject: 'العلوم الفيزيائية', progress: 65, status: 'on-track', lastUpdate: 'منذ يومين' },
    { id: 2, subject: 'علوم الطبيعة والحياة', progress: 72, status: 'ahead', lastUpdate: 'منذ 5 ساعات' },
    { id: 3, subject: 'هندسة كهربائية', progress: 45, status: 'delayed', lastUpdate: 'منذ أسبوع' },
  ];

  const filteredData = data.filter(item => item.subject.includes(searchTerm));

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="bg-surface p-10 rounded-[40px] border border-outline/10 shadow-2xl">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <TrendingUp size={24} />
          </div>
          <h2 className="text-3xl font-black text-primary">ملخص التقدم السنوي</h2>
        </div>
        
        <div className="space-y-10">
          {filteredData.map((item) => (
            <div key={item.id} className="space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <h4 className="text-xl font-black text-on-surface">{item.subject}</h4>
                  <span className="text-xs font-bold text-on-surface/40">آخر تحديث: {item.lastUpdate}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest",
                    item.status === 'on-track' ? "bg-success/10 text-success" :
                    item.status === 'ahead' ? "bg-primary/10 text-primary" : "bg-error/10 text-error"
                  )}>
                    {item.status === 'on-track' ? 'وفق التدرج' : 
                     item.status === 'ahead' ? 'متقدم' : 'متأخر'}
                  </span>
                  <span className="text-3xl font-black text-primary">{item.progress}%</span>
                </div>
              </div>
              <div className="h-4 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.progress}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={cn(
                    "h-full rounded-full shadow-lg",
                    item.status === 'on-track' ? "bg-success" :
                    item.status === 'ahead' ? "bg-primary" : "bg-error"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
