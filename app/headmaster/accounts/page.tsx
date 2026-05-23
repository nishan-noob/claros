'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, UserX, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

interface Account { id: number; name: string; email: string; role: string; active: boolean; }

export default function AccountsPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [resetId, setResetId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ success: boolean; data: Account[] }>({
    queryKey: ['headmaster-accounts'],
    queryFn: () => fetch('/api/headmaster/accounts').then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetch('/api/headmaster/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: (res) => {
      if (res.success) { toast.success('Account created'); qc.invalidateQueries({ queryKey: ['headmaster-accounts'] }); setAddOpen(false); }
      else toast.error(typeof res.error === 'string' ? res.error : 'Failed to create account');
    },
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, ...body }: { id: number; [k: string]: unknown }) =>
      fetch(`/api/headmaster/accounts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then((r) => r.json()),
    onSuccess: () => { toast.success('Updated'); qc.invalidateQueries({ queryKey: ['headmaster-accounts'] }); setResetId(null); },
  });

  const accounts = data?.data ?? [];
  const roleColors: Record<string, string> = { TEACHER: 'bg-blue-100 text-blue-700', PARENT: 'bg-emerald-100 text-emerald-700' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Accounts</h1>
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />New Account</Button>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Account</DialogTitle></DialogHeader>
            <CreateAccountForm onSubmit={(d) => createMutation.mutate(d)} loading={createMutation.isPending} />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : accounts.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-slate-400">No accounts found.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {accounts.map((a) => (
            <Card key={a.id} className={!a.active ? 'opacity-60' : ''}>
              <CardContent className="py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800">{a.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[a.role] ?? 'bg-slate-100 text-slate-600'}`}>{a.role}</span>
                    {!a.active && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-slate-500">{a.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setResetId(a.id)}>
                    <KeyRound className="w-3.5 h-3.5 mr-1" />Reset
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-600" onClick={() => patchMutation.mutate({ id: a.id, active: !a.active })}>
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={resetId !== null} onOpenChange={(o) => !o && setResetId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <ResetPasswordForm onSubmit={(pw) => patchMutation.mutate({ id: resetId!, password: pw })} loading={patchMutation.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateAccountForm({ onSubmit, loading }: { onSubmit: (d: Record<string, unknown>) => void; loading: boolean }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Temporary Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
      <div className="space-y-1.5">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => v !== null && setRole(v)}>
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="TEACHER">Teacher</SelectItem>
            <SelectItem value="PARENT">Parent</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading || !name || !email || !password || !role} onClick={() => onSubmit({ name, email, password, role })}>
        {loading ? 'Creating…' : 'Create Account'}
      </Button>
    </div>
  );
}

function ResetPasswordForm({ onSubmit, loading }: { onSubmit: (pw: string) => void; loading: boolean }) {
  const [pw, setPw] = useState('');
  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5"><Label>New Password</Label><Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
      <Button className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading || !pw} onClick={() => onSubmit(pw)}>
        {loading ? 'Saving…' : 'Reset Password'}
      </Button>
    </div>
  );
}
