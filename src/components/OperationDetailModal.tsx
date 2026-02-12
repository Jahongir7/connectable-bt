import { X, Printer, Calendar, User, Hash, Banknote, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG } from '@/types/bank';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface OperationDetailModalProps {
  operation: any;
  operationType: 'cashIn' | 'cashOut' | 'fx' | 'card' | 'deposit';
  onClose: () => void;
}

const OPERATION_TITLES: Record<string, string> = {
  cashIn: 'Naqd pul kirim',
  cashOut: 'Naqd pul chiqim',
  fx: 'Valyuta ayirboshlash',
  card: 'Plastik karta ochish',
  deposit: 'Omonat ochish',
};

export function OperationDetailModal({ operation, operationType, onClose }: OperationDetailModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    if (operationType !== 'cashIn' && operationType !== 'cashOut' && operationType !== 'fx' && operationType !== 'card' && operationType !== 'deposit') {
      toast.error("Hozircha faqat kassa, valyuta, karta va omonat operatsiyalari uchun PDF mavjud");
      return;
    }

    setIsDownloading(true);
    try {
      // 1. Fetch full operation details
      const id = operation.oper_id.split('-')[1] || operation.oper_id;
      let endpoint = '';
      if (operationType === 'cashIn') endpoint = 'cash-in';
      else if (operationType === 'cashOut') endpoint = 'cash-out';
      else if (operationType === 'fx') endpoint = 'currency-exchange';
      else if (operationType === 'card') endpoint = 'card-applications';
      else if (operationType === 'deposit') endpoint = 'deposits';

      const response = await fetch(`https://mamun.university/api/v1/bt/${endpoint}/${id}`);
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
      
      let title = '';
      if (operationType === 'cashIn') title = 'Kassa kirim orderi';
      else if (operationType === 'cashOut') title = 'Kassa chiqim orderi';
      else if (operationType === 'fx') title = 'Valyuta ayirboshlash';
      else if (operationType === 'card') title = 'Plastik karta arizasi';
      else if (operationType === 'deposit') title = 'Omonat shartnomasi';
      
      doc.text(title, 40, 20, { align: 'center' });
      doc.line(10, 25, 70, 25);

      // Details
      let details = [];
      if (operationType === 'fx') {
        details = [
          ['№:', `FX-${data.id}`],
          ['Sana:', data.operation_date],
          ['Mijoz:', data.client_name],
          ['Turi:', data.operation_type === 'buy' ? 'Sotib olish' : 'Sotish'],
          ['Berildi:', `${parseFloat(data.given_amount).toLocaleString()} ${data.given_currency}`],
          ['Olindi:', `${parseFloat(data.received_amount || (data.given_amount * data.exchange_rate)).toLocaleString()} ${data.received_currency}`],
          ['Kurs:', data.exchange_rate.toString()],
          ['Kassir:', data.operator_name]
        ];
      } else if (operationType === 'card') {
        details = [
          ['№:', `CARD-${data.id}`],
          ['Sana:', data.operation_date],
          ['Mijoz:', data.client_name],
          ['Karta turi:', data.card_type],
          ['Valyuta:', data.currency],
          ['Telefon:', data.phone],
          ['Yetkazish:', data.delivery_type],
          ['SMS:', data.sms_notification ? 'Yoqilgan' : 'Ochirilgan'],
          ['Depozit:', `${parseFloat(data.initial_deposit || 0).toLocaleString()} ${data.currency}`],
          ['Holati:', data.card_status],
          ['Kassir:', data.operator_name]
        ];
      } else if (operationType === 'deposit') {
        details = [
          ['№:', `DEP-${data.id}`],
          ['Sana:', data.operation_date],
          ['Mijoz:', data.client_name],
          ['Omonat turi:', data.deposit_type],
          ['Valyuta:', data.currency],
          ['Summa:', `${parseFloat(data.amount).toLocaleString()} ${data.currency}`],
          ['Muddat:', `${data.term_months} oy`],
          ['Foiz:', `${data.interest_rate}%`],
          ['Kassir:', data.operator_name]
        ];
      } else {
        details = [
          ['№:', `${operationType === 'cashIn' ? 'CI' : 'CO'}-${data.id}`],
          ['Sana:', data.operation_date],
          ['Mijoz:', data.client_name],
          ['Summa:', `${parseFloat(data.amount).toLocaleString()} ${data.currency}`],
          [operationType === 'cashIn' ? 'Maqsad:' : 'Asos:', data.purpose || data.reason],
          ['Kassir:', data.operator_name]
        ];
      }

      autoTable(doc, {
        startY: 30,
        body: details,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 20 } }
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(7);
      doc.text('Xizmatimizdan foydalanganingiz uchun rahmat!', 40, finalY, { align: 'center' });

      // 3. Download
      let prefix = '';
      if (operationType === 'cashIn') prefix = 'CI';
      else if (operationType === 'cashOut') prefix = 'CO';
      else if (operationType === 'fx') prefix = 'FX';
      else if (operationType === 'card') prefix = 'CARD';
      else if (operationType === 'deposit') prefix = 'DEP';
      
      doc.save(`receipt-${prefix}-${data.id}.pdf`);
      toast.success("PDF yuklab olindi");
    } catch (error) {
      console.error('Download error:', error);
      toast.error("PDF yuklashda xatolik yuz berdi");
    } finally {
      setIsDownloading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: any, currency: string) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return `0 ${currency}`;
    }
    return `${Number(amount).toLocaleString()} ${currency}`;
  };

  const renderOperationDetails = () => {
    switch (operationType) {
      case 'cashIn':
      case 'cashOut':
        return (
          <>
            <DetailRow icon={<User />} label="Mijoz" value={operation.client_fio} />
            <DetailRow icon={<Banknote />} label="Summa" value={formatCurrency(operation.summa, operation.valuta)} highlight />
            <DetailRow icon={<FileText />} label="Maqsad" value={operation.maqsad || '-'} />
            {operation.asos && <DetailRow icon={<FileText />} label="Asos" value={operation.asos} />}
            <DetailRow icon={<Hash />} label="Izoh" value={operation.izoh || '-'} />
          </>
        );
      
      case 'fx':
        return (
          <>
            <DetailRow icon={<User />} label="Mijoz" value={operation.client_fio} />
            <DetailRow 
              icon={<Banknote />} 
              label="Berilgan" 
              value={formatCurrency(operation.berilgan_summa, operation.berilgan_valyuta)} 
            />
            <DetailRow 
              icon={<Banknote />} 
              label="Olingan" 
              value={formatCurrency(operation.olinadigan_summa, operation.olinadigan_valyuta)} 
              highlight
            />
            <DetailRow icon={<FileText />} label="Kurs" value={operation.kurs.toFixed(4)} />
            <DetailRow icon={<FileText />} label="Turi" value={operation.turi === 'buy' ? 'Sotib olish' : 'Sotish'} />
            {operation.komissiya > 0 && (
              <DetailRow icon={<FileText />} label="Komissiya" value={`${operation.komissiya.toLocaleString()} UZS`} />
            )}
          </>
        );
      
      case 'card':
        return (
          <>
            <DetailRow icon={<User />} label="Mijoz" value={operation.client_fio} />
            <DetailRow icon={<FileText />} label="Karta turi" value={operation.karta_turi} highlight />
            <DetailRow icon={<Banknote />} label="Valyuta" value={operation.valuta} />
            <DetailRow icon={<FileText />} label="Yetkazish" value={operation.yetkazish_turi === 'branch' ? 'Filialdan olish' : 'Yetkazib berish'} />
            <DetailRow icon={<FileText />} label="SMS xizmat" value={operation.sms ? 'Ha' : "Yo'q"} />
            {operation.boshlangich_depozit > 0 && (
              <DetailRow icon={<Banknote />} label="Boshlang'ich depozit" value={formatCurrency(operation.boshlangich_depozit, operation.valuta)} />
            )}
          </>
        );
      
      case 'deposit':
        return (
          <>
            <DetailRow icon={<User />} label="Mijoz" value={operation.client_fio} />
            <DetailRow icon={<FileText />} label="Omonat turi" value={operation.omonat_turi} />
            <DetailRow icon={<Banknote />} label="Summa" value={formatCurrency(operation.summa, operation.valuta)} highlight />
            <DetailRow icon={<Calendar />} label="Muddat" value={`${operation.muddat_oy} oy`} />
            <DetailRow icon={<FileText />} label="Foiz stavkasi" value={`${operation.foiz}% yillik`} />
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg-semibold text-foreground">{OPERATION_TITLES[operationType]}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{operation.oper_id}</p>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-6 space-y-6 print-content" id="print-receipt">
          {/* Status & Date */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={operation.status === 'completed' ? 'success' : operation.status === 'cancelled' ? 'error' : 'gray'}>
                  {STATUS_CONFIG[operation.status as keyof typeof STATUS_CONFIG]?.label || operation.status}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Sana</p>
              <p className="text-sm font-medium text-foreground">{formatDate(operation.sana_vaqt)}</p>
            </div>
          </div>
          
          {/* Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tafsilotlar</h3>
            <div className="space-y-3">
              {renderOperationDetails()}
            </div>
          </div>
          
          {/* Operator */}
          <div className="pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 dark:bg-primary/20">
                {operation.operator_fio?.charAt(0) || operation.kassir_fio?.charAt(0) || 'O'}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Operator</p>
                <p className="text-sm font-medium text-foreground">{operation.operator_fio || operation.kassir_fio}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center gap-3 p-6 border-t border-border bg-secondary/50">
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
  );
}

interface DetailRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}

function DetailRow({ icon, label, value, highlight }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 text-muted-foreground">
        <span className="w-4 h-4 shrink-0">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn(
        "text-sm",
        highlight ? "font-semibold text-primary" : "font-medium text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
