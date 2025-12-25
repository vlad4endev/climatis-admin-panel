import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import siberianForestBg from "@/assets/siberian-forest-bg.jpg";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        
        <div className="flex-1 flex flex-col relative z-0 min-w-0 overflow-hidden">
          {/* Background image with high transparency */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 pointer-events-none"
            style={{ backgroundImage: `url(${siberianForestBg})` }}
          />
          
          {/* Main content - add bottom padding on mobile for nav */}
          <main className="flex-1 p-4 md:p-6 relative z-10 min-w-0 overflow-y-auto overflow-x-hidden pb-20 md:pb-6">
            <div className="min-w-0">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </SidebarProvider>
  );
}
