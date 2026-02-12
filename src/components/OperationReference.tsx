import { X, BookMarked } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OPERATION_CODES } from '@/types/bank';

interface OperationReferenceProps {
  onClose: () => void;
}

export function OperationReference({ onClose }: OperationReferenceProps) {
  const ops = Object.entries(OPERATION_CODES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center dark:bg-amber-500/10">
              <BookMarked className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg-semibold text-foreground">Operatsiya kodlari</h2>
              <p className="text-sm text-muted-foreground">Spravochnik — barcha operatsiya turlari</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Table */}
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Kod</th>
                <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Operatsiya nomi</th>
                <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tavsif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ops.map(([key, op]) => (
                <tr key={key} className="hover:bg-secondary/50 transition-colors">
                  <td className="table-cell">
                    <Badge variant="outline" className="font-mono text-sm font-bold">{op.code}</Badge>
                  </td>
                  <td className="table-cell text-sm font-semibold text-foreground">{op.name}</td>
                  <td className="table-cell text-sm text-muted-foreground">{op.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex justify-end bg-secondary/30">
          <Button variant="outline" onClick={onClose}>Yopish</Button>
        </div>
      </div>
    </div>
  );
}
