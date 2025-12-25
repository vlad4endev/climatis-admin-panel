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

// Admin main items (fixed order)
const adminMainItems = [
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Заявки", url: "/requests", icon: Inbox },
  { title: "Расчеты", url: "/estimates", icon: Coins },
  { title: "Задания", url: "/assignments", icon: ClipboardCheck },
];

// Admin additional items for "more" menu
const adminMoreItems = [
  { title: "Объекты", url: "/service-objects", icon: MapPin },
  { title: "Документы", url: "/documents", icon: ScrollText },
  { title: "Сотрудники", url: "/employees", icon: UserCircle },
  { title: "Бригады", url: "/teams", icon: UsersRound },
  { title: "Задачи", url: "/tasks", icon: ListTodo },
  { title: "Разделы в складе", url: "/warehouse-categories", icon: FolderTree },
  { title: "Комплектующие", url: "/spare-parts", icon: Package },
  { title: "Расход/Приход", url: "/stock-movements", icon: ArrowLeftRight },
  { title: "Пользователи", url: "/users", icon: Shield },
];

// All items for regular users
const allItems = [
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Объекты", url: "/service-objects", icon: MapPin },
  { title: "Заявки", url: "/requests", icon: Inbox },
  { title: "Документы", url: "/documents", icon: ScrollText },
  { title: "Расчеты", url: "/estimates", icon: Coins },
  { title: "Задания", url: "/assignments", icon: ClipboardCheck },
  { title: "Сотрудники", url: "/employees", icon: UserCircle },
  { title: "Бригады", url: "/teams", icon: UsersRound },
  { title: "Задачи", url: "/tasks", icon: ListTodo },
  { title: "Разделы в складе", url: "/warehouse-categories", icon: FolderTree },
  { title: "Комплектующие", url: "/spare-parts", icon: Package },
  { title: "Расход/Приход", url: "/stock-movements", icon: ArrowLeftRight },
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

  // For admin: fixed main items, all items in more menu
  // For regular user: first 4 accessible items in main, all accessible in more
  let mainItems: typeof allItems = [];
  let allVisibleItems: typeof allItems = [];

  if (!isLoading) {
    if (isAdmin) {
      mainItems = adminMainItems;
      allVisibleItems = [...adminMainItems, ...adminMoreItems];
    } else {
      const visibleItems = allItems.filter(item => canViewItem(item.url, permissions));
      mainItems = visibleItems.slice(0, 4);
      allVisibleItems = visibleItems;
    }
  }

  const handleNavigate = (url: string) => {
    navigate(url);
    setSheetOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setSheetOpen(false);
  };

  if (isLoading || mainItems.length === 0) {
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
        {allVisibleItems.length > 0 && (
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-center flex-1 h-full gap-1 text-xs transition-colors",
                  allVisibleItems.some(item => isActive(item.url))
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
                {allVisibleItems.map((item) => (
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
