'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { StudentAvatar } from '@/components/StudentAvatar';
import { LetterGradeBadge } from '@/components/LetterGradeBadge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';

interface Subject { id: number; name: string; class: { id: number; name: string }; }
interface Assessment { id: number; title: string; type: string; date: string; maxScore: number; subject: { name: string; class: { name: string } }; }
interface Grade { id: number; score: number | null; remarks: string | null; student: { id: number; name: string; photoUrl?: string | null }; }

export default function TeacherGradesPage() {
  const [step, setStep] = useState<'subject' | 'assessments' | 'grades'>('subject');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [addAssessmentOpen, setAddAssessmentOpen] = useState(false);
  const [localGrades, setLocalGrades] = useState<Record<number, { score: string; remarks: string }>>({});
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const { data: subjectsData, isLoading: loadingSubjects } = useQuery<{ success: boolean; data: Subject[] }>({
    queryKey: ['teacher-subjects'],
    queryFn: () => fetch('/api/teacher/subjects').then((r) => r.json()),
  });

  const { data: assessmentsData, isLoading: loadingAssessments } = useQuery<{ success: boolean; data: Assessment[] }>({
    queryKey: ['teacher-assessments', selectedSubject?.id],
    queryFn: () => fetch(`/api/teacher/assessments?subjectId=${selectedSubject!.id}`).then((r) => r.json()),
    enabled: !!selectedSubject && step === 'assessments',
  });

  const { data: gradesData, isLoading: loadingGrades } = useQuery<{ success: boolean; data: Grade[] }>({
    queryKey: ['teacher-grades', selectedAssessment?.id],
    queryFn: () => fetch(`/api/teacher/grades/${selectedAssessment!.id}`).then((r) => r.json()),
    enabled: !!selectedAssessment && step === 'grades',
  });

  useEffect(() => {
    if (gradesData?.success && gradesData.data) {
      const init: Record<number, { score: string; remarks: string }> = {};
      gradesData.data.forEach((g) => {
        init[g.student.id] = { score: g.score !== null ? String(g.score) : '', remarks: g.remarks ?? '' };
      });
      setLocalGrades(init);
    }
  }, [gradesData]);

  const createAssessmentMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/teacher/assessments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Assessment created'); qc.invalidateQueries({ queryKey: ['teacher-assessments'] }); setAddAssessmentOpen(false); }
      else toast.error('Failed to create assessment');
    },
  });

  const deleteAssessmentMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/teacher/assessments/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: () => { toast.success('Deleted'); qc.invalidateQueries({ queryKey: ['teacher-assessments'] }); },
  });

  const subjects = subjectsData?.data ?? [];
  const assessments = assessmentsData?.data ?? [];
  const grades = gradesData?.data ?? [];

  async function handleSaveGrades() {
    if (!selectedAssessment) return;
    setSaving(true);
    try {
      const records = Object.entries(localGrades).map(([studentId, { score, remarks }]) => ({
        studentId: parseInt(studentId),
        score: score !== '' ? parseFloat(score) : null,
        remarks: remarks || null,
      }));
      const res = await fetch(`/api/teacher/grades/${selectedAssessment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: records }),
      }).then((r) => r.json());
      if (res.success) { toast.success('Grades saved!'); qc.invalidateQueries({ queryKey: ['teacher-grades'] }); }
      else toast.error('Failed to save grades');
    } finally {
      setSaving(false);
    }
  }

  if (step === 'subject') {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Grades</h1>
        <p className="text-sm text-slate-500">Select a subject to manage grades.</p>
        {loadingSubjects ? <Skeleton className="h-32 w-full" /> : (
          <div className="space-y-2">
            {subjects.map((s) => (
              <Card key={s.id} className="cursor-pointer hover:border-indigo-400 transition-colors"
                onClick={() => { setSelectedSubject(s); setStep('assessments'); }}>
                <CardContent className="py-3">
                  <p className="font-medium text-slate-800">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.class.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (step === 'assessments') {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setStep('subject')}>← Back</Button>
          <h1 className="text-xl font-bold text-slate-900">{selectedSubject?.name}</h1>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">{selectedSubject?.class.name}</p>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddAssessmentOpen(true)}><Plus className="w-4 h-4 mr-1" />New Assessment</Button>
          <Dialog open={addAssessmentOpen} onOpenChange={setAddAssessmentOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>New Assessment</DialogTitle></DialogHeader>
              <CreateAssessmentForm
                subjectId={selectedSubject!.id}
                onSubmit={(d) => createAssessmentMutation.mutate(d)}
                loading={createAssessmentMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
        {loadingAssessments ? <Skeleton className="h-32 w-full" /> :
          assessments.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-slate-400 text-sm">No assessments yet. Create one above.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {assessments.map((a) => (
                <Card key={a.id} className="cursor-pointer hover:border-indigo-400 transition-colors"
                  onClick={() => { setSelectedAssessment(a); setStep('grades'); }}>
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">{a.type}</Badge>
                        <span className="text-xs text-slate-400">{formatDate(a.date)} · Max: {a.maxScore}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-600"
                      onClick={(e) => { e.stopPropagation(); deleteAssessmentMutation.mutate(a.id); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </div>
    );
  }

  // Step: grades entry
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setStep('assessments')}>← Back</Button>
        <div>
          <h1 className="text-base font-bold text-slate-900">{selectedAssessment?.title}</h1>
          <p className="text-xs text-slate-500">{selectedSubject?.name} · Max: {selectedAssessment?.maxScore}</p>
        </div>
      </div>

      {loadingGrades ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="space-y-2 pb-20">
          {grades.map((g) => {
            const local = localGrades[g.student.id] ?? { score: g.score !== null ? String(g.score) : '', remarks: g.remarks ?? '' };
            const scoreNum = local.score !== '' ? parseFloat(local.score) : null;
            const pct = scoreNum !== null ? Math.round((scoreNum / selectedAssessment!.maxScore) * 100) : null;

            return (
              <Card key={g.id}>
                <CardContent className="py-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <StudentAvatar name={g.student.name} photoUrl={g.student.photoUrl} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-800">{g.student.name}</p>
                    </div>
                    {pct !== null && <LetterGradeBadge percentage={pct} />}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={`Score (max ${selectedAssessment?.maxScore})`}
                      value={local.score}
                      onChange={(e) => setLocalGrades((prev) => ({ ...prev, [g.student.id]: { ...local, score: e.target.value } }))}
                      className="w-32"
                      min={0}
                      max={selectedAssessment?.maxScore}
                    />
                    <Input
                      placeholder="Remarks (optional)"
                      value={local.remarks}
                      onChange={(e) => setLocalGrades((prev) => ({ ...prev, [g.student.id]: { ...local, remarks: e.target.value } }))}
                      className="flex-1"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-20"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}>
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
          onClick={handleSaveGrades}
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Grades'}
        </Button>
      </div>
    </div>
  );
}

function CreateAssessmentForm({ subjectId, onSubmit, loading }: { subjectId: number; onSubmit: (d: Record<string, unknown>) => void; loading: boolean; }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('QUIZ');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [maxScore, setMaxScore] = useState('100');
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Quiz 3" /></div>
      <div className="space-y-1.5">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => v !== null && setType(v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {['QUIZ', 'EXAM', 'ASSIGNMENT', 'MIDTERM', 'FINAL', 'PROJECT'].map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Max Score</Label><Input type="number" value={maxScore} onChange={(e) => setMaxScore(e.target.value)} /></div>
      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700"
        disabled={loading || !title || !maxScore}
        onClick={() => onSubmit({ title, type, date, maxScore: parseFloat(maxScore), subjectId })}
      >
        {loading ? 'Creating…' : 'Create Assessment'}
      </Button>
    </div>
  );
}
