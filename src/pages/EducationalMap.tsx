import React, { useState, useMemo, useEffect } from 'react';
import { Map, Users, BookOpen, Calendar, History, Plus, FileText, Sparkles, LayoutGrid, Filter, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ROUTES } from '../config/routes';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

const MIDDLE_SCHOOL_GROUPS = [
  { level: 'السنة الأولى متوسط', branch: '', groups: [1, 2, 3] },
  { level: 'السنة الثانية متوسط', branch: '', groups: [1, 2, 3] },
  { level: 'السنة الثالثة متوسط', branch: '', groups: [1, 2, 3] },
  { level: 'السنة الرابعة متوسط', branch: '', groups: [1, 2, 3] },
];

const HIGH_SCHOOL_GROUPS = [
  // 1st Year
  { level: 'السنة الأولى ثانوي', branch: 'جذع مشترك علوم وتكنولوجيا', groups: [1, 2, 3] },
  { level: 'السنة الأولى ثانوي', branch: 'جذع مشترك آداب', groups: [1, 2] },
  // 2nd Year
  { level: 'السنة الثانية ثانوي', branch: 'شعبة الرياضيات', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة العلوم التجريبية', groups: [1, 2] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة تقني رياضي (هندسة ميكانيكية)', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة تقني رياضي (هندسة كهربائية)', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة تقني رياضي (هندسة مدنية)', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة تقني رياضي (هندسة الطرائق)', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة آداب وفلسفة', groups: [1, 2] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة لغات أجنبية (إسبانية)', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة لغات أجنبية (ألمانية)', groups: [1] },
  { level: 'السنة الثانية ثانوي', branch: 'شعبة لغات أجنبية (إيطالية)', groups: [1] },
  // 3rd Year
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة الرياضيات', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة العلوم التجريبية', groups: [1, 2] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة تقني رياضي (هندسة ميكانيكية)', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة تقني رياضي (هندسة كهربائية)', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة تقني رياضي (هندسة مدنية)', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة تقني رياضي (هندسة الطرائق)', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة تسيير واقتصاد', groups: [1, 2] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة آداب وفلسفة', groups: [1, 2] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة لغات أجنبية (إسبانية)', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة لغات أجنبية (ألمانية)', groups: [1] },
  { level: 'السنة الثالثة ثانوي', branch: 'شعبة لغات أجنبية (إيطالية)', groups: [1] },
];

export default function EducationalMap() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cycle, setCycle] = useState<'متوسط' | 'ثانوي'>('ثانوي');
  const [filterLevel, setFilterLevel] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [groupsData, setGroupsData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'settings', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userCycle = data.cycle || 'ثانوي';
          setCycle(userCycle);
          
          // Load saved map data if it exists, otherwise use defaults
          if (data.educationalMap && Array.isArray(data.educationalMap) && data.educationalMap.length > 0) {
            setGroupsData(data.educationalMap);
          } else {
            setGroupsData(userCycle === 'متوسط' ? MIDDLE_SCHOOL_GROUPS : HIGH_SCHOOL_GROUPS);
          }
        } else {
          setGroupsData(HIGH_SCHOOL_GROUPS);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setGroupsData(HIGH_SCHOOL_GROUPS);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const stats = useMemo(() => {
    const totalGroups = groupsData.reduce((acc, item) => acc + item.groups.length, 0);
    return [
      { label: 'إجمالي الأفواج', value: totalGroups.toString(), icon: Users, color: 'bg-primary/10' },
      { label: 'مخابر مستغلة', value: '03', icon: Map, color: 'bg-primary/5' },
      { label: 'حصص أسبوعية', value: '142', icon: Calendar, color: 'bg-surface-container-low' },
      { label: 'معدل التغطية', value: '100%', icon: Sparkles, color: 'bg-secondary-container' },
    ];
  }, [groupsData]);

  const availableBranches = useMemo(() => {
    if (cycle === 'متوسط') return [];
    const branches = new Set<string>();
    groupsData.forEach(item => {
      if (!filterLevel || item.level === filterLevel) {
        if (item.branch) branches.add(item.branch);
      }
    });
    return Array.from(branches);
  }, [groupsData, cycle, filterLevel]);

  const filteredGroups = useMemo(() => {
    return groupsData.filter(item => {
      const matchLevel = !filterLevel || item.level === filterLevel;
      const matchBranch = !filterBranch || item.branch === filterBranch;
      return matchLevel && matchBranch;
    });
  }, [groupsData, filterLevel, filterBranch]);

  const toggleGroup = (level: string, branch: string, groupNum: number) => {
    setGroupsData(prev => prev.map(item => {
      if (item.level === level && item.branch === branch) {
        const exists = item.groups.includes(groupNum);
        if (exists) {
          return { ...item, groups: item.groups.filter(g => g !== groupNum) };
        } else {
          return { ...item, groups: [...item.groups, groupNum].sort((a, b) => a - b) };
        }
      }
      return item;
    }));
  };

  const [isSaving, setIsSaving] = useState(false);

  const saveMap = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      const { setDoc, doc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        educationalMap: groupsData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert('تم حفظ الخريطة التربوية بنجاح');
    } catch (error) {
      console.error('Error saving map:', error);
      alert('حدث خطأ أثناء حفظ الخريطة');
    } finally {
      setIsSaving(false);
    }
  };

  const getCleanLevel = (level: string) => {
    if (level === 'السنة الأولى ثانوي') return 'أولى ثانوي';
    if (level === 'السنة الثانية ثانوي') return 'ثانية ثانوي';
    if (level === 'السنة الثالثة ثانوي') return 'ثالثة ثانوي';
    return level;
  };

  const getCleanBranch = (branch: string) => {
    if (!branch) return '';
    return branch.replace('شعبة ', '').replace('(', '').replace(')', '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
          <div className="h-4 w-32 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto px-6 pb-24 rtl font-sans" dir="rtl">
      {/* Header */}
      <header className="relative flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-4">
        <div className="text-right space-y-3 relative z-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest mb-2">
            <Map size={14} />
            إدارة الخريطة التربوية
          </div>
          <h1 className="text-6xl font-black text-primary tracking-tighter font-serif">الخريطة التربوية</h1>
          <p className="text-on-surface/60 text-xl font-bold">توزيع الأفواج <span className="text-primary italic">والمستويات الدراسية</span> على المخابر وتعيين الأساتذة.</p>
        </div>
        
        <div className="flex items-center gap-4 relative z-10">
          <button 
            onClick={() => navigate(ROUTES.PEDAGOGICAL_DASHBOARD)}
            className="bg-surface text-primary border border-outline/10 px-8 py-4 rounded-[32px] font-black flex items-center gap-3 shadow-xl hover:bg-primary/5 transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
            العودة للفضاء البيداغوجي
          </button>
          <button className="bg-primary text-on-primary px-10 py-4 rounded-full font-black flex items-center gap-3 shadow-2xl shadow-primary/30 hover:bg-primary-container transition-all active:scale-95">
            <Plus size={24} />
            توزيع فوج جديد
          </button>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-8 rounded-[40px] border border-outline/5 transition-all group relative overflow-hidden shadow-xl",
              stat.color
            )}
          >
            <div className="absolute top-0 left-0 w-24 h-24 bg-surface/40 rounded-br-[80px] -ml-6 -mt-6 group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10 flex justify-between items-start mb-6">
              <div className="p-4 bg-surface rounded-2xl shadow-sm text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <stat.icon size={24} />
              </div>
            </div>
            <div className="relative z-10">
              <p className="text-xs text-on-surface/40 font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <span className="text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform inline-block text-primary">{stat.value}</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Educational Map Section (v7) */}
      <section className="v7s-section">
        <div className="v7s-title">
          <LayoutGrid size={24} />
          الخريطة التربوية — الأفواج التربوية
        </div>
        
        <div className="v7map-toolbar">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-on-surface/40" />
            <label className="text-xs font-bold text-on-surface/60">تصفية:</label>
          </div>
          
          <select 
            className="v7map-sel" 
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <option value="">كل المستويات</option>
            {cycle === 'متوسط' ? (
              <>
                <option value="السنة الأولى متوسط">السنة الأولى متوسط</option>
                <option value="السنة الثانية متوسط">السنة الثانية متوسط</option>
                <option value="السنة الثالثة متوسط">السنة الثالثة متوسط</option>
                <option value="السنة الرابعة متوسط">السنة الرابعة متوسط</option>
              </>
            ) : (
              <>
                <option value="السنة الأولى ثانوي">السنة الأولى ثانوي</option>
                <option value="السنة الثانية ثانوي">السنة الثانية ثانوي</option>
                <option value="السنة الثالثة ثانوي">السنة الثالثة ثانوي</option>
              </>
            )}
          </select>

          {cycle === 'ثانوي' && (
            <select 
              className="v7map-sel" 
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
            >
              <option value="">جميع الشعب</option>
              {availableBranches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          )}

          <button 
            className="v7s-save-btn px-4 py-2 text-xs disabled:opacity-50" 
            onClick={saveMap}
            disabled={isSaving}
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            حفظ الخريطة
          </button>
        </div>

        <div className="v7map-grid">
          {filteredGroups.map((item, idx) => (
            <div key={`${item.level}-${item.branch}`} className="v7map-card">
              <div className="mc-head">{getCleanLevel(item.level)}</div>
              {cycle === 'ثانوي' && <div className="mc-sub">{getCleanBranch(item.branch)}</div>}
              <div className="mc-groups">
                {item.groups.map(g => (
                  <button 
                    key={g}
                    className="mc-g active" 
                    title="انقر للحذف" 
                    onClick={() => toggleGroup(item.level, item.branch, g)}
                  >
                    {g.toString().padStart(2, '0')}
                  </button>
                ))}
                <button 
                  className="mc-add" 
                  onClick={() => toggleGroup(item.level, item.branch, (item.groups.length > 0 ? Math.max(...item.groups) + 1 : 1))}
                  title={`إضافة فوج ${(item.groups.length > 0 ? Math.max(...item.groups) + 1 : 1).toString().padStart(2, '0')}`}
                >
                  + فوج
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
