import { X, BarChart3, TrendingUp, TrendingDown, AlertTriangle, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBankStore } from '@/store/bankStore';
import { useMemo } from 'react';

interface DailyReportProps {
  onClose: () => void;
}

export function DailyReport({ onClose }: DailyReportProps) {
  const { cashInOps, cashOutOps, fxOps, cardOps, depositOps, loanOps, studentScore } = useBankStore();

  const report = useMemo(() => {
    const today = new Date().toDateString();
    const isToday = (d: Date | string) => new Date(d).toDateString() === today;

    const todayCashIn = cashInOps.filter(op => isToday(op.sana_vaqt));
    const todayCashOut = cashOutOps.filter(op => isToday(op.sana_vaqt));
    const todayFx = fxOps.filter(op => isToday(op.sana_vaqt));
    const todayCard = cardOps.filter(op => isToday(op.sana_vaqt));
    const todayDeposit = depositOps.filter(op => isToday(op.sana_vaqt));
    const todayLoan = loanOps.filter(op => isToday(op.sana_vaqt));

    const totalOps = todayCashIn.length + todayCashOut.length + todayFx.length + todayCard.length + todayDeposit.length + todayLoan.length;

    const totalIncoming = { UZS: 0, USD: 0, EUR: 0 };
    todayCashIn.forEach(op => { totalIncoming[op.valuta] += op.summa; });

    const totalOutgoing = { UZS: 0, USD: 0, EUR: 0 };
    todayCashOut.forEach(op => { totalOutgoing[op.valuta] += op.summa; });
    todayLoan.forEach(op => { totalOutgoing[op.valuta] += op.summa; });

    return {
      totalOps,
      todayCashIn: todayCashIn.length,
      todayCashOut: todayCashOut.length,
      todayFx: todayFx.length,
      todayCard: todayCard.length,
      todayDeposit: todayDeposit.length,
      todayLoan: todayLoan.length,
      totalIncoming,
      totalOutgoing,
      errorCount: studentScore.error_count,
      score: studentScore.score,
    };
  }, [cashInOps, cashOutOps, fxOps, cardOps, depositOps, loanOps, studentScore]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center dark:bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg-semibold text-foreground">Kunlik hisobot</h2>
              <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-secondary rounded-xl text-center">
              <Activity className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{report.totalOps}</p>
              <p className="text-xs text-muted-foreground">Jami operatsiyalar</p>
            </div>
            <div className="p-4 bg-success-50 dark:bg-success/10 rounded-xl text-center">
              <TrendingUp className="w-5 h-5 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">{report.totalIncoming.UZS.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Kirim (UZS)</p>
            </div>
            <div className="p-4 bg-error-50 dark:bg-destructive/10 rounded-xl text-center">
              <TrendingDown className="w-5 h-5 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">{report.totalOutgoing.UZS.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Chiqim (UZS)</p>
            </div>
            <div className="p-4 bg-warning-50 dark:bg-warning/10 rounded-xl text-center">
              <AlertTriangle className="w-5 h-5 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{report.errorCount}</p>
              <p className="text-xs text-muted-foreground">Xatolar soni</p>
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Operatsiyalar taqsimoti</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Naqd kirim', count: report.todayCashIn, color: 'text-success' },
                { label: 'Naqd chiqim', count: report.todayCashOut, color: 'text-destructive' },
                { label: 'Valyuta', count: report.todayFx, color: 'text-primary' },
                { label: 'Plastik karta', count: report.todayCard, color: 'text-purple-500' },
                { label: 'Omonat', count: report.todayDeposit, color: 'text-amber-500' },
                { label: 'Kredit', count: report.todayLoan, color: 'text-primary' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                  <span className="text-sm text-foreground">{item.label}</span>
                  <span className={`font-bold ${item.color}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Student Score */}
          <div className="p-4 bg-secondary rounded-xl">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Talaba natijasi</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{report.score}</p>
                <p className="text-xs text-muted-foreground">ball</p>
              </div>
              <Badge variant={
                report.errorCount >= 5 ? 'error' :
                report.errorCount >= 3 ? 'warning' : 'success'
              } className="text-sm px-3 py-1">
                {report.errorCount >= 5 ? '🔴 Jarima' :
                 report.errorCount >= 3 ? '⚠️ Ogohlantirish' : '✅ Yaxshi'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end bg-secondary/30">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
        </div>
      </div>
    </div>
  );
}
