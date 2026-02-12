import { useState, useMemo } from 'react';
import { X, Landmark, Check, Printer, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { DepositOpen, ActivityLog, Currency, DepositType, CURRENCY_CONFIG } from '@/types/bank';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Loader2 } from 'lucide-react';

interface DepositOpenFormProps {
  onClose: () => void;
}

const DEPOSIT_RATES: Record<DepositType, Record<number, number>> = {
  muddatli: { 3: 18, 6: 20, 12: 22, 24: 24 },
  jamgarma: { 3: 16, 6: 18, 12: 20, 24: 22 },
  bolalar: { 12: 25, 24: 27, 36: 29 }
};

const DEPOSIT_LABELS: Record<DepositType, string> = {
  muddatli: 'Muddatli omonat',
  jamgarma: 'Jamg\'arma omonat',
  bolalar: 'Bolalar omonati'
};

export function DepositOpenForm({ onClose }: DepositOpenFormProps) {
  const { currentUser, clients, addDepositOp, addActivityLog, generateJournalEntries, addCorrectOperation } = useBankStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOp, setSavedOp] = useState<DepositOpen | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    client_id: '',
    omonat_turi: 'muddatli' as DepositType,
    valuta: 'UZS' as Currency,
    summa: '',
    muddat_oy: 12
  });
  
  const selectedClient = clients.find(c => c.client_id === formData.client_id);
  
  const { rate, expectedProfit } = useMemo(() => {
    const rates = DEPOSIT_RATES[formData.omonat_turi];
    const r = rates[formData.muddat_oy] || Object.values(rates)[0];
    const summa = parseFloat(formData.summa) || 0;
    const profit = (summa * r * formData.muddat_oy) / 1200;
    return { rate: r, expectedProfit: profit };
  }, [formData.omonat_turi, formData.muddat_oy, formData.summa]);
  
  const availableTerms = Object.keys(DEPOSIT_RATES[formData.omonat_turi]).map(Number);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.summa || parseFloat(formData.summa) <= 0) newErrors.summa = 'Summa kiriting';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      const payload = {
        operation_date: new Date().toISOString().replace('T', ' ').split('.')[0],
        operator_name: currentUser?.name || 'System',
        client_id: parseInt(formData.client_id),
        deposit_type: DEPOSIT_LABELS[formData.omonat_turi],
        currency: formData.valuta,
        amount: parseFloat(formData.summa),
        term_months: formData.muddat_oy,
        interest_rate: rate,
        operator_role: "Omonat operatori",
        bank_name: "Mamun Bank",
        branch_name: "Markaziy filial",
        notes: "",
        status: "completed"
      };

      const response = await fetch('https://mamun.university/api/v1/bt/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to create deposit');
      const result = await response.json();

      if (result.status === 200 || result.status === 201) {
        const operation: DepositOpen = {
          oper_id: `DEP-${result.data.id}`,
          sana_vaqt: new Date(),
          operator_id: currentUser?.id || '',
          operator_fio: currentUser?.name || '',
          client_id: formData.client_id,
          client_fio: selectedClient?.full_name || '',
          omonat_turi: formData.omonat_turi,
          valuta: formData.valuta,
          summa: parseFloat(formData.summa),
          muddat_oy: formData.muddat_oy,
          foiz: rate,
          status: 'completed'
        };
        
        addDepositOp(operation);
        
        const log: ActivityLog = {
          id: `LOG-${Date.now()}`,
          sana_vaqt: new Date(),
          xodim_id: currentUser?.id || '',
          xodim_fio: currentUser?.name || '',
          rol: 'omonat',
          operatsiya_turi: 'Omonat ochish',
          oper_id: operation.oper_id,
          mijoz_fio: operation.client_fio,
          summa: operation.summa,
          valuta: operation.valuta,
          status: 'completed'
        };
        
        addActivityLog(log);
        generateJournalEntries('deposit', operation.oper_id, operation.summa, operation.valuta, currentUser?.name || '');
        addCorrectOperation();
        setSavedOp(operation);
        setShowReceipt(true);
        toast.success("Omonat muvaffaqiyatli ochildi");
      }
    } catch (error) {
      console.error('Error creating deposit:', error);
      toast.error("Omonat ochishda xatolik yuz berdi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!savedOp) return;
    
    setIsDownloading(true);
    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(0, 111, 238); // #006FEE
      doc.text('MAMUN BANK', 105, 20, { align: 'center' });
      
      doc.setFontSize(14);
      doc.setTextColor(100);
      doc.text('OMONAT SHARTNOMASI', 105, 30, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`ID: ${savedOp.oper_id}`, 105, 37, { align: 'center' });
      
      // Content
      const tableData = [
        ['Mijoz', savedOp.client_fio],
        ['Omonat turi', DEPOSIT_LABELS[savedOp.omonat_turi]],
        ['Valyuta', savedOp.valuta],
        ['Summa', `${savedOp.summa.toLocaleString()} ${savedOp.valuta}`],
        ['Muddat', `${savedOp.muddat_oy} oy`],
        ['Yillik foiz', `${savedOp.foiz}%`],
        ['Sana', new Date(savedOp.sana_vaqt).toLocaleString()],
        ['Operator', savedOp.operator_fio],
        ['Bank', 'Mamun Bank'],
        ['Filial', 'Markaziy filial']
      ];

      autoTable(doc, {
        startY: 45,
        head: [['Maydon', 'Ma\'lumot']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 111, 238] },
        styles: { fontSize: 11, cellPadding: 5 }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(10);
      doc.setTextColor(150);
      doc.text('Ushbu hujjat elektron shaklda shakllantirilgan.', 105, finalY + 20, { align: 'center' });
      doc.text('MAMUN BANK - Ishonchli hamkoringiz', 105, finalY + 27, { align: 'center' });

      doc.save(`omonat-${savedOp.oper_id}.pdf`);
      toast.success("Kvitansiya yuklab olindi");
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("Kvitansiya yuklashda xatolik yuz berdi");
    } finally {
      setIsDownloading(false);
    }
  };
  
  if (showReceipt && savedOp) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
          <div className="bg-success-50 dark:bg-success/10 p-6 text-center border-b border-success-100 dark:border-success/20">
            <div className="w-12 h-12 rounded-full bg-success mx-auto mb-3 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Omonat ochildi!</h2>
          </div>
          
          <div className="p-6">
            <div className="bg-secondary rounded-lg p-4 space-y-3 mb-6 font-mono text-sm">
              <div className="text-center pb-3 border-b border-border">
                <p className="font-bold text-foreground">MAMUN BANK</p>
                <p className="text-xs text-muted-foreground">Omonat shartnomasi</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turi:</span>
                  <span className="font-medium text-foreground">{DEPOSIT_LABELS[savedOp.omonat_turi]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summa:</span>
                  <span className="font-bold text-foreground">{savedOp.summa.toLocaleString()} {savedOp.valuta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Muddat:</span>
                  <span className="text-foreground">{savedOp.muddat_oy} oy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Foiz:</span>
                  <span className="font-bold text-success">{savedOp.foiz}% yillik</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Yopish</Button>
              <Button 
                onClick={handleDownloadReceipt} 
                className="flex-1"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Yuklab olish
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center dark:bg-amber-500/10">
              <Landmark className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Omonat ochish</h2>
              <p className="text-sm text-muted-foreground">Yangi omonat hisobi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Mijoz</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
              <SelectTrigger><SelectValue placeholder="Mijozni tanlang (ixtiyoriy)..." /></SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Mijozlar yo'q</div>
                ) : (
                  clients.map(client => (<SelectItem key={client.client_id} value={client.client_id}>{client.full_name}</SelectItem>))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Omonat turi</Label>
            <Select value={formData.omonat_turi} onValueChange={(value: DepositType) => {
              const newTerms = Object.keys(DEPOSIT_RATES[value]).map(Number);
              setFormData({ ...formData, omonat_turi: value, muddat_oy: newTerms[0] });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="muddatli">📅 Muddatli omonat</SelectItem>
                <SelectItem value="jamgarma">💰 Jamg'arma omonat</SelectItem>
                <SelectItem value="bolalar">👶 Bolalar omonati</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Summa <span className="text-destructive">*</span></Label>
              <Input type="number" value={formData.summa} onChange={(e) => { setFormData({ ...formData, summa: e.target.value }); setErrors({ ...errors, summa: '' }); }} placeholder="5,000,000" className={errors.summa ? 'border-destructive' : ''} />
              {errors.summa && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.summa}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Valyuta</Label>
              <Select value={formData.valuta} onValueChange={(value: Currency) => setFormData({ ...formData, valuta: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_CONFIG) as Currency[]).map(cur => (<SelectItem key={cur} value={cur}>{CURRENCY_CONFIG[cur].flag} {cur}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Muddat</Label>
            <Select value={formData.muddat_oy.toString()} onValueChange={(value) => setFormData({ ...formData, muddat_oy: parseInt(value) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableTerms.map(months => (
                  <SelectItem key={months} value={months.toString()}>
                    {months} oy — {DEPOSIT_RATES[formData.omonat_turi][months]}% yillik
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="p-4 bg-success-50 dark:bg-success/10 rounded-lg border border-success-100 dark:border-success/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Foiz stavkasi:</span>
              <span className="font-bold text-success">{rate}% yillik</span>
            </div>
            {formData.summa && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kutilayotgan foyda:</span>
                <span className="font-bold text-lg text-success">+{expectedProfit.toLocaleString()} {formData.valuta}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Bekor qilish</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saqlanmoqda...' : <><Check className="w-4 h-4" />Ochish</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
