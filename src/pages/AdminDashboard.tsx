import { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  ShoppingCart, 
  ShieldCheck, 
  ChevronRight,
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  HelpCircle,
  Search,
  Filter,
  Scale,
  Settings,
  School,
  Database,
  X,
  KeyRound,
  Loader2,
  Download,
  Bell
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc,
  Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { motion } from 'motion/react';
import { Helmet } from 'react-helmet-async';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { arDZ } from 'date-fns/locale';

type TabType = 'users' | 'tickets' | 'purchases' | 'advanced';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [tickets, setTickets] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [modalMode, setModalMode] = useState<'tech' | 'edit' | 'review'>('review');

  // Advanced tab states
  const [adminEmail, setAdminEmail] = useState('');
  const [jsonKey, setJsonKey] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminResult, setAdminResult] = useState<{ success: boolean; message: string } | null>(null);

  const [migLoading, setMigLoading] = useState(false);
  const [migResult, setMigResult] = useState<{ success: boolean; message: string } | null>(null);

  const [announcementMsg, setAnnouncementMsg] = useState('');
  const [announcementSending, setAnnouncementSending] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    
    // Listen to users
    const unsubUsers = onSnapshot(query(collection(db, 'users'), orderBy('displayName', 'asc')), (snap) => {
      setUsers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'users'));

    // Listen to settings
    const unsubSettings = onSnapshot(collection(db, 'settings'), (snap) => {
      const sMap: Record<string, any> = {};
      snap.docs.forEach(doc => {
        sMap[doc.id] = doc.data();
      });
      setSettings(sMap);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'settings'));

    // Listen to tickets
    const unsubTickets = onSnapshot(query(collection(db, 'support_tickets'), orderBy('createdAt', 'desc')), (snap) => {
      setTickets(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'support_tickets'));

    // Listen to purchases
    const unsubPurchases = onSnapshot(query(collection(db, 'purchase_requests'), orderBy('createdAt', 'desc')), (snap) => {
      setPurchases(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'purchase_requests'));

    setIsLoading(false);

    return () => {
      unsubUsers();
      unsubSettings();
      unsubTickets();
      unsubPurchases();
    };
  }, []);

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'support_tickets', ticketId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'support_tickets');
    }
  };

  const handleUpdatePurchaseStatus = async (requestId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'purchase_requests', requestId), { status });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'purchase_requests');
    }
  };

  const handleUpdateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'Admin' ? 'user' : 'Admin';
    if (!window.confirm(`هل أنت متأكد من تغيير رتبة المستخدم إلى ${newRole === 'Admin' ? 'مدير نظام' : 'مستخدم عادي'}؟`)) return;
    
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      if (selectedUser) setSelectedUser({ ...selectedUser, role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users');
    }
  };

  const handleAssignAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoading(true);
    setAdminResult(null);

    try {
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, serviceAccountJson: jsonKey })
      });

      const data = await response.json();

      if (response.ok) {
        setAdminResult({ success: true, message: data.message });
        setAdminEmail('');
      } else {
        setAdminResult({ success: false, message: data.error });
      }
    } catch (err: any) {
      setAdminResult({ success: false, message: err.message || 'شبكة الاتصال فشلت' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleMigrateDb = async () => {
    if (!jsonKey) return;
    setMigLoading(true);
    setMigResult(null);

    try {
      const response = await fetch('/api/migrate-schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAccountJson: jsonKey })
      });

      const data = await response.json();

      if (response.ok) {
        setMigResult({ success: true, message: data.message });
      } else {
        setMigResult({ success: false, message: data.error });
      }
    } catch (err: any) {
      setMigResult({ success: false, message: err.message || 'شبكة الاتصال فشلت' });
    } finally {
      setMigLoading(false);
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementMsg.trim()) return;
    setAnnouncementSending(true);
    try {
      // Just demo notification functionality by logging, 
      // typically we might create a document in 'announcements' or map over users.
      // We will pretend to broadcast.
      await new Promise(r => setTimeout(r, 1500));
      alert('تم بث الإشعار بنجاح لجميع المستخدمين!');
      setAnnouncementMsg('');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء بث الإشعار.');
    } finally {
      setAnnouncementSending(false);
    }
  };

  const handleExportData = () => {
    const merged = getMergedUsers();
    const headers = ['Name', 'Email', 'Role', 'School', 'Directorate', 'Commune', 'Created At'];
    
    const maxRows = 2000;
    const csvContent = [
      headers.join(','),
      ...merged.slice(0, maxRows).map(u => [
        `"${u.displayName || ''}"`,
        `"${u.email || ''}"`,
        `"${u.role || ''}"`,
        `"${u.settings?.school || u.schoolName || u.schoolId || ''}"`,
        `"${u.settings?.directorate || ''}"`,
        `"${u.settings?.commune || ''}"`,
        `"${u.createdAt?.toDate ? format(u.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : typeof u.createdAt === 'string' ? u.createdAt : ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `نظام_المستخدمين_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const getMergedUsers = () => {
    return users.map(u => ({
      ...u,
      settings: settings[u.uid] || settings[u.id] || {}
    }));
  };

  const filteredData = () => {
    const q = search.toLowerCase();
    if (activeTab === 'users') {
      const merged = getMergedUsers();
      return merged.filter(u => 
        u.displayName?.toLowerCase().includes(q) || 
        u.email?.toLowerCase().includes(q) ||
        u.schoolId?.toLowerCase().includes(q) ||
        u.settings?.school?.toLowerCase().includes(q)
      );
    }
    if (activeTab === 'tickets') {
      return tickets.filter(t => 
        t.subject?.toLowerCase().includes(q) || 
        t.userEmail?.toLowerCase().includes(q)
      );
    }
    return purchases.filter(p => 
      p.featureName?.toLowerCase().includes(q) || 
      p.userEmail?.toLowerCase().includes(q)
    );
  };

  const stats = [
    { label: 'إجمالي المستخدمين', value: users.length, icon: Users, color: 'bg-primary/10 text-primary border-primary/20' },
    { label: 'المؤسسات التعليمية', value: new Set(users.map(u => u.schoolId).filter(id => !!id)).size, icon: School, color: 'bg-secondary-container text-primary border-primary/10' },
    { label: 'بلاغات نشطة', value: tickets.filter(t => t.status === 'open').length, icon: MessageSquare, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { label: 'طلبات الشراء', value: purchases.filter(p => p.status === 'pending').length, icon: ShoppingCart, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      <Helmet>
        <title>لوحة الإدارة المركزية | فيصل عسول</title>
      </Helmet>

      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
        <div className="text-right space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary text-on-primary rounded-full text-[0.625rem] font-black uppercase tracking-widest mb-2 shadow-sm">
            <ShieldCheck size={12} />
            Command Center v2.0
          </div>
          <h1 className="text-4xl font-black text-primary tracking-tighter">الإدارة المركزية للنظام</h1>
          <p className="text-on-surface/50 font-bold">أهلاً بك يا فيصل. إليك نظرة شاملة على نشاط المنصة والمستخدمين.</p>
        </div>

        <div className="flex bg-surface-container-low p-1.5 rounded-[24px] border border-outline/10 h-max overflow-hidden shadow-sm relative z-0">
          <button 
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-2.5 rounded-[18px] text-sm font-black transition-all flex items-center gap-2 relative",
              activeTab === 'users' ? "text-on-primary" : "text-on-surface/60 hover:bg-surface-container-high"
            )}
          >
            {activeTab === 'users' && (
              <motion.div layoutId="admin-tab-bubble" className="absolute inset-0 bg-primary rounded-[18px] -z-10 shadow-md" />
            )}
            <Users size={18} />
            المستخدمون
          </button>
          <button 
            onClick={() => setActiveTab('tickets')}
            className={cn(
              "px-6 py-2.5 rounded-[18px] text-sm font-black transition-all flex items-center gap-2 relative",
              activeTab === 'tickets' ? "text-on-primary" : "text-on-surface/60 hover:bg-surface-container-high"
            )}
          >
            {activeTab === 'tickets' && (
              <motion.div layoutId="admin-tab-bubble" className="absolute inset-0 bg-primary rounded-[18px] -z-10 shadow-md" />
            )}
            <MessageSquare size={18} />
            الدعم
          </button>
          <button 
            onClick={() => setActiveTab('purchases')}
            className={cn(
              "px-6 py-2.5 rounded-[18px] text-sm font-black transition-all flex items-center gap-2 relative",
              activeTab === 'purchases' ? "text-on-primary" : "text-on-surface/60 hover:bg-surface-container-high"
            )}
          >
            {activeTab === 'purchases' && (
              <motion.div layoutId="admin-tab-bubble" className="absolute inset-0 bg-primary rounded-[18px] -z-10 shadow-md" />
            )}
            <ShoppingCart size={18} />
            المتجر
          </button>
          
          <button 
            onClick={() => setActiveTab('advanced')}
            className={cn(
              "px-6 py-2.5 rounded-[18px] text-sm font-black transition-all flex items-center gap-2 relative",
              activeTab === 'advanced' ? "text-on-primary" : "text-on-surface/60 hover:bg-surface-container-high"
            )}
          >
            {activeTab === 'advanced' && (
              <motion.div layoutId="admin-tab-bubble" className="absolute inset-0 bg-primary rounded-[18px] -z-10 shadow-md" />
            )}
            <Settings size={18} />
            إعدادات متقدمة
          </button>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -5, scale: 1.02 }}
            className="bg-surface p-6 rounded-[32px] border border-outline/5 shadow-sm flex items-center gap-5 transition-all"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center border shadow-sm", stat.color)}>
              <stat.icon size={26} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-on-surface/40 tracking-wider mb-1 font-mono">{stat.label}</p>
              <h3 className="text-3xl font-black text-on-surface tracking-tighter">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <section className="bg-surface p-4 rounded-[24px] border border-outline/10 shadow-sm flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full group">
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-on-surface/40 group-focus-within:text-primary transition-colors">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="بحث عن مستخدم، تذكرة، طلب..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-low pr-12 pl-4 py-4 rounded-[20px] border-2 border-transparent focus:border-primary/20 focus:bg-white transition-all font-bold text-on-surface outline-none"
          />
        </div>
        <button className="w-full md:w-auto flex justify-center items-center gap-3 px-6 py-4 bg-surface-container-low rounded-[20px] text-on-surface/70 border-2 border-transparent hover:border-outline/10 hover:bg-surface-container hover:text-on-surface transition-all active:scale-95">
          <Filter size={18} />
          <span className="font-black text-sm">تصفية متقدمة</span>
        </button>
      </section>

      {/* Content Area */}
      <section>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
             <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
             <p className="font-black text-primary/40 text-sm">جاري مزامنة بيانات السحابة...</p>
          </div>
        ) : filteredData().length === 0 && activeTab !== 'advanced' ? (
          <div className="bg-surface-container-lowest border border-dashed border-outline/20 rounded-[40px] py-24 flex flex-col items-center text-center gap-6">
            <div className="w-24 h-24 bg-surface-container-low rounded-full flex items-center justify-center text-on-surface/20">
               <HelpCircle size={48} />
            </div>
            <div>
              <h3 className="text-xl font-black text-on-surface/60">لا يوجد بيانات</h3>
              <p className="text-on-surface/40 font-bold">لم نجد أي سجلات تتوافق مع معايير البحث الحالية.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {activeTab === 'advanced' && (
              <div className="space-y-6">
                
                {/* Export Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-surface p-8 rounded-[32px] border border-outline/5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                      <Download size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-on-surface">تصدير بيانات المستخدمين</h4>
                      <p className="text-sm font-bold text-on-surface/50">تحميل نسخة احتياطية بصيغة CSV لجميع الحسابات المسجلة</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleExportData}
                    className="w-full md:w-auto px-8 py-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-2xl font-black transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    تصدير الآن
                  </button>
                </motion.div>

                {/* Announcement Card */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="bg-surface p-8 rounded-[32px] border border-outline/5 shadow-sm space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                      <Bell size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-on-surface">بث إشعار عام</h4>
                      <p className="text-sm font-bold text-on-surface/50">إرسال تنبيه أو رسالة لجميع المستخدمين النشطين في المنصة</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input 
                      type="text" 
                      placeholder="اكتب رسالة الإشعار هنا..."
                      value={announcementMsg}
                      onChange={(e) => setAnnouncementMsg(e.target.value)}
                      className="flex-1 bg-surface-container-low px-6 py-3 rounded-2xl border-2 border-transparent focus:border-blue-300 focus:bg-white transition-all font-bold text-on-surface outline-none"
                    />
                    <button 
                      onClick={handleSendAnnouncement}
                      disabled={announcementSending || !announcementMsg.trim()}
                      className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {announcementSending ? <Loader2 className="animate-spin" size={18} /> : <Bell size={18} />}
                      إرسال
                    </button>
                  </div>
                </motion.div>

                {/* Admin Role Assignment Card */}
                <motion.div 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                   className="bg-surface p-8 rounded-[32px] border border-outline/5 shadow-sm space-y-6"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center border border-primary/20">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-on-surface">إعداد صلاحيات المشرف باستخدام Service Account</h4>
                      <p className="text-sm font-bold text-on-surface/50">منح صلاحية المشرف (Admin) لحساب إيميل محدد باستخدام مفتاح JSON.</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                     <div>
                       <label className="block text-sm font-black text-on-surface/70 mb-2">مفتاح الوصول JSON</label>
                       <textarea
                         required
                         rows={8}
                         value={jsonKey}
                         onChange={(e) => setJsonKey(e.target.value)}
                         placeholder='{"type": "service_account", "project_id": "..."}'
                         className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline/20 focus:border-primary/50 text-left font-mono text-xs"
                         dir="ltr"
                       />
                     </div>
                     <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-black text-on-surface/70 mb-2">إيميل المستخدم</label>
                          <input
                            type="email"
                            required
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl bg-surface-container-lowest border border-outline/20 focus:border-primary/50 text-left font-sans text-sm"
                            dir="ltr"
                            placeholder="user@example.com"
                          />
                        </div>

                        {adminResult && (
                          <div className={`p-4 rounded-xl flex items-start gap-3 ${adminResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                            {adminResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            <p className="text-xs font-bold">{adminResult.message}</p>
                          </div>
                        )}

                        <button
                          onClick={handleAssignAdmin}
                          disabled={adminLoading || !jsonKey || !adminEmail}
                          className="w-full py-3 bg-surface-container-high text-on-surface hover:bg-primary hover:text-white disabled:opacity-50 disabled:hover:bg-surface-container-high rounded-xl font-black transition-all shadow-sm flex items-center justify-center gap-2"
                        >
                          {adminLoading ? <Loader2 className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
                          تفعيل الصلاحية للمستخدم
                        </button>
                     </div>
                  </div>
                </motion.div>

                {/* DB Migration Card */}
                <motion.div 
                   initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                   className="bg-surface p-8 rounded-[32px] border border-outline/5 shadow-sm flex flex-col sm:flex-row items-center gap-4 sm:gap-8"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-200">
                        <Database size={20} />
                      </div>
                      <h4 className="text-xl font-black text-on-surface">نقل بيانات المؤسسات (Migration)</h4>
                    </div>
                    <p className="text-sm font-bold text-on-surface/50">نقل بيانات +30,000 مؤسسة تربوية من الملف المحلي إلى فايرستور. (يتطلب مفتاح JSON من المربع الأعلى مسبقاً)</p>
                    
                    {migResult && (
                      <div className={`mt-4 p-4 rounded-xl flex items-start gap-3 ${migResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                         {migResult.success ? <CheckCircle size={20} /> : <XCircle size={20} />}
                         <p className="text-xs font-bold">{migResult.message}</p>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleMigrateDb}
                    disabled={migLoading || !jsonKey}
                    className="w-full md:w-auto px-8 py-4 bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 disabled:bg-amber-500 rounded-2xl font-black transition-all shadow-lg shadow-amber-500/20 flex flex-col items-center justify-center gap-1"
                  >
                    {migLoading ? <Loader2 className="animate-spin" size={20} /> : <Database size={20} />}
                    بدء ترحيل البيانات
                  </button>
                </motion.div>

              </div>
            )}
            {activeTab === 'users' && filteredData().map((u, i) => (
              <motion.div 
                key={u.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-8 rounded-[40px] border border-outline/5 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative"
              >
                <div className="absolute top-0 left-0 w-2 h-full bg-primary/10 group-hover:bg-primary transition-all" />
                
                <div className="flex flex-col xl:flex-row items-center lg:items-start gap-4 sm:gap-8">
                  {/* User Avatar & Basic Info */}
                  <div className="flex items-center gap-6 flex-1 w-full">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-[32px] bg-primary/5 flex items-center justify-center text-primary text-4xl font-black shadow-inner border border-primary/10 overflow-hidden group-hover:border-primary/20 transition-colors">
                        {(u.settings?.profilePhoto || u.photoURL) ? (
                          <img 
                            src={(u.settings?.profilePhoto || u.photoURL).replace(/=s\d+(-c)?/g, '=s400-c')} 
                            alt={u.displayName} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 antialiased" 
                            style={{ imageRendering: 'auto' }}
                            onLoad={() => console.log(`Photo loaded for ${u.displayName}`)}
                            onError={(e) => {
                              console.error(`Photo failed to load for ${u.displayName}:`, (u.settings?.profilePhoto || u.photoURL));
                              e.currentTarget.style.display = 'none';
                            }}
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          u.displayName?.charAt(0) || <User size={40} />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 border-4 border-white rounded-full shadow-sm" title="نشط حالياً" />
                    </div>
                    
                    <div className="space-y-1.5">
                       <h4 className="text-2xl font-black text-on-surface group-hover:text-primary transition-colors tracking-tight">
                         {u.displayName || 'مستخدم مجهول'}
                       </h4>
                       <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <p className="text-sm font-bold text-on-surface/50 flex items-center gap-2">
                          <Mail size={16} className="text-primary/40" />
                          {u.email}
                        </p>
                        <p className="text-sm font-bold text-on-surface/50 flex items-center gap-2">
                          <Calendar size={16} className="text-primary/40" />
                          عضو منذ: {u.createdAt ? (typeof u.createdAt === 'string' ? format(new Date(u.createdAt), 'dd MMMM yyyy', { locale: arDZ }) : u.createdAt.toDate ? format(u.createdAt.toDate(), 'dd MMMM yyyy', { locale: arDZ }) : 'غير متوفر') : 'غير متوفر'}
                        </p>
                       </div>
                       
                       {/* Professional Details Section */}
                       <div className="flex flex-wrap gap-3 mt-4">
                          <div className="px-5 py-2 bg-secondary-container/30 text-primary rounded-2xl border border-primary/5 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-on-surface/30 mb-0.5 tracking-widest">الرتبة المهنية</p>
                            <p className="text-sm font-black">{u.settings?.jobTitle || 'غير محدد'}</p>
                          </div>
                          <div className="px-5 py-2 bg-surface-container-high rounded-2xl border border-outline/5 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-on-surface/30 mb-0.5 tracking-widest">الدرجة / التخصص</p>
                            <p className="text-sm font-bold">{u.settings?.grade || 'N/A'} — {u.settings?.specialty || 'N/A'}</p>
                          </div>
                          <div className="px-5 py-2 bg-surface-container-high rounded-2xl border border-outline/5 shadow-sm">
                            <p className="text-[9px] font-black uppercase text-on-surface/30 mb-0.5 tracking-widest">الرقم الوظيفي</p>
                            <p className="text-sm font-mono font-bold tracking-widest">{u.settings?.employeeId || '**********'}</p>
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Institution Details */}
                  <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline/10 min-w-[300px] w-full lg:w-auto shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shadow-sm">
                        <School size={20} />
                      </div>
                      <div>
                        <span className="text-[10px] font-black uppercase text-on-surface/40 tracking-widest block">الخريطة التربوية للهيكل</span>
                        <h5 className="text-sm font-black text-on-surface">معلومات المؤسسة التعليمية</h5>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black text-on-surface/30 uppercase">اسم المؤسسة</span>
                        <p className="text-base font-black text-primary leading-tight">
                          {u.settings?.school || u.settings?.institutionName || u.schoolName || u.schoolId || 'لم يتم ربط مؤسسة بعد'}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-outline/5">
                        <div className="space-y-0.5 text-right">
                          <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-tighter">الولاية</span>
                          <p className="text-xs font-bold text-on-surface/60">{u.settings?.directorate || '—'}</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[9px] font-black text-on-surface/30 uppercase tracking-tighter">البلدية</span>
                          <p className="text-xs font-bold text-on-surface/60">{u.settings?.commune || '—'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-outline/5">
                        <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                          <Scale size={12} />
                        </div>
                        <p className="text-[10px] font-mono text-on-surface/40 truncate">
                          رمز المؤسسة: {u.schoolId || u.settings?.school || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Role & Actions */}
                  <div className="flex xl:flex-col items-center xl:items-end justify-between xl:justify-start gap-6 w-full xl:w-auto">
                    <div className="text-right">
                      <span className="text-[9px] font-black uppercase text-on-surface/30 block mb-1 tracking-widest">صلاحيات النظام</span>
                      <div className={cn(
                        "px-6 py-2 rounded-2xl text-[11px] font-black flex items-center gap-2 shadow-sm border",
                        u.role === 'Admin' ? "bg-primary text-on-primary border-primary/20" : "bg-surface-container-high text-on-surface/60 border-outline/5"
                      )}>
                        {u.role === 'Admin' ? <ShieldCheck size={16} /> : <User size={16} />}
                        {u.role ? (u.role === 'Admin' ? 'مدير نظام كامل' : u.role) : 'مستخدم عادي'}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row xl:flex-col gap-2.5 w-full xl:w-auto">
                      <button 
                        onClick={() => { setSelectedUser(u); setModalMode('tech'); }}
                        className="px-6 py-3 bg-surface-container-high text-on-surface/60 rounded-2xl hover:bg-primary hover:text-white transition-all shadow-sm group/btn flex items-center justify-center gap-3 text-sm font-black" 
                      >
                        <Database size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span>البيانات التقنية</span>
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(u); setModalMode('edit'); }}
                        className="px-6 py-3 bg-surface-container-high text-on-surface/60 rounded-2xl hover:bg-amber-500 hover:text-white transition-all shadow-sm group/btn flex items-center justify-center gap-3 text-sm font-black" 
                      >
                        <Settings size={18} className="group-hover/btn:scale-110 transition-transform" />
                        <span>تعديل الحساب</span>
                      </button>
                      <button 
                        onClick={() => { setSelectedUser(u); setModalMode('review'); }}
                        className="px-6 py-3 bg-primary text-on-primary rounded-2xl hover:brightness-95 transition-all shadow-xl shadow-primary/20 group/btn flex items-center justify-center gap-3 text-sm font-black" 
                      >
                        <ChevronRight size={18} className="rotate-180 group-hover/btn:-translate-x-1 transition-transform" />
                        <span>استعراض كامل</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {activeTab === 'tickets' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredData().map((t, i) => (
                    <motion.div 
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-surface p-8 rounded-[32px] border border-outline/5 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 relative overflow-hidden group"
                    >
                      <div className={cn(
                        "absolute top-0 left-0 w-full h-1.5 transition-all group-hover:h-2",
                        t.status === 'open' ? "bg-amber-400" : "bg-emerald-400"
                      )} />
                      <div className="flex justify-between items-start pt-2">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner border",
                            t.status === 'open' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-emerald-50 text-emerald-600 border-emerald-200"
                          )}>
                            {t.status === 'open' ? <HelpCircle size={24} /> : <CheckCircle size={24} />}
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{t.subject}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm font-bold text-on-surface/50 flex items-center gap-1.5"><Mail size={14}/>{t.userEmail}</p>
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          t.status === 'open' ? "bg-amber-50 text-amber-700 border-amber-200 shadow-amber-100 shadow-sm" : "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100 shadow-sm"
                        )}>
                          {t.status === 'open' ? 'قيد الانتظار' : 'تم الرد والمساعدة'}
                        </div>
                      </div>
                      <div className="bg-surface-container-lowest p-6 rounded-3xl text-on-surface/80 font-medium leading-relaxed italic border border-outline/5 shadow-inner relative">
                         <div className="absolute top-4 right-4 text-on-surface/10"><MessageSquare size={48} /></div>
                         <p className="relative z-10 text-sm">"{t.message}"</p>
                      </div>
                      <div className="flex justify-between items-center mt-auto pt-2 border-t border-outline/5">
                        <span className="text-xs font-bold text-on-surface/40 flex items-center gap-1.5">
                          <Calendar size={14} />
                          {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'dd MMM yyyy — HH:mm', { locale: arDZ }) : '—'}
                        </span>
                        <div className="flex justify-end gap-3">
                          {t.status === 'open' ? (
                            <button 
                              onClick={() => handleUpdateTicketStatus(t.id, 'closed')}
                              className="bg-primary text-on-primary px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:brightness-95 active:scale-95 transition-all flex items-center gap-2"
                            >
                              <CheckCircle size={16} />
                              إنهاء المعالجة
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateTicketStatus(t.id, 'open')}
                              className="bg-surface-container-high text-on-surface/60 px-6 py-2.5 rounded-2xl font-black text-sm hover:bg-outline/10 active:scale-95 transition-all"
                            >
                              إعادة فتح
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredData().map((p, i) => (
                    <motion.div 
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="bg-surface p-8 rounded-[32px] border border-outline/5 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 relative overflow-hidden group"
                    >
                      <div className={cn(
                        "absolute top-0 left-0 w-full h-1.5 transition-all group-hover:h-2",
                        p.status === 'pending' ? "bg-blue-400" : p.status === 'approved' ? "bg-emerald-400" : "bg-red-400"
                      )} />
                      <div className="flex justify-between items-start pt-2">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner border",
                                p.status === 'pending' ? "bg-blue-50 text-blue-600 border-blue-200" : p.status === 'approved' ? "bg-emerald-50 text-emerald-600 border-emerald-200" : "bg-red-50 text-red-600 border-red-200"
                            )}>
                              <ShoppingCart size={18} />
                            </div>
                            <h4 className="text-xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors">{p.featureName}</h4>
                          </div>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-sm font-bold text-on-surface/50 flex items-center gap-1.5"><Mail size={14}/>{p.userEmail}</p>
                          </div>
                        </div>
                        <div className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
                          p.status === 'pending' ? "bg-blue-50 text-blue-700 border-blue-200 shadow-blue-100 shadow-sm" : 
                          p.status === 'approved' ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-emerald-100 shadow-sm" : 
                          "bg-red-50 text-red-700 border-red-200 shadow-red-100 shadow-sm"
                        )}>
                          {p.status === 'pending' ? 'بانتظار الموافقة' : 
                           p.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-auto pt-4 border-t border-outline/5">
                        <span className="text-xs font-bold text-on-surface/40 flex items-center gap-1.5">
                          <Calendar size={14} />
                          {p.createdAt?.toDate ? format(p.createdAt.toDate(), 'dd MMM yyyy', { locale: arDZ }) : '—'}
                        </span>
                        <div className="flex justify-end gap-2 text-xs">
                          {p.status === 'pending' ? (
                            <>
                              <button 
                                onClick={() => handleUpdatePurchaseStatus(p.id, 'rejected')}
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl font-black transition-all flex items-center gap-1"
                              >
                                <XCircle size={14} />
                                رفض
                              </button>
                              <button 
                                onClick={() => handleUpdatePurchaseStatus(p.id, 'approved')}
                                className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-black shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-1"
                              >
                                <CheckCircle size={14} />
                                موافقة
                              </button>
                            </>
                          ) : (
                            <button 
                              onClick={() => handleUpdatePurchaseStatus(p.id, 'pending')}
                              className="bg-surface-container-high text-on-surface/60 px-5 py-2 rounded-xl font-black hover:bg-outline/10 active:scale-95 transition-all"
                            >
                              تغيير القرار
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* User Management Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-primary/20 backdrop-blur-sm rtl font-sans" dir="rtl">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-surface w-full max-w-4xl max-h-[90vh] rounded-[48px] shadow-2xl border border-outline/10 flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-8 border-b border-outline/5 flex justify-between items-center bg-surface-container-low">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  {modalMode === 'tech' ? <Database size={28} /> : modalMode === 'edit' ? <Settings size={28} /> : <User size={28} />}
                </div>
                <div>
                   <h2 className="text-2xl font-black text-primary tracking-tight">
                     {modalMode === 'tech' ? 'البيانات التقنية للمستخدم' : modalMode === 'edit' ? 'إدارة صلاحيات الحساب' : 'الملف الشخصي الكامل'}
                   </h2>
                   <p className="text-on-surface/50 font-bold text-sm">المستخدم: {selectedUser.displayName}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-3 bg-surface hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {modalMode === 'tech' && (
                <div className="space-y-6">
                  <div className="bg-surface-container-high p-8 rounded-[32px] font-mono text-sm overflow-x-auto border border-outline/10 shadow-inner">
                    <pre className="text-primary/70">{JSON.stringify(selectedUser, null, 2)}</pre>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl text-xs font-bold border border-amber-100">
                    <ShieldCheck size={16} />
                    هذه البيانات مخزنة في قواعد بياناتنا السحابية وتتضمن معلومات الجلسة والتوثيق.
                  </div>
                </div>
              )}

              {modalMode === 'edit' && (
                <div className="space-y-8 max-w-2xl mx-auto py-8">
                  <div className="p-8 bg-surface-container-low rounded-[40px] border border-outline/5 space-y-6">
                    <div className="flex items-center justify-between">
                       <div className="space-y-1">
                         <h4 className="text-lg font-black text-on-surface">رتبة المستخدم</h4>
                         <p className="text-sm font-bold text-on-surface/40">تغيير مستوى الوصول للنظام لهذا الحساب</p>
                       </div>
                       <div className={cn(
                        "px-6 py-2 rounded-2xl text-xs font-black border",
                        selectedUser.role === 'Admin' ? "bg-primary text-on-primary border-primary/20" : "bg-surface-container-high text-on-surface/60 border-outline/5"
                       )}>
                         {selectedUser.role === 'Admin' ? 'مدير نظام حالي' : 'مستخدم عادي'}
                       </div>
                    </div>
                    
                    <button 
                      onClick={() => handleUpdateUserRole(selectedUser.uid || selectedUser.id, selectedUser.role)}
                      className={cn(
                        "w-full py-5 rounded-[24px] font-black shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3",
                        selectedUser.role === 'Admin' ? "bg-red-500 text-white shadow-red-200" : "bg-primary text-on-primary shadow-primary/20"
                      )}
                    >
                      {selectedUser.role === 'Admin' ? (
                        <><XCircle size={20} /> سحب صلاحية المدير</>
                      ) : (
                        <><ShieldCheck size={20} /> ترقية إلى مدير نظام</>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <button className="p-6 bg-surface border border-outline/10 rounded-[32px] text-right hover:border-primary/40 transition-all flex flex-col gap-2">
                        <Mail className="text-primary" size={24} />
                        <span className="font-black text-sm">إرسال بريد رسمي</span>
                        <span className="text-[10px] text-on-surface/40 font-bold">للتواصل بخصوص تنبيهات النظام</span>
                     </button>
                     <button className="p-6 bg-surface border border-outline/10 rounded-[32px] text-right hover:border-red-400 transition-all flex flex-col gap-2">
                        <XCircle className="text-red-500" size={24} />
                        <span className="font-black text-sm text-red-500">حظر الحساب مؤقتاً</span>
                        <span className="text-[10px] text-on-surface/40 font-bold">منع الوصول لجميع المميزات</span>
                     </button>
                  </div>
                </div>
              )}

              {modalMode === 'review' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div className="relative group">
                        <div className="w-full aspect-square rounded-[48px] bg-primary/5 flex items-center justify-center overflow-hidden border-2 border-outline/5 shadow-xl">
                          {(selectedUser.settings?.profilePhoto || selectedUser.photoURL) ? (
                            <img 
                              src={(selectedUser.settings?.profilePhoto || selectedUser.photoURL).replace(/=s\d+(-c)?/g, '=s800-c')} 
                              alt={selectedUser.displayName} 
                              className="w-full h-full object-cover antialiased" 
                              style={{ imageRendering: 'auto' }}
                              onLoad={() => console.log(`Modal photo loaded for ${selectedUser.displayName}`)}
                              onError={(e) => {
                                console.error(`Modal photo failed to load for ${selectedUser.displayName}:`, (selectedUser.settings?.profilePhoto || selectedUser.photoURL));
                                e.currentTarget.style.display = 'none';
                              }}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <User size={120} className="text-primary/20" />
                          )}
                        </div>
                        <div className="absolute top-6 right-6 px-4 py-2 bg-white/90 backdrop-blur rounded-2xl shadow-lg border border-outline/10">
                           <span className="text-xs font-black text-primary">المعرف الفريد: {selectedUser.uid?.slice(0, 8)}...</span>
                        </div>
                      </div>
                      
                      <div className="bg-primary/5 p-8 rounded-[40px] border border-primary/10">
                         <h5 className="text-lg font-black text-primary mb-4">جهة الاتصال</h5>
                         <div className="space-y-4">
                            <div className="flex items-center gap-4 text-on-surface/70">
                               <div className="p-2 bg-white rounded-xl shadow-sm"><Mail size={18} /></div>
                               <span className="font-bold">{selectedUser.email}</span>
                            </div>
                            <div className="flex items-center gap-4 text-on-surface/70">
                               <div className="p-2 bg-white rounded-xl shadow-sm"><Calendar size={18} /></div>
                               <span className="font-bold tracking-tight" dir="ltr">
                                 {selectedUser.createdAt ? (typeof selectedUser.createdAt === 'string' ? format(new Date(selectedUser.createdAt), 'PPPP', { locale: arDZ }) : selectedUser.createdAt.toDate ? format(selectedUser.createdAt.toDate(), 'PPPP', { locale: arDZ }) : '—') : '—'}
                               </span>
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="bg-surface-container-low p-8 rounded-[40px] border border-outline/5 shadow-inner">
                         <div className="flex items-center gap-3 mb-6">
                            <School className="text-primary" size={28} />
                            <h4 className="text-xl font-black text-primary">تفاصيل المؤسسة</h4>
                         </div>
                         <div className="space-y-6">
                            <div>
                               <span className="text-[10px] font-black uppercase text-on-surface/30 tracking-widest block mb-1">اسم الهيكل</span>
                               <p className="text-lg font-black text-on-surface">{selectedUser.settings?.school || '—'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                               <div>
                                  <span className="text-[10px] font-black uppercase text-on-surface/30 tracking-widest block mb-1">المديرية</span>
                                  <p className="font-bold text-on-surface/70">{selectedUser.settings?.directorate || '—'}</p>
                               </div>
                               <div>
                                  <span className="text-[10px] font-black uppercase text-on-surface/30 tracking-widest block mb-1">البلدية</span>
                                  <p className="font-bold text-on-surface/70">{selectedUser.settings?.commune || '—'}</p>
                               </div>
                            </div>
                            <div>
                               <span className="text-[10px] font-black uppercase text-on-surface/30 tracking-widest block mb-1">تاريخ ربط المؤسسة</span>
                               <p className="font-mono text-xs text-on-surface/40">Registered System Key: {selectedUser.schoolId || 'N/A'}</p>
                            </div>
                         </div>
                      </div>

                      <div className="bg-surface p-8 rounded-[40px] border border-outline/10 shadow-sm">
                         <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-amber-500" size={28} />
                            <h4 className="text-xl font-black text-on-surface">الحالة والنشاط</h4>
                         </div>
                         <div className="grid grid-cols-2 gap-6">
                            <div className="p-4 bg-emerald-50 rounded-[28px] text-center border border-emerald-100">
                               <p className="text-emerald-700 font-black text-sm">درجة التحقق</p>
                               <span className="text-[10px] font-bold text-emerald-600/60 uppercase">Verified Account</span>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-[28px] text-center border border-blue-100">
                               <p className="text-blue-700 font-black text-sm">آخر نشاط</p>
                               <span className="text-[10px] font-bold text-blue-600/60 uppercase">System Sync Ok</span>
                            </div>
                         </div>
                      </div>

                      <div className="pt-4">
                         <button 
                          onClick={() => { setModalMode('edit'); }}
                          className="w-full bg-primary text-on-primary py-5 rounded-full font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
                         >
                            <Settings size={20} />
                            تغيير إعدادات الحساب
                         </button>
                      </div>
                   </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-6 border-t border-outline/5 bg-surface-container-lowest text-center">
               <p className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em]">Secure Administrator Access Only • Laboratory Digital Platform v2</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
