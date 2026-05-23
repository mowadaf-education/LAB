import React from 'react';
import { Trash2, ShieldAlert, Lock, ArrowRight, Mail, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface p-8 lg:p-24 rtl font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-surface rounded-[40px] shadow-2xl border border-outline/10 p-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-error/10 rounded-3xl text-error">
            <Trash2 size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-error font-serif">تعليمات حذف بيانات المستخدم</h1>
            <p className="text-on-surface/60 font-bold">آخر تحديث: 1 أفريل 2026</p>
          </div>
        </div>

        <div className="space-y-12 text-lg leading-relaxed text-on-surface/80">
          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <ShieldAlert size={24} /> 1. نظرة عامة
            </h2>
            <p>
              نحن نحترم خصوصيتك ونوفر لك التحكم الكامل في بياناتك الشخصية. إذا كنت ترغب في حذف بياناتك المرتبطة بتطبيقنا، يرجى اتباع التعليمات أدناه.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <Lock size={24} /> 2. كيفية طلب حذف البيانات
            </h2>
            <p>
              يمكنك طلب حذف بياناتك من خلال إحدى الطرق التالية:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-4 mr-4">
              <li className="flex items-start gap-3">
                <span className="font-bold">من خلال التطبيق:</span> قم بتسجيل الدخول إلى حسابك، واذهب إلى صفحة الإعدادات، ثم اختر "حذف الحساب". سيؤدي ذلك إلى حذف جميع بياناتك الشخصية وتاريخ نشاطك بشكل دائم.
              </li>
              <li className="flex items-start gap-3">
                <span className="font-bold">عبر البريد الإلكتروني:</span> أرسل طلباً إلى <span className="text-primary font-bold">faycalassoul@gmail.com</span> مع ذكر عنوان البريد الإلكتروني المرتبط بحسابك. سنقوم بمعالجة طلبك في غضون 7 أيام عمل.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <HelpCircle size={24} /> 3. ماذا يحدث عند حذف البيانات؟
            </h2>
            <p>
              بمجرد معالجة طلب الحذف:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 mr-4">
              <li>سيتم حذف معلومات ملفك الشخصي بالكامل من خوادمنا.</li>
              <li>سيتم إلغاء ربط حسابك بأي خدمات طرف ثالث (مثل فيسبوك أو جوجل).</li>
              <li>لن تتمكن من استعادة بياناتك أو الوصول إلى حسابك مرة أخرى.</li>
            </ul>
          </section>

          <section className="bg-surface-container-high p-8 rounded-3xl border border-outline/10">
            <h2 className="text-xl font-black text-primary mb-4 flex items-center gap-3">
              <Mail size={24} /> هل لديك أسئلة؟
            </h2>
            <p className="text-base">
              إذا كان لديك أي استفسار حول عملية حذف البيانات، يرجى عدم التردد في الاتصال بنا عبر البريد الإلكتروني المذكور أعلاه.
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
