import { Users, MapPin, ScrollText, UserCircle, UsersRound, Inbox, Coins, ClipboardCheck, Package, ArrowLeftRight, FolderTree, ListTodo, PanelLeftClose, PanelLeft } from "lucide-react";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const clientsItems = [
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Объекты", url: "/service-objects", icon: MapPin },
];

const requestsItems = [
  { title: "Заявки", url: "/requests", icon: Inbox },
  { title: "Документы", url: "/documents", icon: ScrollText },
  { title: "Расчеты", url: "/estimates", icon: Coins },
  { title: "Задания", url: "/assignments", icon: ClipboardCheck },
];

const staffItems = [
  { title: "Сотрудники", url: "/employees", icon: UserCircle },
  { title: "Бригады", url: "/teams", icon: UsersRound },
  { title: "Задачи", url: "/tasks", icon: ListTodo },
];

const warehouseItems = [
  { title: "Разделы в складе", url: "/warehouse-categories", icon: FolderTree },
  { title: "Комплектующие", url: "/spare-parts", icon: Package },
  { title: "Расход/Приход", url: "/stock-movements", icon: ArrowLeftRight },
];

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
  const isWarehouseActive = warehouseItems.some(item => location.pathname === item.url);

  return (
    <Sidebar 
      className="border-r border-sidebar-border"
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
              <PanelLeftClose className="h-5 w-5 text-sidebar-foreground/60" />
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
              <PanelLeft className="h-5 w-5 text-sidebar-foreground/60" />
            </button>
          </div>
        )}

        {/* Клиенты и объекты */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {clientsItems.map((item) => (
                <MenuItemComponent key={item.title} item={item} open={open} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Заявки и документы */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {requestsItems.map((item) => (
                <MenuItemComponent key={item.title} item={item} open={open} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Сотрудники и бригады */}
        <SidebarGroup className="py-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {staffItems.map((item) => (
                <MenuItemComponent key={item.title} item={item} open={open} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2 bg-sidebar-border" />

        {/* Склад */}
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
                      {warehouseItems.map((item) => (
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
                      {warehouseItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
}
