import { X, Star, Edit2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useBankStore } from '@/store/bankStore';
import { ManualScore } from '@/types/bank';
import { useState } from 'react';
import { toast } from 'sonner';

interface ScoreManagerProps {
  onClose: () => void;
}

export function ScoreManager({ onClose }: ScoreManagerProps) {
  const { currentUser, manualScores, addManualScore, updateManualScore, activityLog } = useBankStore();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    student_name: '',
    score: '',
    comment: '',
  });

  const handleSubmit = () => {
    if (!formData.student_name.trim() || !formData.score) {
      toast.error("Talaba ismi va ball kiriting");
      return;
    }

    if (editId) {
      updateManualScore(editId, {
        score: parseInt(formData.score),
        comment: formData.comment,
      });
      toast.success("Baho yangilandi");
    } else {
      const score: ManualScore = {
        id: `SCORE-${Date.now()}`,
        student_id: formData.student_name.toLowerCase().replace(/\s+/g, '-'),
        student_name: formData.student_name,
        assigned_by: currentUser?.id || '',
        assigned_by_name: currentUser?.name || '',
        score: parseInt(formData.score),
        comment: formData.comment,
        session_id: `SESSION-${new Date().toISOString().split('T')[0]}`,
        created_at: new Date(),
      };
      addManualScore(score);
      toast.success("Baho qo'yildi");
    }

    setFormData({ student_name: '', score: '', comment: '' });
    setShowForm(false);
    setEditId(null);
  };

  const handleEdit = (score: ManualScore) => {
    setFormData({
      student_name: score.student_name,
      score: score.score.toString(),
      comment: score.comment,
    });
    setEditId(score.id);
    setShowForm(true);
  };

  // Group scores by student
  const studentSummary = manualScores.reduce<Record<string, { total: number; count: number; name: string }>>((acc, s) => {
    if (!acc[s.student_id]) acc[s.student_id] = { total: 0, count: 0, name: s.student_name };
    acc[s.student_id].total += s.score;
    acc[s.student_id].count += 1;
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-xl shadow-xl overflow-hidden animate-scale-in border border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning-50 flex items-center justify-center dark:bg-warning/10">
              <Star className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h2 className="text-lg-semibold text-foreground">Talabalarni baholash</h2>
              <p className="text-sm text-muted-foreground">Rahbar tomonidan qo'lda baho berish</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setShowForm(!showForm); setEditId(null); setFormData({ student_name: '', score: '', comment: '' }); }}>
              <Plus className="w-4 h-4" />
              Yangi baho
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="px-6 py-4 border-b border-border bg-secondary/30 animate-slide-up">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Talaba ismi</Label>
                <Input
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  placeholder="Ism familiya"
                  disabled={!!editId}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Ball</Label>
                <Input
                  type="number"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Izoh</Label>
                <Input
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="Qisqacha izoh"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditId(null); }}>Bekor</Button>
              <Button size="sm" onClick={handleSubmit}>{editId ? 'Yangilash' : 'Saqlash'}</Button>
            </div>
          </div>
        )}

        {/* Student Summary */}
        {Object.keys(studentSummary).length > 0 && (
          <div className="px-6 py-3 border-b border-border flex gap-4 flex-wrap">
            {Object.entries(studentSummary).map(([id, s]) => (
              <div key={id} className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                <Badge variant="outline" className="font-bold">{s.total} ball</Badge>
                <span className="text-xs text-muted-foreground">({s.count} ta baho)</span>
              </div>
            ))}
          </div>
        )}

        {/* Score History */}
        <div className="overflow-auto max-h-[50vh]">
          {manualScores.length === 0 ? (
            <div className="p-16 text-center">
              <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
              <p className="font-medium text-foreground mb-1">Baholar yo'q</p>
              <p className="text-sm text-muted-foreground">Talablarga baho bering</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-secondary sticky top-0">
                <tr>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Sana</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Talaba</th>
                  <th className="table-cell text-center text-xs font-medium text-muted-foreground uppercase">Ball</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Izoh</th>
                  <th className="table-cell text-left text-xs font-medium text-muted-foreground uppercase">Bergan</th>
                  <th className="table-cell text-center text-xs font-medium text-muted-foreground uppercase">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {manualScores.map(score => (
                  <tr key={score.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="table-cell text-sm text-foreground">{new Date(score.created_at).toLocaleDateString('uz-UZ')}</td>
                    <td className="table-cell text-sm font-medium text-foreground">{score.student_name}</td>
                    <td className="table-cell text-center">
                      <Badge variant={score.score >= 8 ? 'success' : score.score >= 5 ? 'warning' : 'error'} className="font-bold">
                        {score.score}
                      </Badge>
                    </td>
                    <td className="table-cell text-sm text-muted-foreground">{score.comment || '—'}</td>
                    <td className="table-cell text-sm text-muted-foreground">{score.assigned_by_name}</td>
                    <td className="table-cell text-center">
                      <Button variant="ghost" size="icon-sm" onClick={() => handleEdit(score)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
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
