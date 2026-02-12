import { X, FileText, Search, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { OPERATION_CODES } from '@/types/bank';
import { useState, useMemo } from 'react';

interface AccountingJournalProps {
  onClose: () => void;
}

export function AccountingJournal({ onClose }: AccountingJournalProps) {
  const { journalEntries } = useBankStore();
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const itemsPerPage = 10;

  const filteredEntries = useMemo(() => {
    let entries = journalEntries.filter(e =>
      e.debit_account.toLowerCase().includes(search.toLowerCase()) ||
      e.credit_account.toLowerCase().includes(search.toLowerCase()) ||
      e.operation_id.toLowerCase().includes(search.toLowerCase())
    );

    if (timeFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      entries = entries.filter(e => {
        const d = new Date(e.created_at);
        if (timeFilter === 'today') return d >= today;
        if (timeFilter === 'week') { const w = new Date(today); w.setDate(w.getDate() - 7); return d >= w; }
        if (timeFilter === 'month') { const m = new Date(today); m.setMonth(m.getMonth() - 1); return d >= m; }
        return true;
      });
    }

    return entries;
  }, [journalEntries, search, timeFilter]);

  const totalPages = Math.ceil(filteredEntries.length / itemsPerPage);
  const paginatedEntries = filteredEntries.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getOpName = (type: string) => OPERATION_CODES[type]?.name || type;
  const getOpCode = (type: string) => OPERATION_CODES[type]?.code || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-5xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center dark:bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg-semibold text-foreground">Buxgalteriya jurnali</h2>
              <p className="text-sm text-muted-foreground">Debet / Kredit yozuvlari</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="px-6 py-3 border-b border-border flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} placeholder="Hisob yoki operatsiya bo'yicha qidirish..." className="pl-10" />
          </div>
          <Select value={timeFilter} onValueChange={(v: any) => { setTimeFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
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
          {filteredEntries.length === 0 ? (
            <div className="p-16 text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground mb-1">Jurnalda yozuvlar yo'q</p>
              <p className="text-sm text-muted-foreground">Operatsiyalar bajarganda avtomatik yozuvlar paydo bo'ladi</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sana</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Kod</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Operatsiya</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Debet</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Kredit</th>
                  <th className="table-cell text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Summa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="table-cell text-sm text-foreground">
                      {new Date(entry.created_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="table-cell">
                      <Badge variant="outline" className="font-mono text-xs">{getOpCode(entry.operation_type)}</Badge>
                    </td>
                    <td className="table-cell text-sm text-foreground">
                      {getOpName(entry.operation_type)}
                      <div className="text-xs text-muted-foreground">{entry.operation_id}</div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-destructive">{entry.debit_account}</span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm font-medium text-success">{entry.credit_account}</span>
                    </td>
                    <td className="table-cell text-right">
                      <span className="font-semibold text-foreground">{entry.amount.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1 text-xs">{entry.currency}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-secondary/30">
          <span className="text-sm text-muted-foreground">Jami: {filteredEntries.length} ta yozuv</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-foreground px-2">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="icon-sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
