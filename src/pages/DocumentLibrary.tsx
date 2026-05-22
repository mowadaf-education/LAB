import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  FileText, 
  BookOpen, 
  Scale, 
  ShieldAlert, 
  Search, 
  Plus, 
  Folder, 
  MoreVertical, 
  Download, 
  Trash2, 
  Calendar,
  Filter,
  FileUp,
  X,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, getUserCollection, handleFirestoreError, OperationType } from '../firebase';
import { onSnapshot, query, addDoc, serverTimestamp, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { cn } from '../lib/utils';


interface UserDoc {
  id: string;
  title: string;
  category: string;
  description: string;
  fileUrl?: string;
  fileName?: string;
  date: any;
}

const QUICK_LINKS = [
  { 
    title: 'التشريع المدرسي', 
    desc: 'القوانين، المراسيم، والمناشير الرسمية المنظمة للمخابر والتربية.', 
    path: '/school-legislation', 
    icon: Scale, 
    color: 'bg-primary/10 text-primary',
    accent: 'border-primary/20'
  },
  { 
    title: 'دليل السلامة', 
    desc: 'بروتوكولات الطوارئ، الإسعافات الأولية، وقواعد الأمن المخبري.', 
    path: '/safety-guide', 
    icon: ShieldAlert, 
    color: 'bg-error/10 text-error',
    accent: 'border-error/20'
  },
  { 
    title: 'المولد الذكي', 
    desc: 'إنشاء نماذج وتقارير رسمية (محاضر جرد، طلبات مواد) بضغطة زر.', 
    path: '/smart-forms', 
    icon: FileText, 
    color: 'bg-tertiary/10 text-tertiary',
    accent: 'border-tertiary/20'
  }
];

export default function DocumentLibrary() {
  const { schoolId } = useSchool();
  const navigate = useNavigate();
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<UserDoc>>({
    title: '',
    category: 'أخرى',
    description: '',
    fileUrl: '',
    fileName: ''
  });

  useEffect(() => {
    const q = query(getUserCollection(schoolId, 'user_documents'), orderBy('date', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        date: d.data().date?.toDate() || new Date()
      } as UserDoc));
      setUserDocs(items);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(getUserCollection(schoolId, 'user_documents'), {
        ...newDoc,
        date: serverTimestamp(),
      });
      setIsModalOpen(false);
      setNewDoc({ title: '', category: 'أخرى', description: '', fileUrl: '', fileName: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'user_documents');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) return;
    try {
      await deleteDoc(doc(getUserCollection(schoolId, 'user_documents'), id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'user_documents');
    }
  };

  const filteredDocs = userDocs.filter(d => 
    d.title.includes(searchTerm) || 
    d.description.includes(searchTerm) ||
    d.category.includes(searchTerm)
  );

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-32 rtl" dir="rtl">
      

      <header className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[24px] bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <BookOpen size={36} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tighter">المكتبة الرقمية</h1>
            <p className="text-secondary/70 text-lg font-bold">مركز إدارة ونشر الوثائق، القوانين، والدلائل التقنية.</p>
          </div>
        </div>
      </header>

      {/* Main Hub: Quick Links Bento */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {QUICK_LINKS.map((link, i) => {
          const Icon = link.icon;
          return (
            <motion.button
              key={link.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(link.path)}
              className={cn(
                "p-8 rounded-[40px] border-2 text-right group relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1",
                link.accent,
                "bg-surface"
              )}
            >
              <div className={cn("w-16 h-16 rounded-[24px] flex items-center justify-center mb-6 shadow-sm", link.color)}>
                <Icon size={32} />
              </div>
              <h3 className="text-2xl font-black text-primary mb-3">{link.title}</h3>
              <p className="text-sm font-bold text-secondary/70 leading-relaxed mb-6">{link.desc}</p>
              <div className="flex items-center gap-2 text-xs font-black text-primary group-hover:gap-4 transition-all">
                <span>استعراض القسم</span>
                <ChevronRight size={16} />
              </div>
              
              {/* Decorative circle */}
              <div className={cn("absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-10", link.color.split(' ')[0])} />
            </motion.button>
          )
        })}
      </section>

      {/* User Documents Section */}
      <section className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-primary flex items-center gap-3">
              <Folder className="text-primary/40" />
              أرشيف المستخدم
            </h2>
            <p className="text-secondary/60 font-bold">وثائقك الخاصة، أدلة الأجهزة المعربة، وقوائم التلاميذ.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary px-10 py-5 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 transition-all active:scale-95 shrink-0"
          >
            <Plus size={24} />
            إضافة وثيقة للأرشيف
          </button>
        </div>

        <div className="bg-surface rounded-[40px] border border-outline/10 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-outline/5 flex flex-col md:flex-row justify-between items-center gap-6 bg-surface-container-low/30">
            <div className="relative w-full max-w-md">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-secondary/40" size={20} />
              <input 
                type="text" 
                placeholder="بحث في أرشيف المستخدم..." 
                className="w-full bg-surface border border-outline/10 rounded-2xl pr-12 pl-4 py-4 font-bold text-sm focus:ring-2 focus:ring-primary/10 transition-all outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-outline/5">
            {filteredDocs.map((doc, i) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface p-8 group hover:bg-primary/5 transition-all flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:bg-primary/20 group-hover:text-primary transition-all">
                    <FileText size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDelete(doc.id)} className="p-2 text-error hover:bg-error/10 rounded-lg transition-all"><Trash2 size={18} /></button>
                    <button className="p-2 text-secondary hover:bg-surface-container-high rounded-lg transition-all"><MoreVertical size={18} /></button>
                  </div>
                </div>

                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-surface-container-high px-3 py-1 rounded-full text-secondary/60">
                      {doc.category}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-primary group-hover:text-primary-container transition-colors line-clamp-2">{doc.title}</h4>
                  <p className="text-sm font-bold text-secondary/60 leading-relaxed line-clamp-3">{doc.description || 'لا يوجد وصف متاح.'}</p>
                </div>

                <div className="mt-8 pt-6 border-t border-outline/5 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-xs font-bold text-secondary/40">
                    <Calendar size={14} />
                    <span>{doc.date.toLocaleDateString('ar-DZ')}</span>
                  </div>
                  {doc.fileUrl ? (
                    <a 
                      href={doc.fileUrl} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center gap-2 text-sm font-black text-primary hover:gap-3 transition-all"
                    >
                      <Download size={16} />
                      تحميل
                    </a>
                  ) : (
                    <span className="text-xs font-black text-secondary/30 italic">رابط فقط</span>
                  )}
                </div>
              </motion.div>
            ))}

            {filteredDocs.length === 0 && !loading && (
              <div className="col-span-full py-40 text-center text-secondary/30">
                <FileUp size={64} className="mx-auto mb-4 opacity-10" />
                <p className="text-xl font-black">أرشيفك فارغ حالياً.</p>
                <p className="text-sm font-bold mt-2">ابدأ برفع أول وثيقة لتنظيم مكتبتك الرقمية.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Add Modal */}
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
                <h3 className="text-2xl font-black text-primary flex items-center gap-3">
                  <FileUp className="text-tertiary" />
                  أرشفة وثيقة جديدة
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-surface-container-high rounded-full transition-all active:scale-90"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleAddDoc} className="p-10 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">عنوان الوثيقة</label>
                    <input required className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold mt-2" value={newDoc.title} onChange={e => setNewDoc({...newDoc, title: e.target.value})} placeholder="مثال: دليل استعمال المجهر الضوئي..." />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">التصنيف</label>
                      <select className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold mt-2 appearance-none" value={newDoc.category} onChange={e => setNewDoc({...newDoc, category: e.target.value})}>
                        <option value="دليل تقني">دليل تقني</option>
                        <option value="قائمة تلاميذ">قائمة تلاميذ</option>
                        <option value="بطاقة فنية">بطاقة فنية</option>
                        <option value="نموذج إداري">نموذج إداري</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">رابط الملف (اختياري)</label>
                      <input className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold mt-2 text-left" dir="ltr" value={newDoc.fileUrl} onChange={e => setNewDoc({...newDoc, fileUrl: e.target.value})} placeholder="https://..." />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-secondary/60 uppercase tracking-widest mr-2">وصف مختصر</label>
                    <textarea className="w-full bg-surface-container-low border border-outline/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold mt-2 min-h-[100px] resize-none" value={newDoc.description} onChange={e => setNewDoc({...newDoc, description: e.target.value})} placeholder="ماذا تحتوي هذه الوثيقة؟" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-primary text-on-primary py-6 rounded-full font-black shadow-2xl shadow-primary/20 hover:bg-primary-container transition-all active:scale-[0.98] flex items-center justify-center gap-3 mt-4">
                  <Check size={24} />
                  حفظ في الأرشيف
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Check({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
