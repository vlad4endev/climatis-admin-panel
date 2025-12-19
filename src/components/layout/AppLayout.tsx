import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import siberianForestBg from "@/assets/siberian-forest-bg.jpg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden">
          {/* Background image with high transparency */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${siberianForestBg})` }}
          />
          
          
          <main className="flex-1 p-6 relative z-10 min-w-0 overflow-y-auto overflow-x-hidden">
            <div className="min-w-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
