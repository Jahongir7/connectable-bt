import { useState } from 'react';
import { X, TrendingDown, Check, Printer, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { CashOut, ActivityLog, Currency, CURRENCY_CONFIG } from '@/types/bank';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashOutFormProps {
  onClose: () => void;
}

export function CashOutForm({ onClose }: CashOutFormProps) {
  const { currentUser, clients, addCashOut, addActivityLog, generateJournalEntries } = useBankStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOp, setSavedOp] = useState<CashOut | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    client_id: '',
    valuta: 'UZS' as Currency,
    summa: '',
    asos: '',
    izoh: ''
  });
  
  const selectedClient = clients.find(c => c.client_id === formData.client_id);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.summa || parseFloat(formData.summa) <= 0) newErrors.summa = 'Summa kiriting';
    if (!formData.asos.trim()) newErrors.asos = 'Asos kiriting';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const handleDownloadReceipt = async (id: string) => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    try {
      // Fetch full details from API
      const cleanId = id.replace('CO-', '');
      const response = await fetch(`https://mamun.university/api/v1/bt/cash-out/${cleanId}`);
      if (!response.ok) throw new Error('Failed to fetch details');
      const result = await response.json();
      const data = result.data;

      const doc = new jsPDF({
        unit: 'mm',
        format: [80, 150]
      });

      // Header
      doc.setFontSize(14);
      doc.text('MAMUN BANK', 40, 10, { align: 'center' });
      doc.setFontSize(10);
      doc.text('KASSA CHIQIM ORDERI', 40, 16, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(10, 20, 70, 20);

      // Details Table
      const details = [
        ['Operatsiya №:', `CO-${data.id}`],
        ['Sana:', data.operation_date],
        ['Mijoz:', data.client_name],
        ['Pasport:', data.client_passport || '-'],
        ['Valyuta:', data.currency],
        ['Summa:', `${parseFloat(data.amount).toLocaleString()} ${data.currency}`],
        ['Asos:', data.reason],
        ['Kassir:', data.operator_name],
        ['Filial:', data.branch_name]
      ];

      autoTable(doc, {
        startY: 25,
        body: details,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 } }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(8);
      doc.text('Mijoz imzosi: _________________', 10, finalY);
      doc.text('Kassir imzosi: _________________', 10, finalY + 10);
      doc.setFontSize(7);
      doc.text('Tizim orqali yaratilgan: ' + new Date().toLocaleString(), 40, finalY + 20, { align: 'center' });

      doc.save(`receipt-CO-${data.id}.pdf`);
      toast.success("Kvitansiya yuklab olindi");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("Kvitansiyani yuklab olishda xatolik");
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    
    try {
      const payload = {
        operation_date: formatDate(new Date()),
        operator_name: currentUser?.name || 'Alisher Valiyev',
        client_id: parseInt(formData.client_id) || 1,
        currency: formData.valuta,
        amount: parseFloat(formData.summa),
        reason: formData.asos,
        operator_role: 'Kassir',
        bank_name: 'Mamun Bank',
        branch_name: 'Markaziy filial',
        notes: formData.izoh || null,
        status: 'completed'
      };

      const response = await fetch('https://mamun.university/api/v1/bt/cash-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server xatosi');
      }

      const result = await response.json();
      const operId = result.data.oper_id || `CO-${result.data.id}`;

      const operation: CashOut = {
        oper_id: operId,
        sana_vaqt: new Date(),
        kassir_id: currentUser?.id || 'system',
        kassir_fio: currentUser?.name || 'Alisher Valiyev',
        client_id: formData.client_id,
        client_fio: selectedClient?.full_name || result.data.client_name || '',
        valuta: formData.valuta,
        summa: parseFloat(formData.summa),
        asos: formData.asos,
        izoh: formData.izoh || undefined,
        status: 'completed',
        print_count: 0
      };
      
      addCashOut(operation);
      
      const log: ActivityLog = {
        id: `LOG-${Date.now()}`,
        sana_vaqt: new Date(),
        xodim_id: currentUser?.id || 'system',
        xodim_fio: currentUser?.name || 'Alisher Valiyev',
        rol: 'kassir',
        operatsiya_turi: 'Naqd pul chiqim',
        oper_id: operation.oper_id,
        mijoz_fio: operation.client_fio,
        summa: operation.summa,
        valuta: operation.valuta,
        status: 'completed'
      };
      
      addActivityLog(log);
      generateJournalEntries('cash_out', operation.oper_id, operation.summa, operation.valuta, currentUser?.name || '');
      
      setSavedOp(operation);
      setShowReceipt(true);
      toast.success("Operatsiya muvaffaqiyatli saqlandi");
    } catch (error: any) {
      console.error('Cash-out error:', error);
      toast.error(error.message || "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
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
            <h2 className="text-lg font-semibold text-foreground">Muvaffaqiyatli!</h2>
          </div>
          
          <div className="p-6">
            <div className="bg-secondary rounded-lg p-4 space-y-3 mb-6 font-mono text-sm">
              <div className="text-center pb-3 border-b border-border">
                <p className="font-bold text-foreground">MAMUN BANK</p>
                <p className="text-xs text-muted-foreground">Kassa chiqim orderi</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">№:</span>
                  <span className="font-medium text-foreground">{savedOp.oper_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mijoz:</span>
                  <span className="text-foreground">{savedOp.client_fio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summa:</span>
                  <span className="font-bold text-destructive">-{savedOp.summa.toLocaleString()} {savedOp.valuta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asos:</span>
                  <span className="text-foreground">{savedOp.asos}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">Yopish</Button>
              <Button 
                onClick={() => handleDownloadReceipt(savedOp.oper_id)} 
                disabled={isDownloading}
                className="flex-1"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Printer className="w-4 h-4" />
                )}
                Chop etish
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
            <div className="w-10 h-10 rounded-lg bg-error-50 flex items-center justify-center dark:bg-error-500/10">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Naqd pul chiqim</h2>
              <p className="text-sm text-muted-foreground">Mijozga pul berish</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Mijoz</Label>
            <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Mijozni tanlang (ixtiyoriy)..." />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">Mijozlar yo'q</div>
                ) : (
                    clients.map(client => (
                      <SelectItem key={client.client_id} value={client.client_id}>{client.full_name}</SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Summa <span className="text-destructive">*</span></Label>
              <Input type="number" value={formData.summa} onChange={(e) => { setFormData({ ...formData, summa: e.target.value }); setErrors({ ...errors, summa: '' }); }} placeholder="500,000" className={errors.summa ? 'border-destructive' : ''} />
              {errors.summa && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.summa}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Valyuta</Label>
              <Select value={formData.valuta} onValueChange={(value: Currency) => setFormData({ ...formData, valuta: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_CONFIG) as Currency[]).map(cur => (
                    <SelectItem key={cur} value={cur}>{CURRENCY_CONFIG[cur].flag} {cur}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Asos <span className="text-destructive">*</span></Label>
            <Input value={formData.asos} onChange={(e) => { setFormData({ ...formData, asos: e.target.value }); setErrors({ ...errors, asos: '' }); }} placeholder="Hisobdan yechish" className={errors.asos ? 'border-destructive' : ''} />
            {errors.asos && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.asos}</p>}
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Izoh</Label>
            <Input value={formData.izoh} onChange={(e) => setFormData({ ...formData, izoh: e.target.value })} placeholder="Qo'shimcha izoh..." />
          </div>
          
          {formData.summa && (
            <div className="p-4 bg-error-50 dark:bg-error-500/10 rounded-lg border border-error-100 dark:border-error-500/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Chiqim summasi:</span>
                <span className="font-bold text-destructive text-lg">-{parseFloat(formData.summa).toLocaleString()} {formData.valuta}</span>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Bekor qilish</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? 'Saqlanmoqda...' : <><Check className="w-4 h-4" />Saqlash</>}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
