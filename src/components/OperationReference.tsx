import { X, BookMarked, Plus, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBankStore } from '@/store/bankStore';
import { OperationCode } from '@/types/bank';
import { useState } from 'react';
import { toast } from 'sonner';

interface OperationReferenceProps {
  onClose: () => void;
}

export function OperationReference({ onClose }: OperationReferenceProps) {
  const { currentUser, operationCodes, addOperationCode, updateOperationCode, deleteOperationCode } = useBankStore();
  const isRahbar = currentUser?.role === 'rahbar';

  const [showForm, setShowForm] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({ key: '', code: '', name: '', description: '', status: 'active' as 'active' | 'inactive' });

  const ops = Object.entries(operationCodes);

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("Kod va nom kiritilishi shart");
      return;
    }

    // Check unique code
    const existingWithCode = ops.find(([k, v]) => v.code === formData.code && k !== editKey);
    if (existingWithCode) {
      toast.error(`"${formData.code}" kodi allaqachon mavjud`);
      return;
    }

    if (editKey) {
      updateOperationCode(editKey, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      toast.success("Operatsiya kodi yangilandi");
    } else {
      const key = formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') || `op_${Date.now()}`;
      addOperationCode(key, {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        status: formData.status,
      });
      toast.success("Yangi operatsiya kodi qo'shildi");
    }

    setFormData({ key: '', code: '', name: '', description: '', status: 'active' });
    setShowForm(false);
    setEditKey(null);
  };

  const handleEdit = (key: string, op: OperationCode) => {
    setFormData({ key, code: op.code, name: op.name, description: op.description, status: op.status });
    setEditKey(key);
    setShowForm(true);
  };

  const handleDelete = (key: string) => {
    deleteOperationCode(key);
    toast.success("Operatsiya kodi o'chirildi");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-3xl rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
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
          <div className="flex items-center gap-2">
            {isRahbar && (
              <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditKey(null); setFormData({ key: '', code: '', name: '', description: '', status: 'active' }); }}>
                <Plus className="w-4 h-4" />
                Yangi kod
              </Button>
            )}
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Form (Rahbar only) */}
        {showForm && isRahbar && (
          <div className="px-6 py-4 border-b border-border bg-secondary/30 animate-slide-up">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Kod <span className="text-destructive">*</span></Label>
                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="OP-06" />
              </div>
              <div className="space-y-1.5">
                <Label>Operatsiya nomi <span className="text-destructive">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Yangi operatsiya" />
              </div>
              <div className="space-y-1.5">
                <Label>Tavsif</Label>
                <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Qisqacha tavsif" />
              </div>
              <div className="space-y-1.5">
                <Label>Holat</Label>
                <Select value={formData.status} onValueChange={(v: any) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Faol</SelectItem>
                    <SelectItem value="inactive">Nofaol</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditKey(null); }}>Bekor</Button>
              <Button size="sm" onClick={handleSubmit}>{editKey ? 'Yangilash' : 'Qo\'shish'}</Button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-auto max-h-[60vh]">
          <table className="w-full">
            <thead className="bg-secondary">
              <tr>
                <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Kod</th>
                <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Operatsiya nomi</th>
                <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Tavsif</th>
                <th className="table-cell text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-20">Holat</th>
                {isRahbar && <th className="table-cell text-center text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">Amal</th>}
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
                  <td className="table-cell text-center">
                    <Badge variant={op.status === 'active' ? 'success' : 'gray'}>
                      {op.status === 'active' ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </td>
                  {isRahbar && (
                    <td className="table-cell text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(key, op)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(key)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  )}
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
