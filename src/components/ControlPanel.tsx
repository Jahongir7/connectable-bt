import { X, ShieldCheck, CheckCircle, AlertCircle, MinusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { AuditStatus } from '@/types/bank';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

interface ControlPanelProps {
  onClose: () => void;
}

export function ControlPanel({ onClose }: ControlPanelProps) {
  const { managerReport, auditMarks, setAuditMark, currentUser, addMistake } = useBankStore();
  const [filter, setFilter] = useState<'all' | 'unchecked' | 'checked' | 'error_found'>('all');

  const operations = useMemo(() => {
    return managerReport.map(item => {
      let prefix = 'OP';
      if (item.operation_type === 'cash_in') prefix = 'CI';
      else if (item.operation_type === 'cash_out') prefix = 'CO';
      else if (item.operation_type === 'currency_exchange') prefix = 'FX';
      else if (item.operation_type === 'card_application') prefix = 'CARD';
      else if (item.operation_type === 'deposit') prefix = 'DEP';

      const opId = `${prefix}-${item.operation_id}`;
      const mark = auditMarks.find(m => m.operation_id === opId);

      return {
        ...item,
        oper_id: opId,
        audit_status: mark?.audit_status || 'unchecked' as AuditStatus,
      };
    });
  }, [managerReport, auditMarks]);

  const filteredOps = useMemo(() => {
    if (filter === 'all') return operations;
    return operations.filter(op => op.audit_status === filter);
  }, [operations, filter]);

  const handleMark = (opId: string, opType: string, status: AuditStatus) => {
    setAuditMark({
      operation_id: opId,
      operation_type: opType,
      audit_status: status,
      marked_by: currentUser?.name || '',
      marked_at: new Date(),
    });

    if (status === 'error_found') {
      addMistake();
      toast.warning("Xatolik qayd etildi — talaba -5 ball");
    } else {
      toast.success("Tekshirildi deb belgilandi");
    }
  };

  const auditStats = useMemo(() => ({
    total: operations.length,
    checked: operations.filter(o => o.audit_status === 'checked').length,
    errors: operations.filter(o => o.audit_status === 'error_found').length,
    unchecked: operations.filter(o => o.audit_status === 'unchecked').length,
  }), [operations]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-4xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center dark:bg-gray-800">
              <ShieldCheck className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h2 className="text-lg-semibold text-foreground">Nazorat bo'limi</h2>
              <p className="text-sm text-muted-foreground">Operatsiyalarni tekshirish va belgilash</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Stats */}
        <div className="px-6 py-3 border-b border-border flex gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <MinusCircle className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Tekshirilmagan: <strong className="text-foreground">{auditStats.unchecked}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span className="text-sm text-muted-foreground">Tekshirilgan: <strong className="text-success">{auditStats.checked}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-sm text-muted-foreground">Xatolik: <strong className="text-destructive">{auditStats.errors}</strong></span>
          </div>
          <div className="ml-auto">
            <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
              <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="unchecked">Tekshirilmagan</SelectItem>
                <SelectItem value="checked">✓ Tekshirilgan</SelectItem>
                <SelectItem value="error_found">✗ Xatolik</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto max-h-[60vh]">
          {filteredOps.length === 0 ? (
            <div className="p-16 text-center">
              <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground mb-1">Operatsiyalar yo'q</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">ID</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Operatsiya</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Operator</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Mijoz</th>
                  <th className="table-cell text-right text-xs font-medium text-muted-foreground uppercase">Summa</th>
                  <th className="table-cell text-center text-xs font-medium text-muted-foreground uppercase">Nazorat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOps.map((op) => (
                  <tr key={op.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="table-cell text-sm font-mono text-foreground">{op.oper_id}</td>
                    <td className="table-cell text-sm text-foreground">{op.operation_type}</td>
                    <td className="table-cell text-sm text-foreground">{op.operator_name}</td>
                    <td className="table-cell text-sm text-foreground">{op.client_name}</td>
                    <td className="table-cell text-right text-sm font-medium text-foreground">{parseFloat(op.amount).toLocaleString()} {op.currency}</td>
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-2">
                        {op.audit_status === 'unchecked' ? (
                          <>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMark(op.oper_id, op.operation_type, 'checked')}>
                              <CheckCircle className="w-3 h-3 text-success" /> Tekshirildi
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleMark(op.oper_id, op.operation_type, 'error_found')}>
                              <AlertCircle className="w-3 h-3 text-destructive" /> Xatolik
                            </Button>
                          </>
                        ) : (
                          <Badge variant={op.audit_status === 'checked' ? 'success' : 'error'}>
                            {op.audit_status === 'checked' ? '✓ Tekshirildi' : '✗ Xatolik topildi'}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end bg-secondary/30">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
        </div>
      </div>
    </div>
  );
}
