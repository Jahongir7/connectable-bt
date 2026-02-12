import { useState } from 'react';
import { X, TrendingUp, Check, Printer, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { CashIn, ActivityLog, Currency, CURRENCY_CONFIG } from '@/types/bank';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CashInFormProps {
  onClose: () => void;
}

export function CashInForm({ onClose }: CashInFormProps) {
  const { currentUser, clients, addCashIn, addActivityLog } = useBankStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOp, setSavedOp] = useState<CashIn | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [formData, setFormData] = useState({
    client_id: '',
    valuta: 'UZS' as Currency,
    summa: '',
    maqsad: '',
    izoh: ''
  });
  
  const selectedClient = clients.find(c => c.client_id === formData.client_id);
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.summa || parseFloat(formData.summa) <= 0) newErrors.summa = 'Summa kiriting';
    if (!formData.maqsad.trim()) newErrors.maqsad = 'Maqsad kiriting';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    
    const formatDate = (date: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    try {
      const payload = {
        operation_date: formatDate(new Date()),
        operator_name: currentUser?.name || 'System',
        client_id: parseInt(formData.client_id) || 0,
        currency: formData.valuta,
        amount: parseFloat(formData.summa),
        purpose: formData.maqsad,
        operator_role: "Kassir",
        bank_name: "Mamun Bank",
        branch_name: "Markaziy filial",
        notes: formData.izoh || "",
        status: "completed"
      };

      const response = await fetch('https://mamun.university/api/v1/bt/cash-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Operatsiyani saqlashda xatolik yuz berdi');
      }

      const result = await response.json();
      
      const operation: CashIn = {
        oper_id: result.oper_id || `CI-${Date.now()}`,
        sana_vaqt: new Date(),
        kassir_id: currentUser?.id || '',
        kassir_fio: currentUser?.name || '',
        client_id: formData.client_id,
        client_fio: selectedClient?.full_name || '',
        valuta: formData.valuta,
        summa: parseFloat(formData.summa),
        maqsad: formData.maqsad,
        izoh: formData.izoh || undefined,
        status: 'completed',
        print_count: 0
      };
      
      addCashIn(operation);
      
      const log: ActivityLog = {
        id: `LOG-${Date.now()}`,
        sana_vaqt: new Date(),
        xodim_id: currentUser?.id || '',
        xodim_fio: currentUser?.name || '',
        rol: 'kassir',
        operatsiya_turi: 'Naqd pul kirim',
        oper_id: operation.oper_id,
        mijoz_fio: operation.client_fio,
        summa: operation.summa,
        valuta: operation.valuta,
        status: 'completed'
      };
      
      addActivityLog(log);
      setSavedOp(operation);
      setShowReceipt(true);
      toast.success("Operatsiya muvaffaqiyatli saqlandi");
    } catch (error) {
      console.error('API Error:', error);
      toast.error(error instanceof Error ? error.message : "Xatolik yuz berdi. Qayta urinib ko'ring.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDownloadReceipt = async () => {
    if (!savedOp) return;
    setIsDownloading(true);
    try {
      // 1. Fetch full operation details
      const response = await fetch(`https://mamun.university/api/v1/bt/cash-in/${savedOp.oper_id.split('-')[1] || savedOp.oper_id}`);
      if (!response.ok) throw new Error('Ma\'lumotlarni yuklashda xatolik');
      const result = await response.json();
      const data = result.data;

      // 2. Generate PDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 150] // Receipt size
      });

      // Header
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MAMUN BANK', 40, 15, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Kassa kirim orderi', 40, 20, { align: 'center' });
      doc.line(10, 25, 70, 25);

      // Details
      const details = [
        ['№:', data.id.toString()],
        ['Sana:', data.operation_date],
        ['Mijoz:', data.client_name],
        ['Summa:', `${parseFloat(data.amount).toLocaleString()} ${data.currency}`],
        ['Maqsad:', data.purpose],
        ['Kassir:', data.operator_name]
      ];

      autoTable(doc, {
        startY: 30,
        body: details,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold', width: 20 } }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(7);
      doc.text('Xizmatimizdan foydalanganingiz uchun rahmat!', 40, finalY, { align: 'center' });

      // 3. Download
      doc.save(`receipt-${data.id}.pdf`);
      toast.success("PDF yuklab olindi");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("PDF yuklashda xatolik yuz berdi");
    } finally {
      setIsDownloading(false);
    }
  };

  if (showReceipt && savedOp) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
          {/* Success Header */}
          <div className="bg-success-50 dark:bg-success/10 p-6 text-center border-b border-success-100 dark:border-success/20">
            <div className="w-12 h-12 rounded-full bg-success mx-auto mb-3 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Muvaffaqiyatli!</h2>
            <p className="text-sm text-muted-foreground">Operatsiya saqlandi</p>
          </div>
          
          {/* Receipt */}
          <div className="p-6">
            <div className="bg-secondary rounded-lg p-4 space-y-3 mb-6 font-mono text-sm">
              <div className="text-center pb-3 border-b border-border">
                <p className="font-bold text-foreground">MAMUN BANK</p>
                <p className="text-xs text-muted-foreground">Kassa kirim orderi</p>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">№:</span>
                  <span className="font-medium text-foreground">{savedOp.oper_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sana:</span>
                  <span className="text-foreground">{new Date(savedOp.sana_vaqt).toLocaleString('uz-UZ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mijoz:</span>
                  <span className="text-foreground">{savedOp.client_fio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Summa:</span>
                  <span className="font-bold text-success">{savedOp.summa.toLocaleString()} {savedOp.valuta}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Maqsad:</span>
                  <span className="text-foreground">{savedOp.maqsad}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kassir:</span>
                  <span className="text-foreground">{savedOp.kassir_fio}</span>
                </div>
              </div>
              
              <div className="text-center pt-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Xizmatimizdan foydalanganingiz uchun rahmat!</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Yopish
              </Button>
              <Button 
                onClick={handleDownloadReceipt} 
                className="flex-1"
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center dark:bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Naqd pul kirim</h2>
              <p className="text-sm text-muted-foreground">Mijozdan pul qabul qilish</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Mijoz</Label>
            <Select
              value={formData.client_id}
              onValueChange={(value) => {
                setFormData({ ...formData, client_id: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Mijozni tanlang (ixtiyoriy)..." />
              </SelectTrigger>
              <SelectContent>
                {clients.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    Mijozlar yo'q
                  </div>
                ) : (
                    clients.map(client => (
                      <SelectItem key={client.client_id} value={client.client_id}>
                        <div className="flex items-center gap-2">
                          <span>{client.full_name}</span>
                          <span className="text-muted-foreground">· {client.passport_series_number}</span>
                        </div>
                      </SelectItem>
                    ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Summa <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                value={formData.summa}
                onChange={(e) => {
                  setFormData({ ...formData, summa: e.target.value });
                  setErrors({ ...errors, summa: '' });
                }}
                placeholder="1,000,000"
                className={errors.summa ? 'border-destructive' : ''}
              />
              {errors.summa && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.summa}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Valyuta</Label>
              <Select
                value={formData.valuta}
                onValueChange={(value: Currency) => setFormData({ ...formData, valuta: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_CONFIG) as Currency[]).map(cur => (
                    <SelectItem key={cur} value={cur}>
                      {CURRENCY_CONFIG[cur].flag} {cur} - {CURRENCY_CONFIG[cur].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">
              Maqsad <span className="text-destructive">*</span>
            </Label>
            <Input
              value={formData.maqsad}
              onChange={(e) => {
                setFormData({ ...formData, maqsad: e.target.value });
                setErrors({ ...errors, maqsad: '' });
              }}
              placeholder="Hisobni to'ldirish"
              className={errors.maqsad ? 'border-destructive' : ''}
            />
            {errors.maqsad && (
              <p className="text-sm text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.maqsad}
              </p>
            )}
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Izoh</Label>
            <Input
              value={formData.izoh}
              onChange={(e) => setFormData({ ...formData, izoh: e.target.value })}
              placeholder="Qo'shimcha izoh..."
            />
          </div>
          
          {/* Summary */}
          {formData.summa && (
            <div className="p-4 bg-success-50 dark:bg-success/10 rounded-lg border border-success-100 dark:border-success/20">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kirim summasi:</span>
                <span className="font-bold text-success text-lg">
                  +{parseFloat(formData.summa).toLocaleString()} {formData.valuta}
                </span>
              </div>
            </div>
          )}
          
          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Bekor qilish
            </Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saqlanmoqda...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Saqlash
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
