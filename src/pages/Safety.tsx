import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { onSnapshot, query, addDoc, serverTimestamp, orderBy, limit, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  History, 
  Plus,
  Flame,
  Eye,
  BriefcaseMedical,
  Activity,
  X,
  Clock,
  Trash2,
  Edit,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { analyzeIncident } from '../services/geminiService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileText, Sparkles, Download, ShieldCheck as ShieldCheckIcon } from 'lucide-react';

import { SafetyItem, Incident } from '../types/safety';

const iconMap = {
  fire: Flame,
  eye: Eye,
  firstaid: BriefcaseMedical,
  gas: ShieldAlert
};

export default function Safety() {
  const { schoolId } = useSchool();
  const navigate = useNavigate();
  const [safetyItems, setSafetyItems] = useState<SafetyItem[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddEquipModalOpen, setIsAddEquipModalOpen] = useState(false);
  const [editingEquip, setEditingEquip] = useState<SafetyItem | null>(null);
  const [isLogIncidentModalOpen, setIsLogIncidentModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [newEquip, setNewEquip] = useState<Partial<SafetyItem>>({
    name: '',
    status: 'صالح',
    type: 'fire',
    serialNumber: ''
  });

  const [newIncident, setNewIncident] = useState<Partial<Incident>>({
    type: '',
    status: 'جديد',
    reporter: '',
    severity: 'medium',
    description: ''
  });

  useEffect(() => {
    // Fetch Safety Equipment
    const qEquip = query(getUserCollection(schoolId, 'equipment'));
    const unsubEquip = onSnapshot(qEquip, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SafetyItem));
      setSafetyItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'safety_equipment');
    });

    // Fetch Incidents
    const qIncidents = query(getUserCollection(schoolId, 'safety_incidents'), orderBy('date', 'desc'), limit(50));
    const unsubIncidents = onSnapshot(qIncidents, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          ...data,
          displayDate: data.date?.toDate()?.toLocaleDateString('ar-DZ') || 'غير محدد'
        } as Incident & { displayDate: string };
      });
      setIncidents(items as any);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'incident_logs');
    });

    return () => {
      unsubEquip();
      unsubIncidents();
    };
  }, []);

  const handleAddEquip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEquip) {
        await updateDoc(doc(getUserCollection(schoolId, 'equipment'), editingEquip.id), {
          ...newEquip,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(getUserCollection(schoolId, 'equipment'), {
          ...newEquip,
          lastCheck: new Date().toISOString().split('T')[0],
          createdAt: serverTimestamp()
        });
      }
      setIsAddEquipModalOpen(false);
      setEditingEquip(null);
      setNewEquip({ name: '', status: 'صالح', type: 'fire', serialNumber: '' });
    } catch (error) {
      handleFirestoreError(error, editingEquip ? OperationType.UPDATE : OperationType.CREATE, 'safety_equipment');
    }
  };

  const handleDeleteEquip = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه المعدات؟')) return;
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'safety_incidents'), id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `safety_equipment/${id}`);
    }
  };

  const handleLogIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(getUserCollection(schoolId, 'equipment'), {
        ...newIncident,
        date: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      setIsLogIncidentModalOpen(false);
      setNewIncident({ type: '', status: 'جديد', reporter: '', severity: 'medium', description: '', location: '', injured: '', witnesses: '', firstAid: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'incident_logs');
    }
  };

  const handleRunInvestigation = async (incident: Incident) => {
    try {
      await updateDoc(doc(getUserCollection(schoolId, 'safety_incidents'), incident.id), {
        status: 'تحت التحقيق',
        updatedAt: serverTimestamp()
      });
      
      const analysis = await analyzeIncident(incident);
      if (analysis) {
        await updateDoc(doc(getUserCollection(schoolId, 'safety_incidents'), incident.id), {
          analysis,
          status: 'قيد المتابعة',
          updatedAt: serverTimestamp()
        });
        // Update local state if selected
        if (selectedIncident?.id === incident.id) {
          setSelectedIncident({ ...incident, analysis, status: 'قيد المتابعة' });
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incident_logs/${incident.id}`);
    }
  };

  const exportIncidentPDF = (incident: Incident) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    
    // Arabic support is tricky in jsPDF without custom fonts, 
    // so we'll use English labels or assume the user has fonts if this were a production app.
    // For this prototype, we'll create a professional structured layout.
    
    doc.setFontSize(22);
    doc.text('Incident Report (PV d\'accident)', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Ref: ${incident.id.toUpperCase()}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 190, 30, { align: 'right' });
    
    autoTable(doc, {
      startY: 40,
      head: [['Field', 'Details']],
      body: [
        ['Type', incident.type],
        ['Location', incident.location || 'N/A'],
        ['Severity', incident.severity.toUpperCase()],
        ['Reporter', incident.reporter],
        ['Injured Persons', incident.injured || 'None reported'],
        ['Witnesses', incident.witnesses || 'None'],
        ['First Aid Given', incident.firstAid || 'None'],
        ['Description', incident.description || 'N/A'],
      ],
      theme: 'grid',
      headStyles: { fillColor: [43, 61, 34] },
    });

    if (incident.analysis) {
      doc.text('AI Safety Analysis & Investigation:', 20, (doc as any).lastAutoTable.finalY + 15);
      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        body: [
          ['Root Cause', incident.analysis.rootCause],
          ['Mitigation', incident.analysis.longTermMitigation],
          ['Safety Tips', incident.analysis.safetyTipsAr]
        ],
        theme: 'striped'
      });
    }

    doc.save(`incident_${incident.id}.pdf`);
  };

  const handleDeleteIncident = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'safety_incidents'), id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `incident_logs/${id}`);
    }
  };

  const handleUpdateIncidentStatus = async (id: string, status: Incident['status']) => {
    try {
      await updateDoc(doc(getUserCollection(schoolId, 'equipment'), id), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `incident_logs/${id}`);
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSeverity = filterSeverity === 'all' || incident.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-24 rtl" dir="rtl">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div className="text-right space-y-1">
          <h1 className="text-3xl font-black text-primary tracking-tighter">السلامة والأمان</h1>
          <p className="text-secondary/80 text-lg font-medium">الرصد الدوري والوقاية المخبرية الذكية</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              setEditingEquip(null);
              setNewEquip({ name: '', status: 'صالح', type: 'fire', serialNumber: '' });
              setIsAddEquipModalOpen(true);
            }}
            className="bg-surface-container-low text-primary border border-outline/20 px-6 py-3.5 rounded-full flex items-center gap-2 font-bold hover:bg-surface-container-high hover:border-outline/40 transition-all active:scale-95"
          >
            <Plus size={20} />
            إضافة معدات
          </button>
          <button 
            onClick={() => setIsLogIncidentModalOpen(true)}
            className="bg-primary text-on-primary px-8 py-3.5 rounded-full flex items-center gap-2 font-bold shadow-xl shadow-primary/20 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95"
          >
            <ShieldAlert size={20} />
            تبليغ عن حادث
          </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-primary text-on-primary p-8 rounded-[28px_28px_28px_8px] flex flex-col justify-between overflow-hidden relative group min-h-[180px]">
          <div className="relative z-10">
            <p className="text-primary-fixed-dim/80 text-sm font-bold uppercase tracking-widest mb-2">الأيام بدون حوادث</p>
            <h3 className="text-6xl font-black">124</h3>
          </div>
          <ShieldAlert className="absolute -bottom-6 -left-6 text-white/10 w-40 h-40 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
        </div>
        
        <div className="bg-primary-fixed text-primary p-8 rounded-[28px_28px_28px_8px] flex flex-col justify-between border border-primary/10 min-h-[180px]">
          <div>
            <p className="text-primary/60 text-sm font-bold uppercase tracking-widest mb-2">تاريخ التدقيق القادم</p>
            <h3 className="text-3xl font-black">2024-06-15</h3>
          </div>
          <div className="flex items-center gap-3 mt-4 text-sm bg-primary/5 w-fit px-4 py-2 rounded-full border border-primary/10">
            <Clock size={16} className="text-primary" />
            <span className="font-bold">متبقي 28 يوم</span>
          </div>
        </div>

        <div className="bg-surface-container-low text-on-surface p-8 rounded-[28px_28px_28px_8px] flex flex-col justify-between border border-outline/10 min-h-[180px]">
          <div>
            <p className="text-secondary/60 text-sm font-bold uppercase tracking-widest mb-2">عدد معدات السلامة</p>
            <h3 className="text-4xl font-black text-primary">{safetyItems.length}</h3>
          </div>
          <div className="w-full bg-surface-container-high h-2.5 rounded-full mt-6 overflow-hidden border border-outline/5">
            <div className="bg-primary h-full w-4/5 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Equipment Overview */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-primary flex items-center gap-3">
            <Activity className="text-primary/40" />
            نظرة عامة على المعدات
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {safetyItems.map((item) => {
            const Icon = iconMap[item.type] || ShieldAlert;
            return (
              <div 
                key={item.id} 
                className="bg-surface-container-lowest p-7 rounded-[28px_28px_28px_8px] hover:shadow-2xl hover:-translate-y-1 transition-all group border border-outline/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
                
                <div className="flex justify-between items-start mb-8 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center shadow-inner">
                    <Icon size={28} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "px-4 py-1.5 text-xs font-black rounded-full shadow-sm",
                      item.status === 'صالح' ? "bg-primary-fixed/40 text-primary" : "bg-error-container text-on-error-container"
                    )}>
                      {item.status}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingEquip(item);
                          setNewEquip(item);
                          setIsAddEquipModalOpen(true);
                        }}
                        className="p-1.5 hover:bg-primary/10 rounded-lg text-primary transition-colors"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEquip(item.id)}
                        className="p-1.5 hover:bg-error/10 rounded-lg text-error transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="relative z-10">
                  <h4 className="text-xl font-black mb-1 text-primary group-hover:text-primary-container transition-colors">{item.name}</h4>
                  <p className="text-secondary/60 text-sm mb-6 font-medium">آخر فحص: {item.lastCheck}</p>
                </div>

                <div className="flex items-center justify-between pt-5 border-t border-outline/10 relative z-10">
                  <span className="text-[11px] font-mono text-outline/60 uppercase tracking-widest">{item.serialNumber || item.id.slice(0, 8)}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center">
                    <History size={16} className="text-primary" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Incident Log */}
      <section className="pb-20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <h2 className="text-3xl font-black text-primary flex items-center gap-3">
            <History className="text-primary/40" />
            سجل الحوادث الأخير
          </h2>
          <div className="flex flex-wrap gap-3">
            <select 
              className="bg-surface-container-low border border-outline/10 rounded-full px-6 py-2.5 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
            >
              <option value="all">كل المستويات</option>
              <option value="low">منخفضة</option>
              <option value="medium">متوسطة</option>
              <option value="high">عالية</option>
            </select>
            <select 
              className="bg-surface-container-low border border-outline/10 rounded-full px-6 py-2.5 text-sm font-bold text-secondary focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">كل الحالات</option>
              <option value="جديد">جديد</option>
              <option value="قيد المتابعة">قيد المتابعة</option>
              <option value="تم التعامل">تم التعامل</option>
            </select>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-[32px] overflow-hidden border border-outline/10 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 text-secondary/60 text-xs font-black uppercase tracking-widest">
                  <th className="p-6">التاريخ</th>
                  <th className="p-6">نوع الحادث</th>
                  <th className="p-6">الحالة</th>
                  <th className="p-6">المسؤول</th>
                  <th className="p-6 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/5">
                {filteredIncidents.map((incident: any) => (
                  <tr key={incident.id} className="hover:bg-surface-container-low/40 transition-colors group">
                    <td className="p-6 text-sm font-medium text-secondary">{incident.displayDate}</td>
                    <td className="p-6">
                      <div className="flex items-center justify-end gap-4">
                        <span className="font-bold text-primary group-hover:text-primary-container transition-colors">{incident.type}</span>
                        <div className={cn(
                          "w-2.5 h-2.5 rounded-full shadow-sm",
                          incident.severity === 'high' ? "bg-error animate-pulse" : incident.severity === 'medium' ? "bg-tertiary" : "bg-secondary/40"
                        )}></div>
                      </div>
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-4 py-1.5 text-xs rounded-full font-black shadow-sm",
                          incident.status === 'تم التعامل' ? "bg-primary-fixed/40 text-primary" : "bg-tertiary-container text-on-tertiary-container"
                        )}>
                          {incident.status}
                        </span>
                        {incident.status !== 'تم التعامل' && (
                          <button 
                            onClick={() => handleUpdateIncidentStatus(incident.id, 'تم التعامل')}
                            className="p-1.5 hover:bg-primary/10 rounded-lg text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                            title="تحديد كمكتمل"
                          >
                            <Check size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-secondary/80 text-sm font-medium">{incident.reporter}</td>
                    <td className="p-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setSelectedIncident(incident)}
                          className="text-primary hover:bg-primary/10 p-2.5 rounded-full transition-all active:scale-90"
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          onClick={() => handleDeleteIncident(incident.id)}
                          className="text-error hover:bg-error/10 p-2.5 rounded-full transition-all active:scale-90"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modals */}
      <AnimatePresence>
        {isAddEquipModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsAddEquipModalOpen(false); setEditingEquip(null); }} className="absolute inset-0 bg-primary/20 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-surface w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-outline/10">
              <div className="p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5">
                <h3 className="text-2xl font-black text-primary">{editingEquip ? 'تعديل معدات' : 'إضافة معدات سلامة'}</h3>
                <button onClick={() => { setIsAddEquipModalOpen(false); setEditingEquip(null); }} className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddEquip} className="p-10 space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">اسم المعدات</label>
                  <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newEquip.name} onChange={e => setNewEquip({...newEquip, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">النوع</label>
                  <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer" value={newEquip.type} onChange={e => setNewEquip({...newEquip, type: e.target.value as any})}>
                    <option value="fire">مطفأة حريق</option>
                    <option value="eye">محطة غسل عين</option>
                    <option value="firstaid">حقيبة إسعافات</option>
                    <option value="gas">كاشف غاز</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الحالة</label>
                  <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer" value={newEquip.status} onChange={e => setNewEquip({...newEquip, status: e.target.value as any})}>
                    <option value="صالح">صالح</option>
                    <option value="تحتاج تحديث">تحتاج تحديث</option>
                    <option value="منتهي">منتهي</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الرقم التسلسلي</label>
                  <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newEquip.serialNumber} onChange={e => setNewEquip({...newEquip, serialNumber: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 mt-4 hover:bg-primary-container hover:shadow-2xl transition-all active:scale-95">
                  {editingEquip ? 'تحديث' : 'حفظ المعدات'}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isLogIncidentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLogIncidentModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-surface w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-outline/10">
              <div className="p-8 flex justify-between items-center bg-surface-container-low border-b border-outline/5">
                <h3 className="text-2xl font-black text-primary">تبليغ عن حادث</h3>
                <button onClick={() => setIsLogIncidentModalOpen(false)} className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"><X size={24} /></button>
              </div>
              <form onSubmit={handleLogIncident} className="p-10 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">نوع الحادث</label>
                    <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newIncident.type} onChange={e => setNewIncident({...newIncident, type: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">المكان (المخبر/الجناح)</label>
                    <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newIncident.location} onChange={e => setNewIncident({...newIncident, location: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">المبلغ</label>
                    <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newIncident.reporter} onChange={e => setNewIncident({...newIncident, reporter: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الخطورة</label>
                    <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold appearance-none cursor-pointer" value={newIncident.severity} onChange={e => setNewIncident({...newIncident, severity: e.target.value as any})}>
                      <option value="low">منخفضة</option>
                      <option value="medium">متوسطة</option>
                      <option value="high">عالية</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الأشخاص المتضررون (إن وجد)</label>
                  <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newIncident.injured} onChange={e => setNewIncident({...newIncident, injured: e.target.value})} placeholder="الاسم واللقب..." />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الشهود</label>
                    <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newIncident.witnesses} onChange={e => setNewIncident({...newIncident, witnesses: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">الإسعافات الأولية المقدمة</label>
                    <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold" value={newIncident.firstAid} onChange={e => setNewIncident({...newIncident, firstAid: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">وصف تفصيلي للحادث</label>
                  <textarea className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all font-bold min-h-[100px]" value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-error text-on-error py-5 rounded-full font-black shadow-xl shadow-error/20 mt-4 hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2">
                  <ShieldAlert size={20} />
                  إرسال التقرير الرسمي
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedIncident(null)} className="absolute inset-0 bg-primary/20 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative bg-surface w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-outline/10 p-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={28} className="text-error" />
                    <h3 className="text-3xl font-black text-primary">{selectedIncident.type}</h3>
                  </div>
                  <p className="text-secondary/60 font-bold mt-1">{(selectedIncident as any).displayDate} • {selectedIncident.location}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => exportIncidentPDF(selectedIncident)} className="p-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-all" title="تصدير PDF"><Download size={20} /></button>
                  <button onClick={() => setSelectedIncident(null)} className="p-2.5 hover:bg-surface-container-low rounded-full transition-all"><X size={24} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                 <div className="p-5 bg-surface-container-low rounded-2xl border border-outline/5 transition-all hover:border-primary/20">
                    <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest block mb-2">المبلغ والشهود</span>
                    <p className="font-black text-primary truncate">المبلغ: {selectedIncident.reporter}</p>
                    <p className="text-xs text-secondary mt-1 font-bold">الشهود: {selectedIncident.witnesses || 'لا يوجد'}</p>
                 </div>
                 <div className="p-5 bg-surface-container-low rounded-2xl border border-outline/5 transition-all hover:border-primary/20">
                    <span className="text-[10px] font-black text-secondary/60 uppercase tracking-widest block mb-2">الإسعافات والضرر</span>
                    <p className="font-black text-primary truncate">المتضرر: {selectedIncident.injured || 'لا يوجد'}</p>
                    <p className="text-xs text-secondary mt-1 font-bold">الإسعاف: {selectedIncident.firstAid || 'لا يوجد'}</p>
                 </div>
              </div>

              <div className="space-y-6">
                <div className="p-6 bg-surface-container-low rounded-[24px] border border-outline/5">
                  <span className="text-xs font-black text-secondary/60 uppercase tracking-widest block mb-3 underline decoration-primary/20 underline-offset-4">وصف الحادث</span>
                  <p className="text-on-surface leading-relaxed font-medium whitespace-pre-wrap">{selectedIncident.description || 'لا توجد تفاصيل إضافية.'}</p>
                </div>

                {/* Investigation Section */}
                <div className="space-y-4 pt-4 border-t border-outline/10">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black text-primary flex items-center gap-2">
                      <Sparkles size={20} className="text-tertiary" />
                      التحقيق الذكي (AI)
                    </h4>
                    {!selectedIncident.analysis && (
                      <button 
                        onClick={() => handleRunInvestigation(selectedIncident)}
                        className="bg-tertiary text-on-tertiary px-6 py-2.5 rounded-full text-xs font-black flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-tertiary/20"
                      >
                        {selectedIncident.status === 'تحت التحقيق' ? 'جاري التحليل...' : 'بدء التحقيق'}
                      </button>
                    )}
                  </div>

                  {selectedIncident.analysis ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                       <div className="p-6 bg-tertiary/5 border border-tertiary/20 rounded-3xl">
                          <span className="text-[10px] font-black text-tertiary uppercase tracking-widest block mb-2">السبب الجذري المحتمل</span>
                          <p className="text-on-surface font-bold leading-relaxed">{selectedIncident.analysis.rootCause}</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl">
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest block mb-2">إجراءات فورية</span>
                             <ul className="text-xs space-y-1.5 list-disc list-inside font-bold text-secondary text-right">
                                {selectedIncident.analysis.suggestedActions.map((action, i) => (
                                  <li key={i}>{action}</li>
                                ))}
                             </ul>
                          </div>
                          <div className="p-5 bg-surface-container-high border border-outline/10 rounded-2xl">
                             <span className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">استراتيجية الوقاية</span>
                             <p className="text-xs font-bold leading-relaxed">{selectedIncident.analysis.longTermMitigation}</p>
                          </div>
                       </div>

                       <div className="p-5 bg-secondary/5 border border-secondary/20 rounded-2xl flex items-center gap-4">
                          <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center shrink-0">
                             <ShieldCheckIcon size={20} className="text-secondary" />
                          </div>
                          <p className="text-xs font-bold text-secondary italic">" {selectedIncident.analysis.safetyTipsAr} "</p>
                       </div>
                    </motion.div>
                  ) : (
                    <div className="p-12 text-center bg-surface-container-low rounded-3xl border border-dashed border-outline/20">
                       <Sparkles size={40} className="mx-auto text-tertiary/20 mb-3" />
                       <p className="text-sm text-secondary font-bold">يمكن للذكاء الاصطناعي تحليل الحادث وتوليد تقرير تحقيق مفصل واقتراح تدابير وقائية.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
