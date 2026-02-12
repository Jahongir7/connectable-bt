import { X, FileText, Search, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { ROLE_CONFIG, STATUS_CONFIG } from '@/types/bank';
import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

interface ActivityLogTableProps {
  onClose: () => void;
}

export function ActivityLogTable({ onClose }: ActivityLogTableProps) {
  const { activityLog, managerReport, currentUser } = useBankStore();
  const isRahbar = currentUser?.role === 'rahbar';
  
  const displayLogs = useMemo(() => {
    if (!isRahbar) return activityLog;
    
    return managerReport.map(item => {
      // Map operator_role to UserRole
      let role: any = 'kassir';
      if (item.operator_role.includes('Valyuta')) role = 'valyuta';
      else if (item.operator_role.includes('Plastik')) role = 'plastik';
      else if (item.operator_role.includes('Omonat')) role = 'omonat';
      
      // Map operation_type to readable string
      let type = item.operation_type;
      if (type === 'currency_exchange') type = 'Valyuta ayirboshlash';
      else if (type === 'card_application') type = 'Karta ochish';
      else if (type === 'cash_in') type = 'Naqd pul kirim';
      else if (type === 'cash_out') type = 'Naqd pul chiqim';
      else if (type === 'deposit') type = 'Omonat ochish';
      
      // Map operation_type to prefix
      let prefix = 'OP';
      if (type.includes('kirim')) prefix = 'CI';
      else if (type.includes('chiqim')) prefix = 'CO';
      else if (type.includes('Valyuta')) prefix = 'FX';
      else if (type.includes('Karta')) prefix = 'CARD';
      else if (type.includes('Omonat')) prefix = 'DEP';

      return {
        id: item.id.toString(),
        sana_vaqt: new Date(item.operation_date),
        xodim_id: 'system',
        xodim_fio: item.operator_name,
        rol: role,
        operatsiya_turi: type,
        oper_id: `${prefix}-${item.operation_id}`,
        mijoz_fio: item.client_name,
        summa: parseFloat(item.amount),
        valuta: item.currency,
        status: item.status
      };
    });
  }, [activityLog, managerReport, isRahbar]);

  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft' | 'cancelled'>('all');
  const [currencyFilter, setCurrencyFilter] = useState<'all' | 'UZS' | 'USD' | 'EUR'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'kassir' | 'valyuta' | 'plastik' | 'omonat'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  
  const filteredLogs = useMemo(() => {
    let logs = displayLogs.filter(log => 
      log.xodim_fio.toLowerCase().includes(search.toLowerCase()) ||
      log.mijoz_fio.toLowerCase().includes(search.toLowerCase()) ||
      log.operatsiya_turi.toLowerCase().includes(search.toLowerCase()) ||
      log.oper_id.toLowerCase().includes(search.toLowerCase())
    );
    
    // Apply status filter
    if (statusFilter !== 'all') {
      logs = logs.filter(log => log.status === statusFilter);
    }
    
    // Apply currency filter
    if (currencyFilter !== 'all') {
      logs = logs.filter(log => log.valuta === currencyFilter);
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      logs = logs.filter(log => log.rol === roleFilter);
    }
    
    // Apply time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      logs = logs.filter(log => {
        const logDate = new Date(log.sana_vaqt);
        if (timeFilter === 'today') {
          return logDate >= today;
        } else if (timeFilter === 'week') {
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return logDate >= weekAgo;
        } else if (timeFilter === 'month') {
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return logDate >= monthAgo;
        }
        return true;
      });
    }
    
    return logs;
  }, [displayLogs, search, statusFilter, currencyFilter, roleFilter, timeFilter]);
  
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportPDF = async () => {
    if (filteredLogs.length === 0) {
      toast.error("Eksport qilish uchun ma'lumotlar yo'q");
      return;
    }

    setIsExporting(true);
    try {
      const doc = new jsPDF('landscape');
      
      // Header
      doc.setFontSize(18);
      doc.text('MAMUN BANK', 14, 15);
      doc.setFontSize(12);
      doc.text('Faoliyat jurnali', 14, 22);
      doc.setFontSize(10);
      doc.text(`Sana: ${new Date().toLocaleString('uz-UZ')}`, 14, 28);
      
      // Table
      const tableData = filteredLogs.map(log => [
        new Date(log.sana_vaqt).toLocaleString('uz-UZ'),
        log.xodim_fio,
        ROLE_CONFIG[log.rol as keyof typeof ROLE_CONFIG]?.labelUz || log.rol,
        log.operatsiya_turi,
        log.mijoz_fio,
        `${log.summa.toLocaleString()} ${log.valuta}`,
        STATUS_CONFIG[log.status as keyof typeof STATUS_CONFIG]?.label || log.status
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Sana/Vaqt', 'Xodim', 'Rol', 'Operatsiya', 'Mijoz', 'Summa', 'Holat']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [0, 111, 238] }, // Primary color #006FEE
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 40 },
          2: { cellWidth: 25 },
          3: { cellWidth: 50 },
          4: { cellWidth: 45 },
          5: { cellWidth: 40, halign: 'right' },
          6: { cellWidth: 30, halign: 'center' }
        }
      });

      doc.save(`activity-log-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF muvaffaqiyatli yuklab olindi");
    } catch (error) {
      console.error('Export error:', error);
      toast.error("PDF eksport qilishda xatolik yuz berdi");
    } finally {
      setIsExporting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-lg-semibold text-foreground">Faoliyat jurnali</h2>
            <p className="text-sm text-muted-foreground">Barcha operatsiyalar tarixi</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportPDF}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Export
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="px-6 py-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Xodim, mijoz yoki operatsiya bo'yicha qidirish..."
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Filter Dropdowns */}
        <div className="px-6 py-3 border-b border-border flex flex-wrap gap-3">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(value: any) => { setStatusFilter(value); setCurrentPage(1); }}>
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
          
          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={(value: any) => { setRoleFilter(value); setCurrentPage(1); }}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue placeholder="Rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Barchasi</SelectItem>
              <SelectItem value="kassir">💵 Kassir</SelectItem>
              <SelectItem value="valyuta">💱 Valyuta</SelectItem>
              <SelectItem value="plastik">💳 Plastik</SelectItem>
              <SelectItem value="omonat">🏦 Omonat</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Currency Filter */}
          <Select value={currencyFilter} onValueChange={(value: any) => { setCurrencyFilter(value); setCurrentPage(1); }}>
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
          <Select value={timeFilter} onValueChange={(value: any) => { setTimeFilter(value); setCurrentPage(1); }}>
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
        
        {/* Table */}
        <div className="overflow-auto max-h-[60vh]">
          {filteredLogs.length === 0 ? (
            <div className="p-16 text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground mb-1">Hali operatsiyalar yo'q</p>
              <p className="text-sm text-muted-foreground">Yangi operatsiya qo'shilganda bu yerda ko'rinadi</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sana/Vaqt</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Xodim</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rol</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Operatsiya</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Mijoz</th>
                  <th className="table-cell text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Summa</th>
                  <th className="table-cell text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedLogs.map((log) => {
                  const roleConfig = ROLE_CONFIG[log.rol];
                  const statusConfig = STATUS_CONFIG[log.status];
                  
                  return (
                    <tr key={log.id} className="hover:bg-secondary/50 transition-colors">
                      <td className="table-cell">
                        <div className="font-medium text-foreground text-sm">
                          {new Date(log.sana_vaqt).toLocaleDateString('uz-UZ')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.sana_vaqt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-medium text-primary-700 dark:bg-primary/20">
                            {log.xodim_fio.charAt(0)}
                          </div>
                          <span className="text-sm text-foreground">{log.xodim_fio}</span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <Badge variant="gray" className="text-xs">
                          {roleConfig?.labelUz || log.rol}
                        </Badge>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-foreground">{log.operatsiya_turi}</span>
                        <div className="text-xs text-muted-foreground">{log.oper_id}</div>
                      </td>
                      <td className="table-cell text-sm text-foreground">{log.mijoz_fio}</td>
                      <td className="table-cell text-right">
                        <span className="font-medium text-foreground">
                          {log.summa.toLocaleString()}
                        </span>
                        <span className="text-muted-foreground ml-1">{log.valuta}</span>
                      </td>
                      <td className="table-cell text-center">
                        <Badge variant={log.status === 'completed' ? 'success' : log.status === 'cancelled' ? 'error' : 'gray'}>
                          {statusConfig?.label || log.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Footer with Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-secondary/30">
          <span className="text-sm text-muted-foreground">
            Jami: {filteredLogs.length} ta operatsiya
          </span>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-foreground px-2">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
