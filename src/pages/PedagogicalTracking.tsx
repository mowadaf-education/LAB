import React, { useState, useMemo, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { BookOpen, CheckCircle2, AlertCircle, ArrowLeft, Plus, Download, Filter, Search, MoreVertical, Trash2, Edit2, TrendingUp, FileText, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes';
import { cn } from '../lib/utils';
import { CURRICULUM_DB } from '../data/curriculumData';
import { onSnapshot, query } from 'firebase/firestore';
import { getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { useTimeSlots } from '../hooks/useTimeSlots';
import TimeSlotManager from '../components/TimeSlotManager';
import { Clock } from 'lucide-react';
import { analyzePedagogicalTracking, PedagogicalInsight } from '../services/geminiService';

interface Teacher {
  id: string;
  name: string;
  subject: string;
}

interface TrackingEntry {
  id: string;
  subject: string;
  level: string;
  branch?: string;
  teacher: string;
  progress: number;
  lastLesson: string;
  date: string;
  status: 'on-track' | 'delayed' | 'ahead';
  // New fields
  domain?: string;
  unit?: string;
  completedWeeks?: number;
  delayWeeks?: number;
  delayReason?: string;
  pedagogicalAdjustment?: string;
}

const INITIAL_DATA: TrackingEntry[] = [];

export default function PedagogicalTracking() {
  const { schoolId } = useSchool();
  const navigate = useNavigate();
  const { timeSlots } = useTimeSlots();
  const [isTimeManagerOpen, setIsTimeManagerOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [entries, setEntries] = useState<TrackingEntry[]>(INITIAL_DATA);
  const [searchTerm, setSearchTerm] = useState('');

  const [filterLevel, setFilterLevel] = useState('الكل');

  const filteredEntries = entries.filter(entry => 
    (filterLevel === 'الكل' || entry.level === filterLevel) &&
    (entry.subject.includes(searchTerm) || 
     entry.teacher.includes(searchTerm) || 
     entry.level.includes(searchTerm))
  );

  const openProgressions = () => {
    window.open('https://drive.google.com/drive/folders/1Q79KYQZzX7cbsYN6EedzYyQ7oFayfxx8?usp=sharing', '_blank');
  };

  const stats = useMemo(() => {
    const totalProgress = entries.reduce((acc, curr) => acc + curr.progress, 0);
    const avgProgress = entries.length > 0 ? Math.round(totalProgress / entries.length) : 0;
    const aheadCount = entries.filter(e => e.status === 'ahead').length;
    const delayedCount = entries.filter(e => e.status === 'delayed').length;

    return {
      avgProgress,
      aheadCount,
      delayedCount
    };
  }, [entries]);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TrackingEntry | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [aiInsight, setAiInsight] = useState<PedagogicalInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzePedagogicalTracking(entries);
      setAiInsight(insight);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const q = query(getUserCollection(schoolId, 'equipment'));
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

  const handleEdit = (entry: TrackingEntry) => {
    setEditingEntry({ ...entry });
    setIsAdding(false);
    setIsEditModalOpen(true);
  };

  const handleAddNew = () => {
    const newEntry: TrackingEntry = {
      id: Math.random().toString(36).substr(2, 9),
      subject: '',
      level: '',
      branch: '',
      teacher: '',
      progress: 0,
      lastLesson: '',
      date: new Date().toISOString().split('T')[0],
      status: 'on-track',
      domain: '',
      unit: '',
      completedWeeks: 0,
      delayWeeks: 0,
      delayReason: '',
      pedagogicalAdjustment: ''
    };
    setEditingEntry(newEntry);
    setIsAdding(true);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingEntry) {
      if (isAdding) {
        setEntries(prev => [editingEntry, ...prev]);
      } else {
        setEntries(prev => prev.map(e => e.id === editingEntry.id ? editingEntry : e));
      }
      setIsEditModalOpen(false);
      setEditingEntry(null);
      setIsAdding(false);
    }
  };

  // Curriculum selection logic
  const availableLevels = useMemo(() => Object.keys(CURRICULUM_DB), []);
  
  const availableBranches = useMemo(() => {
    if (!editingEntry || !editingEntry.level) return [];
    return Object.keys(CURRICULUM_DB[editingEntry.level] || {});
  }, [editingEntry?.level]);

  const availableSubjects = useMemo(() => {
    if (!editingEntry || !editingEntry.level || !editingEntry.branch) return [];
    return Object.keys(CURRICULUM_DB[editingEntry.level]?.[editingEntry.branch] || {});
  }, [editingEntry?.level, editingEntry?.branch]);

  const availableDomains = useMemo(() => {
    if (!editingEntry || !editingEntry.level || !editingEntry.branch || !editingEntry.subject) return [];
    const subjectData = CURRICULUM_DB[editingEntry.level]?.[editingEntry.branch]?.[editingEntry.subject];
    return subjectData?.domains || [];
  }, [editingEntry?.level, editingEntry?.branch, editingEntry?.subject]);

  const availableUnits = useMemo(() => {
    if (!editingEntry || !editingEntry.domain) return [];
    const domain = availableDomains.find(d => d.title === editingEntry.domain);
    return domain?.units || [];
  }, [editingEntry, availableDomains]);

  const availableLessons = useMemo(() => {
    if (!editingEntry || !editingEntry.unit) return [];
    const unit = availableUnits.find(u => u.title === editingEntry.unit);
    return unit?.lessons || [];
  }, [editingEntry, availableUnits]);

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Edit Modal */}
      {isEditModalOpen && editingEntry && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface rounded-[40px] w-full max-w-2xl overflow-hidden shadow-2xl border border-outline/10"
          >
            <div className="p-8 border-b border-outline/5 bg-surface-container-low/50 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl text-primary">
                  {isAdding ? <Plus size={24} /> : <Edit2 size={24} />}
                </div>
                <h2 className="text-3xl font-black text-primary tracking-tight">
                  {isAdding ? 'تسجيل تقدم جديد' : 'حجز الدرس'}
                </h2>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-outline/10 rounded-full transition-colors"
              >
                <ArrowLeft size={24} className="rotate-180" />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isAdding ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-primary/5 p-6 rounded-[32px] border border-primary/10 mb-8">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-primary mr-2">المستوى</label>
                    <select 
                      className="w-full bg-surface border-none rounded-2xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                      value={editingEntry.level}
                      onChange={(e) => setEditingEntry({ ...editingEntry, level: e.target.value, branch: '', subject: '', domain: '', unit: '', lastLesson: '' })}
                    >
                      <option value="">اختر المستوى...</option>
                      {availableLevels.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-primary mr-2">الشعبة</label>
                    <select 
                      className="w-full bg-surface border-none rounded-2xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none disabled:opacity-50"
                      value={editingEntry.branch}
                      disabled={!editingEntry.level}
                      onChange={(e) => setEditingEntry({ ...editingEntry, branch: e.target.value, subject: '', domain: '', unit: '', lastLesson: '' })}
                    >
                      <option value="">اختر الشعبة...</option>
                      {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-primary mr-2">المادة</label>
                    <select 
                      className="w-full bg-surface border-none rounded-2xl px-4 py-3 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none disabled:opacity-50"
                      value={editingEntry.subject}
                      disabled={!editingEntry.branch}
                      onChange={(e) => setEditingEntry({ ...editingEntry, subject: e.target.value, domain: '', unit: '', lastLesson: '' })}
                    >
                      <option value="">اختر المادة...</option>
                      {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 mb-6">
                  <div className="flex justify-between text-sm font-black text-primary">
                    <span>المستوى: {editingEntry.level}</span>
                    <span>الشعبة: {editingEntry.branch}</span>
                    <span>المادة: {editingEntry.subject}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">الأستاذ</label>
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={editingEntry.teacher}
                    onChange={(e) => setEditingEntry({ ...editingEntry, teacher: e.target.value })}
                  >
                    <option value="">اختر الأستاذ...</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">التاريخ</label>
                  <input 
                    type="date" 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={editingEntry.date}
                    onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">المجال</label>
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    value={editingEntry.domain || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, domain: e.target.value, unit: '', lastLesson: '' })}
                  >
                    <option value="">اختر المجال...</option>
                    {availableDomains.map(d => (
                      <option key={d.title} value={d.title}>{d.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">الوحدة</label>
                  <select 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none disabled:opacity-50"
                    value={editingEntry.unit || ''}
                    disabled={!editingEntry.domain}
                    onChange={(e) => setEditingEntry({ ...editingEntry, unit: e.target.value, lastLesson: '' })}
                  >
                    <option value="">اختر الوحدة...</option>
                    {availableUnits.map(u => (
                      <option key={u.title} value={u.title}>{u.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-on-surface/60 mr-2">الدرس (النشاط التطبيقي)</label>
                <select 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all appearance-none disabled:opacity-50"
                  value={editingEntry.lastLesson || ''}
                  disabled={!editingEntry.unit}
                  onChange={(e) => setEditingEntry({ ...editingEntry, lastLesson: e.target.value })}
                >
                  <option value="">اختر الدرس...</option>
                  {availableLessons.map(l => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">عدد الأسابيع المنجزة</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={editingEntry.completedWeeks || 0}
                    onChange={(e) => setEditingEntry({ ...editingEntry, completedWeeks: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-on-surface/60 mr-2">عدد أسابيع التأخر وفق التدرجات</label>
                  <input 
                    type="number" 
                    className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                    value={editingEntry.delayWeeks || 0}
                    onChange={(e) => setEditingEntry({ ...editingEntry, delayWeeks: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-on-surface/60 mr-2">سبب التأخر</label>
                <textarea 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                  value={editingEntry.delayReason || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, delayReason: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-on-surface/60 mr-2">الاجراءات المتخدة أو التعديل البيداغوجي</label>
                <textarea 
                  className="w-full bg-surface-container-low border-none rounded-2xl px-6 py-4 font-bold focus:ring-2 focus:ring-primary/20 transition-all min-h-[100px]"
                  value={editingEntry.pedagogicalAdjustment || ''}
                  onChange={(e) => setEditingEntry({ ...editingEntry, pedagogicalAdjustment: e.target.value })}
                />
              </div>
            </div>

            <div className="p-8 bg-surface-container-low/30 border-t border-outline/5 flex justify-end gap-4">
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="px-8 py-4 rounded-2xl font-black text-on-surface/60 hover:bg-outline/10 transition-all"
              >
                إلغاء
              </button>
              <button 
                onClick={handleSaveEdit}
                className="bg-primary text-on-primary px-10 py-4 rounded-2xl font-black shadow-xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-95"
              >
                حفظ التغييرات
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Time Slot Manager Modal */}
      <TimeSlotManager 
        isOpen={isTimeManagerOpen} 
        onClose={() => setIsTimeManagerOpen(false)} 
      />

      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <TrendingUp size={14} />
            المتابعة البيداغوجية
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter font-serif">المتابعة البيداغوجية</h1>
          <p className="text-on-surface/60 text-xl font-bold">متابعة تقدم الدروس وتنفيذ المنهاج الدراسي.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 relative z-10">
          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-primary/20 text-primary border border-primary/20 px-6 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/30 transition-all active:scale-95 disabled:opacity-50"
          >
            {isAnalyzing ? (
              <div className="w-5 h-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />
            ) : (
              <Sparkles size={24} />
            )}
            الذكاء البيداغوجي (تحليل)
          </button>
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
          <button 
            onClick={openProgressions}
            className="bg-secondary text-on-secondary px-8 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-secondary/90 transition-all active:scale-95"
          >
            <ExternalLink size={24} />
            التدرجات السنوية
          </button>
          <button 
            onClick={handleAddNew}
            className="bg-primary text-on-primary px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95"
          >
            <Plus size={24} />
            تسجيل تقدم جديد
          </button>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Summary Stats */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 rounded-[40px] bg-primary/5 border border-primary/10 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-surface rounded-2xl shadow-sm text-primary">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest mb-1">نسبة الإنجاز العام</p>
          <span className="text-4xl font-black tracking-tighter text-primary">{stats.avgProgress}%</span>
        </div>
        <div className="p-8 rounded-[40px] bg-success/5 border border-success/10 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-surface rounded-2xl shadow-sm text-success">
              <TrendingUp size={24} />
            </div>
          </div>
          <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest mb-1">مواد متقدمة</p>
          <span className="text-4xl font-black tracking-tighter text-success">{stats.aheadCount} مادة</span>
        </div>
        <div className="p-8 rounded-[40px] bg-error/5 border border-error/10 shadow-xl">
          <div className="flex justify-between items-start mb-6">
            <div className="p-4 bg-surface rounded-2xl shadow-sm text-error">
              <AlertCircle size={24} />
            </div>
          </div>
          <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest mb-1">مواد متأخرة</p>
          <span className="text-4xl font-black tracking-tighter text-error">{stats.delayedCount} مادة</span>
        </div>
      </section>

      {/* AI Insights Section */}
      <AnimatePresence>
        {aiInsight && (
          <motion.section 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-[40px] p-8 shadow-2xl relative">
              <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/20 text-primary rounded-2xl">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-black text-primary">تقييم المفتش الذكي (AI)</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-secondary mb-2 uppercase tracking-widest">النظرة العامة</h3>
                  <p className="text-on-surface font-medium leading-relaxed">{aiInsight.overview}</p>
                </div>
                
                {aiInsight.criticalDelays?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-error mb-4 uppercase tracking-widest">تحذيرات تأخر حرجة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiInsight.criticalDelays.map((delay, index) => (
                        <div key={index} className="bg-surface rounded-2xl p-6 border border-error/20 shadow-sm relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-error" />
                          <p className="font-black text-error mb-1">{delay.subject} - {delay.teacher}</p>
                          <p className="text-xs text-on-surface/60 font-bold mb-3">{delay.reason}</p>
                          <div className="bg-success/10 p-3 rounded-xl border border-success/10">
                            <p className="text-xs font-black text-success mb-1">توصية لتدارك التأخر:</p>
                            <p className="text-sm font-bold text-success/80">{delay.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-black text-primary mb-2 uppercase tracking-widest">توجيهات إدارية وبيداغوجية</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiInsight.generalRecommendations.map((rec, i) => (
                      <li key={i} className="flex gap-3 text-sm font-bold text-on-surface/80 bg-surface p-4 rounded-xl border border-outline/5 shadow-sm">
                        <CheckCircle2 size={18} className="text-primary shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => setAiInsight(null)}
                className="mt-8 text-sm font-black text-outline hover:text-primary transition-colors"
              >
                إخفاء التحليل
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Tracking List */}
      <section className="bg-surface rounded-[40px] border border-outline/10 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-outline/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface-container-low/30">
          <div className="flex items-center gap-6 flex-wrap">
            <h2 className="text-2xl font-black text-primary">متابعة تنفيذ المناهج</h2>
            <div className="flex items-center bg-surface p-1 rounded-xl border border-outline/10 shadow-sm">
              {['الكل', 'أولى ثانوي', 'ثانية ثانوي', 'ثالثة ثانوي'].map(level => (
                <button
                  key={level}
                  onClick={() => setFilterLevel(level)}
                  className={cn(
                    "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                    filterLevel === level 
                      ? "bg-primary text-on-primary shadow-sm" 
                      : "text-on-surface/60 hover:bg-surface-container-high"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={18} />
            <input 
              type="text" 
              placeholder="بحث عن مادة، أستاذ..." 
              className="w-full md:w-64 bg-surface border border-outline/10 rounded-xl pr-10 pl-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[32px] bg-surface-container-low border border-outline/5 hover:shadow-2xl transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-primary/20 group-hover:bg-primary transition-colors" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-xs font-black text-primary uppercase tracking-widest mb-1">
                    {entry.level} {entry.branch ? ` - ${entry.branch}` : ''}
                  </span>
                  <h3 className="text-2xl font-black text-on-surface tracking-tight">{entry.subject}</h3>
                </div>
                <div className={cn(
                  "p-2 rounded-xl",
                  entry.status === 'on-track' ? "bg-success/10 text-success" :
                  entry.status === 'delayed' ? "bg-error/10 text-error" :
                  "bg-primary/10 text-primary"
                )}>
                  {entry.status === 'on-track' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                      {entry.teacher.split(' ')[1]?.[0] || 'أ'}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-on-surface/40">الأستاذ</span>
                      <span className="font-bold text-on-surface/80">{entry.teacher}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleEdit(entry)}
                    className="p-3 bg-surface text-primary rounded-xl shadow-sm border border-outline/5 hover:bg-primary hover:text-on-primary transition-all active:scale-90"
                    title="تعديل"
                  >
                    <Edit2 size={18} />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-on-surface/40 uppercase tracking-widest">نسبة التقدم</span>
                    <span className="text-primary">{entry.progress}%</span>
                  </div>
                  <div className="h-3 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${entry.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={cn(
                        "h-full rounded-full",
                        entry.progress > 80 ? "bg-success" : entry.progress > 40 ? "bg-primary" : "bg-error"
                      )}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-outline/5 flex flex-col gap-3">
                  <div className="flex items-center justify-between text-xs font-bold text-on-surface/40">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-primary" />
                      <span className="text-on-surface font-black">{entry.lastLesson}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      {entry.date}
                    </div>
                  </div>
                  {entry.delayWeeks && entry.delayWeeks > 0 ? (
                    <div className="flex items-center gap-2 text-xs font-black text-error bg-error/5 p-2 rounded-lg">
                      <AlertCircle size={14} />
                      <span>تأخر: {entry.delayWeeks} أسابيع</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
