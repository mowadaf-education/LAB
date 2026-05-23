import React from 'react';
import { ArrowRight, Shield, Lock, Eye, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface p-8 lg:p-24 rtl font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-surface rounded-[40px] shadow-2xl border border-outline/10 p-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-primary/10 rounded-3xl text-primary">
            <Shield size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-primary font-serif">سياسة الخصوصية</h1>
            <p className="text-on-surface/60 font-bold">آخر تحديث: 1 أفريل 2026</p>
          </div>
        </div>

        <div className="space-y-12 text-lg leading-relaxed text-on-surface/80">
          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <Eye size={24} /> 1. جمع المعلومات
            </h2>
            <p>
              نحن نجمع المعلومات التي تقدمها لنا مباشرة عند استخدام تطبيقنا، بما في ذلك عند إنشاء حساب أو تسجيل الدخول عبر خدمات الطرف الثالث مثل جوجل وفيسبوك. قد تشمل هذه المعلومات:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 mr-4">
              <li>الاسم والبريد الإلكتروني.</li>
              <li>معلومات الملف الشخصي العامة المتاحة من خلال مزودي خدمة تسجيل الدخول.</li>
              <li>البيانات التي تدخلها في النظام لإدارة المخابر.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <Lock size={24} /> 2. استخدام المعلومات
            </h2>
            <p>
              نستخدم المعلومات التي نجمعها لتقديم خدماتنا وتحسينها، وتخصيص تجربتك، والتواصل معك بشأن حسابك أو تحديثات النظام. نحن لا نبيع معلوماتك الشخصية لأطراف ثالثة.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <FileText size={24} /> 3. حماية البيانات
            </h2>
            <p>
              نحن نتخذ إجراءات أمنية تقنية وتنظيمية معقولة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو الكشف عنها أو تغييرها أو إتلافها. يتم تخزين جميع البيانات بشكل آمن باستخدام خدمات Firebase.
            </p>
            <h3 className="text-xl font-bold text-primary mt-4 mb-2">تشفير البيانات وحمايتها</h3>
            <p>
              يتم تأمين جميع البيانات المتبادلة باستخدام تقنيات تشفير متقدمة (SSL/TLS).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <ArrowRight size={24} /> 4. حقوقك
            </h2>
            <p>
              لديك الحق في الوصول إلى معلوماتك الشخصية أو تصحيحها أو طلب حذفها في أي وقت. يمكنك القيام بذلك من خلال إعدادات حسابك أو الاتصال بنا مباشرة.
            </p>
          </section>
        </div>

        <div className="mt-16 pt-10 border-t border-outline/10 text-center">
          <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-3 text-primary font-black hover:underline">
            <ArrowRight size={20} /> العودة لصفحة تسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  );
}
