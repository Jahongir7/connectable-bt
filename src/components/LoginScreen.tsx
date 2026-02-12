import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBankStore } from '@/store/bankStore';
import { User as UserType } from '@/types/bank';

export function LoginScreen() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { setCurrentUser } = useBankStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Iltimos, ismingizni kiriting');
      return;
    }
    
    if (name.trim().length < 2) {
      setError('Ism kamida 2 ta belgidan iborat bo\'lishi kerak');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const user: UserType = {
      id: `USR-${Date.now()}`,
      name: name.trim(),
      role: 'kassir',
      createdAt: new Date()
    };
    
    setCurrentUser(user);
    setIsLoading(false);
    navigate('/role-select');
  };
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center">
                <img src="https://www.mamunedu.uz/images/logo.png" alt="Mamun Bank" className="w-12 h-12" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mamun Bank</h1>
                <p className="text-sm text-gray-400">Trenajer 1.0</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold leading-tight mb-4">
                Bank operatsiyalarini<br />
                <span className="text-primary-400">simulyatsiya qiling</span>
              </h2>
              <p className="text-gray-400 text-lg max-w-md">
                Kassir, valyuta operatori, plastik karta va omonat bo'yicha amaliy mashqlar
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex -space-x-3">
                {['K', 'V', 'P', 'O'].map((letter, i) => (
                  <div 
                    key={letter}
                    className="w-10 h-10 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-sm font-medium"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">4 ta rol</span> mavjud
              </div>
            </div>
          </div>
          
          
        </div>
      </div>
      
      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
              <img src="https://www.mamunedu.uz/images/logo.png" alt="Mamun Bank" className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Mamun Bank</h1>
              <p className="text-xs text-muted-foreground">Trenajer 1.0</p>
            </div>
          </div>
          
          <div className="animate-slide-up">
            <div className="mb-8">
              <h2 className="text-display-xs text-foreground mb-2">Tizimga kirish</h2>
              <p className="text-muted-foreground">
                Davom etish uchun ismingizni kiriting
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Ism va familiya
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError('');
                    }}
                    placeholder="Masalan: Aliyev Ali"
                    className={`pl-11 h-12 input-base ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : ''}`}
                    autoFocus
                    autoComplete="name"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive animate-slide-down">{error}</p>
                )}
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12"
                size="lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    <span>Kirish...</span>
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    Davom etish
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
            
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Bu trenajer tizimi faqat o'quv maqsadlari uchun
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
