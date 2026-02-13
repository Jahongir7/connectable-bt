import { X, BarChart3, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useBankStore } from '@/store/bankStore';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface LoanAnalysisProps {
  onClose: () => void;
}

export function LoanAnalysis({ onClose }: LoanAnalysisProps) {
  const { loanOps, updateLoanOp } = useBankStore();
  const [selectedLoan, setSelectedLoan] = useState<string | null>(null);

  const loan = loanOps.find(l => l.oper_id === selectedLoan);

  const handleScoringChange = (loanId: string, field: keyof typeof loan.scoring, value: boolean) => {
    const target = loanOps.find(l => l.oper_id === loanId);
    if (!target) return;
    
    const newScoring = { ...target.scoring, [field]: value };
    const checkedCount = [newScoring.has_income, newScoring.no_existing_debt, newScoring.insurance_confirmed].filter(Boolean).length;
    const result = checkedCount >= 2 ? 'recommended' : checkedCount === 1 ? 'risky' : 'pending';
    
    updateLoanOp(loanId, {
      scoring: newScoring,
      scoring_result: result as any,
    });
    
    toast.success(`Tahlil yangilandi: ${result === 'recommended' ? 'Tavsiya etiladi' : result === 'risky' ? 'Xavfli' : 'Kutilmoqda'}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center dark:bg-blue-500/10">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg-semibold text-foreground">Kredit tahlili</h2>
              <p className="text-sm text-muted-foreground">Kreditlarni ko'rib chiqish va qaror qabul qilish</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex h-[70vh]">
          {/* Loan list */}
          <div className="w-1/3 border-r border-border overflow-auto">
            {loanOps.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">Kredit arizalari yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {loanOps.map(l => (
                  <button
                    key={l.oper_id}
                    onClick={() => setSelectedLoan(l.oper_id)}
                    className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${selectedLoan === l.oper_id ? 'bg-secondary' : ''}`}
                  >
                    <p className="font-medium text-foreground text-sm">{l.client_fio}</p>
                    <p className="text-xs text-muted-foreground">{l.oper_id} · {l.summa.toLocaleString()} {l.valuta}</p>
                    <Badge variant={l.scoring_result === 'recommended' ? 'success' : l.scoring_result === 'risky' ? 'warning' : 'gray'} className="mt-1 text-xs">
                      {l.scoring_result === 'recommended' ? '✅ Tavsiya' : l.scoring_result === 'risky' ? '⚠️ Xavfli' : '— Kutilmoqda'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className="flex-1 p-6 overflow-auto">
            {!loan ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                Chap tomondan kredit tanlang
              </div>
            ) : (
              <div className="space-y-6 animate-slide-up">
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Mijoz:</span>
                    <span className="font-medium text-foreground">{loan.client_fio}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Summa:</span>
                    <span className="font-bold text-foreground">{loan.summa.toLocaleString()} {loan.valuta}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Muddat:</span>
                    <span className="text-foreground">{loan.muddat_oy} oy</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Maqsad:</span>
                    <span className="text-foreground">{loan.maqsad}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Oylik to'lov:</span>
                    <span className="font-medium text-primary">{loan.oylik_tolov.toLocaleString(undefined, { maximumFractionDigits: 0 })} {loan.valuta}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Qaror mezonlari</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                      <Checkbox
                        checked={loan.scoring.has_income}
                        onCheckedChange={(v) => handleScoringChange(loan.oper_id, 'has_income', !!v)}
                        id={`income-${loan.oper_id}`}
                      />
                      <Label htmlFor={`income-${loan.oper_id}`} className="cursor-pointer flex-1">
                        <span className="font-medium text-foreground">Daromadga ega</span>
                        <p className="text-xs text-muted-foreground">Mijozning doimiy daromad manbai bor</p>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                      <Checkbox
                        checked={loan.scoring.no_existing_debt}
                        onCheckedChange={(v) => handleScoringChange(loan.oper_id, 'no_existing_debt', !!v)}
                        id={`debt-${loan.oper_id}`}
                      />
                      <Label htmlFor={`debt-${loan.oper_id}`} className="cursor-pointer flex-1">
                        <span className="font-medium text-foreground">Mavjud qarz yo'q</span>
                        <p className="text-xs text-muted-foreground">Boshqa faol kreditlari mavjud emas</p>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-secondary rounded-lg">
                      <Checkbox
                        checked={loan.scoring.insurance_confirmed}
                        onCheckedChange={(v) => handleScoringChange(loan.oper_id, 'insurance_confirmed', !!v)}
                        id={`insurance-${loan.oper_id}`}
                      />
                      <Label htmlFor={`insurance-${loan.oper_id}`} className="cursor-pointer flex-1">
                        <span className="font-medium text-foreground">Sug'urta tasdiqlangan</span>
                        <p className="text-xs text-muted-foreground">Kredit sug'urtasi rasmiylashtirilgan</p>
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Result */}
                <div className={`p-4 rounded-lg border text-center ${
                  loan.scoring_result === 'recommended' ? 'bg-success-50 border-success-100 dark:bg-success/10 dark:border-success/20' :
                  loan.scoring_result === 'risky' ? 'bg-warning-50 border-warning-400/30 dark:bg-warning/10' :
                  'bg-secondary border-border'
                }`}>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Natija:</p>
                  <p className={`text-lg font-bold ${
                    loan.scoring_result === 'recommended' ? 'text-success' :
                    loan.scoring_result === 'risky' ? 'text-warning' :
                    'text-muted-foreground'
                  }`}>
                    {loan.scoring_result === 'recommended' ? '✅ Tavsiya etiladi' :
                     loan.scoring_result === 'risky' ? '⚠️ Xavfli' :
                     '— Mezonlar tanlanmagan'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end bg-secondary/30">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
        </div>
      </div>
    </div>
  );
}
