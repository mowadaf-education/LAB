import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  GoogleAuthProvider, 
  FacebookAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, checkIsAdmin } from '../firebase';
import { Beaker, Lock as LockIcon, User, Eye, EyeOff, ArrowLeft, ShieldCheck, Globe, UserPlus, Facebook } from 'lucide-react';
import logo from '/ministry-logo.png';
import { cn } from '../lib/utils';

declare global {
  interface Window {
    grecaptcha: any;
  }
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<React.ReactNode>('');
  const [loading, setLoading] = useState(false);

  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [pendingCred, setPendingCred] = useState<any>(null);
  const [linkingMessage, setLinkingMessage] = useState<string | null>(null);

  useEffect(() => {
    // Dynamic loading of reCAPTCHA Enterprise
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && !document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isFB = ua.indexOf("FBAN") > -1 || ua.indexOf("FBAV") > -1;
    const isIG = ua.indexOf("Instagram") > -1;
    if (isFB || isIG) {
      setIsInAppBrowser(true);
    }

    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          const user = result.user;
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              email: user.email,
              role: (await checkIsAdmin(user)) ? 'Admin' : 'user',
              displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
              photoURL: user.photoURL || null,
              createdAt: new Date().toISOString()
            });
          } else {
            await setDoc(doc(db, 'users', user.uid), {
              photoURL: user.photoURL || null,
              displayName: user.displayName || userDoc.data()?.displayName
            }, { merge: true });
          }
        }
      } catch (err: any) {
        console.error('Redirect result error:', err);
        if (err.code === 'auth/missing-initial-state' || err.code === 'auth/internal-error') {
          setError(
            <div className="text-right p-4 bg-error/5 rounded-2xl border border-error/20">
              <p className="font-black text-error mb-2">فشل تسجيل الدخول بسبب قيود المتصفح.</p>
              <p className="text-xs text-on-surface/70 leading-relaxed">
                يبدو أنك تستخدم متصفحاً مدمجاً (مثل متصفح فيسبوك) يمنع حفظ بيانات الدخول.
              </p>
              <div className="mt-4 space-y-3">
                <button 
                  onClick={() => window.location.href = "https://amatti-education-dz.firebaseapp.com/LAB"}
                  className="w-full bg-primary text-on-primary py-3 rounded-xl text-xs font-black shadow-lg"
                >
                  استخدام الرابط المباشر (موصى به)
                </button>
                <p className="text-[10px] text-center text-on-surface/40">أو قم بفتح هذا الرابط في متصفح Chrome أو Safari</p>
              </div>
            </div>
          );
        } else {
          setError('حدث خطأ أثناء معالجة تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
      }
    };
    checkRedirect();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('يرجى إدخال البريد الإلكتروني أولاً.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setError('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من صندوق الوارد.');
      setIsResetting(false);
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('هذا البريد الإلكتروني غير مسجل لدينا.');
      } else {
        setError('حدث خطأ أثناء محاولة إرسال رابط إعادة التعيين.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!isLogin && password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة.');
      setLoading(false);
      return;
    }

    try {
      // Execute reCAPTCHA Enterprise
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha?.enterprise) {
        await new Promise<void>((resolve) => {
          window.grecaptcha.enterprise.ready(async () => {
            try {
              const token = await window.grecaptcha.enterprise.execute(siteKey, { action: 'LOGIN' });
              console.log('reCAPTCHA Enterprise token:', token);
              resolve();
            } catch (err) {
              console.warn('reCAPTCHA execution failed, continuing login:', err);
              resolve(); 
            }
          });
          // Safety timeout
          setTimeout(resolve, 3000);
        });
      }

      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: (await checkIsAdmin(user)) ? 'Admin' : 'user',
          displayName: user.email?.split('@')[0] || 'مستخدم جديد',
          photoURL: user.photoURL || null,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          <div className="text-right p-4 bg-error/5 rounded-2xl border border-error/20">
            <p className="font-black text-error mb-2">النطاق غير مصرح به</p>
            <p className="text-[10px] mb-3">يجب إضافة هذا النطاق في إعدادات Firebase Console لتفعيل تسجيل الدخول.</p>
            <div className="bg-surface p-2 rounded-lg text-[9px] font-mono mb-4 text-center">{window.location.hostname}</div>
            <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/settings`} target="_blank" rel="noopener noreferrer" className="block w-full bg-primary text-on-primary py-2 rounded-xl text-center text-xs font-black">إعدادات النطاقات</a>
          </div>
        );
      } else if (isLogin) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setError('البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى التأكد من صحة البيانات أو تفعيل خيار تسجيل الدخول بالبريد الإلكتروني في Firebase.');
        } else if (err.code === 'auth/operation-not-allowed') {
          setError('تسجيل الدخول بالبريد الإلكتروني غير مفعل في إعدادات Firebase.');
        } else {
          setError('خطأ في تسجيل الدخول. يرجى التحقق من البيانات أو التأكد من تفعيل خدمات Firebase.');
        }
      } else {
        if (err.code === 'auth/email-already-in-use') {
          setError('هذا البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.');
        } else if (err.code === 'auth/weak-password') {
          setError('كلمة المرور ضعيفة جداً. يجب أن تتكون من 6 أحرف على الأقل.');
        } else if (err.code === 'auth/operation-not-allowed') {
          setError('إنشاء الحساب بالبريد الإلكتروني غير مفعل في إعدادات Firebase.');
        } else {
          setError('فشل إنشاء الحساب. يرجى المحاولة مرة أخرى.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // Execute reCAPTCHA Enterprise
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha?.enterprise) {
        await new Promise<void>((resolve) => {
          window.grecaptcha.enterprise.ready(async () => {
            try {
              const token = await window.grecaptcha.enterprise.execute(siteKey, { action: 'GOOGLE_LOGIN' });
              console.log('reCAPTCHA Enterprise token (Google):', token);
              resolve();
            } catch (err) {
              console.warn('reCAPTCHA execution failed (Google), continuing:', err);
              resolve();
            }
          });
          setTimeout(resolve, 3000);
        });
      }

      if (isMobile()) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // If there's a pending credential, link it now
        if (pendingCred) {
          try {
            await linkWithCredential(user, pendingCred);
            setPendingCred(null);
            setLinkingMessage(null);
            console.log('Account linked successfully');
          } catch (linkErr) {
            console.error('Error linking account:', linkErr);
          }
        }
        
        // Check if user document exists, if not create it
        const userDocGoogle = await getDoc(doc(db, 'users', user.uid));
        if (!userDocGoogle.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            role: (await checkIsAdmin(user)) ? 'Admin' : 'user',
            displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
            photoURL: user.photoURL || null,
            createdAt: new Date().toISOString()
          });
        } else {
          await setDoc(doc(db, 'users', user.uid), {
            photoURL: user.photoURL || null,
            displayName: user.displayName || userDocGoogle.data()?.displayName
          }, { merge: true });
        }
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          <div className="text-right p-4 bg-error/5 rounded-2xl border border-error/20">
            <p className="font-black text-error mb-2">النطاق غير مصرح به (Unauthorized Domain)</p>
            <p className="text-[10px] text-on-surface/70 leading-relaxed mb-3">
              رابط هذا الموقع غير مضاف لقائمة النطاقات المسموح لها بتسجيل الدخول.
            </p>
            <div className="bg-surface p-2 rounded-lg text-[9px] font-mono select-all mb-4 break-all opacity-80 text-center">
              {window.location.hostname}
            </div>
            <a 
              href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/settings`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-primary text-on-primary py-2 rounded-xl text-center text-xs font-black"
            >
              فتح إعدادات Firebase
            </a>
          </div>
        );
      } else if (err.code === 'auth/missing-initial-state') {
        setError(
          <div className="text-right">
            <p>فشل تسجيل الدخول بسبب قيود المتصفح على ملفات تعريف الارتباط (Cookies).</p>
            <p className="mt-2">يرجى تجربة أحد الحلول التالية:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>استخدام متصفح Chrome أو Firefox بدلاً من متصفح فيسبوك المدمج.</li>
              <li>إيقاف "منع التتبع بين المواقع" في إعدادات Safari.</li>
              <li>
                استخدام الرابط المباشر: {' '}
                <a href="https://amatti-education-dz.firebaseapp.com/LAB" className="underline font-black">
                  amatti-education-dz.firebaseapp.com/LAB
                </a>
              </li>
            </ul>
          </div>
        );
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية. يرجى المحاولة مرة أخرى.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('بيانات الاعتماد غير صالحة. قد يكون هناك مشكلة في إعدادات Google Cloud أو انتهت صلاحية الجلسة.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('تسجيل الدخول عبر جوجل غير مفعل في إعدادات Firebase.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email;
        const credential = GoogleAuthProvider.credentialFromError(err);
        
        if (email && credential) {
          setPendingCred(credential);
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            const method = methods[0];
            let providerName = 'طريقة أخرى';
            if (method === 'facebook.com') providerName = 'فيسبوك';
            if (method === 'password') providerName = 'البريد الإلكتروني';
            
            setLinkingMessage(`لديك حساب مفعل مسبقاً عبر ${providerName}. يرجى تسجيل الدخول عبر ${providerName} لربط حساب جوجل الخاص بك تلقائياً.`);
            setError(null);
          } catch (fetchErr) {
            setError('هذا البريد الإلكتروني مرتبط بحساب آخر. يرجى تسجيل الدخول بالطريقة التي استخدمتها سابقاً لربط الحسابات.');
          }
        } else {
          setError('هذا البريد الإلكتروني مرتبط بحساب آخر. يرجى تسجيل الدخول بالطريقة التي استخدمتها سابقاً.');
        }
      } else {
        setError('فشل تسجيل الدخول عبر جوجل. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleFacebookLogin = async () => {
    const provider = new FacebookAuthProvider();
    try {
      // Execute reCAPTCHA Enterprise
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
      if (siteKey && window.grecaptcha?.enterprise) {
        await new Promise<void>((resolve) => {
          window.grecaptcha.enterprise.ready(async () => {
            try {
              const token = await window.grecaptcha.enterprise.execute(siteKey, { action: 'FACEBOOK_LOGIN' });
              console.log('reCAPTCHA Enterprise token (Facebook):', token);
              resolve();
            } catch (err) {
              console.warn('reCAPTCHA execution failed (Facebook), continuing:', err);
              resolve();
            }
          });
          setTimeout(resolve, 3000);
        });
      }

      if (isMobile()) {
        await signInWithRedirect(auth, provider);
      } else {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // If there's a pending credential, link it now
        if (pendingCred) {
          try {
            await linkWithCredential(user, pendingCred);
            setPendingCred(null);
            setLinkingMessage(null);
            console.log('Account linked successfully');
          } catch (linkErr) {
            console.error('Error linking account:', linkErr);
          }
        }
        
        // Check if user document exists, if not create it
        const userDocFB = await getDoc(doc(db, 'users', user.uid));
        if (!userDocFB.exists()) {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            role: (await checkIsAdmin(user)) ? 'Admin' : 'user',
            displayName: user.displayName || user.email?.split('@')[0] || 'مستخدم جديد',
            photoURL: user.photoURL || null,
            createdAt: new Date().toISOString()
          });
        } else {
          await setDoc(doc(db, 'users', user.uid), {
            photoURL: user.photoURL || null,
            displayName: user.displayName || userDocFB.data()?.displayName
          }, { merge: true });
        }
      }
    } catch (err: any) {
      console.error('Facebook login error:', err);
      if (err.code === 'auth/unauthorized-domain') {
        setError(
          <div className="text-right p-4 bg-error/5 rounded-2xl border border-error/20">
            <p className="font-black text-error mb-2">النطاق غير مصرح به</p>
            <p className="text-xs mb-3">أضف هذا النطاق في إعدادات Facebook Authentication:</p>
            <div className="bg-surface p-2 rounded-lg text-[10px] font-mono mb-4 text-center">{window.location.hostname}</div>
            <a href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/settings`} target="_blank" rel="noopener noreferrer" className="block w-full bg-primary text-on-primary py-2 rounded-xl text-center text-xs font-black">فتح إعدادات Firebase</a>
          </div>
        );
      } else if (err.code === 'auth/missing-initial-state') {
        setError(
          <div className="text-right">
            <p>فشل تسجيل الدخول بسبب قيود المتصفح على ملفات تعريف الارتباط (Cookies).</p>
            <p className="mt-2">يرجى تجربة أحد الحلول التالية:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>استخدام متصفح Chrome أو Firefox بدلاً من متصفح فيسبوك المدمج.</li>
              <li>إيقاف "منع التتبع بين المواقع" في إعدادات Safari.</li>
              <li>
                استخدام الرابط المباشر: {' '}
                <a href="https://amatti-education-dz.firebaseapp.com/LAB" className="underline font-black">
                  amatti-education-dz.firebaseapp.com/LAB
                </a>
              </li>
            </ul>
          </div>
        );
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setError('تم إغلاق نافذة تسجيل الدخول قبل اكتمال العملية. يرجى المحاولة مرة أخرى.');
      } else if (err.code === 'auth/invalid-credential') {
        setError(
          <span className="flex flex-col items-center gap-1 justify-center text-center">
            <span>بيانات الاعتماد غير صالحة. يرجى التأكد من صحة "App Secret" في إعدادات فيسبوك بـ Firebase.</span>
            <a 
              href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-black text-[10px]"
            >
              تحقق من الإعدادات هنا
            </a>
          </span>
        );
      } else if (err.code === 'auth/operation-not-allowed') {
        setError(
          <span className="flex items-center gap-1 justify-center">
            تسجيل الدخول عبر فيسبوك غير مفعل. يرجى تفعيله من{' '}
            <a 
              href={`https://console.firebase.google.com/project/${auth.app.options.projectId}/authentication/providers`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-black"
            >
              Firebase Console
            </a>
          </span>
        );
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        const email = err.customData?.email;
        const credential = FacebookAuthProvider.credentialFromError(err);
        
        if (email && credential) {
          setPendingCred(credential);
          try {
            const methods = await fetchSignInMethodsForEmail(auth, email);
            const method = methods[0];
            let providerName = 'طريقة أخرى';
            if (method === 'google.com') providerName = 'جوجل';
            if (method === 'password') providerName = 'البريد الإلكتروني';
            
            setLinkingMessage(`لديك حساب مفعل مسبقاً عبر ${providerName}. يرجى تسجيل الدخول عبر ${providerName} لربط حساب فيسبوك الخاص بك تلقائياً.`);
            setError(null);
          } catch (fetchErr) {
            setError('هذا البريد الإلكتروني مرتبط بحساب آخر. يرجى تسجيل الدخول بالطريقة التي استخدمتها سابقاً لربط الحسابات.');
          }
        } else {
          setError('هذا البريد الإلكتروني مرتبط بحساب آخر. يرجى تسجيل الدخول بالطريقة التي استخدمتها سابقاً.');
        }
      } else {
        setError('فشل تسجيل الدخول عبر فيسبوك. يرجى المحاولة مرة أخرى.');
      }
    }
  };

  return (
    <div className="bg-surface-container-low text-on-surface min-h-screen flex overflow-hidden rtl font-sans" dir="rtl">
      {/* Left Panel: Photo Mosaic (70%) */}
      <section className="hidden md:flex md:w-[70%] relative bg-primary-dim p-8 flex-col justify-between overflow-hidden">
        {/* Background Mosaic Overlay */}
        <div className="absolute inset-0 opacity-40 z-0 p-4">
          <div className="mosaic-container">
            <div className="rounded-xl overflow-hidden shadow-lg bg-surface-variant col-span-2 row-span-1">
              <img className="w-full h-full object-cover" data-alt="Science laboratory with microscopes and glass tubes" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3v04XZdR-wrr-yl9jm1TwqSzZh1tB2Q_b2seHi78Pot77MsMKUR_IfLse_SOAchzoJnl9_QyxHYtsxc5wu26u4ADOAzYFgqR8gRymImjjvvT-bDPHvCmLBkeobQG0AcqNGd6vHpntlBztJ221uKcrlHe0ThJ4WLglF7F8BkpxNeqIax36ScCmlka5P905m6gshhHSbmcp0nBeSVUvuNGqULHF4tyOFKqEbn_cMXOMT09UhVajKnS6za7T-T9mTkBJ2In2H4Gg4-4" referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg bg-surface-variant">
              <img className="w-full h-full object-cover" data-alt="Close up of chemical reaction in test tube" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAK-3rZyvrCfdVxOKdAv8bR1wO3FG3vheJUtH9H5Ex6zmXLnSMqqvrqhqLhZXr-6EEUg-clmsiUqfrTsT1ayjC0cfDHAklAFpmlB_La9uV4hegLKAEzWA_Scf12WX5ykbgzB2227HIREHQucl3l3EeUV2SL95ZqqHw9nCMheHY__u9TTVVC9hBrFiiw9R880kRD_glE_Pjt0M0CNkxq6dYlHNg7u1HGqhuSpviq15SPp7kowsWvvkdEoHYO8CnbbPB1gy4UJ5uS9-A" referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg bg-surface-variant">
              <img className="w-full h-full object-cover" data-alt="Modern high school laboratory environment" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtQbiu329wvWJUIPV7-dHHkB8scwVlkjW0CxzAb_jkwQ6-Jqn63-dlCNl0PIsaUnxNqzFMH9zmVdgX-RtWbyQKYuFzHRViVJn_UlEhK6C2r6147LwlOE-LDSfsF6-3rO1m8ZGQmjw3w5iq5CzTZaOLjBIom_GHbBVKM-FZDGeaL6tVwLDqp7x72FMHHSedgxS_qQRRgpORxw5gS5pl43CsOClujg6hvVlI6CaFojkEIwLaHIA2svKzfvfdOhanjdfvx6qXY3yBcjs" referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg bg-surface-variant">
              <img className="w-full h-full object-cover" data-alt="Scientist working with laboratory equipment" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDPFGMsi61n29fUlKz-g9O3v3RDqIUPJA-Hd-3Eu1vZT6fsKe2dpWiZ7MV1j0aH8pGMUtKYujyGg7yo14gbULLD8FmKF7ag0U5RHVEmXsc0-SeQNOp9JnqjZbQQBPm2DpU7SYOV219H8rSwcmew0izuW-mE8sbqaY5a5URddDsyPQSPBpaQ6Jo9iOTwSDEdGfgCNZQHKxaiBQCz14goom5XhB_lg9h57mvcwYPBjAvGFjRkoFxUUx7K_wexj5aaQKzt7e0fzITXWS8" referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg bg-surface-variant">
              <img className="w-full h-full object-cover" data-alt="Algerian school science lab workspace" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuu21W2NVmM2_12ChkPiiiSFralvib0a8U_lpsxVaAOqbHci_xBeb_JzUYm5XLunM43cDfllelPvxX21ruhld2KlTUw8FSodp75yDnZJzIIlbv6blmsbjAaJu19MR8mfi4mkJ-073-m-tswkhO1H2z5du4QRJq_lTCwpirBx8j-3zaZds9KBDsILc4gumE1CcSVNFpmJ0c6dju6Es6rRVo4hqT49j8sgYAEeY1qdkH9a0CkPRigO2YkJrX33Zkvautpubi87g-m7Y" referrerPolicy="no-referrer" />
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg bg-surface-variant col-span-3">
              <img className="w-full h-full object-cover" data-alt="Wide shot of a sterile chemistry lab" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKE46oqP3asuAvBjP-Hbs9AphtR1hQhiUXym8bmOEbovjI2BcbP075NU0xdSxp50PTKaBRjjHn2tO1ozFJVbbq5GpO8GPcAERHD_1KFsRVd_M2IynoapJLG6EskcDp2411e4OfDTd5C4-A9CHkE2f0MV-JA5U3kV0hKrkoknyJ-T-Qo9aKT1jeY8PQ5v3iQ2C0U7auDz0zTqzkG3Zyh8sjQNlmVa1n_XLRzz7DzE34FdleIFAZmGjCr1H89O7ZD8hZfTfvygnhaZU" referrerPolicy="no-referrer" />
            </div>
          </div>
        </div>
        {/* Gradient Layer */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#415437]/90 via-[#415437]/70 to-transparent z-10"></div>
        {/* Branding Content */}
        <div className="relative z-20 h-full flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-surface/10 backdrop-blur-md rounded-2xl flex items-center justify-center p-2 shadow-lg">
              <img 
                src={logo}
                alt="Ministry Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-white text-3xl font-black tracking-tight leading-none">الأرضية الرقمية</h1>
              <p className="text-secondary-fixed opacity-90 text-sm mt-1">فضاء موظفوا المخابر</p>
            </div>
          </div>
          <div className="mt-auto">
            <h2 className="text-white text-6xl font-black mb-4 leading-tight">التميز العلمي في <br />قلب المنظومة التربوية</h2>
            <p className="text-surface-container-low text-xl max-w-lg leading-relaxed opacity-80">
              نظام رقمي متطور مصمم خصيصاً لتلبية احتياجات المخابر العلمية في المؤسسات التربوية الجزائرية، لضمان جرد دقيق ومتابعة بيداغوجية فعالة.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-10 gap-y-4 text-on-primary/40 text-xs font-black uppercase tracking-widest">
            <span className="flex items-center gap-2">
              <Globe size={14} aria-hidden="true" /> وزارة التربية الوطنية
            </span>
            <Link className="hover:text-on-primary transition-colors" to="/privacy-policy">سياسة الخصوصية</Link>
            <Link className="hover:text-on-primary transition-colors" to="/terms-of-service">شروط الخدمة</Link>
            <Link className="hover:text-on-primary transition-colors" to="/data-deletion">حذف البيانات</Link>
          </div>
        </div>
      </section>

      {/* Right Panel: Auth Form (30%) */}
      <main className="w-full lg:w-[30%] bg-surface-container-low relative flex flex-col items-center justify-center p-4 md:p-8 lg:p-10 overflow-y-auto">
        {/* Decorative Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>
        
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-4 md:mb-6">
            {isInAppBrowser && (
              <div className="mb-3 p-2 bg-primary/10 rounded-2xl border border-primary/20 text-right">
                <p className="text-[9px] font-black text-primary mb-1 flex items-center gap-2">
                  <Globe size={10} /> تنبيه لمستخدمي فيسبوك/إنستغرام
                </p>
                <p className="text-[8px] text-on-surface/70 leading-relaxed mb-1.5">
                  لتجنب مشاكل تسجيل الدخول، يفضل فتح الموقع في متصفح خارجي أو استخدام الرابط المباشر.
                </p>
                <button 
                  onClick={() => window.location.href = "https://amatti-education-dz.firebaseapp.com/LAB"}
                  className="w-full bg-primary text-on-primary py-1 rounded-lg text-[8px] font-black"
                >
                  فتح الرابط المباشر المستقر
                </button>
              </div>
            )}
            <img 
              src={logo}
              alt="Logo" 
              className="w-32 h-32 md:w-40 md:h-40 object-contain mx-auto mb-6"
              referrerPolicy="no-referrer"
            />
            <h3 className="text-lg md:text-xl font-black text-primary mb-0.5 font-serif tracking-tight">الأرضية الرقمية — فضاء موظفوا المخابر</h3>
            <p className="text-on-surface/60 font-bold text-xs md:text-sm">نظام تسيير المخابر العلمية — فضاء الموظفين</p>
            {!isLogin && (
              <div className="mt-3 inline-flex items-center px-4 py-1.5 bg-primary/10 rounded-full text-primary text-[10px] font-black uppercase tracking-widest">
                <UserPlus size={12} className="ml-1.5" />
                إنشاء حساب جديد
              </div>
            )}
          </div>

          {isResetting ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-black text-primary">إعادة تعيين كلمة المرور</h4>
                <p className="text-on-surface/60 text-sm">أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة التعيين.</p>
                <p className="text-[10px] text-error font-bold mt-2 italic">ملاحظة: إذا لم تجد الرسالة، يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam).</p>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mr-2" htmlFor="reset-email">البريد الإلكتروني</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-on-surface/30 group-focus-within:text-primary transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    className="w-full bg-surface border-2 border-transparent focus:border-primary/20 focus:bg-surface rounded-[20px] py-3.5 pr-12 pl-5 text-on-surface font-bold placeholder-on-surface/20 shadow-sm focus:shadow-xl transition-all outline-none text-sm"
                    id="reset-email" 
                    type="email" 
                    placeholder="name@institution.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              {linkingMessage && (
                <div className="bg-primary/10 text-primary text-[10px] font-black p-3 rounded-2xl text-center border border-primary/20 mb-4 flex items-center gap-2 justify-center">
                  <Globe size={14} />
                  {linkingMessage}
                </div>
              )}

              {error && (
                <div className={cn(
                  "text-xs font-black p-4 rounded-2xl text-center border animate-shake",
                  typeof error === 'string' && error.includes('تم إرسال') ? "bg-primary/10 text-primary border-primary/20" : "bg-error/10 text-error border-error/20"
                )}>
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button 
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary-container text-on-primary font-black py-4 rounded-full shadow-2xl shadow-primary/20 transform active:scale-95 transition-all flex items-center justify-center gap-3 group text-base disabled:opacity-50" 
                  type="submit"
                >
                  <span>{loading ? 'جاري الإرسال...' : 'إرسال رابط التعيين'}</span>
                </button>
                <button 
                  type="button"
                  onClick={() => { setIsResetting(false); setError(''); }}
                  className="text-sm font-bold text-on-surface/60 hover:text-primary transition-colors"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mr-2" htmlFor="email">البريد الإلكتروني</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-on-surface/30 group-focus-within:text-primary transition-colors">
                    <User size={20} />
                  </div>
                  <input 
                    className="w-full bg-surface border-2 border-transparent focus:border-primary/20 focus:bg-surface rounded-[20px] py-3.5 pr-12 pl-5 text-on-surface font-bold placeholder-on-surface/20 shadow-sm focus:shadow-xl transition-all outline-none text-sm"
                    id="email" 
                    type="email" 
                    placeholder="name@institution.dz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mr-2">
                  <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest" htmlFor="password">كلمة المرور</label>
                  {isLogin && (
                    <button 
                      type="button"
                      onClick={() => setIsResetting(true)}
                      className="text-[10px] text-primary font-black hover:underline"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-on-surface/30 group-focus-within:text-primary transition-colors">
                    <LockIcon size={20} />
                  </div>
                  <input 
                    className="w-full bg-surface border-2 border-transparent focus:border-primary/20 focus:bg-surface rounded-[20px] py-3.5 pr-12 pl-12 text-on-surface font-bold placeholder-on-surface/20 shadow-sm focus:shadow-xl transition-all outline-none text-sm"
                    id="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-4 cursor-pointer text-on-surface/30 hover:text-primary transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-on-surface/40 uppercase tracking-widest mr-2" htmlFor="confirmPassword">تأكيد كلمة المرور</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-on-surface/30 group-focus-within:text-primary transition-colors">
                      <ShieldCheck size={20} />
                    </div>
                    <input 
                      className="w-full bg-surface border-2 border-transparent focus:border-primary/20 focus:bg-surface rounded-[20px] py-3.5 pr-12 pl-12 text-on-surface font-bold placeholder-on-surface/20 shadow-sm focus:shadow-xl transition-all outline-none text-sm"
                      id="confirmPassword" 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 left-0 flex items-center pl-4 cursor-pointer text-on-surface/30 hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              {linkingMessage && (
                <div className="bg-primary/10 text-primary text-[10px] font-black p-3 rounded-2xl text-center border border-primary/20 mb-4 flex items-center gap-2 justify-center">
                  <Globe size={14} />
                  {linkingMessage}
                </div>
              )}

              {error && (
                <div className="bg-error/10 text-error text-[10px] font-black p-3 rounded-2xl text-center border border-error/20 animate-shake">
                  {error}
                </div>
              )}

              <button 
                disabled={loading}
                className="w-full bg-primary hover:bg-primary-container text-on-primary font-black py-4 rounded-full shadow-2xl shadow-primary/20 transform active:scale-95 transition-all flex items-center justify-center gap-3 group text-base disabled:opacity-50 disabled:active:scale-100" 
                type="submit"
              >
                <span>{loading ? 'جاري التحميل...' : (isLogin ? 'دخول إلى النظام' : 'إنشاء الحساب')}</span>
                <ArrowLeft className="group-hover:-translate-x-2 transition-transform" size={20} />
              </button>
            </form>
          )}

          <div className="text-center mt-2">
            <button 
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-xs font-bold text-on-surface/60 hover:text-primary transition-colors"
            >
              {isLogin ? 'ليس لديك حساب؟ إنشاء حساب جديد' : 'لديك حساب بالفعل؟ تسجيل الدخول'}
            </button>
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-outline/10"></div></div>
            <span className="relative px-4 bg-surface-container-low text-[9px] font-black text-on-surface/30 uppercase tracking-[0.3em]">أو</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-surface border-2 border-outline/10 hover:border-primary/30 text-on-surface font-black py-3 rounded-full transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-95 text-xs"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4 ml-1" alt="Google" />
              {isLogin ? 'جوجل' : 'جوجل'}
            </button>

            <button 
              type="button"
              onClick={handleFacebookLogin}
              className="w-full bg-[#1877F2] hover:bg-[#166fe5] text-white font-black py-3 rounded-full transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md active:scale-95 text-xs"
            >
              <Facebook size={18} className="ml-1" />
              {isLogin ? 'فيسبوك' : 'فيسبوك'}
            </button>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[10px] font-bold text-on-surface/60 border-t border-outline/10 pt-6 w-full max-w-md mx-auto">
            <Link className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4" to="/privacy-policy">سياسة الخصوصية</Link>
            <Link className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4" to="/terms-of-service">شروط الخدمة</Link>
            <Link className="hover:text-primary transition-colors underline decoration-primary/30 underline-offset-4" to="/data-deletion">حذف البيانات</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

