import { Outlet, Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Beaker, 
  ShieldAlert, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  User,
  Menu,
  X,
  FileText,
  Archive,
  Users,
  Database,
  Trash2,
  Map,
  Monitor,
  Package,
  Folder,
  BookOpen,
  Sun,
  Moon,
  QrCode,
  Printer,
  Wallet,
  ShieldCheck,
  Scale,
  Calculator,
  Wrench,
  ChevronDown,
  Clock,
  Sparkles,
  Atom,
  Binary,
  MessageSquare,
  ExternalLink,
  Award,
} from 'lucide-react';
import { useState, useRef, useEffect, Suspense } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ErrorBoundary from './ErrorBoundary';
import { doc, getDoc, onSnapshot, query, where, setDoc } from 'firebase/firestore';
import { db, getUserCollection, checkIsAdmin } from '../firebase';
import GlobalSearch from './GlobalSearch';
import Breadcrumbs from './Breadcrumbs';
import NotificationCenter from './NotificationCenter';
import logo from '/ministry-logo.png';
import { ROUTES } from '../config/routes';

export default function Layout() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });

  useEffect(() => {
    const syncUserProfile = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          const updates: any = {};
          if (auth.currentUser.photoURL && (!userDoc.exists() || userDoc.data()?.photoURL !== auth.currentUser.photoURL)) {
            updates.photoURL = auth.currentUser.photoURL;
          }
          if (auth.currentUser.displayName && (!userDoc.exists() || userDoc.data()?.displayName !== auth.currentUser.displayName)) {
            updates.displayName = auth.currentUser.displayName;
          }

          if (Object.keys(updates).length > 0) {
            await setDoc(userDocRef, updates, { merge: true });
          }
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      }
    };
    syncUserProfile();
  }, [auth.currentUser]);

  useEffect(() => {
    if (auth.currentUser) {
      checkIsAdmin(auth.currentUser).then(setIsAdmin);
    }
  }, [auth.currentUser]);

  const navigationGroups = [
    {
      title: 'لوحة التحكم الرئيسية',
      icon: LayoutDashboard,
      items: [
        { name: 'لوحة القيادة', path: ROUTES.HOME, icon: LayoutDashboard },
        { name: 'لوحة الجرد الشاملة', path: ROUTES.INVENTORY_DASHBOARD, icon: Database },
        { name: 'اللوحة البيداغوجية', path: ROUTES.PEDAGOGICAL_DASHBOARD, icon: BookOpen },
        ...(isAdmin ? [{ name: 'لوحة الإدارة المركزية', path: ROUTES.ADMIN, icon: ShieldCheck }] : []),
      ]
    },
    {
      title: 'الجرد والمخزون',
      icon: Package,
      items: [
        { name: 'الكواشف الكيميائية', path: ROUTES.CHEMICALS, icon: FlaskConical },
        { name: 'التجهيزات المخبرية', path: ROUTES.EQUIPMENT, icon: Beaker },
        { name: 'سجل بطاقات الجرد', path: ROUTES.INVENTORY_CARDS, icon: FileText },
        { name: 'مصفوفة التوافق', path: ROUTES.CHEMICAL_STORAGE, icon: ShieldCheck },
        { name: 'مركز الطباعة (QR)', path: ROUTES.QR_PRINT_CENTER, icon: Printer },
        { name: 'الصيانة والمعايرة', path: ROUTES.MAINTENANCE, icon: Wrench },
        { name: 'الحاسبة المخبرية', path: ROUTES.CALCULATORS, icon: Calculator },
      ]
    },
    {
      title: 'المتابعة البيداغوجية',
      icon: BookOpen,
      items: [
        { name: 'مساعد مخبري (AI)', path: ROUTES.LAB_ASSISTANT, icon: Sparkles },
        { name: 'المكتبة الرقمية', path: ROUTES.DOCUMENT_LIBRARY, icon: Folder },
        { name: 'جدول استعمال المخابر', path: ROUTES.LAB_SCHEDULE, icon: Clock },
        { name: 'سجل التجارب المخبرية', path: ROUTES.LAB_EXPERIMENTS, icon: FlaskConical },
        { name: 'المولد الذكي للنماذج', path: ROUTES.SMART_FORMS, icon: FileText },
        { name: 'تسيير الأفواج', path: ROUTES.STUDENT_GROUPS, icon: Users },
        { name: 'الأرشيف الرقمي', path: ROUTES.ARCHIVE, icon: Archive },
        { name: 'التشريع المدرسي', path: ROUTES.SCHOOL_LEGISLATION, icon: Scale },
      ]
    },
    {
      title: 'الأمن والسلامة',
      icon: ShieldAlert,
      items: [
        { name: 'الأمن والسلامة', path: ROUTES.SAFETY, icon: ShieldAlert },
        { name: 'إدارة النفايات الكيميائية', path: ROUTES.CHEMICAL_WASTE, icon: Trash2 },
        { name: 'دليل السلامة', path: ROUTES.SAFETY_GUIDE, icon: ShieldAlert },
      ]
    },
    {
      title: 'الموارد العلمية',
      icon: Atom,
      items: [
        { name: 'الجدول الدوري', path: ROUTES.PERIODIC_TABLE, icon: Atom },
        { name: 'أدوات الكيمياء', path: ROUTES.CHEMISTRY_TOOLS, icon: Binary },
        { name: 'الخريطة التربوية', path: ROUTES.EDUCATIONAL_MAP, icon: Map },
      ]
    },
    {
      title: 'الإدارة والإعدادات',
      icon: Settings,
      items: [
        { name: 'الإعدادات الشخصية', path: ROUTES.SETTINGS, icon: Settings },
        { name: 'مركز النسخ والبيانات', path: ROUTES.BACKUP_CENTER, icon: Database },
        { name: 'الميزانية والطلبيات', path: ROUTES.BUDGET_PURCHASES, icon: Wallet },
        { name: 'الإمتحانات المهنية', path: ROUTES.PROFESSIONAL_EXAMS, icon: Award },
        { name: 'فضاء الموظف', path: 'https://mowadaf.education.dz/', icon: ExternalLink, external: true },
        { name: 'الدعم والاقتراحات', path: ROUTES.SUPPORT, icon: MessageSquare },
      ]
    },
  ];
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['لوحة التحكم الرئيسية', 'الجرد والمخزون']);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const [userRole, setUserRole] = useState<string | null>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => signOut(auth);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (auth.currentUser) {
        try {
          // Fetch both user record and settings
          const [userDoc, settingsDoc] = await Promise.all([
            getDoc(doc(db, 'users', auth.currentUser.uid)),
            getDoc(doc(db, 'settings', auth.currentUser.uid))
          ]);

          let role = 'مساعد مخبري';
          
          if (settingsDoc.exists()) {
            const settingsData = settingsDoc.data();
            const job = settingsData.soilType || settingsData.jobTitle || settingsData.grade || role;
            const cycle = settingsData.cycle ? ` — ${settingsData.cycle}` : '';
            role = `${job}${cycle}`;
          } else if (userDoc.exists()) {
            role = userDoc.data().role || role;
          }
          
          setUserRole(role);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('the client is offline')) {
            console.warn('Firestore is offline. Using default role.');
          } else {
            console.error('Error fetching role:', error);
          }
          setUserRole('مساعد مخبري');
        }
      } else {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, [auth.currentUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-surface flex rtl text-right" dir="rtl">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* SideNavBar */}
      <aside className={cn(
        "fixed right-0 top-0 h-full z-40 flex flex-col bg-surface-container-low transition-all duration-300 no-print",
        isSidebarOpen ? "translate-x-0 w-72" : "translate-x-full lg:translate-x-0 lg:w-20"
      )}>
        <div className="p-6 flex flex-col items-center gap-2">
          <img 
            className={cn("object-contain transition-all", isSidebarOpen ? "w-16 h-16" : "w-10 h-10")}
            src={logo}
            alt="Logo" 
          />
          {isSidebarOpen && (
            <div className="text-center mt-2">
              <h1 className="text-lg font-bold text-primary">الأرضية الرقمية — فضاء موظفوا المخابر</h1>
              <p className="text-[10px] text-secondary font-medium leading-tight">وزارة التربية الوطنية</p>
            </div>
          )}
        </div>

        <nav role="navigation" aria-label="القائمة الرئيسية" className="flex-1 px-4 py-6 space-y-4 overflow-y-auto no-scrollbar">
          {navigationGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.title);
            const toggleGroup = () => {
              if (!isSidebarOpen) {
                setIsSidebarOpen(true);
                setExpandedGroups([group.title]);
                return;
              }
              setExpandedGroups(prev => 
                prev.includes(group.title) 
                  ? prev.filter(t => t !== group.title)
                  : [...prev, group.title]
              );
            };

            const GroupIcon = group.icon;

            return (
              <div key={group.title} className="space-y-1">
                {isSidebarOpen ? (
                  <>
                    <button
                      onClick={toggleGroup}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-2 rounded-xl transition-all duration-200 group/title",
                        isExpanded ? "text-primary bg-primary/5" : "text-secondary hover:bg-secondary-container/30"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <GroupIcon size={20} className={cn(isExpanded && "text-primary")} />
                        <span className="text-sm font-bold">{group.title}</span>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown size={16} className="text-secondary/50 group-hover/title:text-primary" />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden pr-4 flex flex-col gap-1 mt-1"
                        >
                          {group.items.map((item) => {
                            const isActive = !item.external && location.pathname === item.path;
                            const ItemIcon = item.icon;
                            
                            const linkClasses = cn(
                              "flex items-center gap-3 px-4 py-2 rounded-full transition-all duration-200 group/item",
                              isActive 
                                ? "bg-secondary-container text-primary font-bold shadow-sm" 
                                : "text-secondary/80 hover:bg-secondary-container/20 hover:text-primary"
                            );

                            if (item.external) {
                              return (
                                <a
                                  key={item.path}
                                  href={item.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={linkClasses}
                                >
                                  <ItemIcon size={18} />
                                  <span className="text-[13px]">{item.name}</span>
                                </a>
                              );
                            }

                            return (
                              <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsSidebarOpen(false)}
                                className={linkClasses}
                              >
                                <ItemIcon size={18} className={cn(isActive && "text-primary")} />
                                <span className="text-[13px]">{item.name}</span>
                              </Link>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <div className="flex flex-col items-center py-2">
                    <button
                      onClick={() => {
                        if (!isSidebarOpen) {
                          setIsSidebarOpen(true);
                          setExpandedGroups([group.title]);
                        }
                      }}
                      title={group.title}
                      className={cn(
                        "p-3 rounded-xl transition-all duration-200 hover:scale-110",
                        expandedGroups.includes(group.title)
                          ? "bg-primary text-on-primary shadow-lg" 
                          : "text-secondary bg-surface hover:bg-secondary-container/30 shadow-sm"
                      )}
                    >
                      <GroupIcon size={24} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 text-error py-3 px-4 hover:bg-error/10 transition-all rounded-full"
          >
            <LogOut size={22} />
            {isSidebarOpen && <span className="font-medium text-sm">تسجيل الخروج</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300 print:mr-0 min-w-0 w-full",
        isSidebarOpen ? "lg:mr-72" : "lg:mr-20"
      )}>
        {/* TopAppBar */}
        <header className="h-16 bg-surface/80 backdrop-blur-md sticky top-0 z-20 flex justify-between items-center px-4 md:px-8 no-print">
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-secondary-container/50 rounded-full text-primary"
            >
              <Menu size={20} className={cn("transition-transform", isSidebarOpen ? "hidden lg:block" : "")} />
              <X size={20} className={cn("transition-transform", !isSidebarOpen ? "hidden lg:hidden" : "lg:hidden")} />
            </button>
            <h2 className="text-base md:text-lg font-bold text-primary truncate max-w-[150px] sm:max-w-none">نظام تسيير المخابر</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-6">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-secondary-container/50 rounded-full text-primary transition-all hidden sm:block"
              title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={() => setIsQRScannerOpen(true)}
              className="p-2 hover:bg-secondary-container/50 rounded-full text-primary transition-all"
              title="مسح رمز QR"
            >
              <QrCode size={20} />
            </button>
            <div className="relative hidden md:block">
              <button 
                onClick={() => setIsSearchOpen(true)}
                className="bg-surface-container-high border-none rounded-full py-2 pr-10 pl-4 w-64 text-sm text-right text-outline/60 hover:bg-surface-container-highest transition-all flex items-center justify-between"
              >
                <span>بحث سريع...</span>
                <span className="text-[10px] bg-surface-container-low px-1.5 py-0.5 rounded border border-outline/10">⌘K</span>
              </button>
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary" size={18} />
            </div>
            <div className="flex items-center gap-3 relative" ref={profileMenuRef}>
              <NotificationCenter />
              <button 
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/10 hover:border-primary/30 transition-all active:scale-95 ml-2"
              >
                <img 
                  className="w-full h-full object-cover antialiased" 
                  src={(auth.currentUser?.photoURL || "https://picsum.photos/seed/user/100/100").replace(/=s\d+(-c)?/g, '=s400-c')} 
                  alt="Profile" 
                  style={{ imageRendering: 'auto' }}
                  referrerPolicy="no-referrer"
                />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 top-full mt-2 w-56 bg-surface-container-highest rounded-2xl shadow-xl border border-outline-variant p-2 z-50"
                  >
                    <div className="px-4 py-3 border-b border-outline-variant/50 mb-2">
                      <p className="text-sm font-bold text-primary truncate">{auth.currentUser?.displayName || 'مستخدم'}</p>
                      <p className="text-[10px] text-secondary truncate mb-2">{auth.currentUser?.email || auth.currentUser?.phoneNumber}</p>
                      {userRole && (
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[10px] font-black border border-primary/5 shadow-sm">
                            {userRole}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Link 
                      to={ROUTES.SETTINGS} 
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-secondary hover:bg-primary/5 rounded-xl transition-colors"
                    >
                      <Settings size={18} />
                      <span>الإعدادات</span>
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-error hover:bg-error/5 rounded-xl transition-colors mt-1"
                    >
                      <LogOut size={18} />
                      <span>تسجيل الخروج</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main role="main" aria-label="المحتوى الرئيسي" className="p-4 md:p-8 print:p-0 overflow-x-hidden">
          <Breadcrumbs />
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex justify-center items-center h-64 w-full">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                  <p className="text-secondary font-bold animate-pulse text-sm">جاري التحميل...</p>
                </div>
              </div>
            }>
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* QR Scanner Modal Placeholder */}
      <AnimatePresence>
        {isQRScannerOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQRScannerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-surface w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl border border-outline/10"
            >
              <div className="p-6 flex justify-between items-center border-b border-outline/5">
                <h3 className="text-xl font-black text-primary flex items-center gap-2">
                  <QrCode size={24} />
                  ماسح الرموز
                </h3>
                <button onClick={() => setIsQRScannerOpen(false)} className="p-2 hover:bg-surface-container-high rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-8 flex flex-col items-center gap-6">
                <div className="w-64 h-64 bg-black rounded-3xl relative overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-4 border-2 border-primary/50 rounded-2xl animate-pulse"></div>
                  <div className="w-full h-0.5 bg-primary absolute top-1/2 -translate-y-1/2 animate-scan shadow-[0_0_15px_rgba(var(--color-primary),0.5)]"></div>
                  <p className="text-white/50 text-[10px] font-bold">جاري البحث عن رمز QR...</p>
                </div>
                <p className="text-center text-sm text-secondary font-medium">
                  وجه الكاميرا نحو رمز الاستجابة السريعة (QR Code) الملصق على الجهاز أو المادة الكيميائية
                </p>
                <button className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold hover:shadow-lg transition-all">
                  تشغيل الكاميرا
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
