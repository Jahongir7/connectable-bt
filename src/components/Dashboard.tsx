import { useNavigate, useParams } from 'react-router-dom';
import { useBankStore } from '@/store/bankStore';
import { UserRole, ROLE_CONFIG, STATUS_CONFIG, OPERATION_CODES } from '@/types/bank';
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  History, 
  Users,
  ChevronRight,
  TrendingUp,
  Activity,
  Building2,
  Banknote,
  ArrowLeftRight,
  CreditCard,
  Landmark,
  ShieldCheck,
  Search,
  MoreHorizontal,
  LogOut,
  BookOpen,
  BookMarked,
  CircleDollarSign,
  BarChart3,
  Star,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState, useMemo, useEffect } from 'react';
import { CashInForm } from './operations/CashInForm';
import { CashOutForm } from './operations/CashOutForm';
import { FXForm } from './operations/FXForm';
import { CardOpenForm } from './operations/CardOpenForm';
import { DepositOpenForm } from './operations/DepositOpenForm';
import { LoanForm } from './operations/LoanForm';
import { ActivityLogTable } from './ActivityLogTable';
import { ClientForm } from './ClientForm';
import { OperationDetailModal } from './OperationDetailModal';
import { AccountingJournal } from './AccountingJournal';
import { OperationReference } from './OperationReference';
import { DailyReport } from './DailyReport';
import { ControlPanel } from './ControlPanel';
import { cn } from '@/lib/utils';

type ModalType = 'cash-in' | 'cash-out' | 'fx' | 'card' | 'deposit' | 'loan' | 'client' | 'log' | 'detail' | 'journal' | 'reference' | 'daily-report' | 'control' | null;

interface SelectedOperation {
  operation: any;
  type: 'cashIn' | 'cashOut' | 'fx' | 'card' | 'deposit';
}

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  kassir: <Banknote className="w-5 h-5" />,
  valyuta: <ArrowLeftRight className="w-5 h-5" />,
  plastik: <CreditCard className="w-5 h-5" />,
  omonat: <Landmark className="w-5 h-5" />,
  rahbar: <ShieldCheck className="w-5 h-5" />,
};

const OPERATIONS: Record<UserRole, { id: ModalType; label: string; description: string; icon: React.ReactNode; code?: string }[]> = {
  kassir: [
    { id: 'cash-in', label: 'Naqd pul kirim', description: 'Mijozdan pul qabul qilish', icon: <TrendingUp className="w-5 h-5 text-success" />, code: 'OP-01' },
    { id: 'cash-out', label: 'Naqd pul chiqim', description: 'Mijozga pul berish', icon: <TrendingUp className="w-5 h-5 text-destructive rotate-180" />, code: 'OP-02' },
    { id: 'loan', label: 'Kredit berish', description: 'Yangi kredit rasmiylashtirish', icon: <CircleDollarSign className="w-5 h-5 text-primary" />, code: 'OP-03' },
  ],
  valyuta: [
    { id: 'fx', label: 'Valyuta ayirboshlash', description: 'Sotib olish / Sotish', icon: <ArrowLeftRight className="w-5 h-5 text-primary" />, code: 'OP-04' },
  ],
  plastik: [
    { id: 'card', label: 'Karta ochish', description: 'Yangi plastik karta', icon: <CreditCard className="w-5 h-5 text-purple-500" /> },
  ],
  omonat: [
    { id: 'deposit', label: 'Omonat ochish', description: 'Yangi omonat hisobi', icon: <Landmark className="w-5 h-5 text-amber-500" />, code: 'OP-05' },
  ],
  rahbar: [
    { id: 'log', label: 'Faoliyat jurnali', description: 'Barcha operatsiyalar', icon: <Activity className="w-5 h-5 text-muted-foreground" /> },
    { id: 'journal', label: 'Buxgalteriya jurnali', description: 'Debet/Kredit yozuvlari', icon: <BookOpen className="w-5 h-5 text-primary" /> },
    { id: 'daily-report', label: 'Kunlik hisobot', description: 'Bugungi natijalar', icon: <BarChart3 className="w-5 h-5 text-success" /> },
    { id: 'control', label: 'Nazorat bo\'limi', description: 'Operatsiyalarni tekshirish', icon: <ShieldCheck className="w-5 h-5 text-muted-foreground" /> },
  ],
};

export function Dashboard() {
  const navigate = useNavigate();
  const { role } = useParams<{ role: UserRole }>();
  const { currentUser, setCurrentUser, cashInOps, cashOutOps, fxOps, cardOps, depositOps, loanOps, managerReport, clients, getStats, fetchClients, fetchCashInOps, fetchCashOutOps, fetchFXOps, fetchCardOps, fetchManagerReport, fetchDepositOps, studentScore } = useBankStore();
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedOperation, setSelectedOperation] = useState<SelectedOperation | null>(null);
  const [showAllClients, setShowAllClients] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchCashInOps();
    fetchCashOutOps();
    fetchFXOps();
    fetchCardOps();
    fetchDepositOps();
    if (role === 'rahbar') {
      fetchManagerReport();
    }
  }, [fetchClients, fetchCashInOps, fetchCashOutOps, fetchFXOps, fetchCardOps, fetchDepositOps, fetchManagerReport, role]);

  const handleLogout = () => {
    setCurrentUser(null);
    useBankStore.persist.clearStorage();
    navigate('/login');
  };
  
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft' | 'cancelled'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'UZS' | 'USD' | 'EUR'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Get recent operations for current role with filters
  const getRecentOperations = useMemo(() => {
    if (!role) return [];
    let ops: any[] = [];
    
    switch (role) {
      case 'kassir':
        ops = [...cashInOps, ...cashOutOps];
        break;
      case 'valyuta':
        ops = [...fxOps];
        break;
      case 'plastik':
        ops = [...cardOps];
        break;
      case 'omonat':
        ops = [...depositOps];
        break;
      case 'rahbar':
        ops = managerReport.map(item => {
          const type = item.operation_type;
          let prefix = 'OP';
          if (type === 'cash_in') prefix = 'CI';
          else if (type === 'cash_out') prefix = 'CO';
          else if (type === 'currency_exchange') prefix = 'FX';
          else if (type === 'card_application') prefix = 'CARD';
          else if (type === 'deposit') prefix = 'DEP';

          return {
            ...item,
            oper_id: `${prefix}-${item.operation_id}`,
            sana_vaqt: item.operation_date,
            client_fio: item.client_name,
            summa: parseFloat(item.amount),
            valuta: item.currency
          };
        });
        break;
      default:
        ops = [];
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      ops = ops.filter(op => op.status === statusFilter);
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      ops = ops.filter(op => (op.valuta || op.berilgan_valyuta) === currencyFilter);
    }
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      ops = ops.filter(op => {
        const opDate = new Date(op.sana_vaqt);
        if (timeFilter === 'today') {
          return opDate >= today;
        } else if (timeFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return opDate >= weekAgo;
        } else if (timeFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return opDate >= monthAgo;
        }
        return true;
      });
    }
    
    return ops
      .sort((a, b) => new Date(b.sana_vaqt).getTime() - new Date(a.sana_vaqt).getTime())
      .slice(0, 10);
  }, [role, cashInOps, cashOutOps, fxOps, cardOps, depositOps, managerReport, statusFilter, currencyFilter, timeFilter]);

  if (!role) return null;

  const handleOperationClick = (op: any) => {
    let opType: 'cashIn' | 'cashOut' | 'fx' | 'card' | 'deposit' = 'cashIn';
    
    if (op.oper_id?.startsWith('CI-')) opType = 'cashIn';
    else if (op.oper_id?.startsWith('CO-')) opType = 'cashOut';
    else if (op.oper_id?.startsWith('FX-')) opType = 'fx';
    else if (op.oper_id?.startsWith('CARD-')) opType = 'card';
    else if (op.oper_id?.startsWith('DEP-')) opType = 'deposit';
    
    setSelectedOperation({ operation: op, type: opType });
    setActiveModal('detail');
  };
  
  const roleConfig = ROLE_CONFIG[role];
  const operations = OPERATIONS[role];
  const stats = getStats();
  
  const recentOps = getRecentOperations;
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => navigate('/role-select')}
                className="text-muted-foreground"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                 <img src="https://www.mamunedu.uz/images/logo.png" alt="Mamun Bank" className="w-8 h-8" />
                </div>
                <div className="h-6 w-px bg-border" />
                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", roleConfig.bgColor)}>
                  <span className={roleConfig.color}>{ROLE_ICONS[role]}</span>
                  <span className={cn("text-sm font-medium", roleConfig.color)}>{roleConfig.labelUz}</span>
                </div>
              </div>
            </div>
            
            
            {/* Right */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-foreground">{currentUser?.name}</p>
                <p className="text-xs text-muted-foreground">{roleConfig.label}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-medium text-sm dark:bg-primary/20">
                {currentUser?.name?.charAt(0).toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-error hover:bg-error/10"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Jami operatsiyalar</span>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-display-xs text-foreground">{stats.totalOperations}</p>
          </div>
          
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Bugungi</span>
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            <p className="text-display-xs text-foreground">{stats.todayOperations}</p>
          </div>
          
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Mijozlar</span>
              <Users className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-display-xs text-foreground">{stats.totalClients}</p>
          </div>
          
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Jami kirim (UZS)</span>
              <Banknote className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-display-xs text-foreground">{stats.totalAmount.UZS.toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            <div className="animate-slide-up" style={{ animationDelay: '50ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg-semibold text-foreground">Tezkor amallar</h2>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {operations.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => setActiveModal(op.id)}
                    className="group card-interactive p-5 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                        {op.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-0.5 flex items-center gap-2">
                          {op.label}
                          {op.code && <Badge variant="outline" className="font-mono text-[10px] px-1.5 py-0">{op.code}</Badge>}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">{op.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Recent Operations Table */}
            {role !== 'rahbar' && (
              <div className="animate-slide-up" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg-semibold text-foreground">So'nggi operatsiyalar</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveModal('log')}
                  >
                    <History className="w-4 h-4" />
                    Barchasi
                  </Button>
                </div>
                
                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-3 mb-4">
                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="Holat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="completed">✓ Bajarilgan</SelectItem>
                      <SelectItem value="draft">◷ Qoralama</SelectItem>
                      <SelectItem value="cancelled">✗ Bekor</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Currency Filter */}
                  <Select value={currencyFilter} onValueChange={(value: any) => setCurrencyFilter(value)}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Valyuta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="UZS">🇺🇿 UZS</SelectItem>
                      <SelectItem value="USD">🇺🇸 USD</SelectItem>
                      <SelectItem value="EUR">🇪🇺 EUR</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {/* Time Filter */}
                  <Select value={timeFilter} onValueChange={(value: any) => setTimeFilter(value)}>
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Vaqt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Barchasi</SelectItem>
                      <SelectItem value="today">Bugun</SelectItem>
                      <SelectItem value="week">Hafta</SelectItem>
                      <SelectItem value="month">Oy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="card-base overflow-hidden">
                  {recentOps.length === 0 ? (
                    <div className="p-12 text-center">
                      <FileText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                      <p className="font-medium text-foreground mb-1">Hali operatsiyalar yo'q</p>
                      <p className="text-sm text-muted-foreground">Yangi operatsiya qo'shing!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {recentOps.map((op: any) => (
                        <button
                          key={op.oper_id}
                          onClick={() => handleOperationClick(op)}
                          className="w-full p-4 hover:bg-secondary/50 transition-colors text-left cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-foreground">
                                {op.client_fio?.charAt(0) || 'M'}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{op.client_fio}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(op.sana_vaqt).toLocaleDateString('uz-UZ')} · {op.oper_id}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-foreground">
                                {(op.summa || op.berilgan_summa || 0).toLocaleString()} {op.valuta || op.berilgan_valyuta}
                              </p>
                              <Badge variant={op.status === 'completed' ? 'success' : op.status === 'cancelled' ? 'error' : 'gray'}>
                                {STATUS_CONFIG[op.status as keyof typeof STATUS_CONFIG]?.label || op.status}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            {/* Clients Quick View */}
            <div className="card-base p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Mijozlar</h3>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setActiveModal('client')}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {clients.length === 0 ? (
                <div className="text-center py-6">
                  <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">Mijozlar yo'q</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setActiveModal('client')}
                    className="mt-2"
                  >
                    Yangi qo'shish
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {(showAllClients ? clients : clients.slice(0, 4)).map((client) => (
                    <div key={client.client_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 dark:bg-primary/20">
                        {(client.full_name || (client as any).fio || '?').charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{client.full_name || (client as any).fio || 'Noma\'lum'}</p>
                        <p className="text-xs text-muted-foreground">{client.phone || (client as any).telefon || ''}</p>
                      </div>
                    </div>
                  ))}
                  {clients.length > 4 && (
                    <button
                      onClick={() => setShowAllClients(!showAllClients)}
                      className="w-full py-2 text-xs text-center text-muted-foreground hover:text-primary transition-colors font-medium"
                    >
                      {showAllClients ? "Qisqartirish" : `+${clients.length - 4} mijoz`}
                    </button>
                  )}
                </div>
              )}
            </div>
            
            {/* Score Card */}
            <div className={cn("card-base p-5", studentScore.penalty_status === 'penalty' ? 'border-destructive/50' : studentScore.penalty_status === 'warning' ? 'border-warning/50' : '')}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-warning" /> Natija
                </h3>
                <Badge variant={studentScore.penalty_status === 'penalty' ? 'error' : studentScore.penalty_status === 'warning' ? 'warning' : 'success'}>
                  {studentScore.penalty_status === 'penalty' ? '🔴 Jarima' : studentScore.penalty_status === 'warning' ? '⚠️ Ogohlantirish' : '✅ Yaxshi'}
                </Badge>
              </div>
              <p className="text-display-xs text-primary">{studentScore.score} <span className="text-sm font-normal text-muted-foreground">ball</span></p>
              {studentScore.error_count > 0 && (
                <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {studentScore.error_count} ta xatolik
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div className="card-base p-5 space-y-3">
              <h3 className="font-semibold text-foreground">Qo'shimcha</h3>
              <button onClick={() => setActiveModal('reference')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left">
                <BookMarked className="w-5 h-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Operatsiya kodlari</p>
                  <p className="text-xs text-muted-foreground">Spravochnik</p>
                </div>
              </button>
              <button onClick={() => setActiveModal('journal')} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Buxgalteriya jurnali</p>
                  <p className="text-xs text-muted-foreground">Debet/Kredit</p>
                </div>
              </button>
            </div>
            
            {/* Help Card */}
            <div className="card-base p-5 bg-primary-50 border-primary-100 dark:bg-primary/10 dark:border-primary/20">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">💡</span>
                <h3 className="font-semibold text-foreground">Yordam kerakmi?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                AI suhbatlashing va bank operatsiyalari haqida bilib oling.
              </p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => useBankStore.getState().toggleChat()}>
                AI bilan suhbatlashish
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      {/* Modals */}
      {activeModal === 'cash-in' && <CashInForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'cash-out' && <CashOutForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'fx' && <FXForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'card' && <CardOpenForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'deposit' && <DepositOpenForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'loan' && <LoanForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'client' && <ClientForm onClose={() => setActiveModal(null)} />}
      {activeModal === 'log' && <ActivityLogTable onClose={() => setActiveModal(null)} />}
      {activeModal === 'journal' && <AccountingJournal onClose={() => setActiveModal(null)} />}
      {activeModal === 'reference' && <OperationReference onClose={() => setActiveModal(null)} />}
      {activeModal === 'daily-report' && <DailyReport onClose={() => setActiveModal(null)} />}
      {activeModal === 'control' && <ControlPanel onClose={() => setActiveModal(null)} />}
      {activeModal === 'detail' && selectedOperation && (
        <OperationDetailModal
          operation={selectedOperation.operation}
          operationType={selectedOperation.type}
          onClose={() => {
            setActiveModal(null);
            setSelectedOperation(null);
          }}
        />
      )}
    </div>
  );
}
