import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Menu } from "lucide-react";
import siberianForestBg from "@/assets/siberian-forest-bg.jpg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative">
          {/* Background image with high transparency */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${siberianForestBg})` }}
          />
          
          <header className="h-16 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 relative z-10">
            <SidebarTrigger className="-ml-1">
              <Menu className="h-5 w-5" />
            </SidebarTrigger>
          </header>
          
          <main className="flex-1 p-6 relative z-10 overflow-x-auto">
            <div className="min-w-0 w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
