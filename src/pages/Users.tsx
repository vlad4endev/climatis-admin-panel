import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users as UsersIcon, Shield, Settings, Loader2 } from "lucide-react";
import { useAllUsers, useIsAdmin, useSetUserRole, useUserPermissions, useSetSectionPermission, SECTIONS, AppRole, PermissionLevel, UserWithRole } from "@/hooks/useUserRoles";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function Users() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: users = [], isLoading } = useAllUsers();
  const setUserRole = useSetUserRole();
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  if (adminLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Доступ запрещён</CardTitle>
            <CardDescription>У вас нет прав для просмотра этой страницы</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const handleRoleChange = (userId: string, role: AppRole) => {
    setUserRole.mutate({ userId, role });
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Пользователи</h1>
        <p className="text-muted-foreground mt-2">Управление пользователями и правами доступа</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Список пользователей</CardTitle>
              <CardDescription>Всего: {users.length}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Имя</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead>Дата регистрации</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    {user.fullName || "Без имени"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={user.role}
                      onValueChange={(value: AppRole) => handleRoleChange(user.id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4" />
                            Пользователь
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Администратор
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "dd MMM yyyy", { locale: ru })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                      className="gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Доступы
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserPermissionsDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

function UserPermissionsDialog({ user, onClose }: { user: UserWithRole | null; onClose: () => void }) {
  const { data: permissions = [], isLoading } = useUserPermissions(user?.id || null);
  const setPermission = useSetSectionPermission();

  const getPermission = (section: string): PermissionLevel => {
    const perm = permissions.find(p => p.section === section);
    return perm?.permission || "none";
  };

  const handlePermissionChange = (section: string, permission: PermissionLevel) => {
    if (!user) return;
    setPermission.mutate({ userId: user.id, section, permission });
  };

  const getPermissionLabel = (permission: PermissionLevel) => {
    switch (permission) {
      case "none": return "Нет доступа";
      case "view": return "Просмотр";
      case "edit": return "Редактирование";
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Настройка доступов</DialogTitle>
          <DialogDescription>
            Пользователь: {user?.fullName || "Без имени"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Раздел</TableHead>
                <TableHead className="text-right">Доступ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SECTIONS.map((section) => (
                <TableRow key={section.key}>
                  <TableCell className="font-medium">{section.label}</TableCell>
                  <TableCell className="text-right">
                    <Select
                      value={getPermission(section.key)}
                      onValueChange={(value: PermissionLevel) => handlePermissionChange(section.key, value)}
                    >
                      <SelectTrigger className="w-44 bg-background">
                        <SelectValue>{getPermissionLabel(getPermission(section.key))}</SelectValue>
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg">
                        <SelectItem value="none" className="cursor-pointer hover:bg-muted/20 focus:bg-muted/20">
                          <span className="text-muted-foreground">Нет доступа</span>
                        </SelectItem>
                        <SelectItem value="view" className="cursor-pointer hover:bg-blue-500/20 focus:bg-blue-500/20">
                          <span className="text-blue-600 dark:text-blue-400">Просмотр</span>
                        </SelectItem>
                        <SelectItem value="edit" className="cursor-pointer hover:bg-green-500/20 focus:bg-green-500/20">
                          <span className="text-green-600 dark:text-green-400">Редактирование</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
