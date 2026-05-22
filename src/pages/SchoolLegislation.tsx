import React, { useState, useEffect, useMemo } from 'react';
import { useSchool } from '../context/SchoolContext';
import { db, getUserCollection } from '../firebase';
import { getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  Scale, FileText, Search, Plus, Trash2, ExternalLink, 
  Filter, FileArchive, X, BookOpen, UploadCloud, Calendar, 
  FileSignature, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';


export interface LegislationDoc {
  id: string;
  title: string;
  reference: string;
  date: string;
  category: 'law' | 'decree' | 'circular' | 'correspondence' | 'other';
  description: string;
  fileUrl?: string;
  fileName?: string;
  createdAt: any;
}

const CATEGORIES = [
  { id: 'all', label: 'الكل', icon: FileArchive },
  { id: 'law', label: 'قوانين', icon: Scale },
  { id: 'decree', label: 'مراسيم تنفيذية ورئاسية', icon: FileSignature },
  { id: 'circular', label: 'مناشير وقرارات', icon: FileText },
  { id: 'correspondence', label: 'مراسلات وتعليمات', icon: BookOpen },
  { id: 'other', label: 'أخرى', icon: Filter },
];

export default function SchoolLegislation() {
  const { schoolId } = useSchool();
  const [documents, setDocuments] = useState<LegislationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newDoc, setNewDoc] = useState<Partial<LegislationDoc>>({
    title: '',
    reference: '',
    date: '',
    category: 'circular',
    description: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const q = query(getUserCollection(schoolId, 'equipment'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const docsData = snap.docs.map(d => ({ id: d.id, ...d.data() } as LegislationDoc));
      setDocuments(docsData);
    } catch (error) {
      console.error('Error fetching legislation documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.title || !newDoc.category) {
      alert("الرجاء ملء الحقول الإلزامية");
      return;
    }

    setIsUploading(true);
    try {
      let fileUrl = '';
      let fileName = '';

      if (selectedFile) {
        const storage = getStorage();
        const cleanName = `legislation_${Date.now()}_${selectedFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const fileRef = ref(storage, `uploads/legislation/${cleanName}`);
        
        // Add a 30-second timeout for the upload to prevent infinite hanging
        const uploadTask = uploadBytes(fileRef, selectedFile);
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error("UPLOAD_TIMEOUT")), 30000)
        );
        
        try {
          await Promise.race([uploadTask, timeoutPromise]);
          fileUrl = await getDownloadURL(fileRef);
          fileName = selectedFile.name;
        } catch (uploadErr: any) {
          console.error("Upload error details:", uploadErr);
          if (uploadErr.message === "UPLOAD_TIMEOUT") {
            throw new Error("لم يكتمل الرفع (انتهت المهلة). يرجى التأكد من تفعيل Storage في console.firebase.google.com وتعيين القواعد (Rules) لتسمح بالرفع. يمكنك إضافة الوثيقة بدون ملف كحل مؤقت.");
          } else if (uploadErr.code === 'storage/unauthorized') {
            throw new Error("عذراً، لا تملك الصلاحية لرفع ملفات. يرجى مراجعة قواعد الحماية (Rules) لخدمة Storage في Firebase.");
          } else if (uploadErr.code === 'storage/project-not-found' || uploadErr.message?.includes('project')) {
            throw new Error("خدمة التخزين (Storage) غير مفعلة لهذا المشروع. يرجى تفعيلها من لوحة تحكم Firebase.");
          }
          throw uploadErr;
        }
      }

      await addDoc(getUserCollection(schoolId, 'equipment'), {
        title: newDoc.title,
        reference: newDoc.reference || '',
        date: newDoc.date || '',
        category: newDoc.category,
        description: newDoc.description || '',
        fileUrl,
        fileName,
        createdAt: serverTimestamp()
      });

      setShowAddModal(false);
      setNewDoc({ title: '', reference: '', date: '', category: 'circular', description: '' });
      setSelectedFile(null);
      fetchDocuments();
    } catch (error: any) {
      console.error("Error adding document:", error);
      alert(error.message || "حدث خطأ أثناء حفظ الوثيقة.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string, fileUrl?: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التشريع؟ لا يمكن التراجع عن هذه العملية.')) return;
    
    try {
      // Delete from Firestore
      await deleteDoc(doc(getUserCollection(schoolId, 'equipment'), docId));
      
      // Optionally delete from Storage if fileUrl exists
      if (fileUrl) {
        try {
          const storage = getStorage();
          const fileRef = ref(storage, fileUrl);
          
          // Delete operation wrapper with timeout
          const deletePromise = deleteObject(fileRef);
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error("DELETE_TIMEOUT")), 10000)
          );
          
          await Promise.race([deletePromise, timeoutPromise]);
        } catch (storageErr: any) {
          console.warn("Could not delete associated file from storage (this is non-blocking)", storageErr);
          // We don't throw here because the document record is already deleted from Firestore
        }
      }
      
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      console.error("Error deleting document:", error);
      alert("حدث خطأ أثناء الحذف.");
    }
  };

  // Filter Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory === 'all' || doc.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [documents, searchQuery, activeCategory]);


  const getCategoryLabel = (catId: string) => {
    return CATEGORIES.find(c => c.id === catId)?.label || 'غير محدد';
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      
      
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-primary mb-3 flex items-center gap-4">
            <Scale size={40} className="text-tertiary" />
            التشريع المدرسي
          </h1>
          <p className="text-lg text-secondary max-w-3xl">
            مكتبة رقمية شاملة تخزن كل ما يخص القوانين، المراسيم، المناشير، المراسلات والتعليمات المنظمة للحياة المدرسية والتسيير الإداري للمخابر.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-tertiary text-on-tertiary rounded-2xl font-bold hover:shadow-lg hover:shadow-tertiary/30 transition-all flex items-center gap-3 shrink-0"
        >
          <Plus size={24} />
          <span>إضافة تشريع أو منشور</span>
        </button>
      </header>

      {/* Filters and Search */}
      <div className="bg-surface rounded-3xl p-4 border border-outline-variant shadow-sm mb-6 flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${isActive ? 'bg-primary text-on-primary shadow-md' : 'bg-surface-container hover:bg-surface-container-highest text-secondary'}`}
              >
                <Icon size={18} />
                {cat.label}
              </button>
            )
          })}
        </div>
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
          <input 
            type="text" 
            placeholder="بحث في القوانين والمناشير..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high border-none px-12 py-3 rounded-full focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-20 flex flex-col items-center justify-center text-secondary">
          <div className="w-12 h-12 border-4 border-tertiary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="font-bold">جاري تحميل الأرشيف التشريعي...</p>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-surface-container-low rounded-3xl p-16 text-center border border-dashed border-outline-variant">
          <Scale size={64} className="mx-auto text-outline mb-4 opacity-50" />
          <h3 className="text-2xl font-bold text-secondary mb-2">لا توجد نصوص تشريعية مطابقة</h3>
          <p className="text-secondary max-w-md mx-auto">
            لم يتم العثور على أي مراسيم أو قوانين في هذا القسم. اضغط على الزر أعلاه لإضافة أول وثيقة أو قم بتغيير معايير البحث.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredDocuments.map((docItem, index) => (
              <motion.div 
                key={docItem.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                className="bg-surface rounded-3xl p-6 border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col h-full group relative"
              >
                <div className="absolute top-4 left-4 flex gap-2">
                  {docItem.fileUrl && (
                     <a href={docItem.fileUrl} target="_blank" rel="noreferrer" className="p-2 bg-secondary-container hover:bg-primary hover:text-on-primary text-secondary rounded-lg transition-colors" title="تحميل أو عرض المرفق">
                       <ExternalLink size={18} />
                     </a>
                  )}
                  <button onClick={() => handleDelete(docItem.id, docItem.fileUrl)} className="p-2 text-error/0 group-hover:text-error hover:bg-error/10 rounded-lg transition-all" title="حذف">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="mb-4 pr-2">
                   <div className="flex items-center gap-2 mb-3">
                     <span className="bg-tertiary/15 text-tertiary px-3 py-1 rounded-full text-xs font-black">
                       {getCategoryLabel(docItem.category)}
                     </span>
                     {docItem.date && (
                       <span className="text-xs text-outline font-medium flex items-center gap-1">
                         <Calendar size={12}/> {docItem.date}
                       </span>
                     )}
                   </div>
                   <h3 className="text-xl font-bold text-primary leading-tight mb-2 pl-12">{docItem.title}</h3>
                   {docItem.reference && (
                     <p className="text-sm font-mono text-secondary font-bold mb-3 border-r-2 border-tertiary pr-2">
                       المرجع: {docItem.reference}
                     </p>
                   )}
                </div>
                
                <p className="text-sm text-secondary/80 flex-1 leading-relaxed line-clamp-4">
                  {docItem.description || 'لا يوجد وصف للوثيقة.'}
                </p>

                {docItem.fileName && (
                  <div className="mt-6 pt-4 border-t border-outline-variant/30 flex items-center gap-2 text-xs text-outline font-medium truncate" dir="ltr">
                    <FileText size={14} className="shrink-0"/>
                    <span className="truncate">{docItem.fileName}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ADD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }} 
              className="bg-surface w-full max-w-2xl my-auto rounded-[32px] overflow-hidden shadow-2xl border border-outline-variant"
            >
              <div className="p-6 bg-surface-container-low border-b border-outline-variant/50 flex justify-between items-center">
                <h3 className="text-2xl font-bold text-primary flex items-center gap-2"><Scale /> إضافة وثيقة تشريعية</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-outline-variant/30 rounded-full text-secondary transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleAddDocument} className="p-6 md:p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-primary mb-2">عنوان النص التشريعي <span className="text-error">*</span></label>
                  <input 
                    required 
                    type="text" 
                    placeholder="مثال: المرسوم التنفيذي رقم 25-54..."
                    value={newDoc.title} 
                    onChange={e => setNewDoc({...newDoc, title: e.target.value})} 
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">طبيعة النص <span className="text-error">*</span></label>
                    <select 
                      required 
                      value={newDoc.category} 
                      onChange={e => setNewDoc({...newDoc, category: e.target.value as any})} 
                      className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                    >
                      <option value="law">قانون</option>
                      <option value="decree">مرسوم (رئاسي / تنفيذي)</option>
                      <option value="circular">منشور / قرار</option>
                      <option value="correspondence">مراسلة / تعليمة</option>
                      <option value="other">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary mb-2">الرقم المرجعي</label>
                    <input 
                      type="text" 
                      dir="ltr"
                      placeholder="مثال: رقم 25-54"
                      value={newDoc.reference} 
                      onChange={e => setNewDoc({...newDoc, reference: e.target.value})} 
                      className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-left" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-2">تاريخ الإصدار / النشر</label>
                  <input 
                    type="date" 
                    value={newDoc.date} 
                    onChange={e => setNewDoc({...newDoc, date: e.target.value})} 
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-2">خلاصة أو وصف للمحتوى</label>
                  <textarea 
                    rows={4}
                    placeholder="اكتب خلاصة موجزة للموضوع الذي يعالجه هذا النص..."
                    value={newDoc.description} 
                    onChange={e => setNewDoc({...newDoc, description: e.target.value})} 
                    className="w-full bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-primary mb-2">إرفاق الملف (نسخة PDF أو صورة)</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-outline-variant border-dashed rounded-2xl cursor-pointer bg-surface-container-low hover:bg-surface-container hover:border-tertiary transition-all group">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-secondary group-hover:text-tertiary">
                      <UploadCloud size={32} className="mb-2" />
                      <p className="text-sm font-bold">{selectedFile ? selectedFile.name : 'إضغط لإختيار ملف المرفق'}</p>
                      <p className="text-xs opacity-70 mt-1">PDF, JPG, PNG (اختياري)</p>
                    </div>
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                  </label>
                </div>

                <div className="pt-6 border-t border-outline-variant/50 flex gap-3">
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="flex-1 py-4 bg-tertiary text-on-tertiary rounded-xl font-bold hover:bg-tertiary/90 flex items-center justify-center gap-2 shadow-md shadow-tertiary/20 disabled:opacity-70"
                  >
                    {isUploading ? (
                      <div className="w-6 h-6 border-2 border-on-tertiary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <><Scale size={20} /> إضافة التشريع</>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowAddModal(false)} 
                    disabled={isUploading}
                    className="px-8 py-4 bg-surface-container text-secondary rounded-xl font-bold hover:bg-outline-variant/30 transition-colors"
                  >
                    إلغاء
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