import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  FlaskConical, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Users, 
  BookOpen, 
  ClipboardCheck,
  AlertTriangle,
  FileText,
  X,
  Check,
  ArrowRight,
  Trash2,
  Sparkles,
  ClipboardList,
  CheckCircle,
  FileDown,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { onSnapshot, query, addDoc, serverTimestamp, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';

import { ensureApiKey, analyzeExperiment } from '../services/geminiService';
import { logActivity, LogAction, LogModule } from '../services/loggingService';
import * as XLSX from 'xlsx';

interface Experiment {
  id: string;
  title: string;
  date: any;
  teacher: string;
  subject: string; // الفيزياء، الكيمياء، العلوم
  level: string;
  group: string;
  materialsUsed: { name: string; quantity: number; unit: string }[];
  breakage: { item: string; quantity: number; cost?: number }[];
  safetyNotes: string;
  outcome: string;
  status: 'completed' | 'ongoing';
}

export default function LabExperiments() {
  const { schoolId } = useSchool();
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [newExp, setNewExp] = useState<Partial<Experiment>>({
    title: '',
    teacher: '',
    subject: 'الفيزياء',
    level: '',
    group: '',
    materialsUsed: [],
    breakage: [],
    safetyNotes: '',
    outcome: '',
    status: 'completed'
  });

  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(getUserCollection(schoolId, 'experiment_logs'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date()
      } as Experiment));
      setExperiments(items);
      setLoading(false);
    });

    // Fetch chemicals and glassware for materials picker
    const fetchMats = async () => {
      const chemSnap = await getDocs(query(getUserCollection(schoolId, 'chemicals')));
      const glassSnap = await getDocs(query(getUserCollection(schoolId, 'equipment')));
      const mats = [
        ...chemSnap.docs.map(d => ({ name: d.data().nameAr, unit: d.data().unit, type: 'chemical' })),
        ...glassSnap.docs.map(d => ({ name: d.data().name, unit: 'قطعة', type: 'equipment' }))
      ];
      setAvailableMaterials(mats);
    };
    fetchMats();

    return () => unsub();
  }, [schoolId]);

  const handleAddMaterial = (mat: any) => {
    const exists = newExp.materialsUsed?.find(m => m.name === mat.name);
    if (exists) return;
    setNewExp({
      ...newExp,
      materialsUsed: [...(newExp.materialsUsed || []), { name: mat.name, quantity: 1, unit: mat.unit }]
    });
  };

  const handleAddExperiment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docRef = await addDoc(getUserCollection(schoolId, 'experiment_logs'), {
        ...newExp,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      await logActivity(schoolId, LogAction.CREATE, LogModule.REPORTS, `تسجيل تجربة جديدة: ${newExp.title}`, docRef.id);
      setIsModalOpen(false);
      setNewExp({
        title: '', teacher: '', subject: 'الفيزياء', level: '', group: '',
        materialsUsed: [], breakage: [], safetyNotes: '', outcome: '', status: 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'experiment_logs');
    }
  };

  const handleAIAnalyze = async () => {
    if (!newExp.title) {
      alert('الرجاء إدخال عنوان التجربة أولاً.');
      return;
    }
    
    setIsAnalyzing(true);
    try {
      const hasKey = await ensureApiKey();
      if (!hasKey) {
        alert('يرجى اختيار مفتاح API الخاص بك لاستخدام ميزة المساعد الذكي.');
        return;
      }
      
      const analysis = await analyzeExperiment({ 
        title: newExp.title, 
        subject: newExp.subject,
        level: newExp.level
      });
      
      if (analysis) {
        setNewExp(prev => ({
          ...prev,
          title: analysis.smartTitle,
          outcome: analysis.smartOutcome,
          safetyNotes: analysis.suggestedSafetyNotes
        }));
      }
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredExperiments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredExperiments.map(e => e.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`هل أنت متأكد من حذف ${selectedIds.length} سجل؟`)) return;
    try {
      const batch = writeBatch(db);
      selectedIds.forEach(id => {
        batch.delete(doc(getUserCollection(schoolId, 'experiment_logs'), id));
      });
      await batch.commit();
      await logActivity(schoolId, LogAction.DELETE, LogModule.REPORTS, `حذف جماعي لـ ${selectedIds.length} سجل تجربة`);
      setSelectedIds([]);
      alert('تم الحذف بنجاح!');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'experiment_logs/bulk');
    }
  };

  const filteredExperiments = experiments.filter(exp => 
    exp.title?.includes(searchTerm) || 
    exp.teacher?.includes(searchTerm) ||
    exp.group?.includes(searchTerm)
  );

  return (
    <div className="space-y-10 max-w-7xl mx-auto px-6 pb-32 rtl" dir="rtl">
      
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-primary tracking-tighter">سجل التجارب المخبرية</h1>
          <p className="text-secondary/70 text-lg font-bold">توثيق الحصص التطبيقية، استهلاك المواد، وحوادث الكسر.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-on-primary px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 shrink-0"
        >
          <Plus size={24} />
          تسجيل تجربة جديدة
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-primary/5 p-6 rounded-[28px] border border-primary/10">
          <p className="text-xs font-black text-primary/60 uppercase mb-1">إجمالي التجارب</p>
          <h3 className="text-3xl font-black text-primary">{experiments.length}</h3>
        </div>
        <div className="bg-success/5 p-6 rounded-[28px] border border-success/10">
          <p className="text-xs font-black text-success/60 uppercase mb-1">الفيزياء</p>
          <h3 className="text-3xl font-black text-success">{experiments.filter(e => e.subject === 'الفيزياء').length}</h3>
        </div>
        <div className="bg-tertiary/5 p-6 rounded-[28px] border border-tertiary/10">
          <p className="text-xs font-black text-tertiary/60 uppercase mb-1">الكيمياء</p>
          <h3 className="text-3xl font-black text-tertiary">{experiments.filter(e => e.subject === 'الكيمياء').length}</h3>
        </div>
        <div className="bg-orange-500/5 p-6 rounded-[28px] border border-orange-500/10">
          <p className="text-xs font-black text-orange-600/60 uppercase mb-1">العلوم الطبيعية</p>
          <h3 className="text-3xl font-black text-orange-600">{experiments.filter(e => e.subject === 'العلوم الطبيعية').length}</h3>
        </div>
      </div>

      {/* Search and List */}
      <div className="bg-surface rounded-[32px] border border-outline/10 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-outline/5 flex justify-between items-center bg-surface-container-low/30">
          <div className="flex items-center gap-6 flex-1">
             <div 
                onClick={handleSelectAll}
                className={cn(
                  "w-6 h-6 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all shrink-0",
                  selectedIds.length === filteredExperiments.length && filteredExperiments.length > 0
                    ? "bg-primary border-primary text-white" 
                    : "border-outline/30 hover:border-primary/50 bg-surface"
                )}
              >
                {selectedIds.length === filteredExperiments.length && filteredExperiments.length > 0 && <Check size={14} />}
              </div>
            <div className="relative w-full max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40" size={18} />
              <input 
                type="text" 
                placeholder="بحث عن تجربة، أستاذ، أو قسم..." 
                className="w-full bg-surface border border-outline/10 rounded-2xl pr-12 pl-4 py-3 font-bold text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="divide-y divide-outline/5">
          {filteredExperiments.map((exp, i) => (
            <motion.div 
              key={exp.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleToggleSelect(exp.id)}
              className={cn(
                "p-8 hover:bg-primary/5 transition-all group cursor-pointer border-r-4",
                selectedIds.includes(exp.id) ? "bg-primary/5 border-primary" : "border-transparent"
              )}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-start gap-6">
                  <div 
                    onClick={(e_evt) => {
                      e_evt.stopPropagation();
                      handleToggleSelect(exp.id);
                    }}
                    className={cn(
                      "w-6 h-6 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all bg-surface mt-5",
                      selectedIds.includes(exp.id) 
                        ? "bg-primary border-primary text-white scale-110" 
                        : "border-outline/30 group-hover:border-primary/50"
                    )}
                  >
                    {selectedIds.includes(exp.id) && <Check size={14} />}
                  </div>
                  <div className={cn(
                    "w-16 h-16 rounded-[20px] flex items-center justify-center shrink-0 shadow-inner",
                    exp.subject === 'الفيزياء' ? "bg-success/10 text-success" : 
                    exp.subject === 'الكيمياء' ? "bg-tertiary/10 text-tertiary" : "bg-orange-500/10 text-orange-600"
                  )}>
                    <FlaskConical size={32} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-black text-primary group-hover:text-primary-container transition-colors">{exp.title}</h4>
                      <span className="text-[10px] font-black bg-surface-container-high px-3 py-1 rounded-full text-secondary/60">
                        {exp.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm font-bold text-secondary">
                      <span className="flex items-center gap-2"><User size={16} /> {exp.teacher}</span>
                      <span className="flex items-center gap-2"><Users size={16} /> {exp.group} ({exp.level})</span>
                      <span className="flex items-center gap-2"><Calendar size={16} /> {exp.date.toLocaleDateString('ar-DZ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-left md:text-right">
                    <p className="text-[10px] font-black text-secondary/40 uppercase mb-1">استهلاك المواد</p>
                    <p className="text-sm font-bold text-primary">{exp.materialsUsed.length} أصناف</p>
                  </div>
                  {exp.breakage.length > 0 && (
                    <div className="bg-error/10 text-error p-3 rounded-2xl flex items-center gap-2 border border-error/20">
                      <AlertTriangle size={18} />
                      <span className="text-xs font-black">{exp.breakage.length} حوادث كسر</span>
                    </div>
                  )}
                  <div className="p-3 hover:bg-primary/10 rounded-full text-primary transition-all group-hover:translate-x-[-4px]">
                    <ArrowRight size={24} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredExperiments.length === 0 && !loading && (
            <div className="py-32 text-center text-secondary/30">
              <ClipboardCheck size={64} className="mx-auto mb-4 opacity-10" />
              <p className="font-bold">لا توجد سجلات مطابقة للبحث.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-surface w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10 flex flex-col md:flex-row h-[90vh]"
            >
              {/* Sidebar Picker */}
              <div className="w-full md:w-80 bg-surface-container-low border-l border-outline/10 p-8 overflow-y-auto custom-scrollbar">
                <h4 className="text-lg font-black text-primary mb-6 flex items-center gap-2">
                   <Filter size={18} />
                   اختيار المواد المستهلكة
                </h4>
                <div className="space-y-3">
                  {availableMaterials.map((mat, i) => (
                    <button 
                      key={i}
                      onClick={() => handleAddMaterial(mat)}
                      className="w-full text-right p-4 bg-surface hover:bg-primary/5 rounded-2xl border border-outline/5 transition-all font-bold text-xs flex justify-between items-center group"
                    >
                      <span className="text-secondary group-hover:text-primary transition-colors">{mat.name}</span>
                      <Plus size={14} className="text-primary/40 group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Area */}
              <div className="flex-1 flex flex-col overflow-hidden bg-surface">
                <div className="p-8 border-b border-outline/5 flex justify-between items-center shrink-0">
                  <h3 className="text-2xl font-black text-primary">تسجيل حصة تطبيقية</h3>
                  <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleAddExperiment} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">اسم التجربة / الدرس</label>
                        <div className="flex gap-2">
                          <input required className="flex-1 bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" value={newExp.title} onChange={e => setNewExp({...newExp, title: e.target.value})} placeholder="مثال: تعيين كمية المادة عن طريق المعايرة..." />
                          <button 
                            type="button"
                            onClick={handleAIAnalyze}
                            disabled={isAnalyzing}
                            className="bg-primary-container text-primary px-4 rounded-2xl flex items-center justify-center shadow-inner hover:bg-primary/10 transition-all disabled:opacity-50"
                            title="تحسين ذكي"
                          >
                            <span className="sr-only">AI Assist</span>
                            {isAnalyzing ? (
                              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                            ) : (
                              <FlaskConical size={20} className="text-primary" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الأستاذ</label>
                           <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" value={newExp.teacher} onChange={e => setNewExp({...newExp, teacher: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">المادة</label>
                           <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold appearance-none" value={newExp.subject} onChange={e => setNewExp({...newExp, subject: e.target.value})}>
                              <option value="الفيزياء">الفيزياء</option>
                              <option value="الكيمياء">الكيمياء</option>
                              <option value="العلوم الطبيعية">العلوم الطبيعية</option>
                           </select>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">المستوى</label>
                           <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" value={newExp.level} onChange={e => setNewExp({...newExp, level: e.target.value})} placeholder="3 ثانوي..." />
                        </div>
                        <div className="space-y-2">
                           <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الفوج التربوي</label>
                           <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold" value={newExp.group} onChange={e => setNewExp({...newExp, group: e.target.value})} placeholder="2ر 1..." />
                        </div>
                      </div>
                      
                      <div className="bg-primary/5 p-6 rounded-3xl border border-primary/10">
                        <label className="text-xs font-black text-primary uppercase tracking-widest mb-3 block">المواد المستهلكة ({newExp.materialsUsed?.length})</label>
                        <div className="flex flex-wrap gap-2">
                           {newExp.materialsUsed?.map((m, idx) => (
                             <div key={idx} className="bg-surface border border-primary/20 px-3 py-1.5 rounded-xl text-[10px] font-black text-primary flex items-center gap-2">
                               {m.name}
                               <input 
                                 type="number" 
                                 className="w-10 bg-primary/5 border-none p-0 text-center font-black focus:ring-0" 
                                 value={m.quantity}
                                 onChange={(e) => {
                                   const updated = [...(newExp.materialsUsed || [])];
                                   updated[idx].quantity = Number(e.target.value);
                                   setNewExp({...newExp, materialsUsed: updated});
                                 }}
                               />
                               {m.unit}
                               <button 
                                 type="button" 
                                 onClick={() => setNewExp({...newExp, materialsUsed: newExp.materialsUsed?.filter((_, i) => i !== idx)})}
                                 className="hover:text-error transition-colors"
                               >
                                <X size={14} />
                               </button>
                             </div>
                           ))}
                           {newExp.materialsUsed?.length === 0 && (
                             <p className="text-[10px] font-bold text-secondary/50 italic py-2">اختر مواد من القائمة الجانبية...</p>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">نتائج التجربة وملاحظات بيداغوجية</label>
                      <textarea className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold min-h-[120px]" value={newExp.outcome} onChange={e => setNewExp({...newExp, outcome: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">ملاحظات الأمن والكسر</label>
                      <textarea className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold min-h-[120px]" value={newExp.safetyNotes} onChange={e => setNewExp({...newExp, safetyNotes: e.target.value})} placeholder="اذكر أي ضياع، كسر، أو حوادث أمنية..." />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-primary text-on-primary py-6 rounded-full font-black shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4">
                    <Check size={24} />
                    حفظ وتوثيق التجربة
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-secondary text-white px-8 py-5 rounded-[32px] shadow-2xl flex items-center gap-10 min-w-[500px]"
          >
            <div className="flex flex-col">
              <span className="text-sm font-black">{selectedIds.length} سجل مختار</span>
              <span className="text-[10px] text-white/40 font-bold">عمليات جماعية</span>
            </div>

            <div className="h-10 w-px bg-surface/10" />

            <div className="flex gap-4">
              <button 
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-error/20 text-error-container hover:bg-error hover:text-white transition-all font-black text-sm"
              >
                <Trash2 size={18} />
                حذف السجلات
              </button>
              
              <button 
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-surface/10 hover:bg-surface/20 transition-all font-black text-sm"
                onClick={() => {
                  const items = experiments.filter(e => selectedIds.includes(e.id));
                  const worksheet = XLSX.utils.json_to_sheet(items.map(e => ({
                    'Experiment': e.title,
                    'Teacher': e.teacher,
                    'Subject': e.subject,
                    'Level': e.level,
                    'Group': e.group,
                    'Materials': e.materialsUsed.length
                  })));
                  const workbook = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(workbook, worksheet, "SelectedExp");
                  XLSX.writeFile(workbook, `selected_experiments_${new Date().getTime()}.xlsx`);
                }}
              >
                <FileText size={18} />
                تصدير للملفات
              </button>

              <button 
                onClick={() => setSelectedIds([])}
                className="p-2.5 hover:bg-surface/10 rounded-full transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
