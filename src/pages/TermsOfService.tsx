import React from 'react';
import { ArrowRight, Scale, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../config/routes';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-surface-container-low text-on-surface p-8 lg:p-24 rtl font-sans" dir="rtl">
      <div className="max-w-4xl mx-auto bg-surface rounded-[40px] shadow-2xl border border-outline/10 p-12">
        <div className="flex items-center gap-4 mb-12">
          <div className="p-4 bg-primary/10 rounded-3xl text-primary">
            <Scale size={40} />
          </div>
          <div>
            <h1 className="text-4xl font-black text-primary font-serif">شروط الخدمة</h1>
            <p className="text-on-surface/60 font-bold">آخر تحديث: 1 أفريل 2026</p>
          </div>
        </div>

        <div className="space-y-12 text-lg leading-relaxed text-on-surface/80">
          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <ShieldCheck size={24} /> 1. قبول الشروط
            </h2>
            <p>
              باستخدامك لهذا التطبيق، فإنك توافق على الالتزام بشروط الخدمة هذه. إذا كنت لا توافق على أي جزء من هذه الشروط، فيرجى عدم استخدام التطبيق.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <FileText size={24} /> 2. وصف الخدمة
            </h2>
            <p>
              يوفر هذا التطبيق نظاماً رقمياً لتسيير المخابر العلمية في المؤسسات التربوية، بما في ذلك جرد المواد الكيميائية، متابعة المعدات، وإعداد التقارير البيداغوجية.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <AlertCircle size={24} /> 3. مسؤوليات المستخدم
            </h2>
            <ul className="list-disc list-inside mt-4 space-y-2 mr-4">
              <li>يجب أن تكون موظفاً معتمداً في مؤسسة تربوية لاستخدام هذا النظام.</li>
              <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور.</li>
              <li>تتعهد باستخدام النظام للأغراض المهنية والبيداغوجية فقط.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <ShieldCheck size={24} /> 4. الملكية الفكرية
            </h2>
            <p>
              جميع المحتويات والبرمجيات والعلامات التجارية المرتبطة بهذا التطبيق هي ملك لأصحابها ومحمية بموجب قوانين الملكية الفكرية المعمول بها في الجزائر.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-primary mb-4 flex items-center gap-3">
              <AlertCircle size={24} /> 5. التعديلات على الخدمة
            </h2>
            <p>
              نحتفظ بالحق في تعديل أو تعليق الخدمة في أي وقت دون إشعار مسبق. كما نحتفظ بالحق في تحديث شروط الخدمة هذه من وقت لآخر.
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
