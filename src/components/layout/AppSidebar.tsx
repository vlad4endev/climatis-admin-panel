import { Users, Building, FileText, UserCircle, UsersRound, ClipboardList, Calculator, ClipboardCheck, Package, ArrowLeftRight, Layers, CheckSquare } from "lucide-react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Separator } from "@/components/ui/separator";

const clientsItems = [
  { title: "Клиенты", url: "/clients", icon: Users },
  { title: "Объекты", url: "/service-objects", icon: Building },
];

const requestsItems = [
  { title: "Заявки", url: "/requests", icon: ClipboardList },
  { title: "Документы", url: "/documents", icon: FileText },
  { title: "Расчеты", url: "/estimates", icon: Calculator },
  { title: "Задания", url: "/assignments", icon: ClipboardCheck },
];

const staffItems = [
  { title: "Сотрудники", url: "/employees", icon: UserCircle },
  { title: "Бригады", url: "/teams", icon: UsersRound },
  { title: "Задачи", url: "/tasks", icon: CheckSquare },
];

const warehouseItems = [
  { title: "Разделы в складе", url: "/warehouse-categories", icon: Layers },
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
  const { open } = useSidebar();
  const location = useLocation();
  const isWarehouseActive = warehouseItems.some(item => location.pathname === item.url);

  return (
    <Sidebar 
      className="border-r border-sidebar-border"
      collapsible="icon"
    >
      <SidebarContent>
        {open && (
          <div className="px-6 py-5">
            <h2 className="text-xl font-bold text-sidebar-foreground">Климатис</h2>
            <p className="text-xs text-sidebar-foreground/60 mt-1">Административная панель</p>
          </div>
        )}
        
        {!open && (
          <div className="py-5 flex items-center justify-center">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">К</span>
            </div>
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
              <Collapsible defaultOpen={isWarehouseActive} className="group/collapsible">
                <SidebarMenuItem>
                  {open ? (
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="flex items-center gap-3 px-3 py-2">
                        <Package className="h-5 w-5 flex-shrink-0" />
                        <span>Склад</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="flex items-center justify-center w-full py-2">
                            <Package className="h-5 w-5" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Склад
                      </TooltipContent>
                    </Tooltip>
                  )}
                </SidebarMenuItem>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {warehouseItems.map((item) => (
                      <SidebarMenuSubItem key={item.title}>
                        {open ? (
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
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                <SidebarMenuSubButton asChild>
                                  <NavLink
                                    to={item.url}
                                    className="flex items-center justify-center w-full py-1 rounded-md transition-colors hover:bg-sidebar-accent"
                                    activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                                  >
                                    <item.icon className="h-4 w-4" />
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              {item.title}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
