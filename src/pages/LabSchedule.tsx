import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  ArrowLeft, 
  FlaskConical, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Trash2, 
  Edit2,
  X, 
  User, 
  Users, 
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { db, getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { onSnapshot, query, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from 'firebase/firestore';


interface LabReservation {
  id: string;
  labName: string;
  day: string;
  time: string;
  teacher: string;
  subject: string;
  group: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

const LABS = ['مخبر العلوم 1', 'مخبر العلوم 2', 'مخبر الفيزياء 1', 'مخبر الفيزياء 2', 'مخبر الكيمياء'];
const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
const TIME_SLOTS = ['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '08:00 - 10:00', '10:00 - 12:00', '13:00 - 15:00'];

export default function LabSchedule() {
  const { schoolId } = useSchool();
  const navigate = useNavigate();
  const [reservations, setReservations] = useState<LabReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLab, setFilterLab] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [conflictError, setConflictError] = useState<string | null>(null);

  const [newRes, setNewRes] = useState<Partial<LabReservation>>({
    labName: LABS[0],
    day: DAYS[0],
    time: TIME_SLOTS[0],
    teacher: '',
    subject: 'فيزياء',
    group: '',
    status: 'confirmed'
  });

  useEffect(() => {
    const q = query(getUserCollection(schoolId, 'equipment'), orderBy('day'), orderBy('time'));
    const unsub = onSnapshot(q, (snap) => {
      setReservations(snap.docs.map(d => ({ id: d.id, ...d.data() } as LabReservation)));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const checkConflict = (day: string, time: string, lab: string) => {
    return reservations.find(r => r.day === day && r.time === time && r.labName === lab && r.status !== 'cancelled');
  };

  const handleAddReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictError(null);

    const conflict = checkConflict(newRes.day!, newRes.time!, newRes.labName!);
    if (conflict) {
      setConflictError(`هذا المختبر محجوز مسبقاً في هذا الوقت من قبل ${conflict.teacher}.`);
      return;
    }

    try {
      await addDoc(getUserCollection(schoolId, 'equipment'), {
        ...newRes,
        createdAt: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewRes({ labName: LABS[0], day: DAYS[0], time: TIME_SLOTS[0], teacher: '', subject: 'فيزياء', group: '', status: 'confirmed' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'lab_schedule');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الحجز؟')) return;
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'equipment'), id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'lab_schedule');
    }
  };

  const filteredReservations = reservations.filter(res => {
    const matchesLab = !filterLab || res.labName === filterLab;
    const matchesSearch = !searchTerm || 
      res.teacher.includes(searchTerm) || 
      res.subject.includes(searchTerm) || 
      res.group.includes(searchTerm);
    return matchesLab && matchesSearch;
  });

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <FlaskConical size={14} />
            تسيير المخابر
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter font-serif">حصص المخبر</h1>
          <p className="text-on-surface/60 text-xl font-bold">تنظيم استغلال المخابر وحجز الحصص التطبيقية.</p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => navigate('/pedagogical')}
            className="bg-surface text-primary border border-outline/10 px-8 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/5 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
            العودة للفضاء البيداغوجي
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95"
          >
            <Plus size={24} />
            حجز حصة مخبرية
          </button>
        </div>

        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Lab Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {LABS.map((lab, i) => (
          <motion.button
            key={lab}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setFilterLab(lab === filterLab ? '' : lab)}
            className={cn(
              "p-6 rounded-[32px] border transition-all text-right group relative overflow-hidden",
              filterLab === lab 
                ? "bg-primary text-on-primary border-primary shadow-xl shadow-primary/20" 
                : "bg-surface text-on-surface border-outline/10 hover:border-primary/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors",
              filterLab === lab ? "bg-surface/20" : "bg-primary/5 text-primary"
            )}>
              <FlaskConical size={24} />
            </div>
            <h3 className="font-black text-lg leading-tight">{lab}</h3>
            <p className={cn(
              "text-xs mt-2 font-bold",
              filterLab === lab ? "text-on-primary/60" : "text-on-surface/40"
            )}>
              {reservations.filter(r => r.labName === lab).length} حصص محجوزة
            </p>
          </motion.button>
        ))}
      </section>

      {/* Reservations Table */}
      <section className="bg-surface rounded-[40px] border border-outline/10 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-outline/5 flex justify-between items-center bg-surface-container-low/30">
          <h2 className="text-2xl font-black text-primary">جدول الحجوزات</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface/40" size={18} />
              <input 
                type="text" 
                placeholder="بحث..." 
                className="bg-surface border border-outline/10 rounded-xl pr-10 pl-4 py-2 text-sm font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-surface-container-low/50">
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">المخبر</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">اليوم / الوقت</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">الأستاذ</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">المادة / الفوج</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider">الحالة</th>
                <th className="p-6 font-black text-primary text-sm uppercase tracking-wider text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map((res, i) => (
                <motion.tr 
                  key={res.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-outline/5 hover:bg-primary/5 transition-colors group"
                >
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                        <MapPin size={20} />
                      </div>
                      <span className="font-black text-primary">{res.labName}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-black text-on-surface/80">{res.day}</span>
                      <span className="text-xs font-bold text-on-surface/40 flex items-center gap-1">
                        <Clock size={12} />
                        {res.time}
                      </span>
                    </div>
                  </td>
                  <td className="p-6 font-bold">{res.teacher}</td>
                  <td className="p-6">
                    <div className="flex flex-col">
                      <span className="font-bold text-on-surface/80">{res.subject}</span>
                      <span className="text-xs font-black text-secondary">{res.group}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black",
                      res.status === 'confirmed' ? "bg-success/10 text-success" :
                      res.status === 'pending' ? "bg-warning/10 text-warning" :
                      "bg-error/10 text-error"
                    )}>
                      {res.status === 'confirmed' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                      {res.status === 'confirmed' ? 'مؤكد' : res.status === 'pending' ? 'قيد الانتظار' : 'ملغى'}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-all">
                        <Edit2 size={18} />
                      </button>
                      <button className="p-2 hover:bg-error/10 text-error rounded-lg transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Booking Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-primary/20 backdrop-blur-xl" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative bg-surface w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-outline/10"
            >
              <div className="p-8 border-b border-outline/5 flex justify-between items-center bg-surface-container-low/30">
                <h3 className="text-2xl font-black text-primary">حجز جديد</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleAddReservation} className="p-10 space-y-6">
                {conflictError && (
                  <div className="bg-error/5 text-error p-4 rounded-2xl border border-error/10 flex items-center gap-3 text-sm font-bold">
                    <AlertCircle size={20} />
                    {conflictError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary/60 uppercase mr-2">المخبر</label>
                    <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold appearance-none" value={newRes.labName} onChange={e => setNewRes({...newRes, labName: e.target.value})}>
                      {LABS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary/60 uppercase mr-2">اليوم</label>
                    <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold appearance-none" value={newRes.day} onChange={e => setNewRes({...newRes, day: e.target.value})}>
                      {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary/60 uppercase mr-2">التوقيت</label>
                  <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold appearance-none" value={newRes.time} onChange={e => setNewRes({...newRes, time: e.target.value})}>
                    {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-secondary/60 uppercase mr-2">الأستاذ</label>
                  <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold" value={newRes.teacher} onChange={e => setNewRes({...newRes, teacher: e.target.value})} placeholder="اسم الأستاذ..." />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary/60 uppercase mr-2">المادة</label>
                    <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold" value={newRes.subject} onChange={e => setNewRes({...newRes, subject: e.target.value})}>
                      <option value="فيزياء">فيزياء</option>
                      <option value="كيمياء">كيمياء</option>
                      <option value="علوم طبيعية">علوم طبيعية</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-secondary/60 uppercase mr-2">الفوج</label>
                    <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-primary/20 outline-none font-bold" value={newRes.group} onChange={e => setNewRes({...newRes, group: e.target.value})} placeholder="مثال: 3ث 1..." />
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-on-primary py-6 rounded-full font-black shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all flex items-center justify-center gap-3 mt-4">
                  <CheckCircle2 size={24} />
                  إتمام الحجز وتأكيده
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
