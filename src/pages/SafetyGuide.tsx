import React, { useState } from 'react';
import { 
  ShieldAlert, 
  Flame, 
  Droplets, 
  Wind, 
  Zap, 
  Eye, 
  Stethoscope, 
  Sparkles, 
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Skull,
  Radiation,
  Biohazard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";


// Pre-defined protocols
const PROTOCOLS = [
  {
    id: 'chemical-burns',
    title: 'الحروق الكيميائية (سائل)',
    icon: Droplets,
    color: 'text-error',
    steps: [
      'نزع الملابس الملوثة بالمادة فوراً.',
      'غسل المنطقة المصابة بتيار من الماء الفاتر لمدة 20 دقيقة على الأقل.',
      'إذا كانت المادة صلبة (بودرة)، يجب مسحها جفافاً قبل الغسل بالماء.',
      'تغطية الحرق بضمادة معقمة غير لاصقة.',
      'طلب المساعدة الطبية فوراً.'
    ]
  },
  {
    id: 'eye-contact',
    title: 'تلوث العينين',
    icon: Eye,
    color: 'text-blue-500',
    steps: [
      'التوجيه فوراً نحو محطة غسل العينين.',
      'إبقاء جفون العين مفتوحة بالقوة أثناء الغسل.',
      'غسل العين بالماء لمدة لا تقل عن 15 دقيقة.',
      'تحريك مقلة العين في جميع الاتجاهات لضمان التطهير.',
      'مراجعة طبيب المختص فوراً.'
    ]
  },
  {
    id: 'inhalation',
    title: 'استنشاق الأبخرة',
    icon: Wind,
    color: 'text-tertiary',
    steps: [
      'نقل المصاب إلى الهواء الطلق فوراً.',
      'فك الملابس الضيقة حول الرقبة.',
      'إذا كان المصاب لا يتنفس، ابدأ في الإنعاش القلبي الرئوي (CPR).',
      'توفير التدفئة والراحة للمصاب.',
      'الاحتفاظ بملصق المادة (SDS) لتقديمه للفريق الطبي.'
    ]
  },
  {
    id: 'swallowing',
    title: 'ابتلاع مواد كيميائية',
    icon: Stethoscope,
    color: 'text-purple-500',
    steps: [
      'لا تجبر المصاب على التقيؤ أبداً ما لم يطلب الطبيب ذلك.',
      'لا تعطه أي شيء عن طريق الفم إذا كان فاقداً للوعي أو يعاني من تشنجات.',
      'إذا كان واعياً، اطلب منه المضمضة بالماء وبصقه.',
      'اتصل بمركز مكافحة السموم أو الإسعاف فوراً.',
      'احتفظ بالعبوة الأصلية للمادة المبتلعة.'
    ]
  },
  {
    id: 'broken-glass',
    title: 'جروح الزجاج المكسور',
    icon: Sparkles,
    color: 'text-rose-500',
    steps: [
      'لا تحاول نزع شظايا الزجاج العميقة من الجرح.',
      'اغسل الجرح السطحي بالماء والصابون إذا لم يكن هناك نزيف حاد.',
      'اضغط بقطعة قماش نظيفة أو ضمادة معقمة لوقف النزيف.',
      'في حال تلوث الزجاج بمواد كيميائية، تعامل مع الجرح كحرق كيميائي أولاً.',
      'قم بتأمين المنطقة لتجنب إصابة آخرين.'
    ]
  },
  {
    id: 'gas-leak',
    title: 'تسرب غاز (موقد بنزن)',
    icon: Flame,
    color: 'text-orange-600',
    steps: [
      'إغلاق صمام الغاز الرئيسي للمخبر فوراً.',
      'إطفاء أي لهب مكشوف في المنطقة.',
      'فتح جميع النوافذ لتهوية المكان.',
      'عدم تشغيل أو إطفاء أي مفاتيح كهربائية لتجنب شرارة الانفجار.',
      'إخلاء المخبر إذا كانت رائحة الغاز قوية.'
    ]
  },
  {
    id: 'fire',
    title: 'الحرائق الكهربائية',
    icon: Zap,
    color: 'text-yellow-600',
    steps: [
      'فصل التيار الكهربائي عن المصدر إذا كان آمناً.',
      'استخدام مطفأة الحريق من نوع CO2 (ثاني أكسيد الكربون) أو المسحوق الجاف فقط.',
      'لا تستخدم الماء أبداً لإخماد حريق كهربائي.',
      'إخلاء المخبر في حال اتساع رقعة الحريق.',
      'إبلاغ الحماية المدنية.'
    ]
  }
];

export default function SafetyGuide() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleAskEmergency = async () => {
    if (!query.trim()) return;
    setLoadingAi(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY || '' });
      
      const prompt = `You are an expert laboratory safety officer. 
      A technician in a high school lab is facing an emergency: "${query}".
      Provide immediate, clear, and scientific first aid steps in Arabic. 
      Use a bulleted list. 
      Include a warning if the situation is critical. 
      Keep it brief and actionable. 
      Ensure the terminology matches Algerian school laboratory standards.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      setAiResponse(result.text || "لم يتم الحصول على رد. يرجى المحاولة لاحقاً.");
    } catch (error) {
      console.error(error);
      setAiResponse("عذراً، حدث خطأ في الاتصال بالذكاء الاصطناعي. يرجى مراجعة البروتوكولات الورقية الرسمية.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="p-8 pb-32 max-w-7xl mx-auto">
      
      
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-4 flex items-center gap-3">
          <ShieldAlert size={40} className="text-error" />
          دليل السلامة وبروتوكولات الطوارئ
        </h1>
        <p className="text-lg text-secondary max-w-3xl">
          المرجع السريع للتعامل مع الحوادث المخبرية. دليل تفاعلي يجمع بين القواعد الرسمية والمساعدة الذكية الفورية.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: AI Emergency Assistant */}
        <div className="lg:col-span-1">
          <div className="bg-surface-container-low rounded-[32px] p-8 border-2 border-primary/20 shadow-xl sticky top-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="text-primary" />
              <h2 className="text-xl font-black text-primary">مساعد الطوارئ الذكي</h2>
            </div>
            
            <p className="text-sm text-secondary mb-6 leading-relaxed">
              صف الحادث بوضوح (مثلاً: "انكسر بيشر حمض الكبريتيك على يدي" أو "استنشقت غاز الكلور") للحصول على إرشادات فورية.
            </p>

            <textarea 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب هنا ما حدث..."
              className="w-full h-32 bg-surface p-4 rounded-2xl border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary outline-none transition-all text-sm mb-4 resize-none"
            />

            <button 
              onClick={handleAskEmergency}
              disabled={loadingAi || !query.trim()}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {loadingAi ? <div className="w-5 h-5 border-2 border-on-primary border-t-transparent animate-spin rounded-full" /> : <Search size={20} />}
              طلب إرشاد فوري
            </button>

            <AnimatePresence>
              {aiResponse && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-8 p-6 bg-surface rounded-2xl border border-primary/30 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-1 h-full bg-primary" />
                  <div className="prose prose-sm prose-primary max-w-none text-right" dir="rtl">
                    <div className="text-primary whitespace-pre-wrap leading-relaxed font-medium">
                      {aiResponse}
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiResponse(null)}
                    className="mt-4 text-xs font-bold text-outline hover:text-primary transition-colors"
                  >
                    تجاوز الرد
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Standard Protocols */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
            <Stethoscope size={28} className="text-tertiary" />
            البروتوكولات القياسية المعتمدة
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PROTOCOLS.map((protocol) => {
              const Icon = protocol.icon;
              const isExpanded = expandedId === protocol.id;
              
              return (
                <div 
                  key={protocol.id}
                  className={`bg-surface rounded-3xl border border-outline-variant transition-all overflow-hidden ${isExpanded ? 'ring-2 ring-primary/20 shadow-lg' : 'hover:shadow-md'}`}
                >
                  <button 
                    onClick={() => setExpandedId(isExpanded ? null : protocol.id)}
                    className="w-full p-6 flex items-center justify-between text-right"
                  >
                    <div className="flex items-center gap-4 text-right">
                       <div className={`p-3 rounded-2xl bg-surface-container-high ${protocol.color}`}>
                         <Icon size={24} />
                       </div>
                       <span className="font-bold text-lg text-primary">{protocol.title}</span>
                    </div>
                    {isExpanded ? <ChevronUp className="text-outline" /> : <ChevronDown className="text-outline" />}
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-6"
                      >
                        <div className="space-y-3 pt-2">
                          {protocol.steps.map((step, i) => (
                            <div key={i} className="flex gap-3 text-sm text-secondary leading-relaxed">
                              <span className="w-5 h-5 flex items-center justify-center rounded-full bg-outline-variant text-[10px] font-black text-outline shrink-0 mt-0.5">{i+1}</span>
                              <p>{step}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* Quick Warning Card */}
          <div className="bg-error/5 rounded-3xl p-8 border border-error/20 mt-12 flex gap-6 items-start">
             <div className="p-3 bg-error text-on-error rounded-2xl shrink-0">
               <AlertTriangle size={32} />
             </div>
             <div>
               <h4 className="text-xl font-black text-error mb-2 tracking-tight">تحذير عام قبل البدء</h4>
               <p className="text-secondary leading-relaxed font-medium">
                 هذا الدليل للاستخدام السريع والطارئ فقط. لا يغني عن التكوين المستمر والرسكولات الدورية في مجال الأمن المخبري. في جميع الحالات الخطيرة، يجب الاتصال بمصالح الحماية المدنية (14) أو الإسعاف الطبي (115) كخطوة أولى.
               </p>
             </div>
          </div>

          {/* Laboratory Signs Legend */}
          <div className="bg-tertiary/5 rounded-[32px] p-8 mt-12">
            <h4 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Info size={24} className="text-tertiary" />
              تذكير بالعلامات التحذيرية الشائعة
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'مادة سامة جداً', icon: Skull, color: 'text-gray-800' },
                { label: 'مادة مشتعلة', icon: Flame, color: 'text-error' },
                { label: 'مادة أكالة', icon: Droplets, color: 'text-yellow-600' },
                { label: 'مادة مشعة', icon: Radiation, color: 'text-purple-600' },
                { label: 'خطر بيولوجي', icon: Biohazard, color: 'text-green-600' },
                { label: 'خطر كهربائي', icon: Zap, color: 'text-orange-500' },
              ].map((sign, i) => {
                const Icon = sign.icon;
                return (
                  <div key={i} className="flex flex-col items-center text-center p-4 bg-surface rounded-2xl border border-outline-variant hover:shadow-md transition-all">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 bg-opacity-10 ${sign.color.replace('text-', 'bg-')} shadow-sm border border-outline-variant`}>
                      <Icon className={sign.color} size={32} />
                    </div>
                    <span className="text-sm font-bold text-primary">{sign.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
