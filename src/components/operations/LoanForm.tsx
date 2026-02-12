import { useState, useMemo } from 'react';
import { X, Check, AlertCircle, CircleDollarSign, ChevronRight, ChevronLeft, FileCheck, Shield, Scale, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { LoanApplication, LoanStep, Currency, CURRENCY_CONFIG, ActivityLog } from '@/types/bank';
import { toast } from 'sonner';

interface LoanFormProps {
  onClose: () => void;
}

const STEPS: { step: LoanStep; label: string; icon: React.ReactNode }[] = [
  { step: 1, label: 'Ariza', icon: <FileCheck className="w-4 h-4" /> },
  { step: 2, label: 'Tekshirish', icon: <Shield className="w-4 h-4" /> },
  { step: 3, label: 'Sug\'urta', icon: <Shield className="w-4 h-4" /> },
  { step: 4, label: 'Qaror', icon: <Scale className="w-4 h-4" /> },
  { step: 5, label: 'Berish', icon: <Banknote className="w-4 h-4" /> },
];

const LOAN_RATE = 24; // 24% annual, simple

export function LoanForm({ onClose }: LoanFormProps) {
  const { currentUser, clients, addLoanOp, addActivityLog, generateJournalEntries, addCorrectOperation } = useBankStore();
  const [currentStep, setCurrentStep] = useState<LoanStep>(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    client_id: '',
    summa: '',
    valuta: 'UZS' as Currency,
    muddat_oy: 12,
    maqsad: '',
  });

  const [scoring, setScoring] = useState({
    has_income: false,
    no_existing_debt: false,
    insurance_confirmed: false,
  });

  const selectedClient = clients.find(c => c.client_id === formData.client_id);
  const checkedCount = [scoring.has_income, scoring.no_existing_debt, scoring.insurance_confirmed].filter(Boolean).length;
  const scoringResult = checkedCount >= 2 ? 'recommended' : checkedCount === 1 ? 'risky' : 'pending';

  const { oylikTolov, jamiTolov } = useMemo(() => {
    const summa = parseFloat(formData.summa) || 0;
    const months = formData.muddat_oy;
    // Simple equal payment: principal/months + interest/months
    const totalInterest = (summa * LOAN_RATE * months) / 1200;
    const total = summa + totalInterest;
    const monthly = total / months;
    return { oylikTolov: monthly, jamiTolov: total };
  }, [formData.summa, formData.muddat_oy]);

  const validateStep = (step: LoanStep) => {
    const newErrors: Record<string, string> = {};
    if (step === 1) {
      if (!formData.summa || parseFloat(formData.summa) <= 0) newErrors.summa = 'Summa kiriting';
      if (!formData.maqsad.trim()) newErrors.maqsad = 'Maqsad kiriting';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    if (currentStep < 5) setCurrentStep((currentStep + 1) as LoanStep);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep((currentStep - 1) as LoanStep);
  };

  const handleSubmit = () => {
    if (scoringResult === 'pending') {
      toast.error("Kamida bitta mezon tanlanishi kerak");
      return;
    }

    const operation: LoanApplication = {
      oper_id: `LOAN-${Date.now()}`,
      sana_vaqt: new Date(),
      operator_id: currentUser?.id || '',
      operator_fio: currentUser?.name || '',
      client_id: formData.client_id,
      client_fio: selectedClient?.full_name || '',
      summa: parseFloat(formData.summa),
      valuta: formData.valuta,
      muddat_oy: formData.muddat_oy,
      foiz: LOAN_RATE,
      maqsad: formData.maqsad,
      oylik_tolov: oylikTolov,
      current_step: 5,
      scoring,
      scoring_result: scoringResult,
      loan_status: scoringResult === 'recommended' ? 'approved' : 'rejected',
      status: 'completed',
    };

    addLoanOp(operation);
    generateJournalEntries('loan', operation.oper_id, operation.summa, operation.valuta, currentUser?.name || '');
    addCorrectOperation();

    const log: ActivityLog = {
      id: `LOG-${Date.now()}`,
      sana_vaqt: new Date(),
      xodim_id: currentUser?.id || '',
      xodim_fio: currentUser?.name || '',
      rol: 'kassir',
      operatsiya_turi: 'Kredit berish',
      oper_id: operation.oper_id,
      mijoz_fio: operation.client_fio,
      summa: operation.summa,
      valuta: operation.valuta,
      status: 'completed',
    };
    addActivityLog(log);

    toast.success(scoringResult === 'recommended' ? "Kredit tasdiqlandi!" : "Kredit rad etildi (xavfli)");
    onClose();
  };

  const progressPercent = (currentStep / 5) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center dark:bg-primary/10">
              <CircleDollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Kredit berish</h2>
              <div className="flex items-center gap-1">
                <Badge variant="outline" className="font-mono text-xs">OP-03</Badge>
                <span className="text-sm text-muted-foreground">— Qadam {currentStep}/5</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b border-border bg-secondary/30">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.step} className={`flex items-center gap-1.5 text-xs font-medium ${currentStep >= s.step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${currentStep >= s.step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {currentStep > s.step ? <Check className="w-3.5 h-3.5" /> : s.icon}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        {/* Content */}
        <div className="p-6 min-h-[280px]">
          {/* Step 1: Application */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-slide-up">
              <div className="space-y-1.5">
                <Label>Mijoz</Label>
                <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Mijozni tanlang..." /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (<SelectItem key={c.client_id} value={c.client_id}>{c.full_name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Kredit summasi <span className="text-destructive">*</span></Label>
                  <Input type="number" value={formData.summa} onChange={(e) => { setFormData({ ...formData, summa: e.target.value }); setErrors({}); }} placeholder="10,000,000" className={errors.summa ? 'border-destructive' : ''} />
                  {errors.summa && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.summa}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Valyuta</Label>
                  <Select value={formData.valuta} onValueChange={(v: Currency) => setFormData({ ...formData, valuta: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CURRENCY_CONFIG) as Currency[]).map(cur => (<SelectItem key={cur} value={cur}>{CURRENCY_CONFIG[cur].flag} {cur}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Muddat (oy)</Label>
                  <Select value={formData.muddat_oy.toString()} onValueChange={(v) => setFormData({ ...formData, muddat_oy: parseInt(v) })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[6, 12, 18, 24, 36].map(m => (<SelectItem key={m} value={m.toString()}>{m} oy</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Maqsad <span className="text-destructive">*</span></Label>
                  <Input value={formData.maqsad} onChange={(e) => { setFormData({ ...formData, maqsad: e.target.value }); setErrors({}); }} placeholder="Uy ta'miri" className={errors.maqsad ? 'border-destructive' : ''} />
                  {errors.maqsad && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.maqsad}</p>}
                </div>
              </div>
              {formData.summa && (
                <div className="p-4 bg-primary-50 dark:bg-primary/10 rounded-lg border border-primary-100 dark:border-primary/20 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Foiz stavkasi:</span>
                    <span className="font-bold text-foreground">{LOAN_RATE}% yillik</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Oylik to'lov:</span>
                    <span className="font-bold text-primary">{oylikTolov.toLocaleString(undefined, { maximumFractionDigits: 0 })} {formData.valuta}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Jami to'lov:</span>
                    <span className="font-semibold text-foreground">{jamiTolov.toLocaleString(undefined, { maximumFractionDigits: 0 })} {formData.valuta}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Verification */}
          {currentStep === 2 && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center py-6">
                <Shield className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Hujjatlarni tekshirish</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Mijozning shaxsiy hujjatlari, daromad ma'lumotlari va kredit tarixini tekshiring.
                </p>
              </div>
              {selectedClient && (
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mijoz:</span>
                    <span className="font-medium text-foreground">{selectedClient.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Pasport:</span>
                    <span className="text-foreground">{selectedClient.passport_series_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Telefon:</span>
                    <span className="text-foreground">{selectedClient.phone}</span>
                  </div>
                </div>
              )}
              <div className="p-4 bg-success-50 dark:bg-success/10 rounded-lg border border-success-100 dark:border-success/20 text-center">
                <Check className="w-6 h-6 text-success mx-auto mb-1" />
                <p className="text-sm font-medium text-foreground">Hujjatlar tekshirildi</p>
              </div>
            </div>
          )}

          {/* Step 3: Insurance */}
          {currentStep === 3 && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center py-6">
                <Shield className="w-12 h-12 mx-auto mb-3 text-amber-500" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Sug'urta rasmiylash</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Kredit sug'urta polisini rasmiylashtirish bosqichi. Sug'urta kredit xavfsizligini ta'minlaydi.
                </p>
              </div>
              <div className="p-4 bg-secondary rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kredit summasi:</span>
                  <span className="font-medium text-foreground">{parseFloat(formData.summa || '0').toLocaleString()} {formData.valuta}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sug'urta summasi:</span>
                  <span className="font-medium text-foreground">{(parseFloat(formData.summa || '0') * 0.02).toLocaleString()} {formData.valuta}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Decision / Scoring */}
          {currentStep === 4 && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center py-4">
                <Scale className="w-12 h-12 mx-auto mb-3 text-primary" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Kredit qarori</h3>
                <p className="text-sm text-muted-foreground">Soddalashtirilgan skoring tizimi</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                  <Checkbox checked={scoring.has_income} onCheckedChange={(v) => setScoring({ ...scoring, has_income: !!v })} id="income" />
                  <Label htmlFor="income" className="cursor-pointer flex-1">
                    <span className="font-medium text-foreground">Daromadga ega</span>
                    <p className="text-xs text-muted-foreground">Mijozning doimiy daromad manbai bor</p>
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                  <Checkbox checked={scoring.no_existing_debt} onCheckedChange={(v) => setScoring({ ...scoring, no_existing_debt: !!v })} id="debt" />
                  <Label htmlFor="debt" className="cursor-pointer flex-1">
                    <span className="font-medium text-foreground">Mavjud qarz yo'q</span>
                    <p className="text-xs text-muted-foreground">Boshqa faol kreditlari mavjud emas</p>
                  </Label>
                </div>
                <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                  <Checkbox checked={scoring.insurance_confirmed} onCheckedChange={(v) => setScoring({ ...scoring, insurance_confirmed: !!v })} id="insurance" />
                  <Label htmlFor="insurance" className="cursor-pointer flex-1">
                    <span className="font-medium text-foreground">Sug'urta tasdiqlangan</span>
                    <p className="text-xs text-muted-foreground">Kredit sug'urtasi rasmiylashtirilgan</p>
                  </Label>
                </div>
              </div>

              <div className={`p-4 rounded-lg border text-center ${
                scoringResult === 'recommended' ? 'bg-success-50 border-success-100 dark:bg-success/10 dark:border-success/20' :
                scoringResult === 'risky' ? 'bg-warning-50 border-warning-400/30 dark:bg-warning/10' :
                'bg-secondary border-border'
              }`}>
                <p className="text-sm font-medium text-muted-foreground mb-1">Skoring natijasi:</p>
                <p className={`text-lg font-bold ${
                  scoringResult === 'recommended' ? 'text-success' :
                  scoringResult === 'risky' ? 'text-warning' :
                  'text-muted-foreground'
                }`}>
                  {scoringResult === 'recommended' ? '✅ Tavsiya etiladi' :
                   scoringResult === 'risky' ? '⚠️ Xavfli' :
                   '— Mezonlar tanlanmagan'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{checkedCount}/3 mezon bajarildi</p>
              </div>
            </div>
          )}

          {/* Step 5: Disbursement */}
          {currentStep === 5 && (
            <div className="space-y-5 animate-slide-up">
              <div className="text-center py-4">
                <Banknote className="w-12 h-12 mx-auto mb-3 text-success" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Kredit berish</h3>
                <p className="text-sm text-muted-foreground">Yakuniy ma'lumotlarni tekshiring va tasdiqlang</p>
              </div>

              <div className="p-4 bg-secondary rounded-lg space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mijoz:</span>
                  <span className="font-medium text-foreground">{selectedClient?.full_name || '—'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Kredit summasi:</span>
                  <span className="font-bold text-primary">{parseFloat(formData.summa || '0').toLocaleString()} {formData.valuta}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Muddat:</span>
                  <span className="text-foreground">{formData.muddat_oy} oy</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Oylik to'lov:</span>
                  <span className="font-medium text-foreground">{oylikTolov.toLocaleString(undefined, { maximumFractionDigits: 0 })} {formData.valuta}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Skoring:</span>
                  <Badge variant={scoringResult === 'recommended' ? 'success' : 'warning'}>
                    {scoringResult === 'recommended' ? 'Tavsiya etiladi' : 'Xavfli'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={currentStep === 1 ? onClose : handleBack}>
            {currentStep === 1 ? 'Bekor qilish' : <><ChevronLeft className="w-4 h-4" />Orqaga</>}
          </Button>
          {currentStep < 5 ? (
            <Button onClick={handleNext}>
              Keyingi <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className={scoringResult === 'recommended' ? '' : 'bg-warning hover:bg-warning/90'}>
              <Check className="w-4 h-4" />
              {scoringResult === 'recommended' ? 'Tasdiqlash' : 'Rad etish bilan yakunlash'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
