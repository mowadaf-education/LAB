import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RefreshCw, 
  ShieldAlert, 
  FlaskConical, 
  Book, 
  Calculator,
  MessageSquare,
  X,
  Camera,
  ImageIcon,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { chatWithLabAssistant, analyzeLabImage } from '../services/geminiService';


interface Message {
  role: 'user' | 'model';
  parts: string;
}

const SUGGESTED_PROMPTS = [
  { text: "كيف يمكنني تخزين حمض الكلور بشكل آمن؟", icon: ShieldAlert },
  { text: "اشرح لي تجربة المعايرة حمض-أساس للسنة الثالثة ثانوي.", icon: FlaskConical },
  { text: "كيف أحضر محلول ملحي بتركيز 0.1 مول/لتر؟", icon: Calculator },
  { text: "ما هي القوانين المنظمة لمناصب مخبري المدرسة؟", icon: Book }
];

export default function LabAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', parts: 'مرحباً! أنا مساعدك المخبري الذكي "مخبري AI". يمكنني مساعدتك في كل ما يتعلق بالسلامة، التجارب، القوانين المدرسية، والحسابات المخبرية. كيف يمكنني خدمتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      setLoading(true);
      setMessages(prev => [...prev, { role: 'user', parts: 'جاري تحليل الصورة... 🔍' }]);

      try {
        const analysis = await analyzeLabImage(base64);
        if (analysis && analysis.nameAr) {
          const responseText = `لقد قمت بتحليل الصورة، وهذا ما وجدته:
          
**الاسم:** ${analysis.nameAr}
**الاستخدام الأساسي:** ${analysis.primaryUse}
**تحذيرات السلامة:** ${analysis.safetyWarnings}

هل تود معرفة المزيد عن هذا العنصر؟`;
          
          setMessages(prev => [...prev, { role: 'model', parts: responseText }]);
        } else {
          setMessages(prev => [...prev, { role: 'model', parts: 'عذراً، لم أتمكن من التعرف على محتوى الصورة بشكل دقيق. يرجى محاولة تصوير العنصر بشكل أوضح.' }]);
        }
      } catch (error) {
        setMessages(prev => [...prev, { role: 'model', parts: 'حدث خطأ أثناء تحليل الصورة.' }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim() || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', parts: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithLabAssistant(newMessages);
      setMessages(prev => [...prev, { role: 'model', parts: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', parts: 'عذراً، حدث خطأ. حاول مرة أخرى.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto px-6 rtl" dir="rtl">
      
      
      <header className="flex justify-between items-center mb-6 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-primary tracking-tight">مساعد مخبري AI</h1>
            <p className="text-[10px] font-black text-secondary/60 uppercase tracking-widest mt-0.5">مدعوم بالذكاء الاصطناعي التوليدي • نموذج متطور</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([{ role: 'model', parts: 'تمت إعادة تعيين الجلسة. كيف يمكنني مساعدتك؟' }])}
          className="p-3 hover:bg-surface-container rounded-full text-secondary transition-all active:rotate-180 duration-500"
          title="مسح المحادثة"
        >
          <RefreshCw size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-hidden bg-surface rounded-[40px] border border-outline/10 shadow-sm flex flex-col relative">
        {/* Messages Stage */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar"
        >
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn(
                "flex gap-4 max-w-[85%]",
                m.role === 'user' ? "mr-auto flex-row-reverse" : "ml-auto"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                m.role === 'user' ? "bg-primary text-on-primary" : "bg-surface-container-high text-primary"
              )}>
                {m.role === 'user' ? <User size={20} /> : <Bot size={22} />}
              </div>
              
              <div className={cn(
                "p-5 rounded-[28px] text-[15px] leading-relaxed relative",
                m.role === 'user' 
                  ? "bg-primary text-on-primary rounded-tr-none shadow-xl shadow-primary/10 font-bold" 
                  : "bg-surface-container border border-outline/5 rounded-tl-none font-medium text-secondary"
              )}>
                {m.parts}
                {m.role === 'model' && (
                   <span className="absolute -bottom-6 right-0 text-[10px] font-black text-secondary/20 uppercase tracking-widest">
                     Mekhbari AI v3.0
                   </span>
                )}
              </div>
            </motion.div>
          ))}
          
          {loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4 ml-auto"
            >
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center animate-pulse">
                <Sparkles size={20} className="text-primary/40" />
              </div>
              <div className="p-5 bg-surface-container rounded-[28px] rounded-tl-none flex gap-2">
                <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 md:p-8 border-t border-outline/5 bg-surface-container-low shrink-0">
          {messages.length < 3 && !loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {SUGGESTED_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(p.text)}
                  className="bg-surface hover:bg-primary/5 p-4 rounded-2xl border border-outline/10 text-right text-xs font-bold text-secondary hover:text-primary transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 bg-surface-container rounded-lg text-primary/40 group-hover:text-primary transition-colors">
                    <p.icon size={16} />
                  </div>
                  {p.text}
                </button>
              ))}
            </div>
          )}

          <div className="relative group">
            <input 
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <textarea
              rows={1}
              placeholder="اطرح أي سؤال مخبري أو قم بتحميل صورة..."
              className="w-full bg-surface border-2 border-outline-variant/30 rounded-[32px] px-8 py-5 pr-14 pl-28 focus:border-primary/40 outline-none transition-all shadow-lg shadow-black/5 font-bold resize-none custom-scrollbar"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-primary/20 group-focus-within:text-primary transition-colors">
              <MessageSquare size={24} />
            </div>
            <div className="absolute left-16 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-primary/40 hover:text-primary transition-colors hover:bg-primary/5 rounded-full"
                title="تحليل صورة"
              >
                <Camera size={22} />
              </button>
            </div>
            <button 
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
            >
              <Send size={20} />
            </button>
          </div>
          
          <p className="text-center mt-4 text-[9px] font-black text-secondary/30 uppercase tracking-widest">
            الذكاء الاصطناعي قد يخطئ • يرجى التحقق دائماً من بطاقات السلامة الرسمية
          </p>
        </div>
      </main>
    </div>
  );
}
