import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useBankStore } from '@/store/bankStore';
import { ChatMessage } from '@/types/bank';
import { cn } from '@/lib/utils';

const LOVY_RESPONSES: Record<string, string> = {
  kassir: "Kassir roli juda muhim! Siz mijozlardan naqd pul qabul qilasiz (kirim) yoki ularga pul berasiz (chiqim). Har bir operatsiya uchun kvitansiya chiqariladi.",
  valyuta: "Valyuta operatori sifatida siz dollar, yevro va so'mni ayirboshlaysiz. Bugungi kurslarni ko'rib, mijozga eng yaxshi xizmatni ko'rsatasiz.",
  plastik: "Plastik karta ochish – bu mijozlarga qulay! Humo, Uzcard yoki Visa kartalarini ochishingiz mumkin. SMS xabar va yetkazib berish xizmati ham bor.",
  omonat: "Omonat operatori bo'lib, siz mijozlarga pul jamg'arish imkonini berasiz. Muddatli, jamg'arma yoki bolalar omonati – har birining foiz stavkasi bor.",
  rahbar: "Rahbar sifatida siz barcha operatsiyalarni nazorat qilasiz. Activity log'da hamma xodimlarning ishlari ko'rinadi.",
  salom: "Assalomu alaykum! Sizni ko'rganimdan xursandman! Bugun qanday yordam kerak? Bank operatsiyalari bo'yicha hamma narsani o'rgataman!",
  rahmat: "Arzimaydi! Sizga yordam berish menga katta baxt! Yana savollaringiz bo'lsa, doim shu yerdaman!",
  default: "Ajoyib savol! Men sizga bank operatsiyalari haqida ko'p narsani aytib bera olaman. Masalan, kassir, valyuta, plastik karta yoki omonat operatsiyalari bo'yicha so'rang!"
};

function getLovyResponse(message: string): string {
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('salom') || lowerMsg.includes('assalom')) return LOVY_RESPONSES.salom;
  if (lowerMsg.includes('rahmat') || lowerMsg.includes('tashakkur')) return LOVY_RESPONSES.rahmat;
  if (lowerMsg.includes('kassir') || lowerMsg.includes('naqd')) return LOVY_RESPONSES.kassir;
  if (lowerMsg.includes('valyuta') || lowerMsg.includes('dollar')) return LOVY_RESPONSES.valyuta;
  if (lowerMsg.includes('plastik') || lowerMsg.includes('karta')) return LOVY_RESPONSES.plastik;
  if (lowerMsg.includes('omonat') || lowerMsg.includes('foiz')) return LOVY_RESPONSES.omonat;
  if (lowerMsg.includes('rahbar') || lowerMsg.includes('nazorat')) return LOVY_RESPONSES.rahbar;
  return LOVY_RESPONSES.default;
}

export function LovyChat() {
  const { isChatOpen, toggleChat, chatMessages, addChatMessage } = useBankStore();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim(), timestamp: new Date() };
    addChatMessage(userMessage);
    setInput('');
    setIsTyping(true);
    
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 500));
    
    const response = getLovyResponse(userMessage.content);
    addChatMessage({ id: (Date.now() + 1).toString(), role: 'assistant', content: response, timestamp: new Date() });
    setIsTyping(false);
  };
  
  return (
    <>
      <button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary shadow-lg",
          "flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-xl",
          isChatOpen && "scale-0 opacity-0"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-success rounded-full flex items-center justify-center">
          <Sparkles className="w-2.5 h-2.5 text-white" />
        </span>
      </button>
      
      <div className={cn(
        "fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-card rounded-xl shadow-xl border border-border overflow-hidden",
        "transition-all duration-300",
        isChatOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
      )}>
        <div className="bg-primary p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">🤖</div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">AI Yordamchi</h3>
            <p className="text-xs text-white/70">Bank trenajer AI</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={toggleChat} className="text-white hover:bg-white/20">
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="h-80 overflow-y-auto p-4 space-y-3 bg-secondary/30">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                "max-w-[80%] rounded-xl px-4 py-2.5 text-sm",
                msg.role === 'user' ? 'bg-primary text-white rounded-br-sm' : 'bg-card border border-border rounded-bl-sm'
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-1 px-4 py-3 bg-card border border-border rounded-xl rounded-bl-sm w-fit">
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-4 border-t border-border flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Savolingizni yozing..." className="flex-1" />
          <Button type="submit" size="icon" disabled={!input.trim() || isTyping}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
