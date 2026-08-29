import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getApiErrorMessage } from "@/hooks/useProducts";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Mail, Users, Loader2, UserPlus, ShieldCheck } from "lucide-react";
import type { Settings, User, Role } from "@/types";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <EmailSettingsCard isAdmin={isAdmin} />
      {isAdmin && <UserManagementCard />}
    </div>
  );
}

function EmailSettingsCard({ isAdmin }: { isAdmin: boolean }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data } = await api.get<{ settings: Settings }>("/settings");
      return data.settings;
    },
  });

  useEffect(() => {
    if (data?.capsEmail) setEmail(data.capsEmail);
  }, [data]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put("/settings", { capsEmail: email });
      return data.settings;
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Ajustes guardados" });
      qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (err) => {
      toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err) });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5 text-cyan-600" />
          Email de la organización
        </CardTitle>
        <CardDescription>Dirección a la que se envían los reportes y alertas por defecto.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="caps-email">Email de C.A.P.S.</Label>
          <Input
            id="caps-email"
            type="email"
            placeholder="farmacia@caps.local"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!isAdmin || isLoading}
          />
        </div>
        {isAdmin && (
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        )}
        {!isAdmin && <p className="text-xs text-slate-400">Solo un administrador puede modificar este ajuste.</p>}
      </CardContent>
    </Card>
  );
}

function UserManagementCard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("STAFF");

  const { data: users, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<{ users: User[] }>("/users");
      return data.users;
    },
  });

  const createUser = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/users", { name, email, password, role });
      return data.user;
    },
    onSuccess: () => {
      toast({ variant: "success", title: "Usuario creado" });
      qc.invalidateQueries({ queryKey: ["users"] });
      setDialogOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("STAFF");
    },
    onError: (err) => toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err) }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await api.put(`/users/${id}`, { active });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
    onError: (err) => toast({ variant: "destructive", title: "Error", description: getApiErrorMessage(err) }),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-cyan-600" />
            Gestión de usuarios
          </CardTitle>
          <CardDescription>Administrá quién puede acceder al sistema y con qué rol.</CardDescription>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <UserPlus className="size-4" /> Nuevo usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear usuario</DialogTitle>
              <DialogDescription>El usuario podrá iniciar sesión con estas credenciales.</DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createUser.mutate();
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="new-name">Nombre</Label>
                <Input id="new-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input id="new-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Contraseña</Label>
                <Input
                  id="new-password"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-role">Rol</Label>
                <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                  <SelectTrigger id="new-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">Personal (STAFF)</SelectItem>
                    <SelectItem value="ADMIN">Administrador (ADMIN)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="size-4 animate-spin" />}
                  Crear usuario
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <p className="p-6 text-sm text-slate-400">Cargando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Activo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="text-sm text-slate-500">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "ADMIN" ? "info" : "outline"}>
                      {u.role === "ADMIN" && <ShieldCheck className="size-3" />}
                      {u.role === "ADMIN" ? "Administrador" : "Personal"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={u.active ?? true}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: u.id, active: checked })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
