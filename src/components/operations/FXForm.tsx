import { useState, useMemo } from 'react';
import { X, ArrowLeftRight, Check, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { FXOperation, ActivityLog, Currency, CURRENCY_CONFIG } from '@/types/bank';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface FXFormProps {
  onClose: () => void;
}

const EXCHANGE_RATES: Record<string, number> = {
  'USD-UZS': 12750,
  'EUR-UZS': 13800,
  'UZS-USD': 1/12750,
  'UZS-EUR': 1/13800,
  'USD-EUR': 0.92,
  'EUR-USD': 1.08,
};

export function FXForm({ onClose }: FXFormProps) {
  const { currentUser, clients, addFxOp, addActivityLog, generateJournalEntries } = useBankStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOp, setSavedOp] = useState<FXOperation | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    client_id: '',
    turi: 'buy' as 'buy' | 'sell',
    berilgan_valyuta: 'USD' as Currency,
    berilgan_summa: '',
    olinadigan_valyuta: 'UZS' as Currency,
    izoh: ''
  });
  
  const selectedClient = clients.find(c => c.client_id === formData.client_id);
  
  const { rate, olinadiganSumma } = useMemo(() => {
    const key = `${formData.berilgan_valyuta}-${formData.olinadigan_valyuta}`;
    const r = EXCHANGE_RATES[key] || 1;
    const summa = parseFloat(formData.berilgan_summa) || 0;
    return { rate: r, olinadiganSumma: summa * r };
  }, [formData.berilgan_valyuta, formData.olinadigan_valyuta, formData.berilgan_summa]);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.berilgan_summa || parseFloat(formData.berilgan_summa) <= 0) newErrors.berilgan_summa = 'Summa kiriting';
    if (formData.berilgan_valyuta === formData.olinadigan_valyuta) newErrors.olinadigan_valyuta = 'Turli valyutalar tanlang';
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
      const cleanId = id.replace('FX-', '');
      const response = await fetch(`https://mamun.university/api/v1/bt/currency-exchange/${cleanId}`);
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
      doc.text('VALYUTA AYIRBOSHLASH', 40, 16, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(10, 20, 70, 20);

      // Details Table
      const details = [
        ['Operatsiya №:', `FX-${data.id}`],
        ['Sana:', data.operation_date],
        ['Mijoz:', data.client_name],
        ['Turi:', data.operation_type === 'buy' ? 'Sotib olish' : 'Sotish'],
        ['Berildi:', `${parseFloat(data.given_amount).toLocaleString()} ${data.given_currency}`],
        ['Olindi:', `${parseFloat(data.received_amount || (data.given_amount * data.exchange_rate)).toLocaleString()} ${data.received_currency}`],
        ['Kurs:', data.exchange_rate.toString()],
        ['Komissiya:', `${data.commission_percent}%`],
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

      doc.save(`receipt-FX-${data.id}.pdf`);
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
        operator_name: currentUser?.name || 'Gulnora Karimova',
        client_id: parseInt(formData.client_id) || 1,
        operation_type: formData.turi,
        given_currency: formData.berilgan_valyuta,
        given_amount: parseFloat(formData.berilgan_summa),
        received_currency: formData.olinadigan_valyuta,
        exchange_rate: rate,
        commission_percent: 1,
        operator_role: 'Valyuta operatori',
        bank_name: 'Mamun Bank',
        branch_name: 'Markaziy filial',
        notes: formData.izoh || null,
        status: 'completed'
      };

      const response = await fetch('https://mamun.university/api/v1/bt/currency-exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server xatosi');
      }

      const result = await response.json();
      const operId = result.data.oper_id || `FX-${result.data.id}`;

      const operation: FXOperation = {
        oper_id: operId,
        sana_vaqt: new Date(),
        operator_id: currentUser?.id || 'system',
        operator_fio: currentUser?.name || 'Gulnora Karimova',
        client_id: formData.client_id,
        client_fio: selectedClient?.full_name || result.data.client_name || '',
        turi: formData.turi,
        berilgan_valyuta: formData.berilgan_valyuta,
        berilgan_summa: parseFloat(formData.berilgan_summa),
        olinadigan_valyuta: formData.olinadigan_valyuta,
        olinadigan_summa: olinadiganSumma,
        kurs: rate,
        komissiya: 1,
        status: 'completed'
      };
      
      addFxOp(operation);
      
      const log: ActivityLog = {
        id: `LOG-${Date.now()}`,
        sana_vaqt: new Date(),
        xodim_id: currentUser?.id || 'system',
        xodim_fio: currentUser?.name || 'Gulnora Karimova',
        rol: 'valyuta',
        operatsiya_turi: 'Valyuta ayirboshlash',
        oper_id: operation.oper_id,
        mijoz_fio: operation.client_fio,
        summa: operation.berilgan_summa,
        valuta: operation.berilgan_valyuta,
        status: 'completed'
      };
      
      addActivityLog(log);
      generateJournalEntries('fx', operation.oper_id, operation.berilgan_summa, operation.berilgan_valyuta, currentUser?.name || '');
      
      setSavedOp(operation);
      setShowReceipt(true);
      toast.success("Operatsiya muvaffaqiyatli saqlandi");
    } catch (error: any) {
      console.error('FX error:', error);
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
                <p className="text-xs text-muted-foreground">Valyuta ayirboshlash</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Berildi:</span>
                  <span className="font-medium text-foreground">{savedOp.berilgan_summa.toLocaleString()} {savedOp.berilgan_valyuta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Olindi:</span>
                  <span className="font-bold text-success">{savedOp.olinadigan_summa.toLocaleString()} {savedOp.olinadigan_valyuta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kurs:</span>
                  <span className="text-foreground">{savedOp.kurs}</span>
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
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center dark:bg-primary/10">
              <ArrowLeftRight className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Valyuta ayirboshlash</h2>
              <p className="text-sm text-muted-foreground">Sotib olish / Sotish</p>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Berilgan valyuta</Label>
              <Select value={formData.berilgan_valyuta} onValueChange={(value: Currency) => setFormData({ ...formData, berilgan_valyuta: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_CONFIG) as Currency[]).map(cur => (<SelectItem key={cur} value={cur}>{CURRENCY_CONFIG[cur].flag} {cur}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Olinadigan valyuta</Label>
              <Select value={formData.olinadigan_valyuta} onValueChange={(value: Currency) => { setFormData({ ...formData, olinadigan_valyuta: value }); setErrors({ ...errors, olinadigan_valyuta: '' }); }}>
                <SelectTrigger className={errors.olinadigan_valyuta ? 'border-destructive' : ''}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_CONFIG) as Currency[]).map(cur => (<SelectItem key={cur} value={cur}>{CURRENCY_CONFIG[cur].flag} {cur}</SelectItem>))}
                </SelectContent>
              </Select>
              {errors.olinadigan_valyuta && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.olinadigan_valyuta}</p>}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Berilgan summa <span className="text-destructive">*</span></Label>
            <Input type="number" value={formData.berilgan_summa} onChange={(e) => { setFormData({ ...formData, berilgan_summa: e.target.value }); setErrors({ ...errors, berilgan_summa: '' }); }} placeholder="100" className={errors.berilgan_summa ? 'border-destructive' : ''} />
            {errors.berilgan_summa && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.berilgan_summa}</p>}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Izoh</Label>
            <Input value={formData.izoh} onChange={(e) => setFormData({ ...formData, izoh: e.target.value })} placeholder="Qo'shimcha izoh..." />
          </div>
          
          <div className="p-4 bg-primary-50 dark:bg-primary/10 rounded-lg border border-primary-100 dark:border-primary/20 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kurs:</span>
              <span className="font-medium text-foreground">{rate.toFixed(rate < 1 ? 6 : 2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Olinadi:</span>
              <span className="font-bold text-lg text-primary">{olinadiganSumma.toLocaleString()} {formData.olinadigan_valyuta}</span>
            </div>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Bekor qilish</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Check className="w-4 h-4" />Saqlash</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
