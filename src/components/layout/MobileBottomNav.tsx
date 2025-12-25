import { useLocation, useNavigate } from "react-router-dom";
import { Users, MapPin, ScrollText, UserCircle, UsersRound, Inbox, Coins, ClipboardCheck, Package, ArrowLeftRight, FolderTree, ListTodo, Shield, MoreHorizontal, LogOut } from "lucide-react";
import { useIsAdmin, useMyPermissions, PermissionLevel } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

// Map URL paths to section keys
const urlToSectionKey = (url: string): string => url.replace("/", "");

const allItems = [
  { title: "Клиенты", url: "/clients", icon: Users, group: "clients" },
  { title: "Объекты", url: "/service-objects", icon: MapPin, group: "clients" },
  { title: "Заявки", url: "/requests", icon: Inbox, group: "requests" },
  { title: "Документы", url: "/documents", icon: ScrollText, group: "requests" },
  { title: "Расчеты", url: "/estimates", icon: Coins, group: "requests" },
  { title: "Задания", url: "/assignments", icon: ClipboardCheck, group: "requests" },
  { title: "Сотрудники", url: "/employees", icon: UserCircle, group: "staff" },
  { title: "Бригады", url: "/teams", icon: UsersRound, group: "staff" },
  { title: "Задачи", url: "/tasks", icon: ListTodo, group: "staff" },
  { title: "Разделы в складе", url: "/warehouse-categories", icon: FolderTree, group: "warehouse" },
  { title: "Комплектующие", url: "/spare-parts", icon: Package, group: "warehouse" },
  { title: "Расход/Приход", url: "/stock-movements", icon: ArrowLeftRight, group: "warehouse" },
];

// Helper to check if user can see an item
const canViewItem = (url: string, permissions: Map<string, PermissionLevel> | undefined): boolean => {
  if (!permissions) return false;
  const sectionKey = urlToSectionKey(url);
  const permission = permissions.get(sectionKey);
  return permission === "view" || permission === "edit";
};

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();
  const { signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isLoading = isAdminLoading || permissionsLoading;

  // Filter items based on permissions
  const visibleItems = isLoading ? [] : allItems.filter(item => canViewItem(item.url, permissions));

  // Show first 4 items in bottom bar, rest in "more" menu
  const mainItems = visibleItems.slice(0, 4);
  const moreItems = visibleItems.slice(4);

  // Add users for admin
  const adminItem = isAdmin ? { title: "Пользователи", url: "/users", icon: Shield, group: "admin" } : null;

  const handleNavigate = (url: string) => {
    navigate(url);
    setSheetOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setSheetOpen(false);
  };

  if (isLoading || visibleItems.length === 0) {
    return null;
  }

  const isActive = (url: string) => location.pathname === url;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mainItems.map((item) => (
          <button
            key={item.url}
            onClick={() => navigate(item.url)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
              isActive(item.url)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="truncate max-w-[60px]">{item.title}</span>
          </button>
        ))}

        {/* More menu if there are additional items */}
        {(moreItems.length > 0 || adminItem) && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                  moreItems.some(item => isActive(item.url)) || (adminItem && isActive(adminItem.url))
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <MoreHorizontal className="h-5 w-5" />
                <span>Ещё</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto max-h-[70vh]">
              <SheetHeader>
                <SheetTitle>Меню</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-3 gap-3 py-4">
                {moreItems.map((item) => (
                  <button
                    key={item.url}
                    onClick={() => handleNavigate(item.url)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg transition-colors",
                      isActive(item.url)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs text-center">{item.title}</span>
                  </button>
                ))}
                
                {adminItem && (
                  <button
                    onClick={() => handleNavigate(adminItem.url)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-3 rounded-lg transition-colors",
                      isActive(adminItem.url)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <adminItem.icon className="h-6 w-6" />
                    <span className="text-xs text-center">{adminItem.title}</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleSignOut}
                className="flex items-center justify-center gap-2 w-full p-3 mt-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Выйти</span>
              </button>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
