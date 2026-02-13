import { useNavigate } from 'react-router-dom';
import { useBankStore } from '@/store/bankStore';
import { UserRole, ROLE_CONFIG } from '@/types/bank';
import { 
  ChevronRight, 
  LogOut, 
  Banknote, 
  ArrowLeftRight, 
  CreditCard, 
  Landmark, 
  ShieldCheck,
  CircleDollarSign,
  BookOpen,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  kassir: <Banknote className="w-6 h-6" />,
  valyuta: <ArrowLeftRight className="w-6 h-6" />,
  plastik: <CreditCard className="w-6 h-6" />,
  omonat: <Landmark className="w-6 h-6" />,
  rahbar: <ShieldCheck className="w-6 h-6" />,
  kredit: <CircleDollarSign className="w-6 h-6" />,
  buxgalteriya: <BookOpen className="w-6 h-6" />,
};

export function RoleSelection() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser, updateUserRole } = useBankStore();
  
  const roles: UserRole[] = ['kassir', 'valyuta', 'plastik', 'omonat', 'kredit', 'buxgalteriya', 'rahbar'];
  
  const handleRoleSelect = (role: UserRole) => {
    updateUserRole(role);
    navigate(`/dashboard/${role}`);
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    useBankStore.persist.clearStorage();
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg flex items-center justify-center">
            <img src="https://www.mamunedu.uz/images/logo.png" alt="Mamun Bank" className="w-16 h-16" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Mamun Bank</h1>
              <p className="text-xs text-muted-foreground">Trenajer 1.0</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            size="sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Chiqish</span>
          </Button>
        </div>
      </header>
      
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Welcome Section */}
        <div className="mb-10 animate-slide-up">
          <h2 className="text-display-sm text-foreground mb-2">
            Xush kelibsiz, {currentUser?.name}!
          </h2>
          <p className="text-lg text-muted-foreground">
            Mashq qilmoqchi bo'lgan rolingizni tanlang
          </p>
        </div>
        
        {/* Role Cards Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role, index) => {
            const config = ROLE_CONFIG[role];
            const isSpecial = role === 'rahbar';
            
            return (
              <button
                key={role}
                onClick={() => handleRoleSelect(role)}
                className={cn(
                  "group relative text-left card-interactive p-6",
                  "animate-slide-up",
                  isSpecial && "sm:col-span-2 lg:col-span-1"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                  config.bgColor,
                  config.color
                )}>
                  {ROLE_ICONS[role]}
                </div>
                
                {/* Content */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg-semibold text-foreground flex items-center gap-2">
                    {config.label}
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {config.description}
                  </p>
                </div>
                
                {/* Badge for supervisor */}
                {isSpecial && (
                  <span className="absolute top-4 right-4 px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full dark:bg-gray-800 dark:text-gray-400">
                    Nazoratchi
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Help Card */}
        <div className="mt-8 p-6 bg-primary-50 border border-primary-100 rounded-xl animate-slide-up dark:bg-primary/10 dark:border-primary/20" style={{ animationDelay: '300ms' }}>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600 flex-shrink-0 dark:bg-primary/20">
              💡
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-1">Qaysi rolni tanlash kerak?</h4>
              <p className="text-sm text-muted-foreground">
                Har bir rol alohida bank operatsiyalarini o'rgatadi. <strong>Kassir</strong> bilan boshlash tavsiya etiladi, 
                chunki bu eng asosiy operatsiyalar. <strong>Rahbar</strong> rolida barcha operatsiyalarni ko'rishingiz mumkin.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
