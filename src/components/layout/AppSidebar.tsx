import { Users, MapPin, ScrollText, UserCircle, UsersRound, Inbox, Coins, ClipboardCheck, Package, ArrowLeftRight, FolderTree, ListTodo, ChevronsLeft, ChevronsRight, Shield, LogOut, Contact, Trash2, History, Activity } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { useIsAdmin, useMyPermissions, PermissionLevel } from "@/hooks/useUserRoles";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

// Map URL paths to section keys
const urlToSectionKey = (url: string): string => url.replace("/", "");

const clientsItems = [
  { title: "Организации", url: "/clients", icon: Users },
  { title: "Контактные лица", url: "/contacts", icon: UserCircle },
  { title: "Объекты", url: "/service-objects", icon: MapPin },
];

const requestsItems = [
  { title: "Заявки", url: "/requests", icon: Inbox },
  { title: "Документы", url: "/documents", icon: ScrollText },
  { title: "Расчеты", url: "/estimates", icon: Coins },
  { title: "Прайс работ", url: "/work-price-list", icon: ScrollText },
  { title: "Задания", url: "/assignments", icon: ClipboardCheck },
];

const staffItems = [
  { title: "Сотрудники", url: "/employees", icon: UserCircle },
  { title: "Бригады", url: "/teams", icon: UsersRound },
  { title: "Задачи", url: "/tasks", icon: ListTodo },
];

const warehouseItems = [
  { title: "Категории", url: "/warehouse-categories", icon: FolderTree },
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

// Filter items based on permissions
const filterItemsByPermission = (items: typeof clientsItems, permissions: Map<string, PermissionLevel> | undefined) => {
  return items.filter(item => canViewItem(item.url, permissions));
};

const MenuItemComponent = ({ item, open }: { item: typeof clientsItems[0], open: boolean }) => (
  <SidebarMenuItem>
    {open ? (
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
          activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span>{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    ) : (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <SidebarMenuButton asChild>
              <NavLink
                to={item.url}
                className="flex items-center justify-center w-full py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              >
                <item.icon className="h-5 w-5" />
              </NavLink>
            </SidebarMenuButton>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          {item.title}
        </TooltipContent>
      </Tooltip>
    )}
  </SidebarMenuItem>
);

export function AppSidebar() {
  const { open, toggleSidebar } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const { data: permissions, isLoading: permissionsLoading } = useMyPermissions();
  const { user, signOut } = useAuth();
  
  // Wait for both admin status and permissions to load before filtering
  const isLoadingPermissions = isAdminLoading || permissionsLoading;
  
  // Filter items based on permissions (only after loading is complete)
  const visibleClientsItems = isLoadingPermissions ? [] : filterItemsByPermission(clientsItems, permissions);
  const visibleRequestsItems = isLoadingPermissions ? [] : filterItemsByPermission(requestsItems, permissions);
  const visibleStaffItems = isLoadingPermissions ? [] : filterItemsByPermission(staffItems, permissions);
  const visibleWarehouseItems = isLoadingPermissions ? [] : filterItemsByPermission(warehouseItems, permissions);
  
  const isWarehouseActive = visibleWarehouseItems.some(item => location.pathname === item.url);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Пользователь';

  return (
    <Sidebar 
      className="border-r border-sidebar-border z-20"
      collapsible="icon"
    >
      <SidebarContent>
        {open ? (
          <div className="px-6 py-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-sidebar-foreground">Климатис</h2>
              <p className="text-xs text-sidebar-foreground/60 mt-1">Административная панель</p>
            </div>
            <button
              onClick={() => toggleSidebar()}
              className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
              title="Свернуть меню"
            >
              <ChevronsLeft className="h-5 w-5 text-sidebar-foreground/60" />
            </button>
          </div>
        ) : (
          <div className="py-5 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">К</span>
            </div>
            <button
              onClick={() => toggleSidebar()}
              className="p-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
              title="Развернуть меню"
            >
              <ChevronsRight className="h-5 w-5 text-sidebar-foreground/60" />
            </button>
          </div>
        )}

        {/* Клиенты и объекты */}
        {visibleClientsItems.length > 0 && (
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleClientsItems.map((item) => (
                  <MenuItemComponent key={item.title} item={item} open={open} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleClientsItems.length > 0 && visibleRequestsItems.length > 0 && (
          <Separator className="my-2 bg-sidebar-border" />
        )}

        {/* Заявки и документы */}
        {visibleRequestsItems.length > 0 && (
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleRequestsItems.map((item) => (
                  <MenuItemComponent key={item.title} item={item} open={open} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleRequestsItems.length > 0 && visibleStaffItems.length > 0 && (
          <Separator className="my-2 bg-sidebar-border" />
        )}

        {/* Сотрудники и бригады */}
        {visibleStaffItems.length > 0 && (
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleStaffItems.map((item) => (
                  <MenuItemComponent key={item.title} item={item} open={open} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {visibleStaffItems.length > 0 && visibleWarehouseItems.length > 0 && (
          <Separator className="my-2 bg-sidebar-border" />
        )}

        {/* Склад */}
        {visibleWarehouseItems.length > 0 && (
          <SidebarGroup className="py-0">
            <SidebarGroupContent>
              <SidebarMenu>
                {open ? (
                  <Collapsible defaultOpen={isWarehouseActive} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="flex items-center gap-3 px-3 py-2">
                          <Package className="h-5 w-5 flex-shrink-0" />
                          <span>Склад</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                    </SidebarMenuItem>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {visibleWarehouseItems.map((item) => (
                          <SidebarMenuSubItem key={item.title}>
                            <SidebarMenuSubButton asChild>
                              <NavLink
                                to={item.url}
                                className="flex items-center gap-3 px-3 py-2 rounded-md transition-colors hover:bg-sidebar-accent"
                                activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                              >
                                <item.icon className="h-4 w-4 flex-shrink-0" />
                                <span>{item.title}</span>
                              </NavLink>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </Collapsible>
                ) : (
                  <Popover>
                    <PopoverTrigger asChild>
                      <SidebarMenuItem>
                        <SidebarMenuButton className="flex items-center justify-center w-full py-2">
                          <Package className="h-5 w-5" />
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </PopoverTrigger>
                    <PopoverContent side="right" align="start" className="w-48 p-2">
                      <div className="text-sm font-medium text-muted-foreground mb-2 px-2">Склад</div>
                      <div className="space-y-1">
                        {visibleWarehouseItems.map((item) => (
                          <NavLink
                            key={item.title}
                            to={item.url}
                            className="flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors hover:bg-accent"
                            activeClassName="bg-accent text-accent-foreground font-medium"
                          >
                            <item.icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </NavLink>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin section - Users, Logs & Trash */}
        {isAdmin && (
          <>
            <Separator className="my-2 bg-sidebar-border" />
            <SidebarGroup className="py-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  <MenuItemComponent 
                    item={{ title: "Пользователи", url: "/users", icon: Shield }} 
                    open={open} 
                  />
                  <MenuItemComponent 
                    item={{ title: "Логи", url: "/activity-logs", icon: History }} 
                    open={open} 
                  />
                  <MenuItemComponent 
                    item={{ title: "Мониторинг", url: "/monitoring", icon: Activity }} 
                    open={open} 
                  />
                  <MenuItemComponent 
                    item={{ title: "Корзина", url: "/trash", icon: Trash2 }} 
                    open={open} 
                  />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      {/* User footer with logout */}
      <SidebarFooter className="border-t border-sidebar-border px-2 py-2">
        {open ? (
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs text-sidebar-foreground/80 truncate">
              {userName}
            </span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="h-6 px-2 text-xs text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                  <LogOut className="h-3 w-3 mr-1" />
                  Выйти
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Выйти из аккаунта</TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSignOut}
                className="w-full h-6 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Выйти</TooltipContent>
          </Tooltip>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
