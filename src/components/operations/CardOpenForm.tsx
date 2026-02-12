import { useState } from 'react';
import { X, CreditCard, Check, Printer, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useBankStore } from '@/store/bankStore';
import { CardOpen, ActivityLog, Currency, CardType, DeliveryType, CURRENCY_CONFIG } from '@/types/bank';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CardOpenFormProps {
  onClose: () => void;
}

export function CardOpenForm({ onClose }: CardOpenFormProps) {
  const { currentUser, clients, addCardOp, addActivityLog } = useBankStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [savedOp, setSavedOp] = useState<CardOpen | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    client_id: '',
    karta_turi: 'Humo' as CardType,
    valuta: 'UZS' as Currency,
    sms: true,
    telefon: '',
    yetkazish_turi: 'filial' as DeliveryType,
    boshlangich_depozit: '',
    izoh: ''
  });
  
  const selectedClient = clients.find(c => c.client_id === formData.client_id);
  
  // Auto-fill phone when client selected
  const handleClientChange = (value: string) => {
    setFormData({ ...formData, client_id: value });
    const client = clients.find(c => c.client_id === value);
    if (client) {
      setFormData(prev => ({ ...prev, client_id: value, telefon: client.phone }));
    }
    setErrors({ ...errors, client_id: '' });
  };
  
  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (formData.sms && !formData.telefon.trim()) newErrors.telefon = 'SMS uchun telefon kerak';
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
      const cleanId = id.replace('CARD-', '');
      const response = await fetch(`https://mamun.university/api/v1/bt/card-applications/${cleanId}`);
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
      doc.text('PLASTIK KARTA ARIZASI', 40, 16, { align: 'center' });
      doc.setLineWidth(0.5);
      doc.line(10, 20, 70, 20);

      // Details Table
      const details = [
        ['Ariza №:', `CARD-${data.id}`],
        ['Sana:', data.operation_date],
        ['Mijoz:', data.client_name],
        ['Karta turi:', data.card_type],
        ['Valyuta:', data.currency],
        ['Telefon:', data.phone],
        ['Yetkazish:', data.delivery_type],
        ['SMS xizmati:', data.sms_notification ? 'Yoqilgan' : 'Ochirilgan'],
        ['Depozit:', `${parseFloat(data.initial_deposit || 0).toLocaleString()} ${data.currency}`],
        ['Holati:', data.card_status],
        ['Kassir:', data.operator_name]
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

      doc.save(`receipt-CARD-${data.id}.pdf`);
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
        operator_name: currentUser?.name || 'Dilshod Rahimov',
        client_id: parseInt(formData.client_id) || 1,
        card_type: formData.karta_turi,
        currency: formData.valuta,
        phone: formData.telefon,
        delivery_type: formData.yetkazish_turi === 'filial' ? 'Filialdan olish' : 'Kuryer orqali',
        sms_notification: formData.sms,
        initial_deposit: parseFloat(formData.boshlangich_depozit) || 0,
        card_status: 'Ariza qabul qilindi',
        operator_role: 'Plastik operator',
        bank_name: 'Mamun Bank',
        branch_name: 'Markaziy filial',
        notes: formData.izoh || null,
        status: 'completed'
      };

      const response = await fetch('https://mamun.university/api/v1/bt/card-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Server xatosi');
      }

      const result = await response.json();
      const operId = result.data.oper_id || `CARD-${result.data.id}`;

      const operation: CardOpen = {
        oper_id: operId,
        sana_vaqt: new Date(),
        operator_id: currentUser?.id || 'system',
        operator_fio: currentUser?.name || 'Dilshod Rahimov',
        client_id: formData.client_id,
        client_fio: selectedClient?.full_name || result.data.client_name || '',
        karta_turi: formData.karta_turi,
        valuta: formData.valuta,
        sms: formData.sms,
        telefon: formData.telefon,
        yetkazish_turi: formData.yetkazish_turi,
        boshlangich_depozit: parseFloat(formData.boshlangich_depozit) || 0,
        kartaning_holati: 'pending',
        status: 'completed'
      };
      
      addCardOp(operation);
      
      const log: ActivityLog = {
        id: `LOG-${Date.now()}`,
        sana_vaqt: new Date(),
        xodim_id: currentUser?.id || 'system',
        xodim_fio: currentUser?.name || 'Dilshod Rahimov',
        rol: 'plastik',
        operatsiya_turi: 'Karta ochish',
        oper_id: operation.oper_id,
        mijoz_fio: operation.client_fio,
        summa: operation.boshlangich_depozit,
        valuta: operation.valuta,
        status: 'completed'
      };
      
      addActivityLog(log);
      setSavedOp(operation);
      setShowReceipt(true);
      toast.success("Ariza qabul qilindi");
    } catch (error: any) {
      console.error('Card application error:', error);
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
            <h2 className="text-lg font-semibold text-foreground">Ariza qabul qilindi!</h2>
            <p className="text-sm text-muted-foreground">Karta 3-5 ish kunida tayyor</p>
          </div>
          
          <div className="p-6">
            <div className="bg-secondary rounded-lg p-4 space-y-3 mb-6 font-mono text-sm">
              <div className="text-center pb-3 border-b border-border">
                <p className="font-bold text-foreground">MAMUN BANK</p>
                <p className="text-xs text-muted-foreground">Plastik karta arizasi</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">№:</span>
                  <span className="font-medium text-foreground">{savedOp.oper_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Karta:</span>
                  <span className="font-bold text-foreground">{savedOp.karta_turi}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SMS:</span>
                  <span className="text-foreground">{savedOp.sms ? '✓ Ha' : '✗ Yo\'q'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yetkazish:</span>
                  <span className="text-foreground">{savedOp.yetkazish_turi === 'filial' ? 'Filialda' : 'Kuryer'}</span>
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
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center dark:bg-purple-500/10">
              <CreditCard className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Plastik karta ochish</h2>
              <p className="text-sm text-muted-foreground">Yangi karta arizasi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Mijoz</Label>
            <Select value={formData.client_id} onValueChange={handleClientChange}>
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
              <Label className="text-sm font-medium">Karta turi</Label>
              <Select value={formData.karta_turi} onValueChange={(value: CardType) => setFormData({ ...formData, karta_turi: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Humo">💳 Humo</SelectItem>
                  <SelectItem value="Uzcard">💳 Uzcard</SelectItem>
                  <SelectItem value="Visa">💳 Visa</SelectItem>
                </SelectContent>
              </Select>
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
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Telefon {formData.sms && <span className="text-destructive">*</span>}</Label>
              <Input value={formData.telefon} onChange={(e) => { setFormData({ ...formData, telefon: e.target.value }); setErrors({ ...errors, telefon: '' }); }} placeholder="+998 90 123 45 67" className={errors.telefon ? 'border-destructive' : ''} />
              {errors.telefon && <p className="text-sm text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.telefon}</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Yetkazish</Label>
              <Select value={formData.yetkazish_turi} onValueChange={(value: DeliveryType) => setFormData({ ...formData, yetkazish_turi: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="filial">🏦 Filialda</SelectItem>
                  <SelectItem value="kuryer">🚗 Kuryer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Boshlang'ich depozit</Label>
            <Input type="number" value={formData.boshlangich_depozit} onChange={(e) => setFormData({ ...formData, boshlangich_depozit: e.target.value })} placeholder="50,000 (ixtiyoriy)" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Izoh</Label>
            <Input value={formData.izoh} onChange={(e) => setFormData({ ...formData, izoh: e.target.value })} placeholder="Qo'shimcha izoh..." />
          </div>
          
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <Label className="text-sm font-medium">SMS xabar xizmati</Label>
              <p className="text-xs text-muted-foreground">Har bir tranzaksiya uchun</p>
            </div>
            <Switch checked={formData.sms} onCheckedChange={(checked) => setFormData({ ...formData, sms: checked })} />
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Bekor qilish</Button>
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <><Check className="w-4 h-4" />Ariza berish</>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
