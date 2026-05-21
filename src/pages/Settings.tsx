import { useState, useEffect, useRef } from 'react';
import { useSchool } from '../context/SchoolContext';
import { 
  Settings, 
  User, 
  Shield, 
  Database, 
  CloudUpload, 
  FileUp,
  History,
  Bell,
  Globe,
  LogOut,
  CheckCircle2,
  Map as MapIcon,
  Users,
  School,
  MapPin,
  Plus,
  Trash2,
  ChevronDown,
  Lock,
  Pencil,
  Loader2,
  Mail,
  Facebook,
  Chrome,
  AlertCircle,
  Clock,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { auth, db, storage, handleFirestoreError, OperationType, getUserCollection } from '../firebase';
import { 
  updateProfile, 
  signOut, 
  updatePassword, 
  linkWithPopup, 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  sendPasswordResetEmail, 
  unlink
} from 'firebase/auth';
import { doc, getDoc, setDoc, writeBatch, serverTimestamp, getDocFromServer } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as XLSX from 'xlsx';
import { cn } from '../lib/utils';
import LocationCard, { InstitutionSuggestion } from '../components/LocationCard';

export default function SettingsPage() {
  const { schoolId } = useSchool();
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [email] = useState(auth.currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Professional Info State
  const [jobTitle, setJobTitle] = useState('ملحق بالمخابر');
  const [grade, setGrade] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [employeeId, setEmployeeId] = useState('1010101010101010');
  const [isEditingEmployeeId, setIsEditingEmployeeId] = useState(false);

  // Time Slots State
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '08:00 - 09:00',
    '09:00 - 10:00',
    '10:00 - 11:00',
    '11:00 - 12:00',
    '13:00 - 14:00',
    '14:00 - 15:00',
    '15:00 - 16:00',
    '16:00 - 17:00',
    '08:00 - 10:00',
    '10:00 - 12:00',
    '13:00 - 15:00',
    '15:00 - 17:00'
  ]);
  const [newTimeSlot, setNewTimeSlot] = useState('');

  // Institution State
  const [selectedDirectorate, setSelectedDirectorate] = useState('');
  const [selectedCommune, setSelectedCommune] = useState('');
  const [selectedCycle, setSelectedCycle] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [schoolAddress, setSchoolAddress] = useState('');
  
  // Data loaded from Firestore
  const [dirList, setDirList] = useState<any[]>([]);
  const [currentDirData, setCurrentDirData] = useState<any>(null);

  useEffect(() => {
    // Fetch directorates list once
    const fetchMeta = async () => {
      try {
        const metaDoc = await getDoc(doc(db, 'school_metadata', 'directorates'));
        if (metaDoc.exists()) {
          setDirList(metaDoc.data().list || []);
        }
      } catch (e) {
        console.error('Error fetching directorates metadata:', e);
      }
    };
    fetchMeta();
  }, []);

  useEffect(() => {
    // Fetch current directorate data whenever selectedDirectorate changes
    const fetchDir = async () => {
      if (!selectedDirectorate) {
        setCurrentDirData(null);
        return;
      }
      try {
        const dirDoc = await getDoc(doc(db, 'schools', selectedDirectorate));
        if (dirDoc.exists()) {
          setCurrentDirData(dirDoc.data());
        } else {
          setCurrentDirData(null);
        }
      } catch (e) {
        console.error('Error fetching directorate data from Firestore:', e);
      }
    };
    fetchDir();
  }, [selectedDirectorate]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    try {
      setIsUploading(true);
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });

      // Update Firestore users collection
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        photoURL: downloadURL
      }, { merge: true });

      // Update Firestore settings collection
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        profilePhoto: downloadURL
      }, { merge: true });
      
      // Force a re-render to show the new image
      window.location.reload();
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportXLS = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        const batch = writeBatch(db);
        data.forEach((item) => {
          // Determine collection based on headers or a specific field
          let collectionName: 'chemicals' | 'teachers' | 'equipment' = 'chemicals';
          if (item['المادة'] || item['Subject']) collectionName = 'teachers';
          else if (item['النوع'] || item['Type'] || item['تعيين الجهاز'] || item['اسم الجهاز'] || item['رقم الجرد']) collectionName = 'equipment';

          const docRef = doc(getUserCollection(schoolId, 'equipment'));
          
          if (collectionName === 'chemicals') {
            const name = item['الاسم'] || item['Name'] || 'مادة غير مسمى';
            const quantity = Number(item['الكمية'] || item['Quantity']);
            batch.set(docRef, {
              name: String(name).trim() || 'مادة غير مسمى',
              formula: item['الصيغة'] || item['Formula'] || '',
              cas: item['CAS'] || '',
              purity: item['النقاء'] || item['Purity'] || '',
              storageTemp: item['درجة التخزين'] || item['Storage'] || '',
              expiryDate: item['تاريخ الانتهاء'] || item['Expiry'] || '',
              quantity: isNaN(quantity) ? 0 : quantity,
              unit: item['الوحدة'] || item['Unit'] || 'ml',
              hazardClass: (item['الخطورة'] || item['Hazard'] || 'safe').toLowerCase() === 'danger' ? 'danger' : 'safe',
              location: item['الموقع'] || item['Location'] || '',
              createdAt: serverTimestamp()
            });
          } else if (collectionName === 'teachers') {
            const name = item['الاسم'] || item['Name'] || 'أستاذ غير مسمى';
            const subject = item['المادة'] || item['Subject'] || 'مادة غير محددة';
            batch.set(docRef, {
              name: String(name).trim() || 'أستاذ غير مسمى',
              subject: String(subject).trim() || 'مادة غير محددة',
              email: item['البريد'] || item['Email'] || '',
              levels: item['الأطوار'] || item['Levels'] ? String(item['الأطوار'] || item['Levels']).split(';').map(s => s.trim()) : [],
              createdAt: serverTimestamp()
            });
          } else if (collectionName === 'equipment') {
            const type = (item['النوع'] || item['Type'] || 'other').toLowerCase();
            const status = (item['الحالة'] || item['Status'] || 'functional').toLowerCase();
            const name = item['اسم الجهاز'] || item['تعيين الجهاز'] || item['الاسم'] || item['Name'] || 'جهاز غير مسمى';
            const quantity = Number(item['الكمية'] || item['الكمية الإجمالية'] || item['Total'] || 0);

            batch.set(docRef, {
              name: String(name).trim() || 'جهاز غير مسمى',
              type: type === 'زجاجيات' || type === 'glassware' ? 'glassware' : type === 'أجهزة' || type === 'tech' ? 'tech' : 'other',
              serialNumber: item['رقم الجرد'] || item['الرقم التسلسلي'] || item['Serial'] || '',
              status: status === 'سليم' || status === 'جيدة' || status === 'functional' ? 'functional' : status === 'صيانة' || status === 'maintenance' ? 'maintenance' : 'broken',
              totalQuantity: isNaN(quantity) ? 0 : quantity,
              availableQuantity: isNaN(quantity) ? 0 : quantity,
              brokenQuantity: 0,
              supplier: item['المورد'] || item['الممون'] || '',
              location: item['الموقع'] || '',
              notes: item['ملاحظات'] || '',
              foundationalInventory: item['سنة الاقتناء'] || item['الجرد التأسيسي'] || '',
              decennialReview: item['المراجعة العشرية'] || '',
              createdAt: serverTimestamp()
            });
          }
        });

        await batch.commit();
        alert(`تم استيراد ${data.length} سجل بنجاح!`);
      } catch (error) {
        console.error('Error importing XLS:', error);
        alert('حدث خطأ أثناء استيراد الملف. يرجى التأكد من صيغة الملف.');
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleInstitutionSelect = async (suggestion: InstitutionSuggestion) => {
    try {
      const response = await fetch('/api/schools/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suggestion })
      });
      const { bestMatch } = await response.json();
      
      if (bestMatch) {
        setSelectedDirectorate(bestMatch.dirId);
        setSelectedCommune(bestMatch.comId);
        setSelectedCycle(bestMatch.cycle);
        setSelectedSchool(bestMatch.schoolCode);
        
        // Also update address if we have it
        if (suggestion.commune && suggestion.directorate) {
          setSchoolAddress(`${suggestion.name}، ${suggestion.commune}، ${suggestion.directorate}`);
        }
      }
    } catch (err) {
      console.error('Error finding school best match:', err);
    }
  };

  // Educational Map State
  const [levels, setLevels] = useState([
    { 
      id: '1', 
      name: 'السنة الأولى ثانوي', 
      groups: [
        'أولى ثانوي جذع مشترك علوم وتكنولوجيا',
        'أولى ثانوي جذع مشترك آداب'
      ] 
    },
    { 
      id: '2', 
      name: 'السنة الثانية ثانوي', 
      groups: [
        'ثانية ثانوي رياضيات',
        'ثانية ثانوي علوم تجريبية',
        'ثانية ثانوي تقني رياضي',
        'ثانية ثانوي تقني رياضي هندسة ميكانيكية',
        'ثانية ثانوي تقني رياضي هندسة كهربائية',
        'ثانية ثانوي تقني رياضي هندسة مدنية',
        'ثانية ثانوي تقني رياضي هندسة الطرائق',
        'ثانية ثانوي آداب وفلسفة',
        'ثانية ثانوي لغات أجنبية',
        'ثانية ثانوي لغات أجنبية إسبانية',
        'ثانية ثانوي لغات أجنبية ألمانية',
        'ثانية ثانوي لغات أجنبية إيطالية'
      ] 
    },
    { 
      id: '3', 
      name: 'السنة الثالثة ثانوي', 
      groups: [
        'ثالثة ثانوي رياضيات',
        'ثالثة ثانوي علوم تجريبية',
        'ثالثة ثانوي تقني رياضي',
        'ثالثة ثانوي تقني رياضي هندسة ميكانيكية',
        'ثالثة ثانوي تقني رياضي هندسة كهربائية',
        'ثالثة ثانوي تقني رياضي هندسة مدنية',
        'ثالثة ثانوي تقني رياضي هندسة الطرائق',
        'ثالثة ثانوي تسيير واقتصاد',
        'ثالثة ثانوي آداب وفلسفة',
        'ثالثة ثانوي لغات أجنبية',
        'ثالثة ثانوي لغات أجنبية إسبانية',
        'ثالثة ثانوي لغات أجنبية ألمانية',
        'ثالثة ثانوي لغات أجنبية إيطالية'
      ] 
    },
  ]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);

  // Account Linking State
  const [linkingError, setLinkingError] = useState<React.ReactNode | null>(null);

  const CYCLE_TEMPLATES: Record<string, any[]> = {
    'متوسط': [
      { id: 'm1', name: 'السنة الأولى متوسط', groups: ['أولى متوسط 1', 'أولى متوسط 2', 'أولى متوسط 3'] },
      { id: 'm2', name: 'السنة الثانية متوسط', groups: ['ثانية متوسط 1', 'ثانية متوسط 2', 'ثانية متوسط 3'] },
      { id: 'm3', name: 'السنة الثالثة متوسط', groups: ['ثالثة متوسط 1', 'ثالثة متوسط 2', 'ثالثة متوسط 3'] },
      { id: 'm4', name: 'السنة الرابعة متوسط', groups: ['رابعة متوسط 1', 'رابعة متوسط 2', 'رابعة متوسط 3'] },
    ],
    'ثانوي': [
      { 
        id: 's1', 
        name: 'السنة الأولى ثانوي', 
        groups: [
          'أولى ثانوي جذع مشترك علوم وتكنولوجيا',
          'أولى ثانوي جذع مشترك آداب'
        ] 
      },
      { 
        id: 's2', 
        name: 'السنة الثانية ثانوي', 
        groups: [
          'ثانية ثانوي رياضيات',
          'ثانية ثانوي علوم تجريبية',
          'ثانية ثانوي تقني رياضي',
          'ثانية ثانوي تقني رياضي هندسة ميكانيكية',
          'ثانية ثانوي تقني رياضي هندسة كهربائية',
          'ثانية ثانوي تقني رياضي هندسة مدنية',
          'ثانية ثانوي تقني رياضي هندسة الطرائق',
          'ثانية ثانوي آداب وفلسفة',
          'ثانية ثانوي لغات أجنبية',
          'ثانية ثانوي لغات أجنبية إسبانية',
          'ثانية ثانوي لغات أجنبية ألمانية',
          'ثانية ثانوي لغات أجنبية إيطالية'
        ] 
      },
      { 
        id: 's3', 
        name: 'السنة الثالثة ثانوي', 
        groups: [
          'ثالثة ثانوي رياضيات',
          'ثالثة ثانوي علوم تجريبية',
          'ثالثة ثانوي تقني رياضي',
          'ثالثة ثانوي تقني رياضي هندسة ميكانيكية',
          'ثالثة ثانوي تقني رياضي هندسة كهربائية',
          'ثالثة ثانوي تقني رياضي هندسة مدنية',
          'ثالثة ثانوي تقني رياضي هندسة الطرائق',
          'ثالثة ثانوي تسيير واقتصاد',
          'ثالثة ثانوي آداب وفلسفة',
          'ثالثة ثانوي لغات أجنبية',
          'ثالثة ثانوي لغات أجنبية إسبانية',
          'ثالثة ثانوي لغات أجنبية ألمانية',
          'ثالثة ثانوي لغات أجنبية إيطالية'
        ] 
      },
    ]
  };

  const resetToCycleTemplate = () => {
    const template = CYCLE_TEMPLATES[selectedCycle];
    if (template) {
      setLevels(template);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, 'settings', auth.currentUser.uid);
      try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setJobTitle(data.jobTitle || 'ملحق بالمخابر');
          setGrade(data.grade || '');
          setSpecialty(data.specialty || '');
          setSelectedDirectorate(data.directorate || '');
          setSelectedCommune(data.commune || '');
          setSelectedCycle(data.cycle || '');
          setSelectedSchool(data.school || '');
          setSchoolAddress(data.address || '');
          setEmployeeId(data.employeeId || '1010101010101010');
          if (data.levels) setLevels(data.levels);
          if (data.timeSlots) setTimeSlots(data.timeSlots);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `settings/${auth.currentUser.uid}`);
      }
    };
    fetchSettings();
  }, []);

  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isFixingPermissions, setIsFixingPermissions] = useState(false);
  const [fixResults, setFixResults] = useState<{name: string, success: boolean, error?: string}[]>([]);

  const checkConnection = async () => {
    setIsCheckingConnection(true);
    setConnectionStatus('idle');
    try {
      // Use getDocFromServer for a real network test
      await getDocFromServer(doc(db, '_connection_test_', 'ping'));
      setConnectionStatus('success');
      setTimeout(() => setConnectionStatus('idle'), 5000);
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const fixPermissions = async () => {
    if (!auth.currentUser) return;
    setIsFixingPermissions(true);
    setFixResults([]);
    const tests = [
      { name: 'الاتصال العام (Root)', path: '_connection_test_/ping' },
      { name: 'ملف المستخدم (User Profile)', path: `users/${auth.currentUser.uid}` },
      { name: 'مجموعة المواد (Chemicals)', path: `users/${auth.currentUser.uid}/chemicals/permission_test` },
      { name: 'مجموعة الإعدادات (Settings)', path: `users/${auth.currentUser.uid}/settings/permission_test` },
    ];

    const results = [];
    for (const test of tests) {
      try {
        await setDoc(doc(db, test.path), { 
          _permission_test: true, 
          lastTested: serverTimestamp(),
          clientTime: new Date().toISOString()
        }, { merge: true });
        results.push({ name: test.name, success: true });
      } catch (err: any) {
        console.error(`Permission test failed for ${test.name}:`, err);
        results.push({ name: test.name, success: false, error: err.message });
      }
    }
    setFixResults(results);
    setIsFixingPermissions(false);
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setIsSaving(true);
    try {
      await updateProfile(auth.currentUser, { displayName });
      
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        jobTitle,
        grade,
        specialty,
        directorate: selectedDirectorate,
        commune: selectedCommune,
        cycle: selectedCycle,
        school: selectedSchool,
        address: schoolAddress,
        employeeId,
        levels,
        timeSlots,
        profilePhoto: auth.currentUser?.photoURL || null,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error('كلمات المرور غير متطابقة');
        }
        await updatePassword(auth.currentUser, newPassword);
        setNewPassword('');
        setConfirmPassword('');
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        alert('يجب عليك تسجيل الخروج ثم الدخول مرة أخرى لتغيير كلمة المرور لأسباب أمنية.');
      } else {
        handleFirestoreError(error, OperationType.WRITE, `settings/${auth.currentUser.uid}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!auth.currentUser?.email) return;
    setIsResettingPassword(true);
    try {
      await sendPasswordResetEmail(auth, auth.currentUser.email);
      alert('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
    } catch (error: any) {
      console.error('Error sending reset email:', error);
      alert('حدث خطأ أثناء إرسال البريد الإلكتروني.');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const linkAccount = async (providerName: 'google' | 'facebook') => {
    if (!auth.currentUser) return;
    setLinkingError(null);
    try {
      let provider;
      if (providerName === 'google') provider = new GoogleAuthProvider();
      else provider = new FacebookAuthProvider();
      
      await linkWithPopup(auth.currentUser, provider);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setLinkingError('تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.');
      } else {
        console.error(`Error linking ${providerName}:`, error);
        if (error.code === 'auth/credential-already-in-use') {
          setLinkingError('هذا الحساب مرتبط بالفعل بمستخدم آخر.');
        } else if (error.code === 'auth/operation-not-allowed') {
          setLinkingError(
            <span>
              تسجيل الدخول عبر فيسبوك غير مفعل. يرجى تفعيله من{' '}
              <a 
                href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                Firebase Console
              </a>
              .
            </span>
          );
        } else {
          setLinkingError('حدث خطأ أثناء ربط الحساب. يرجى المحاولة مرة أخرى.');
        }
      }
    }
  };

  const unlinkAccount = async (providerId: string) => {
    if (!auth.currentUser) return;
    if (auth.currentUser.providerData.length <= 1) {
      alert('يجب أن يظل هناك وسيلة واحدة على الأقل لتسجيل الدخول.');
      return;
    }
    try {
      await unlink(auth.currentUser, providerId);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error unlinking account:', error);
      alert('حدث خطأ أثناء إلغاء ربط الحساب.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword) {
      setPasswordChangeError('يرجى إدخال كلمة المرور الجديدة');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordChangeError('كلمات المرور غير متطابقة');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordChangeError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setIsUpdatingPassword(true);
    setPasswordChangeSuccess(false);
    setPasswordChangeError(null);

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordChangeSuccess(true);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordChangeSuccess(false), 5000);
      }
    } catch (error: any) {
      console.error('Error updating password:', error);
      let msg = 'فشل تحديث كلمة المرور';
      if (error.code === 'auth/requires-recent-login') {
        msg = 'يرجى تسجيل الخروج ثم الدخول مرة أخرى لتغيير كلمة المرور (لدواعي أمنية)';
      }
      setPasswordChangeError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const addGroup = (levelId: string) => {
    setLevels(levels.map(l => {
      if (l.id === levelId) {
        let newName = `فوج جديد ${l.groups.length + 1}`;
        if (l.name.includes('متوسط')) {
          const year = l.name.match(/\d/)?.[0] || '';
          newName = `${year} متوسط ${l.groups.length + 1}`;
        } else if (l.name.includes('ثانوي')) {
          const year = l.name.match(/\d/)?.[0] || '';
          newName = `${year} ثانوي ${l.groups.length + 1}`;
        }
        return { ...l, groups: [...l.groups, newName] };
      }
      return l;
    }));
  };

  const removeGroup = (levelId: string, groupIndex: number) => {
    setLevels(levels.map(l => {
      if (l.id === levelId) {
        const newGroups = [...l.groups];
        newGroups.splice(groupIndex, 1);
        return { ...l, groups: newGroups };
      }
      return l;
    }));
  };

  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'الملف الشخصي', icon: User },
    { id: 'institution', name: 'المؤسسة والتعليم', icon: School },
    { id: 'database', name: 'إدارة البيانات', icon: Database },
    { id: 'system', name: 'النظام والأمان', icon: Shield },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 pb-24" dir="rtl">
      <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight mb-2">الإعدادات المركزية</h2>
          <p className="text-secondary text-lg opacity-80">تحكم كامل في بيئة العمل، الهوية المهنية، والتنظيم التربوي للمؤسسة.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-all border border-red-100"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-primary text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-2xl border border-white/10"
          >
            <CheckCircle2 size={24} className="text-primary-fixed" />
            <span className="font-bold text-lg">تم تحديث كافة الإعدادات بنجاح</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:w-72 flex-shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap text-right w-full",
                  activeTab === tab.id 
                    ? "bg-primary text-white shadow-lg shadow-primary/20 translate-x-1" 
                    : "text-secondary hover:bg-secondary-container/30 hover:text-primary"
                )}
              >
                <tab.icon size={20} />
                {tab.name}
              </button>
            ))}
          </nav>

          <div className="mt-12 space-y-6 hidden lg:block">
            <div className="asymmetric-card bg-surface-container p-8 flex flex-col items-center text-center shadow-[0_12px_32px_rgba(65,84,55,0.08)]">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-lg relative">
                  <img 
                    className={cn("w-full h-full object-cover antialiased", isUploading && "opacity-50")} 
                    alt="Profile headshot of lab technician" 
                    src={(auth.currentUser?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuB_8_hmo1Qe7WCzKBvJ5CtDQ_pkrInSdwMobEaVisCKQWlr21wbCMzr35-Ya7iavFxKwYViL93OwUcxmq0dtrP1y7mXj42TcimaO9egBxmYkiqYAYG3tL6IOFjUmlyJi230Ox75wLXmG65fCOwX-Up1ZmfY_WYNzHdNm0FdV_Fsn_AXIkpS7CCinUWyvQsMWdRkFo7zlIofDSRKAZVeME1gPXgAEggyqnjPgnkM8KvZbSxY53LmEgbI4LVFgk8vfsps8RPz7-ZmVpc").replace(/=s\d+(-c)?/g, '=s400-c')}
                    style={{ imageRendering: 'auto' }}
                    referrerPolicy="no-referrer"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="animate-spin text-primary" size={24} />
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 bg-primary text-on-primary p-2 rounded-full shadow-md scale-95 active:scale-90 transition-transform disabled:opacity-50"
                >
                  <Pencil size={14} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  className="hidden" 
                  accept="image/*"
                />
              </div>
              <h3 className="text-xl font-bold text-primary">{displayName || 'أحمد بن محمد'}</h3>
              <p className="text-sm text-tertiary font-semibold px-3 py-1 bg-tertiary/10 rounded-full mt-2">{jobTitle || 'ملحق مخبري رئيسي'}</p>
              
              <div className="mt-6 flex flex-col gap-2 w-full">
                <div className="flex justify-between items-center text-xs text-on-surface-variant bg-surface/50 p-3 rounded-lg group">
                  <span>الرمز الوظيفي للموظف:</span>
                  <div className="flex items-center gap-2">
                    {isEditingEmployeeId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          className="w-40 bg-surface border border-primary/20 rounded px-1 py-0.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-primary"
                          autoFocus
                          onBlur={() => setIsEditingEmployeeId(false)}
                          onKeyDown={(e) => e.key === 'Enter' && setIsEditingEmployeeId(false)}
                        />
                        <button 
                          onClick={() => setIsEditingEmployeeId(false)}
                          className="text-primary hover:text-primary/80"
                        >
                          <CheckCircle2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-bold">{employeeId}</span>
                        <button 
                          onClick={() => setIsEditingEmployeeId(true)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:text-primary/80"
                        >
                          <Pencil size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs text-on-surface-variant bg-surface/50 p-3 rounded-lg">
                  <span>تاريخ الانضمام:</span>
                  <span className="font-bold">
                    {auth.currentUser?.metadata.creationTime 
                      ? new Date(auth.currentUser.metadata.creationTime).toLocaleDateString('en-GB').split('/').reverse().join('/')
                      : '2023/10/12'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-grow">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-surface rounded-[40px] p-8 lg:p-12 shadow-xl shadow-primary/5 border border-outline-variant/10 min-h-[600px]"
          >
            {activeTab === 'profile' && (
              <div className="space-y-12">
                <section>
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <User className="text-secondary" />
                    المعلومات الأساسية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">الاسم الكامل</label>
                      <input 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all text-on-surface font-bold" 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="أدخل اسمك الكامل"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">البريد الإلكتروني</label>
                      <input 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 opacity-50 cursor-not-allowed text-on-surface font-bold" 
                        type="email" 
                        value={email}
                        disabled
                      />
                    </div>
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Shield className="text-secondary" />
                    الصفة المهنية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">الرتبة المهنية</label>
                      <select 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all text-on-surface font-bold appearance-none"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                      >
                        <optgroup label="سلك الأعوان التقنيين للمخابر">
                          <option value="عون تقني للمخابر">عون تقني للمخابر</option>
                        </optgroup>
                        <optgroup label="سلك المعاونين التقنيين للمخابر">
                          <option value="معاون تقني للمخابر">معاون تقني للمخابر</option>
                        </optgroup>
                        <optgroup label="سلك الملحقين بالمخابر">
                          <option value="ملحق بالمخابر">ملحق بالمخابر</option>
                          <option value="ملحق رئيسي بالمخابر">ملحق رئيسي بالمخابر</option>
                          <option value="ملحق رئيس بالمخابر">ملحق رئيس بالمخابر</option>
                          <option value="ملحق مشرف بالمخابر">ملحق مشرف بالمخابر</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">الدرجة / السلم</label>
                      <select 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all text-on-surface font-bold appearance-none"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                      >
                        <option value="">اختر الدرجة...</option>
                        {[...Array(13)].map((_, i) => (
                          <option key={i} value={i === 0 ? "متدرب" : i.toString()}>
                            {i === 0 ? "متدرب / جديد" : `الدرجة ${i}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">التخصص الأكاديمي</label>
                      <textarea 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all text-on-surface font-bold min-h-[60px] resize-none" 
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="مثال: فيزياء، كيمياء، علوم طبيعية"
                      />
                    </div>
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Users className="text-secondary" />
                    ربط الحسابات الاجتماعية
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    <button 
                      onClick={() => linkAccount('google')}
                      disabled={auth.currentUser?.providerData.some(p => p.providerId === 'google.com')}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all border-2",
                        auth.currentUser?.providerData.some(p => p.providerId === 'google.com')
                          ? "bg-green-50 border-green-100 text-green-700 cursor-default"
                          : "bg-surface border-outline-variant/30 text-primary hover:border-primary/30"
                      )}
                    >
                      <Chrome size={18} className={auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? "text-green-600" : "text-[#4285F4]"} />
                      {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? 'تم ربط Google' : 'ربط Google'}
                    </button>

                    <button 
                      onClick={() => linkAccount('facebook')}
                      disabled={auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com')}
                      className={cn(
                        "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all border-2",
                        auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com')
                          ? "bg-blue-50 border-blue-100 text-blue-700 cursor-default"
                          : "bg-surface border-outline-variant/30 text-primary hover:border-primary/30"
                      )}
                    >
                      <Facebook size={18} className={auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') ? "text-blue-600" : "text-[#1877F2]"} />
                      {auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') ? 'تم ربط Facebook' : 'ربط Facebook'}
                    </button>
                  </div>
                  {linkingError && (
                    <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-bold">
                      <AlertCircle size={18} />
                      {linkingError}
                    </div>
                  )}
                </section>
              </div>
            )}

            {activeTab === 'institution' && (
              <div className="space-y-16">
                <section>
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <School className="text-secondary" />
                    بيانات المؤسسة التعليمية
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">مديرية التربية</label>
                      <select 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold appearance-none"
                        value={selectedDirectorate}
                        onChange={(e) => {
                          setSelectedDirectorate(e.target.value);
                          setSelectedCommune('');
                          setSelectedSchool('');
                        }}
                      >
                        <option value="">اختر المديرية...</option>
                        {dirList.map((dir: any) => (
                          <option key={dir.id} value={dir.id}>{dir.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">البلدية</label>
                      <select 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold appearance-none disabled:opacity-30"
                        disabled={!selectedDirectorate || !currentDirData}
                        value={selectedCommune}
                        onChange={(e) => {
                          setSelectedCommune(e.target.value);
                          setSelectedCycle('');
                          setSelectedSchool('');
                        }}
                      >
                        <option value="">اختر البلدية...</option>
                        {currentDirData && currentDirData.communes && Object.entries(currentDirData.communes).map(([id, com]: [string, any]) => (
                          <option key={id} value={id}>{com.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">الطور التعليمي</label>
                      <select 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold appearance-none disabled:opacity-30"
                        disabled={!selectedCommune || !currentDirData}
                        value={selectedCycle}
                        onChange={(e) => {
                          setSelectedCycle(e.target.value);
                          setSelectedSchool('');
                        }}
                      >
                        <option value="">اختر الطور...</option>
                        {currentDirData && currentDirData.communes && currentDirData.communes[selectedCommune] && 
                          Object.keys(currentDirData.communes[selectedCommune].cycles).map((cycle) => (
                            <option key={cycle} value={cycle}>{cycle}</option>
                          ))
                        }
                      </select>
                    </div>

                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">المؤسسة التعليمية</label>
                      <select 
                        className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold appearance-none disabled:opacity-30"
                        disabled={!selectedCycle || !currentDirData}
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                      >
                        <option value="">اختر المؤسسة...</option>
                        {currentDirData && currentDirData.communes && currentDirData.communes[selectedCommune] && currentDirData.communes[selectedCommune].cycles[selectedCycle] && 
                          currentDirData.communes[selectedCommune].cycles[selectedCycle].map((sch: any) => (
                            <option key={sch.code} value={sch.code}>{sch.name}</option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="mt-8 space-y-3">
                    <label className="text-sm font-black text-secondary mr-2 flex items-center gap-2">
                      <MapPin size={16} />
                      العنوان الجغرافي الدقيق
                    </label>
                    <textarea 
                      className="w-full bg-background border-2 border-transparent rounded-[24px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold min-h-[100px] resize-none"
                      placeholder="أدخل عنوان المؤسسة بالتفصيل..."
                      value={schoolAddress}
                      onChange={(e) => setSchoolAddress(e.target.value)}
                    />
                  </div>

                  <div className="mt-12">
                    <LocationCard 
                      onSelect={handleInstitutionSelect} 
                      communeName={currentDirData && currentDirData.communes && currentDirData.communes[selectedCommune] ? currentDirData.communes[selectedCommune].name : undefined}
                    />
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-primary flex items-center gap-3">
                        <MapIcon className="text-secondary" />
                        الخريطة التربوية
                      </h3>
                      <p className="text-secondary text-sm font-bold mt-1">تنظيم المستويات والأفواج التربوية للموسم الدراسي الحالي.</p>
                    </div>
                    {selectedCycle && (
                      <button
                        onClick={resetToCycleTemplate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary-container text-primary font-black text-xs hover:bg-primary hover:text-white transition-all shadow-sm"
                      >
                        <History size={14} />
                        تحيين حسب الطور ({selectedCycle})
                      </button>
                    )}
                  </header>

                  <div className="grid grid-cols-1 gap-6">
                    {levels.map((level) => (
                      <motion.div 
                        layout
                        key={level.id} 
                        className="bg-background rounded-[32px] p-8 border border-outline-variant/30"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                          <h4 className="text-lg font-black text-primary">{level.name}</h4>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3 bg-surface px-4 py-2 rounded-2xl border border-outline-variant/50 shadow-sm">
                              <span className="text-[10px] font-black text-secondary uppercase tracking-wider">الأفواج</span>
                              <input 
                                type="number"
                                min="0"
                                max="20"
                                value={level.groups.length}
                                onChange={(e) => {
                                  const count = parseInt(e.target.value) || 0;
                                  const currentCount = level.groups.length;
                                  if (count > currentCount) {
                                    for (let i = 0; i < count - currentCount; i++) addGroup(level.id);
                                  } else if (count < currentCount) {
                                    setLevels(levels.map(l => l.id === level.id ? { ...l, groups: l.groups.slice(0, count) } : l));
                                  }
                                }}
                                className="w-10 text-center font-black text-primary bg-transparent border-none focus:ring-0 p-0"
                              />
                            </div>
                            <button 
                              onClick={() => addGroup(level.id)}
                              className="p-2 bg-primary text-white rounded-xl hover:scale-110 active:scale-90 transition-all shadow-md"
                            >
                              <Plus size={20} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                          {level.groups.map((group, idx) => (
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              key={idx} 
                              className="bg-surface border border-outline-variant/40 p-1 pr-4 rounded-2xl flex items-center justify-between group shadow-sm hover:border-primary/30 transition-all"
                            >
                              <input 
                                type="text"
                                value={group}
                                onChange={(e) => {
                                  setLevels(levels.map(l => {
                                    if (l.id === level.id) {
                                      const newGroups = [...l.groups];
                                      newGroups[idx] = e.target.value;
                                      return { ...l, groups: newGroups };
                                    }
                                    return l;
                                  }));
                                }}
                                className="text-primary bg-transparent border-none focus:ring-0 p-0 w-full font-bold text-sm"
                              />
                              <button 
                                onClick={() => removeGroup(level.id, idx)}
                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={16} />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Clock className="text-secondary" />
                    مواقيت الحصص التعليمية
                  </h3>
                  <p className="text-secondary text-sm font-bold mb-6">تخصيص قائمة المواقيت المستخدمة في التقارير وسجلات المتابعة.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="مثال: 08:00 - 09:30"
                          className="flex-1 bg-background border-2 border-transparent rounded-2xl px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold"
                          value={newTimeSlot}
                          onChange={(e) => setNewTimeSlot(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
                                setTimeSlots([...timeSlots, newTimeSlot]);
                                setNewTimeSlot('');
                              }
                            }
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            if (newTimeSlot && !timeSlots.includes(newTimeSlot)) {
                              setTimeSlots([...timeSlots, newTimeSlot]);
                              setNewTimeSlot('');
                            }
                          }}
                          className="bg-primary text-white p-4 rounded-2xl shadow-lg hover:opacity-90 transition-all active:scale-95"
                        >
                          <Plus size={24} />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {timeSlots.map((slot, index) => (
                          <div 
                            key={index}
                            className="flex items-center gap-2 bg-background px-4 py-2 rounded-xl border border-outline-variant/20 group"
                          >
                            <span className="font-bold text-primary">{slot}</span>
                            <button 
                              type="button"
                              onClick={() => setTimeSlots(timeSlots.filter((_, i) => i !== index))}
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-lg p-1"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-6 rounded-[32px] border border-blue-100">
                      <h4 className="font-black text-blue-900 mb-2 flex items-center gap-2">
                        <AlertCircle size={18} />
                        نصيحة تقنية
                      </h4>
                      <p className="text-sm text-blue-800 leading-relaxed">
                        تظهر هذه المواقيت كقائمة منسدلة (Datalist) عند إدخال الوقت في التقارير اليومية وسجل استعمال الوسائل، مما يسهل عملية الإدخال السريع مع الحفاظ على إمكانية كتابة توقيت مخصص يدوياً.
                      </p>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-12">
                <section>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-primary flex items-center gap-3">
                      <Database className="text-secondary" />
                      إدارة قاعدة البيانات
                    </h3>
                    <Link 
                      to="/database-management"
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                    >
                      <Settings size={14} />
                      فتح لوحة التحكم الكاملة
                    </Link>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-background p-8 rounded-[32px] border border-outline-variant/30 space-y-4">
                      <h4 className="font-black text-primary flex items-center gap-2">
                        <History size={18} />
                        النسخ الاحتياطي
                      </h4>
                      <p className="text-sm text-secondary font-bold leading-relaxed">
                        قم بحماية بياناتك من خلال إنشاء نسخ احتياطية دورية. يمكنك تحميل قاعدة البيانات بالكامل بصيغة JSON.
                      </p>
                      <div className="pt-4 flex gap-3">
                        <Link to="/backup" className="flex-1 bg-primary text-white py-3 rounded-xl font-bold text-center hover:opacity-90 transition-all">
                          مركز النسخ
                        </Link>
                        <button 
                          onClick={() => {
                            window.location.hash = '#/database-management';
                          }}
                          className="flex-1 bg-surface border border-outline-variant/50 text-primary py-3 rounded-xl font-bold hover:bg-background transition-all"
                        >
                          تصدير سريع
                        </button>
                      </div>
                    </div>

                    <div className="bg-background p-8 rounded-[32px] border border-outline-variant/30 space-y-4">
                      <h4 className="font-black text-primary flex items-center gap-2">
                        <CloudUpload size={18} />
                        استيراد البيانات
                      </h4>
                      <p className="text-sm text-secondary font-bold leading-relaxed">
                        هل لديك بيانات سابقة في ملف Excel؟ يمكنك استيراد المواد الكيميائية، الأجهزة، والأساتذة دفعة واحدة.
                      </p>
                      <div className="pt-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full bg-secondary-container text-primary py-3 rounded-xl font-bold hover:bg-primary hover:text-white transition-all"
                        >
                          اختيار ملف Excel (.xlsx)
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <ShieldAlert size={24} className="text-red-600" />
                    صيانة البيانات
                  </h3>
                  <div className="bg-red-50 p-8 rounded-[32px] border border-red-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-right">
                      <h4 className="text-lg font-black text-red-700 mb-1">تفريغ قاعدة البيانات</h4>
                      <p className="text-sm text-red-600/70 font-bold">حذف جميع السجلات والمواد المسجلة بشكل نهائي.</p>
                    </div>
                    <Link 
                      to="/database-management"
                      className="px-8 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                    >
                      بدء عملية المسح
                    </Link>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="space-y-12">
                <section>
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-primary flex items-center gap-3">
                      <Lock className="text-secondary" />
                      أمان الحساب
                    </h3>
                    <button 
                      onClick={handleResetPassword}
                      disabled={isResettingPassword}
                      className="text-sm font-bold text-primary hover:underline flex items-center gap-2"
                    >
                      {isResettingPassword ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                      إرسال رابط إعادة تعيين كلمة المرور
                    </button>
                  </div>
                  <div className="bg-background p-8 rounded-[32px] border border-outline-variant/30">
                    <p className="text-sm font-bold text-secondary mb-6">تغيير كلمة المرور الخاصة بك بانتظام يعزز أمان بياناتك.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-sm font-black text-secondary mr-2">كلمة المرور الجديدة</label>
                          <input 
                            className="w-full bg-surface border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold" 
                            type="password" 
                            placeholder="••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm font-black text-secondary mr-2">تأكيد كلمة المرور</label>
                          <input 
                            className="w-full bg-surface border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold" 
                            type="password" 
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="mt-10 flex flex-col items-center gap-6">
                        <AnimatePresence>
                          {passwordChangeSuccess && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="w-full max-w-sm bg-green-50 text-green-700 p-4 rounded-2xl border border-green-100 flex items-center justify-center gap-2 font-bold text-sm"
                            >
                              <CheckCircle2 size={18} />
                              تم تغيير كلمة المرور بنجاح
                            </motion.div>
                          )}
                          {passwordChangeError && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }} 
                              animate={{ opacity: 1, y: 0 }} 
                              className="w-full max-w-sm bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2 font-bold text-sm"
                            >
                              <ShieldAlert size={18} />
                              {passwordChangeError}
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <button 
                          onClick={handleUpdatePassword}
                          disabled={isUpdatingPassword || !newPassword}
                          className="flex items-center gap-4 px-12 py-5 bg-primary text-white rounded-3xl font-black shadow-[0_15px_40px_rgba(43,61,34,0.3)] hover:scale-[1.03] active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                          {isUpdatingPassword ? (
                            <Loader2 size={24} className="animate-spin" />
                          ) : (
                            <ShieldCheck size={24} />
                          )}
                          تحديث وحفظ كلمة المرور الجديدة
                        </button>
                      </div>
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Users className="text-secondary" />
                    ربط الحسابات
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Google */}
                    <div className="bg-background p-6 rounded-3xl border border-outline-variant/30 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center shadow-sm">
                        <Chrome className="text-[#4285F4]" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">Google</h4>
                        <p className="text-xs text-secondary mt-1">
                          {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') 
                            ? 'مرتبط بنجاح' 
                            : 'غير مرتبط'}
                        </p>
                      </div>
                      {auth.currentUser?.providerData.some(p => p.providerId === 'google.com') ? (
                        <button 
                          onClick={() => unlinkAccount('google.com')}
                          className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                        >
                          إلغاء الربط
                        </button>
                      ) : (
                        <button 
                          onClick={() => linkAccount('google')}
                          className="w-full py-2 bg-[#4285F4] text-white rounded-xl text-sm font-bold hover:bg-[#3367d6] transition-all"
                        >
                          ربط الحساب
                        </button>
                      )}
                    </div>

                    {/* Facebook */}
                    <div className="bg-background p-6 rounded-3xl border border-outline-variant/30 flex flex-col items-center text-center gap-4">
                      <div className="w-12 h-12 bg-surface rounded-2xl flex items-center justify-center shadow-sm">
                        <Facebook className="text-[#1877F2]" size={24} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary">Facebook</h4>
                        <p className="text-xs text-secondary mt-1">
                          {auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') 
                            ? 'مرتبط بنجاح' 
                            : 'غير مرتبط'}
                        </p>
                      </div>
                      {auth.currentUser?.providerData.some(p => p.providerId === 'facebook.com') ? (
                        <button 
                          onClick={() => unlinkAccount('facebook.com')}
                          className="w-full py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-all"
                        >
                          إلغاء الربط
                        </button>
                      ) : (
                        <button 
                          onClick={() => linkAccount('facebook')}
                          className="w-full py-2 bg-[#1877F2] text-white rounded-xl text-sm font-bold hover:bg-[#166fe5] transition-all"
                        >
                          ربط الحساب
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Database className="text-secondary" />
                    قاعدة البيانات والنسخ الاحتياطي
                  </h3>
                  <div className="bg-primary text-white p-10 rounded-[40px] relative overflow-hidden group shadow-2xl">
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-surface/10 rounded-2xl backdrop-blur-md">
                              <History size={24} className="text-primary-fixed" />
                            </div>
                            <div>
                              <p className="text-xs font-black opacity-60 uppercase tracking-widest">آخر مزامنة</p>
                              <p className="text-lg font-bold">منذ 12 دقيقة (تلقائياً)</p>
                            </div>
                          </div>
                          <p className="text-sm opacity-70 max-w-md leading-relaxed">يتم حفظ كافة التغييرات التي تجريها في السحابة بشكل فوري. يمكنك أيضاً إنشاء نسخة يدوية للتحميل.</p>
                        </div>
                        <div className="flex flex-col md:flex-row gap-4">
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleImportXLS} 
                            className="hidden" 
                            accept=".xls,.xlsx"
                          />
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isImporting}
                            className="bg-surface/10 text-white px-8 py-5 rounded-[24px] font-black flex items-center gap-3 hover:bg-surface/20 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                          >
                            {isImporting ? (
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <FileUp size={24} />
                            )}
                            استيراد من XLS
                          </button>
                          <button className="bg-primary-fixed text-primary px-8 py-5 rounded-[24px] font-black flex items-center gap-3 hover:bg-surface transition-all shadow-xl hover:-translate-y-1 active:translate-y-0">
                            <CloudUpload size={24} />
                            تصدير نسخة احتياطية (.json)
                          </button>
                        </div>
                      </div>
                    </div>
                    <Database className="absolute -bottom-12 -left-12 text-white/5 w-64 h-64 rotate-12 group-hover:rotate-0 transition-transform duration-1000" />
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-primary flex items-center gap-3">
                      <ShieldAlert className="text-red-500" />
                      مصحح الصلاحيات المتقدم
                    </h3>
                    
                    <button
                      onClick={fixPermissions}
                      disabled={isFixingPermissions}
                      className="bg-red-500 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isFixingPermissions ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                      بدء فحص وإصلاح الصلاحيات
                    </button>
                  </div>

                  <div className="bg-background p-8 rounded-[32px] border-2 border-red-100/50">
                    <p className="text-sm font-bold text-secondary mb-6">سيقوم نظام الفحص بمحاولة كتابة بيانات تجريبية في المسارات المطلوبة للكشف عن أي عوائق في الصلاحيات.</p>
                    
                    <div className="space-y-4">
                      {fixResults.map((res, i) => (
                        <div key={i} className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-outline-variant/20">
                          <div className="flex items-center gap-3">
                            {res.success ? (
                              <CheckCircle2 size={20} className="text-green-500" />
                            ) : (
                              <AlertCircle size={20} className="text-red-500" />
                            )}
                            <span className="font-bold text-primary">{res.name}</span>
                          </div>
                          {!res.success && (
                            <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full font-mono">
                              {res.error}
                            </span>
                          )}
                          {res.success && (
                            <span className="text-[10px] bg-green-50 text-green-600 px-3 py-1 rounded-full font-bold">
                              جاهز للعمل
                            </span>
                          )}
                        </div>
                      ))}
                      {fixResults.length === 0 && !isFixingPermissions && (
                        <div className="text-center py-6 opacity-30">
                          <Shield size={48} className="mx-auto mb-2" />
                          <p className="text-xs font-bold">اضغط على الزر أعلاه لبدء الاختبار</p>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Database className="text-secondary" />
                    حالة الاتصال بقاعدة البيانات
                  </h3>
                  <div className="bg-background p-8 rounded-[32px] border-2 border-dashed border-outline-variant/30">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="text-right">
                        <h4 className="text-lg font-black text-primary mb-1">اختبار الاتصال بـ Firestore</h4>
                        <p className="text-sm text-secondary opacity-80">تأكد من أن قاعدة البيانات مفعلة وتعمل بشكل صحيح في Firebase Console.</p>
                      </div>
                      <button
                        onClick={checkConnection}
                        disabled={isCheckingConnection}
                        className={cn(
                          "px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-lg active:scale-95",
                          connectionStatus === 'success' ? "bg-green-600 text-white" :
                          connectionStatus === 'error' ? "bg-red-600 text-white" :
                          "bg-primary text-white hover:opacity-90"
                        )}
                      >
                        {isCheckingConnection ? (
                          <>
                            <Loader2 size={20} className="animate-spin" />
                            جاري الاختبار...
                          </>
                        ) : connectionStatus === 'success' ? (
                          <>
                            <CheckCircle2 size={20} />
                            متصل بنجاح
                          </>
                        ) : connectionStatus === 'error' ? (
                          <>
                            <AlertCircle size={20} />
                            فشل الاتصال
                          </>
                        ) : (
                          <>
                            <Globe size={20} />
                            اختبار الآن
                          </>
                        )}
                      </button>
                    </div>
                    {connectionStatus === 'error' && (
                      <div className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-sm font-bold">
                        <p className="mb-2">يبدو أن قاعدة البيانات غير مفعلة. يرجى اتباع الخطوات التالية:</p>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>افتح <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/firestore`} target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a></li>
                          <li>اضغط على "Create database"</li>
                          <li>اختر "Production mode"</li>
                          <li>قم بنشر القواعد (Rules) الموجودة في ملف firestore.rules</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </section>

                <section className="pt-12 border-t border-outline-variant/20">
                  <h3 className="text-2xl font-black text-primary mb-8 flex items-center gap-3">
                    <Globe className="text-secondary" />
                    تفضيلات النظام
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">لغة الواجهة</label>
                      <select className="w-full bg-background border-2 border-transparent rounded-[20px] px-6 py-4 focus:ring-0 focus:border-primary transition-all font-bold appearance-none">
                        <option>العربية (الافتراضية)</option>
                        <option>Français (قريباً)</option>
                        <option>English (قريباً)</option>
                      </select>
                    </div>
                    <div className="space-y-3">
                      <label className="text-sm font-black text-secondary mr-2">الوضع الليلي</label>
                      <div className="flex items-center gap-4 bg-background p-4 rounded-[20px] border-2 border-transparent">
                        <div className="w-12 h-6 bg-outline-variant rounded-full relative cursor-not-allowed opacity-50">
                          <div className="absolute left-1 top-1 w-4 h-4 bg-surface rounded-full" />
                        </div>
                        <span className="text-sm font-bold text-secondary opacity-50">غير متاح حالياً</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </motion.div>

          <AnimatePresence>
            {/* Phone linking UI removed */}
          </AnimatePresence>
        </main>
      </div>

      {/* Floating Save Bar */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-primary text-white py-5 rounded-[28px] font-black shadow-[0_20px_50px_rgba(43,61,34,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-4 border border-white/10"
        >
          {isSaving ? (
            <>
              <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              <span className="text-lg">جاري المزامنة...</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={24} />
              <span className="text-lg">تثبيت كافة التغييرات</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
