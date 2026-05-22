import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Plus, 
  Search, 
  Wrench, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ChevronRight, 
  Filter,
  History,
  MoreVertical,
  X,
  Save,
  Loader2,
  CalendarDays,
  List,
  ChevronLeft,
  Sparkles,
  AlertCircle,
  Hammer,
  Download,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { onSnapshot, query, addDoc, serverTimestamp, updateDoc, doc, orderBy, getDocs, deleteDoc } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '../lib/utils';

import { analyzeMaintenance, MaintenanceInsight } from '../services/geminiService';
import { Link } from 'react-router-dom';

import { PDFService } from '../services/pdfService';

interface MaintenanceLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  issue: string;
  technician?: string;
  status: 'pending' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  cost?: number;
  startDate: string;
  completionDate?: string;
  notes?: string;
  createdAt: any;
}

interface Equipment {
  id: string;
  name: string;
}

export default function Maintenance() {
  const { schoolId } = useSchool();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingLog, setIsAddingLog] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [aiInsight, setAiInsight] = useState<MaintenanceInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [newLog, setNewLog] = useState<Partial<MaintenanceLog>>({
    status: 'pending',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0]
  });

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const insight = await analyzeMaintenance(logs);
      setAiInsight(insight);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    const q = query(getUserCollection(schoolId, 'equipment'), orderBy('startDate', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaintenanceLog[];
      setLogs(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'maintenance_logs');
    });

    const fetchEquipment = async () => {
      const snap = await getDocs(getUserCollection(schoolId, 'equipment'));
      setEquipment(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    };
    fetchEquipment();

    return () => unsubscribe();
  }, []);

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.equipmentId || !newLog.issue) return;

    const selectedEquip = equipment.find(e => e.id === newLog.equipmentId);
    
    try {
      await addDoc(getUserCollection(schoolId, 'equipment'), {
        ...newLog,
        equipmentName: selectedEquip?.name || 'غير معروف',
        createdAt: serverTimestamp()
      });
      setIsAddingLog(false);
      setNewLog({
        status: 'pending',
        priority: 'medium',
        startDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'maintenance_logs');
    }
  };

  const updateStatus = async (id: string, status: MaintenanceLog['status']) => {
    try {
      await updateDoc(doc(getUserCollection(schoolId, 'equipment'), id), { 
        status,
        completionDate: status === 'completed' ? new Date().toISOString().split('T')[0] : null,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'maintenance_logs');
    }
  };

  const deleteLog = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'equipment'), id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'maintenance_logs');
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const getLogsForDay = (day: Date) => {
    return logs.filter(l => {
      if (!l.startDate) return false;
      const lDate = new Date(l.startDate);
      return isSameDay(lDate, day);
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.equipmentName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         log.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success border-success/20';
      case 'in-progress': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-error/10 text-error border-error/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-error font-black';
      case 'medium': return 'text-warning font-bold';
      default: return 'text-primary font-medium';
    }
  };

  const handleExportPDF = async () => {
    const headers = ['#', 'الجهاز', 'المشكلة', 'التاريخ', 'الحالة', 'الأولوية'];
    const tableData = filteredLogs.map((l, index) => [
      index + 1,
      l.equipmentName,
      l.issue,
      l.startDate,
      l.status === 'completed' ? 'مكتمل' : l.status === 'in-progress' ? 'قيد التنفيذ' : 'انتظار',
      l.priority
    ]);

    await PDFService.generateTablePDF(
      'سجل الصيانة الدورية',
      headers,
      tableData,
      `maintenance_report_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto rtl" dir="rtl">
      

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
            <Wrench size={12} />
            التجهيزات التقنية
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tight">برنامج الصيانة الدورية</h1>
          <p className="text-secondary/60 font-bold">تتبع حالة الأجهزة وضمان جاهزيتها للدروس التطبيقية</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-surface-container-low p-1 rounded-2xl border border-outline/10 flex-1 lg:flex-none">
            <button 
              onClick={() => setViewMode('list')}
              className={cn(
                "flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all",
                viewMode === 'list' ? "bg-surface text-primary shadow-sm" : "text-secondary/50"
              )}
            >
              <List size={18} />
              قائمة
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={cn(
                "flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-black transition-all",
                viewMode === 'calendar' ? "bg-surface text-primary shadow-sm" : "text-secondary/50"
              )}
            >
              <CalendarDays size={18} />
              تقويم
            </button>
          </div>

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-6 py-4 bg-primary/10 text-primary rounded-2xl font-black border border-primary/20 hover:bg-primary/20 transition-all disabled:opacity-50 shadow-sm"
          >
            {isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            تحليل ذكي (AI)
          </button>

          <button 
            onClick={handleExportPDF}
            className="flex-1 lg:flex-none flex items-center justify-center p-4 bg-surface-container-low border border-outline/10 rounded-[24px] text-secondary hover:bg-surface-container-high hover:text-primary transition-all shadow-sm"
            title="تصدير سجلات الصيانة PDF"
          >
            <Download size={20} />
          </button>
          
          <button 
            onClick={() => setIsAddingLog(true)}
            className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-primary text-white rounded-[24px] font-black shadow-lg shadow-primary/20 hover:scale-[1.03] active:scale-[0.97] transition-all"
          >
            <Plus size={20} />
            إضافة سجل
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي الأعطال', value: logs.length, icon: Wrench, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'قيد الانتظار', value: logs.filter(l => l.status === 'pending').length, icon: Clock, color: 'text-error', bg: 'bg-error/10' },
          { label: 'جاري الإصلاح', value: logs.filter(l => l.status === 'in-progress').length, icon: Hammer, color: 'text-warning', bg: 'bg-warning/10' },
          { label: 'تم الإصلاح', value: logs.filter(l => l.status === 'completed').length, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-surface rounded-3xl p-6 border border-outline/5 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-secondary font-bold text-xs mb-1 uppercase tracking-widest">{stat.label}</p>
                <p className="text-3xl font-black text-primary">{stat.value}</p>
              </div>
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", stat.bg)}>
                <Icon className={stat.color} size={28} />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Insights Section */}
      <AnimatePresence>
        {aiInsight && (
          <motion.section 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            className="overflow-hidden"
          >
            <div className="bg-primary/5 border border-primary/20 rounded-[40px] p-8 shadow-md relative">
              <div className="absolute top-0 right-0 w-2 h-full bg-primary" />
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-primary/20 text-primary rounded-2xl">
                  <Sparkles size={28} />
                </div>
                <h2 className="text-2xl font-black text-primary">المساعد الذكي للصيانة</h2>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-black text-secondary mb-2 uppercase tracking-widest">موجز الحالة</h3>
                  <p className="text-on-surface font-black leading-relaxed">{aiInsight.overview}</p>
                </div>
                
                {aiInsight.urgentActions?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-error mb-4 uppercase tracking-widest">إجراءات مستعجلة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiInsight.urgentActions.map((action, index) => (
                        <div key={index} className="bg-surface rounded-2xl p-6 border border-error/20 shadow-sm">
                          <p className="font-black text-primary mb-1">{action.equipmentName}</p>
                          <p className="text-xs text-on-surface/60 font-bold mb-3">{action.issue}</p>
                          <div className="bg-error/5 p-3 rounded-xl border border-error/10">
                            <p className="text-sm font-bold text-error">{action.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h3 className="text-sm font-black text-primary mb-2 uppercase tracking-widest">توصيات وقائية</h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {aiInsight.preventiveMeasures.map((measure, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm font-bold text-on-surface/80 bg-surface p-4 rounded-xl border border-outline/5 shadow-sm">
                        <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
                        <span>{measure}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <button 
                onClick={() => setAiInsight(null)}
                className="mt-8 text-sm font-black text-primary/60 hover:text-primary transition-all flex items-center gap-2"
              >
                إخفاء التحليل <X size={14} />
              </button>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {viewMode === 'calendar' ? (
        <div className="bg-surface rounded-[40px] border border-outline/10 shadow-sm overflow-hidden p-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
            <h2 className="text-3xl font-black text-primary font-serif">
              {format(currentMonth, 'MMMM yyyy', { locale: ar })}
            </h2>
            <div className="flex bg-surface-container-low p-1.5 rounded-2xl gap-2">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 hover:bg-surface rounded-xl transition-all shadow-hover"
              >
                <ChevronRight size={20} />
              </button>
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-6 py-2 bg-surface text-primary font-black rounded-xl shadow-sm hover:scale-105 transition-all"
              >
                الشهر الحالي
              </button>
              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 hover:bg-surface rounded-xl transition-all shadow-hover"
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-3">
            {['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'].map(day => (
              <div key={day} className="text-center text-xs font-black text-secondary/40 py-4 uppercase tracking-[0.2em]">
                {day}
              </div>
            ))}
            
            {(() => {
              const startDay = startOfMonth(currentMonth).getDay();
              const blanks = Array(startDay).fill(null);
              return [...blanks, ...monthDays].map((day, idx) => {
                if (!day) return <div key={`blank-${idx}`} className="h-44 bg-surface-container-low/20 rounded-[32px] border border-dashed border-outline/5" />;
                
                const dayLogs = getLogsForDay(day);
                return (
                  <div 
                    key={day.toString()} 
                    className={cn(
                      "h-44 p-5 border border-outline/5 rounded-[32px] transition-all flex flex-col gap-3 relative group overflow-hidden",
                      isToday(day) ? "bg-primary/5 ring-2 ring-primary/40 shadow-inner" : "bg-surface hover:bg-surface-container-low/40"
                    )}
                  >
                    <span className={cn(
                      "text-sm font-black w-8 h-8 flex items-center justify-center rounded-xl",
                      isToday(day) ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-secondary/40"
                    )}>
                      {format(day, 'd')}
                    </span>

                    <div className="flex flex-col gap-2 overflow-y-auto scrollbar-hide">
                      {dayLogs.map(l => (
                        <div 
                          key={l.id}
                          className={cn(
                            "text-[9px] p-2 rounded-xl font-black truncate border shadow-sm",
                            l.priority === 'high' ? "bg-error/10 text-error border-error/10" :
                            l.status === 'completed' ? "bg-success/10 text-success border-success/10" :
                            "bg-primary/10 text-primary border-primary/10"
                          )}
                        >
                          {l.equipmentName}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      ) : (
        /* Enhanced List View */
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 bg-surface p-6 rounded-[32px] shadow-sm border border-outline/10">
            <div className="relative flex-1">
              <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-secondary/30" size={20} />
              <input 
                type="text"
                placeholder="ابحث عن جهاز، مشكلة، أو تقني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-14 pl-6 py-4 bg-surface-container-low rounded-[24px] border border-transparent focus:border-primary/20 focus:ring-4 focus:ring-primary/5 font-bold transition-all outline-none"
              />
            </div>
            <div className="flex bg-surface-container-low p-1.5 rounded-2xl gap-2">
              {['all', 'pending', 'in-progress', 'completed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={cn(
                    "px-6 py-3 rounded-xl text-xs font-black transition-all whitespace-nowrap uppercase tracking-widest",
                    statusFilter === status 
                      ? "bg-surface text-primary shadow-sm" 
                      : "text-secondary/40 hover:text-secondary"
                  )}
                >
                  {status === 'all' ? 'الكل' : 
                   status === 'pending' ? 'انتظار' : 
                   status === 'in-progress' ? 'إصلاح' : 'مكتمل'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log, i) => (
                <motion.div
                  key={log.id}
                  layout
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-surface p-8 rounded-[40px] border border-outline/10 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden"
                >
                  <div className={cn(
                    "absolute top-0 right-0 w-2 h-full transition-all",
                    log.status === 'completed' ? "bg-success" : 
                    log.status === 'in-progress' ? "bg-warning" : "bg-error"
                  )} />

                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-2">
                      <h3 className="text-2xl font-black text-primary tracking-tight font-serif uppercase">{log.equipmentName}</h3>
                      <div className="flex items-center gap-4 text-xs font-bold text-secondary/50">
                        <span className={cn("flex items-center gap-2", getPriorityColor(log.priority))}>
                          {log.priority === 'high' ? <AlertCircle size={14} /> : <Clock size={14} />}
                          أولوية {log.priority}
                        </span>
                        <span className="w-1 h-1 bg-outline/20 rounded-full" />
                        <span className="flex items-center gap-2">
                          <Calendar size={14} />
                          {log.startDate}
                        </span>
                      </div>
                    </div>
                    <div className={cn(
                      "px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border",
                      getStatusColor(log.status)
                    )}>
                      {log.status}
                    </div>
                  </div>

                  <div className="bg-surface-container-low/50 p-6 rounded-[24px] mb-8 border border-outline/5">
                    <p className="text-sm text-on-surface/70 font-bold leading-relaxed italic">
                      "{log.issue}"
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-outline/5">
                    <div className="flex gap-3">
                      {log.status !== 'completed' && (
                        <button 
                          onClick={() => updateStatus(log.id, log.status === 'pending' ? 'in-progress' : 'completed')}
                          className="flex items-center gap-3 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          {log.status === 'pending' ? <Hammer size={16} /> : <CheckCircle2 size={16} />}
                          {log.status === 'pending' ? 'بدء الإصلاح' : 'إتمام الصيانة'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => deleteLog(log.id)}
                        className="p-3 text-secondary/30 hover:text-error hover:bg-error/10 rounded-xl transition-all"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Log Modal */}
      <AnimatePresence>
        {isAddingLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingLog(false)}
              className="absolute inset-0 bg-secondary/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-surface w-full max-w-xl rounded-[48px] shadow-2xl relative z-10 overflow-hidden border border-outline/10"
            >
              <div className="p-10 border-b border-outline/5 flex justify-between items-center bg-surface-container-low/30">
                <h2 className="text-3xl font-black text-primary font-serif italic">تقرير عطل جديد</h2>
                <button onClick={() => setIsAddingLog(false)} className="p-3 hover:bg-surface rounded-full transition-all shadow-sm">
                  <X size={28} className="text-secondary/40" />
                </button>
              </div>

              <form onSubmit={handleAddLog} className="p-10 space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] pr-2">الجهاز المستهدف</label>
                  <select 
                    required
                    value={newLog.equipmentId || ''}
                    onChange={(e) => setNewLog({...newLog, equipmentId: e.target.value})}
                    className="w-full px-8 py-5 bg-surface-container-low rounded-[24px] border border-transparent focus:border-primary/30 font-black outline-none appearance-none cursor-pointer"
                  >
                    <option value="">-- اختر من المخزون --</option>
                    {equipment.map(e => (
                      <option key={e.id} value={e.id}>{e.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] pr-2">وصف العطل / المشكلة</label>
                  <textarea 
                    required
                    value={newLog.issue || ''}
                    onChange={(e) => setNewLog({...newLog, issue: e.target.value})}
                    placeholder="اشرح العطل الفني بالتفصيل لمساعدة التقني..."
                    className="w-full px-8 py-5 bg-surface-container-low rounded-[24px] border border-transparent focus:border-primary/30 font-bold min-h-[140px] outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] pr-2">درجة الأهمية</label>
                    <select 
                      value={newLog.priority}
                      onChange={(e) => setNewLog({...newLog, priority: e.target.value as any})}
                      className="w-full px-8 py-5 bg-surface-container-low rounded-[24px] border-none font-black outline-none cursor-pointer"
                    >
                      <option value="low">عادية (Low)</option>
                      <option value="medium">متوسطة (Medium)</option>
                      <option value="high">عالية (High)</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] pr-2">تاريخ الاكتشاف</label>
                    <input 
                      type="date"
                      value={newLog.startDate}
                      onChange={(e) => setNewLog({...newLog, startDate: e.target.value})}
                      className="w-full px-8 py-5 bg-surface-container-low rounded-[24px] border-none font-black outline-none"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full bg-primary text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                  >
                    <Save size={24} />
                    تسجيل في الدفتر
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
