/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useState, Suspense } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { HelmetProvider } from 'react-helmet-async';
import { auth, testFirestoreConnection } from './firebase';

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
              <div className="fixed bottom-4 right-4 z-[100] bg-error text-on-error px-6 py-4 rounded-2xl shadow-2xl flex flex-col gap-3 animate-bounce max-w-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">{connectionError}</span>
                  <button onClick={() => setConnectionError(null)} className="opacity-50 hover:opacity-100">✕</button>
                </div>
                <a 
                  href="/diagnostic" 
                  className="bg-white/20 hover:bg-white/30 transition-colors py-2 px-4 rounded-xl text-[10px] font-bold text-center flex items-center justify-center gap-2"
                >
                  تشغيل أداة التشخيص
                </a>
              </div>
            )}
            {user && !setupComplete && <FirebaseSetup onComplete={() => setSetupComplete(true)} />}
            
            <Suspense fallback={
              <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-primary font-bold animate-pulse">جاري التحميل...</p>
              </div>
            }>
              {(!user || setupComplete) ? (
                <Routes>
                <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/data-deletion" element={<DataDeletion />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route
                  path="/"
                  element={user ? <Layout /> : <Navigate to="/login" />}
                >
                  <Route index element={<Dashboard />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="support" element={<Support />} />
                  <Route path="document-library" element={<DocumentLibrary />} />
                <Route path="inventory" element={<InventoryDashboard />} />
                <Route path="pedagogical" element={<PedagogicalDashboard />} />
                <Route path="maintenance" element={<Maintenance />} />
                <Route path="chemicals" element={<Chemicals />} />
                <Route path="equipment" element={<Equipment />} />
                <Route path="inventory-cards" element={<InventoryCardsRegistry />} />
                <Route path="tech-inventory" element={<TechInventory />} />
                <Route path="glassware-breakage" element={<GlasswareBreakage />} />
                <Route path="smart-forms" element={<SmartForms />} />
                <Route path="chemical-waste" element={<ChemicalWaste />} />
                <Route path="chemical-storage" element={<ChemicalStorage />} />
                <Route path="school-legislation" element={<SchoolLegislation />} />
                <Route path="safety-guide" element={<SafetyGuide />} />
                <Route path="calculators" element={<LabCalculators />} />
                <Route path="educational-map" element={<EducationalMap />} />
                <Route path="consumables-sds" element={<ConsumablesSDS />} />
                <Route path="backup" element={<BackupCenter />} />
                <Route path="budget-purchases" element={<BudgetPurchases />} />
                <Route path="database-management" element={<DatabaseManagement />} />
                <Route path="qr-print-center" element={<QRPrintCenter />} />
                <Route path="student-groups" element={<StudentGroups />} />
                <Route path="timetable" element={<Timetable />} />
                <Route path="lab-schedule" element={<LabSchedule />} />
                <Route path="lab-experiments" element={<LabExperiments />} />
                <Route path="lab-assistant" element={<LabAssistant />} />
                <Route path="smart-forms" element={<SmartForms />} />
                <Route path="backup-center" element={<BackupCenter />} />
                <Route path="pedagogical-tracking" element={<PedagogicalTracking />} />
                <Route path="follow-up-registry" element={<FollowUpRegistry />} />
                <Route path="sync" element={<Sync />} />
                <Route path="activity-request" element={<ActivityRequest />} />
                <Route path="loan-request" element={<LoanRequest />} />
                <Route path="scrapping" element={<EquipmentScrapping />} />
                <Route path="safety" element={<Safety />} />
                <Route path="reports" element={<Reports />} />
                <Route path="archive" element={<Archive />} />
                <Route path="teachers" element={<Teachers />} />
                <Route path="daily-report" element={<DailyReport />} />
                <Route path="settings" element={<Settings />} />
                <Route path="design-system" element={<DesignSystem />} />
                <Route path="diagnostic" element={<Diagnostic />} />
                {/* Catch-all 404 route for authenticated users */}
                <Route path="periodic-table" element={<PeriodicTable />} />
                <Route path="chemistry-tools" element={<ChemistryTools />} />
                <Route path="*" element={<Navigate to="/not-found" replace />} />
              </Route>
              {/* Catch-all 404 route matching the base path */}
              <Route path="/not-found" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/not-found" replace />} />
            </Routes>
            ) : (
              <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center animate-bounce">
                  <div className="w-12 h-12 bg-primary rounded-2xl animate-pulse"></div>
                </div>
                <div className="text-xl font-black text-primary animate-pulse">جاري تهيئة النظام...</div>
                <div className="text-xs text-on-surface/40">قد يستغرق هذا بضع ثوانٍ لأول مرة</div>
              </div>
            )}
          </Suspense>
          </Router>
        </SchoolProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}


