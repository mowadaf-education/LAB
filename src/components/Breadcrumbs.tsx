import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, Home } from 'lucide-react';

const routeMap: Record<string, string> = {
  'admin': 'إدارة النظام',
  'support': 'الدعم والمساعدة',
  'document-library': 'المكتبة الوثائقية',
  'inventory': 'إدارة المخزون',
  'pedagogical': 'المتابعة البيداغوجية',
  'safety-hub': 'فضاء الأمن والسلامة',
  'scientific-hub': 'الفضاء العلمي',
  'settings-hub': 'الإدارة والإعدادات',
  'important-links': 'موارد وروابط هامة',
  'maintenance': 'الصيانة',
  'chemicals': 'المواد الكيميائية',
  'equipment': 'العتاد والمعدات',
  'inventory-cards': 'سجل بطاقات الجرد',
  'tech-inventory': 'الجرد التقني',
  'glassware-breakage': 'كسر الزجاجيات',
  'smart-forms': 'النماذج الذكية',
  'chemical-waste': 'النفايات الكيميائية',
  'chemical-storage': 'مصفوفة التوافق',
  'school-legislation': 'التشريع المدرسي',
  'safety-guide': 'دليل السلامة',
  'calculators': 'الحاسبة المخبرية',
  'educational-map': 'الخريطة التربوية',
  'consumables-sds': 'بطاقات الأمان',
  'backup': 'مركز النسخ الاحتياطي',
  'backup-center': 'مركز النسخ والبيانات',
  'budget-purchases': 'الميزانية والطلبيات',
  'database-management': 'تسيير قاعدة البيانات',
  'qr-print-center': 'مركز الطباعة',
  'student-groups': 'تسيير الأفواج',
  'timetable': 'جدول التوقيت',
  'lab-schedule': 'جدول حجز المخابر',
  'lab-experiments': 'التجارب المخبرية',
  'lab-assistant': 'فضاء المخبري',
  'pedagogical-tracking': 'المتابعة البيداغوجية المستمرة',
  'follow-up-registry': 'سجل المتابعة',
  'sync': 'مزامنة البيانات',
  'activity-request': 'طلب نشاط',
  'loan-request': 'طلب إعارة',
  'scrapping': 'إسقاط معدات',
  'safety': 'الأمن والسلامة',
  'reports': 'التقارير والاستخراج',
  'archive': 'الأرشيف الرقمي',
  'teachers': 'قائمة الأساتذة',
  'daily-report': 'التقرير اليومي',
  'professional-exams': 'الإمتحانات المهنية',
  'settings': 'الإعدادات',
  'design-system': 'نظام التصميم',
  'diagnostic': 'أداة التشخيص',
  'periodic-table': 'الجدول الدوري',
  'chemistry-tools': 'أدوات الكيمياء'
};

const parentMap: Record<string, string> = {
  // Inventory Hub
  'chemicals': 'inventory',
  'inventory-cards': 'inventory',
  'equipment': 'inventory',
  'chemical-storage': 'inventory',
  'tech-inventory': 'inventory',
  'consumables-sds': 'inventory',
  'glassware-breakage': 'inventory',
  'maintenance': 'inventory',
  'scrapping': 'inventory',
  'loan-request': 'inventory',
  'qr-print-center': 'inventory',

  // Pedagogical Hub
  'daily-report': 'pedagogical',
  'teachers': 'pedagogical',
  'timetable': 'pedagogical',
  'lab-schedule': 'pedagogical',
  'pedagogical-tracking': 'pedagogical',
  'follow-up-registry': 'pedagogical',
  'student-groups': 'pedagogical',
  'smart-forms': 'pedagogical',
  'activity-request': 'pedagogical',
  'sync': 'pedagogical',
  'calculators': 'pedagogical',
  'lab-experiments': 'pedagogical',
  'lab-assistant': 'pedagogical',
  
  // Safety Hub
  'safety': 'safety-hub',
  'chemical-waste': 'safety-hub',
  'safety-guide': 'safety-hub',

  // Scientific Hub
  'periodic-table': 'scientific-hub',
  'chemistry-tools': 'scientific-hub',
  'educational-map': 'scientific-hub',

  // Settings / Management Hub
  'settings': 'settings-hub',
  'backup-center': 'settings-hub',
  'budget-purchases': 'settings-hub',
  'professional-exams': 'settings-hub',
  'important-links': 'settings-hub',
  'support': 'settings-hub',
  'document-library': 'settings-hub',
  'archive': 'settings-hub',
  'database-management': 'settings-hub',
  'school-legislation': 'settings-hub',
  
  // Standalone
  'reports': '',
  'admin': ''
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter((x) => x);
  
  if (pathParts.length === 0) return null;
  
  const currentPath = pathParts[pathParts.length - 1];
  
  // Build the logical path array based on parentMap
  const logicalPaths: string[] = [];
  let currentKey: string | undefined = currentPath;
  
  while (currentKey) {
    logicalPaths.unshift(currentKey);
    currentKey = parentMap[currentKey];
  }

  return (
    <nav className="flex mb-6 no-print rtl" dir="rtl" aria-label="Breadcrumb">
      <ol className="flex items-center flex-wrap gap-2">
        <li className="flex items-center">
          <Link 
            to="/" 
            className="text-secondary hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <Home size={14} />
            <span>الرئيسية</span>
          </Link>
        </li>
        
        {logicalPaths.map((name, index) => {
          const routeTo = `/${name}`;
          const isLast = index === logicalPaths.length - 1;
          const displayName = routeMap[name] || name;

          return (
            <li key={name} className="flex items-center">
              <ChevronLeft size={14} className="text-outline/30 mx-1 flex-shrink-0" />
              {isLast ? (
                <span className="text-primary font-black text-xs">
                  {displayName}
                </span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-secondary hover:text-primary transition-colors text-xs font-bold"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
