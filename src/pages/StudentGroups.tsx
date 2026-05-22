import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { getUserCollection } from '../firebase';
import { addDoc, getDocs, query, orderBy, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Users, Grid, Plus, Trash2, Calendar, User, MessageSquare, CheckCircle2, ShieldAlert, Play, Square, Beaker, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


interface StudentClass {
  id: string;
  name: string;      // e.g., 2 ج م ع ت
  level: string;     // e.g., السنة الثانية
  groups: string[];  // e.g., الفوج 1, الفوج 2
}

interface LabSession {
  id: string;
  date: any;
  classId: string;
  className: string;
  groupName: string;
  teacherName: string;
  roomName: string;
  status: 'active' | 'completed';
  benches: number;
}

export default function StudentGroups() {
  const { schoolId } = useSchool();
  const [activeTab, setActiveTab] = useState<'classes' | 'sessions'>('sessions');
  const [classes, setClasses] = useState<StudentClass[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Class Form
  const [showClassModal, setShowClassModal] = useState(false);
  const [newClass, setNewClass] = useState({ name: '', level: '1', groups: 'الفوج 1, الفوج 2' });

  // New Session Form
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [newSession, setNewSession] = useState({ classId: '', groupName: '', teacherName: '', roomName: 'المخبر 1', benchCount: 12 });

  // Active Session View
  const [activeSession, setActiveSession] = useState<LabSession | null>(null);
  const [incidentModal, setIncidentModal] = useState<{ isOpen: boolean, benchNum: number | null }>({ isOpen: false, benchNum: null });
  const [incidentNote, setIncidentNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classSnap, sessionSnap, teacherSnap] = await Promise.all([
        getDocs(query(getUserCollection(schoolId, 'equipment'))),
        getDocs(query(getUserCollection(schoolId, 'equipment'), orderBy('date', 'desc'))),
        getDocs(query(getUserCollection(schoolId, 'equipment')))
      ]);

      const classData = classSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudentClass));
      const sessionData = sessionSnap.docs.map(d => ({ id: d.id, ...d.data() } as LabSession));
      const teacherData = teacherSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setClasses(classData.sort((a,b) => a.level.localeCompare(b.level)));
      setSessions(sessionData);
      setTeachers(teacherData);
      
      const currentActive = sessionData.find(s => s.status === 'active');
      if (currentActive) setActiveSession(currentActive);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const groupArray = newClass.groups.split(',').map(g => g.trim());
      await addDoc(getUserCollection(schoolId, 'equipment'), {
        name: newClass.name,
        level: newClass.level,
        groups: groupArray
      });
      setShowClassModal(false);
      setNewClass({ name: '', level: '1', groups: 'الفوج 1, الفوج 2' });
      fetchData();
    } catch (error) {
      console.error("Error adding class", error);
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذا القسم؟')) {
      await deleteDoc(doc(getUserCollection(schoolId, 'equipment'), id));
      fetchData();
    }
  };

  const handleStartSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const classObj = classes.find(c => c.id === newSession.classId);
      if (!classObj) return;

      const docRef = await addDoc(getUserCollection(schoolId, 'equipment'), {
        date: serverTimestamp(),
        classId: classObj.id,
        className: classObj.name,
        groupName: newSession.groupName,
        teacherName: newSession.teacherName,
        roomName: newSession.roomName,
        benches: newSession.benchCount,
        status: 'active'
      });
      setShowSessionModal(false);
      fetchData();
    } catch (error) {
      console.error("Error starting session", error);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    if (confirm('إنهاء وحفظ جلسة العمل التطبيقي؟')) {
      try {
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(getUserCollection(schoolId, 'equipment'), activeSession.id), {
          status: 'completed'
        });
        setActiveSession(null);
        fetchData();
      } catch (error) {
        console.error("Error ending", error);
      }
    }
  };

  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || incidentModal.benchNum === null) return;
    try {
      await addDoc(getUserCollection(schoolId, 'equipment'), {
        title: `كسر/إتلاف - طاولة ${incidentModal.benchNum}`,
        description: incidentNote,
        date: new Date().toISOString(),
        severity: 'medium',
        status: 'open',
        context: `القسم: ${activeSession.className} - ${activeSession.groupName}. الأستاذ: ${activeSession.teacherName}`
      });
      setIncidentModal({ isOpen: false, benchNum: null });
      setIncidentNote('');
      alert('تم تسجيل الحادثة بنجاح وتوجيهها إلى سجل الإتلاف.');
    } catch (error) {
      console.error("Error reporting incident", error);
    }
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      
      
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-3 flex items-center gap-4">
            <Users size={40} className="text-tertiary" />
            تسيير الأفواج والمقاعد
          </h1>
          <p className="text-lg text-secondary">
            متابعة الأفواج التربوية، توزيع طاولات العمل خلال الحصة، وتحديد المسؤولية عند الإتلاف بسهولة.
          </p>
        </div>
        {!activeSession && activeTab === 'sessions' && (
          <button 
            onClick={() => setShowSessionModal(true)}
            className="px-8 py-4 bg-tertiary text-on-tertiary rounded-2xl font-bold hover:shadow-lg hover:shadow-tertiary/30 transition-all flex items-center gap-3"
          >
            <Play size={24} />
            <span>بدء حصة تطبيقية جديدة</span>
          </button>
        )}
      </header>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-outline-variant/30 pb-2">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'sessions' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-secondary-container text-secondary'}`}
        >
          <Grid size={20} />
          <span>مخطط الجلسات</span>
        </button>
        <button
          onClick={() => setActiveTab('classes')}
          className={`px-6 py-3 rounded-t-2xl font-bold flex items-center gap-2 transition-colors ${activeTab === 'classes' ? 'bg-primary text-on-primary' : 'bg-surface-container hover:bg-secondary-container text-secondary'}`}
        >
          <Users size={20} />
          <span>إدارة الأقسام والأفواج</span>
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-secondary">جاري تحميل البيانات...</div>
      ) : activeTab === 'sessions' ? (
        <div className="space-y-8">
          {/* Active Session Map */}
          {activeSession ? (
            <div className="bg-surface rounded-[32px] p-8 border-2 border-tertiary shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary/5 rounded-bl-full -z-10" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-outline-variant/50 pb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
                    </span>
                    <h2 className="text-2xl font-bold text-primary">حصة تطبيقية جارية</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm font-bold text-secondary">
                    <span className="text-primary bg-primary/10 px-3 py-1 rounded-full">{activeSession.roomName}</span>
                    <span className="flex items-center gap-2"><Users size={16}/> {activeSession.className} - {activeSession.groupName}</span>
                    <span className="flex items-center gap-2"><User size={16}/> {activeSession.teacherName}</span>
                  </div>
                </div>
                <button 
                  onClick={handleEndSession}
                  className="px-6 py-3 bg-error text-on-error rounded-xl font-bold hover:bg-error/90 transition-all flex items-center gap-2"
                >
                  <Square size={20} fill="currentColor" />
                  <span>إنهاء الحصة وإخلاء المخبر</span>
                </button>
              </div>

              {/* Grid of Benches */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: activeSession.benches }).map((_, i) => {
                  const benchNumber = i + 1;
                  return (
                    <motion.div 
                      key={benchNumber}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="group flex flex-col"
                    >
                      {/* Form representing students sitting */}
                      <div className="flex justify-center gap-2 mb-2">
                        <Users size={20} className="text-outline group-hover:text-tertiary transition-colors" />
                        <Users size={20} className="text-outline group-hover:text-tertiary transition-colors" />
                      </div>
                      {/* Bench physical representation */}
                      <div 
                        onClick={() => setIncidentModal({ isOpen: true, benchNum: benchNumber })}
                        className="bg-surface-container-low border-2 border-outline-variant rounded-2xl p-6 text-center cursor-pointer hover:border-tertiary hover:shadow-lg transition-all relative overflow-hidden h-32 flex flex-col items-center justify-center border-b-[8px]"
                      >
                         <h3 className="text-xl font-black text-secondary group-hover:text-tertiary mb-1">
                           طاولة {benchNumber}
                         </h3>
                         <span className="text-xs text-outline font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                           <ShieldAlert size={14} className="ml-1 text-error" />
                           أبلغ عن إتلاف
                         </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container-low rounded-[32px] p-12 text-center border border-outline-variant border-dashed">
               <Beaker size={64} className="mx-auto text-outline mb-4" />
               <h3 className="text-2xl font-bold text-secondary mb-2">لا توجد حصص تطبيقية جارية</h3>
               <p className="text-outline mb-6">المخبر فارغ حالياً. قم ببدء جلسة لتعيين الأفواج وتوزيع الطاولات.</p>
               <button 
                  onClick={() => setShowSessionModal(true)}
                  className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold hover:shadow-lg hover:shadow-primary/30 transition-all inline-flex items-center gap-2"
                >
                  <Play size={20} />
                  بدء حصة جديدة
                </button>
            </div>
          )}

          {/* Previous Sessions (History) */}
          <div className="mt-8">
            <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <Calendar size={24} /> تاريخ الحصص
            </h3>
            <div className="bg-surface rounded-2xl border border-outline-variant/30 overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-surface-container-low text-secondary">
                  <tr>
                    <th className="p-4 font-bold">التاريخ</th>
                    <th className="p-4 font-bold">القسم والفوج</th>
                    <th className="p-4 font-bold">الأستاذ</th>
                    <th className="p-4 font-bold">المكان</th>
                    <th className="p-4 font-bold text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {sessions.filter(s => s.status === 'completed').map(s => (
                    <tr key={s.id} className="hover:bg-secondary-container/20 transition-colors">
                      <td className="p-4 text-sm font-semibold">{s.date?.toDate().toLocaleDateString('ar-DZ') || 'N/A'}</td>
                      <td className="p-4 text-primary font-bold">{s.className} - {s.groupName}</td>
                      <td className="p-4 text-secondary">{s.teacherName}</td>
                      <td className="p-4 text-secondary text-sm">{s.roomName}</td>
                      <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-success/10 text-success text-xs font-bold px-3 py-1 rounded-full">
                          <CheckCircle2 size={14} /> مكتملة
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sessions.filter(s => s.status === 'completed').length === 0 && (
                    <tr><td colSpan={5} className="p-8 text-center text-secondary">لا يوجد سجل للحصص السابقة</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="space-y-6">
          {/* Classes Tab */}
          <div className="flex justify-between items-center bg-surface-container p-6 rounded-2xl shadow-sm border border-outline-variant/30">
             <div>
               <h2 className="text-xl font-bold text-primary">قائمة الأفواج التربوية</h2>
               <p className="text-sm text-secondary mt-1">تحديد الهيكلة التربوية لربطها بالحركة المخبرية.</p>
             </div>
             <button 
                onClick={() => setShowClassModal(true)}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <Plus size={20} /> إضافة قسم
              </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => (
              <div key={cls.id} className="bg-surface rounded-2xl p-6 border border-outline-variant/50 shadow-sm hover:shadow-md transition-shadow relative group">
                <button 
                  onClick={() => handleDeleteClass(cls.id)}
                  className="absolute top-4 left-4 p-2 text-error/0 group-hover:text-error hover:bg-error/10 rounded-full transition-all"
                >
                  <Trash2 size={18} />
                </button>
                <div className="mb-4">
                  <span className="bg-tertiary/10 text-tertiary text-xs font-black px-2 py-1 rounded-md mb-2 inline-block">سنة {cls.level}</span>
                  <h3 className="text-2xl font-bold text-primary">{cls.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cls.groups.map((g, idx) => (
                    <span key={idx} className="bg-surface-container-high text-secondary text-sm px-3 py-1 rounded-full border border-outline/10">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            {classes.length === 0 && (
              <div className="col-span-full p-12 bg-surface-container-low rounded-2xl text-center text-secondary border border-dashed border-outline-variant/50">
                لم يتم تسجيل أي أقسام بعد. أضف الأقسام الأولى لتنظيم عملية التوزيع.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {/* ADD CLASS MODAL */}
        {showClassModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-outline-variant"
            >
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">إضافة قسم جديد</h3>
                <button onClick={() => setShowClassModal(false)} className="p-2 hover:bg-outline-variant/30 rounded-full text-secondary"><X size={20} /></button>
              </div>
              <form onSubmit={handleAddClass} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">اسم القسم (مثال: 2 ج م ع ت)</label>
                  <input required autoFocus type="text" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">المستوى الدراسي</label>
                  <select value={newClass.level} onChange={e => setNewClass({...newClass, level: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option value="1">السنة الأولى</option>
                    <option value="2">السنة الثانية</option>
                    <option value="3">السنة الثالثة</option>
                    <option value="متوسط">متوسط</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">الأفواج (مفصولة بفاصلة)</label>
                  <input required type="text" value={newClass.groups} onChange={e => setNewClass({...newClass, groups: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-primary text-on-primary rounded-xl font-bold hover:bg-primary/90 flex items-center justify-center gap-2"><Save size={20} /> حفظ القسم</button>
                  <button type="button" onClick={() => setShowClassModal(false)} className="px-6 py-3 bg-surface-container text-secondary rounded-xl font-bold hover:bg-outline-variant/30">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* START SESSION MODAL */}
        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-outline-variant"
            >
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/50 flex justify-between items-center">
                <h3 className="text-xl font-bold text-primary">بدء حصة تطبيقية</h3>
                <button onClick={() => setShowSessionModal(false)} className="p-2 hover:bg-outline-variant/30 rounded-full text-secondary"><X size={20} /></button>
              </div>
              <form onSubmit={handleStartSession} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">تحديد القسم</label>
                    <select required value={newSession.classId} onChange={e => {
                        const cid = e.target.value;
                        const c = classes.find(x => x.id === cid);
                        setNewSession({...newSession, classId: cid, groupName: c ? c.groups[0] : ''});
                      }} 
                      className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary transition-all text-sm"
                    >
                      <option value="">-- اختر القسم --</option>
                      {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">تحديد الفوج</label>
                    <select required value={newSession.groupName} onChange={e => setNewSession({...newSession, groupName: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary transition-all text-sm" disabled={!newSession.classId}>
                      {classes.find(c => c.id === newSession.classId)?.groups.map((g, i) => <option key={i} value={g}>{g}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">الأستاذ المؤطر</label>
                    <select required value={newSession.teacherName} onChange={e => setNewSession({...newSession, teacherName: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary transition-all text-sm">
                      <option value="">-- الأستاذ --</option>
                      {teachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">القاعة / المخبر</label>
                    <input type="text" required value={newSession.roomName} onChange={e => setNewSession({...newSession, roomName: e.target.value})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary transition-all text-sm" />
                  </div>
                </div>
                <div>
                   <label className="block text-sm font-bold text-primary mb-2">عدد طاولات العمل (التوزيع)</label>
                   <input type="number" min={1} max={30} required value={newSession.benchCount} onChange={e => setNewSession({...newSession, benchCount: parseInt(e.target.value)})} className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-primary transition-all text-sm" />
                </div>
                
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-tertiary text-on-tertiary rounded-xl font-bold hover:bg-tertiary/90 flex items-center justify-center gap-2 shadow-md shadow-tertiary/20"><Play size={20} /> انطلاق الحصة</button>
                  <button type="button" onClick={() => setShowSessionModal(false)} className="px-6 py-3 bg-surface-container text-secondary rounded-xl font-bold hover:bg-outline-variant/30">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* INCIDENT MODAL */}
        {incidentModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-error"
            >
              <div className="p-6 bg-error/10 border-b border-error/20 flex justify-between items-center">
                <h3 className="text-xl font-bold text-error flex items-center gap-2"><ShieldAlert /> تبليغ عن إتلاف - الطاولة {incidentModal.benchNum}</h3>
                <button onClick={() => setIncidentModal({isOpen: false, benchNum: null})} className="p-2 hover:bg-error/10 rounded-full text-error"><X size={20} /></button>
              </div>
              <form onSubmit={handleReportIncident} className="p-6 space-y-4">
                <div className="bg-surface-container px-4 py-3 rounded-xl border border-outline-variant/50 text-sm text-secondary">
                   <span className="font-bold">السياق:</span> إسناد هذا الحادث مباشرة إلى <strong>{activeSession?.className} ({activeSession?.groupName})</strong>
                </div>
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">وصف العتاد الزجاجي أو المادة التالفة</label>
                  <textarea required rows={4} value={incidentNote} onChange={e => setIncidentNote(e.target.value)} placeholder="مثال: كسر بيشر 250 مل أثناء التسخين..." className="w-full bg-surface-container px-4 py-3 rounded-xl border border-outline-variant focus:border-error focus:ring-1 focus:ring-error outline-none transition-all resize-none" />
                </div>
                <div className="pt-4 flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-error text-on-error rounded-xl font-bold hover:bg-error/90 flex items-center justify-center gap-2 shadow-md shadow-error/20"><ShieldAlert size={20} /> تسجيل الإتلاف</button>
                  <button type="button" onClick={() => setIncidentModal({isOpen: false, benchNum: null})} className="px-6 py-3 bg-surface-container text-secondary rounded-xl font-bold hover:bg-outline-variant/30">إلغاء</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}