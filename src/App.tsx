/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { HelmetProvider } from 'react-helmet-async';
import { auth, testFirestoreConnection } from './firebase';

import { ROUTES } from './config/routes';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import FirebaseSetup from './components/FirebaseSetup';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import OfflineBanner from './components/OfflineBanner';

// Lazy-loaded pages
const DocumentLibrary = React.lazy(() => import('./pages/DocumentLibrary'));
const Chemicals = React.lazy(() => import('./pages/Chemicals'));
const Equipment = React.lazy(() => import('./pages/Equipment'));
const Safety = React.lazy(() => import('./pages/Safety'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Archive = React.lazy(() => import('./pages/Archive'));
const Teachers = React.lazy(() => import('./pages/Teachers'));
const DailyReport = React.lazy(() => import('./pages/DailyReport'));
const Settings = React.lazy(() => import('./pages/Settings'));
const InventoryDashboard = React.lazy(() => import('./pages/InventoryDashboard'));
const Maintenance = React.lazy(() => import('./pages/Maintenance'));
const PedagogicalDashboard = React.lazy(() => import('./pages/PedagogicalDashboard'));
const SafetyDashboard = React.lazy(() => import('./pages/SafetyDashboard'));
const ScientificDashboard = React.lazy(() => import('./pages/ScientificDashboard'));
const ManagementDashboard = React.lazy(() => import('./pages/ManagementDashboard'));
const ImportantLinks = React.lazy(() => import('./pages/ImportantLinks'));
const ProfessionalExams = React.lazy(() => import('./pages/ProfessionalExams'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const DataDeletion = React.lazy(() => import('./pages/DataDeletion'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const TechInventory = React.lazy(() => import('./pages/TechInventory'));
const GlasswareBreakage = React.lazy(() => import('./pages/GlasswareBreakage'));
const SmartForms = React.lazy(() => import('./pages/SmartForms'));
const ChemicalWaste = React.lazy(() => import('./pages/ChemicalWaste'));
const EducationalMap = React.lazy(() => import('./pages/EducationalMap'));
const ConsumablesSDS = React.lazy(() => import('./pages/ConsumablesSDS'));
const BackupCenter = React.lazy(() => import('./pages/BackupCenter'));
const DatabaseManagement = React.lazy(() => import('./pages/DatabaseManagement'));
const Timetable = React.lazy(() => import('./pages/Timetable'));
const LabSchedule = React.lazy(() => import('./pages/LabSchedule'));
const LabExperiments = React.lazy(() => import('./pages/LabExperiments'));
const LabAssistant = React.lazy(() => import('./pages/LabAssistant'));
const PedagogicalTracking = React.lazy(() => import('./pages/PedagogicalTracking'));
const FollowUpRegistry = React.lazy(() => import('./pages/FollowUpRegistry'));
const Sync = React.lazy(() => import('./pages/Sync'));
const ActivityRequest = React.lazy(() => import('./pages/ActivityRequest'));
const LoanRequest = React.lazy(() => import('./pages/LoanRequest'));
const EquipmentScrapping = React.lazy(() => import('./pages/EquipmentScrapping'));
const InventoryCardsRegistry = React.lazy(() => import('./pages/InventoryCardsRegistry'));
const QRPrintCenter = React.lazy(() => import('./pages/QRPrintCenter'));
const StudentGroups = React.lazy(() => import('./pages/StudentGroups'));
const BudgetPurchases = React.lazy(() => import('./pages/BudgetPurchases'));
const ChemicalStorage = React.lazy(() => import('./pages/ChemicalStorage'));
const SchoolLegislation = React.lazy(() => import('./pages/SchoolLegislation'));
const SafetyGuide = React.lazy(() => import('./pages/SafetyGuide'));
const LabCalculators = React.lazy(() => import('./pages/LabCalculators'));
import { SchoolProvider } from './context/SchoolContext';
const Diagnostic = React.lazy(() => import('./pages/Diagnostic'));
const DesignSystem = React.lazy(() => import('./pages/DesignSystem'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const Support = React.lazy(() => import('./pages/Support'));

const PeriodicTable = React.lazy(() => import('./pages/PeriodicTable'));
const ChemistryTools = React.lazy(() => import('./pages/ChemistryTools'));

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) setSetupComplete(true); 
      setLoading(false);
      
      // Test connection after auth state is known with a small delay
      setTimeout(() => {
        if (currentUser) {
           testFirestoreConnection(2).then(ok => {
             if (!ok) {
               setConnectionError('تنبيه: تعذر الاتصال بخادم Firestore. قد تكون البيانات غير محدثة أو النطاق (Domain) غير مضاف في الإعدادات.');
             }
           });
        }
      }, 500);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-2xl"></div>
          <div className="h-4 w-32 bg-primary/20 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <SchoolProvider>
          <Router>
            <OfflineBanner />
            {user && connectionError && (
              <div className="fixed bottom-4 right-4 z-[100] bg-error text-on-error px-6 py-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">{connectionError}</span>
                  <button onClick={() => setConnectionError(null)} className="opacity-50 hover:opacity-100">✕</button>
                </div>
                <a 
                  href={ROUTES.DIAGNOSTIC} 
                  className="bg-white/20 hover:bg-white/30 transition-colors py-2 px-4 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-2"
                >
                  تشغيل أداة التشخيص
                </a>
              </div>
            )}
            {user && !setupComplete && <FirebaseSetup onComplete={() => setSetupComplete(true)} />}
            
            <ErrorBoundary>
            <Suspense fallback={
              <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-primary font-bold animate-pulse">جاري التحميل...</p>
              </div>
            }>
              {(!user || setupComplete) ? (
                <Routes>
                <Route path={ROUTES.LOGIN} element={user ? <Navigate to={ROUTES.HOME} /> : <Login />} />
                <Route path="/admin-setup" element={<Navigate to={ROUTES.ADMIN} replace />} />
                <Route path={ROUTES.PRIVACY_POLICY} element={<PrivacyPolicy />} />
                <Route path={ROUTES.DATA_DELETION} element={<DataDeletion />} />
                <Route path={ROUTES.TERMS_OF_SERVICE} element={<TermsOfService />} />
                <Route
                  path={ROUTES.HOME}
                  element={user ? <Layout /> : <Navigate to={ROUTES.LOGIN} />}
                >
                  <Route index element={<Dashboard />} />
                  <Route path={ROUTES.ADMIN.substring(1)} element={<AdminDashboard />} />
                  <Route path={ROUTES.SUPPORT.substring(1)} element={<Support />} />
                  <Route path={ROUTES.DOCUMENT_LIBRARY.substring(1)} element={<DocumentLibrary />} />
                <Route path={ROUTES.INVENTORY_DASHBOARD.substring(1)} element={<InventoryDashboard />} />
                <Route path={ROUTES.PEDAGOGICAL_DASHBOARD.substring(1)} element={<PedagogicalDashboard />} />
                <Route path={ROUTES.SAFETY_HUB.substring(1)} element={<SafetyDashboard />} />
                <Route path={ROUTES.SCIENTIFIC_HUB.substring(1)} element={<ScientificDashboard />} />
                <Route path={ROUTES.SETTINGS_HUB.substring(1)} element={<ManagementDashboard />} />
                <Route path={ROUTES.IMPORTANT_LINKS.substring(1)} element={<ImportantLinks />} />
                <Route path={ROUTES.MAINTENANCE.substring(1)} element={<Maintenance />} />
                <Route path={ROUTES.CHEMICALS.substring(1)} element={<Chemicals />} />
                <Route path={ROUTES.EQUIPMENT.substring(1)} element={<Equipment />} />
                <Route path={ROUTES.INVENTORY_CARDS.substring(1)} element={<InventoryCardsRegistry />} />
                <Route path={ROUTES.TECH_INVENTORY.substring(1)} element={<TechInventory />} />
                <Route path={ROUTES.GLASSWARE_BREAKAGE.substring(1)} element={<GlasswareBreakage />} />
                <Route path={ROUTES.SMART_FORMS.substring(1)} element={<SmartForms />} />
                <Route path={ROUTES.CHEMICAL_WASTE.substring(1)} element={<ChemicalWaste />} />
                <Route path={ROUTES.CHEMICAL_STORAGE.substring(1)} element={<ChemicalStorage />} />
                <Route path={ROUTES.SCHOOL_LEGISLATION.substring(1)} element={<SchoolLegislation />} />
                <Route path={ROUTES.SAFETY_GUIDE.substring(1)} element={<SafetyGuide />} />
                <Route path={ROUTES.CALCULATORS.substring(1)} element={<LabCalculators />} />
                <Route path={ROUTES.EDUCATIONAL_MAP.substring(1)} element={<EducationalMap />} />
                <Route path={ROUTES.CONSUMABLES_SDS.substring(1)} element={<ConsumablesSDS />} />
                <Route path={ROUTES.BACKUP_CENTER.substring(1)} element={<BackupCenter />} />
                <Route path={ROUTES.BUDGET_PURCHASES.substring(1)} element={<BudgetPurchases />} />
                <Route path={ROUTES.DATABASE_MANAGEMENT.substring(1)} element={<DatabaseManagement />} />
                <Route path={ROUTES.QR_PRINT_CENTER.substring(1)} element={<QRPrintCenter />} />
                <Route path={ROUTES.STUDENT_GROUPS.substring(1)} element={<StudentGroups />} />
                <Route path={ROUTES.TIMETABLE.substring(1)} element={<Timetable />} />
                <Route path={ROUTES.LAB_SCHEDULE.substring(1)} element={<LabSchedule />} />
                <Route path={ROUTES.LAB_EXPERIMENTS.substring(1)} element={<LabExperiments />} />
                <Route path={ROUTES.LAB_ASSISTANT.substring(1)} element={<LabAssistant />} />
                <Route path={ROUTES.PEDAGOGICAL_TRACKING.substring(1)} element={<PedagogicalTracking />} />
                <Route path={ROUTES.FOLLOW_UP_REGISTRY.substring(1)} element={<FollowUpRegistry />} />
                <Route path={ROUTES.SYNC.substring(1)} element={<Sync />} />
                <Route path={ROUTES.ACTIVITY_REQUEST.substring(1)} element={<ActivityRequest />} />
                <Route path={ROUTES.LOAN_REQUEST.substring(1)} element={<LoanRequest />} />
                <Route path={ROUTES.SCRAPPING.substring(1)} element={<EquipmentScrapping />} />
                <Route path={ROUTES.SAFETY.substring(1)} element={<Safety />} />
                <Route path={ROUTES.REPORTS.substring(1)} element={<Reports />} />
                <Route path={ROUTES.ARCHIVE.substring(1)} element={<Archive />} />
                <Route path={ROUTES.TEACHERS.substring(1)} element={<Teachers />} />
                <Route path={ROUTES.DAILY_REPORT.substring(1)} element={<DailyReport />} />
                <Route path={ROUTES.PROFESSIONAL_EXAMS.substring(1)} element={<ProfessionalExams />} />
                <Route path={ROUTES.SETTINGS.substring(1)} element={<Settings />} />
                <Route path={ROUTES.DESIGN_SYSTEM.substring(1)} element={<DesignSystem />} />
                <Route path={ROUTES.DIAGNOSTIC.substring(1)} element={<Diagnostic />} />
                {/* Catch-all 404 route for authenticated users */}
                <Route path={ROUTES.PERIODIC_TABLE.substring(1)} element={<PeriodicTable />} />
                <Route path={ROUTES.CHEMISTRY_TOOLS.substring(1)} element={<ChemistryTools />} />
                <Route path="*" element={<Navigate to="/not-found" replace />} />
              </Route>
              {/* Catch-all 404 route matching the base path */}
              <Route path="/not-found" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
            ) : (
              <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center">
                  <div className="w-12 h-12 bg-primary rounded-2xl animate-pulse"></div>
                </div>
                <div className="text-xl font-black text-primary animate-pulse">جاري تهيئة النظام...</div>
                <div className="text-xs text-on-surface/40">قد يستغرق هذا بضع ثوانٍ لأول مرة</div>
              </div>
            )}
          </Suspense>
            </ErrorBoundary>
          </Router>
        </SchoolProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}


