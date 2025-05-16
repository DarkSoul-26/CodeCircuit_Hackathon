
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { useSidebar } from "@/contexts/SidebarContext";

const AppLayout = () => {
  const { isOpen } = useSidebar();
  
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main 
        className={`flex-1 overflow-y-auto transition-all duration-200 ease-in-out ${
          isOpen ? "ml-64 md:ml-64" : "ml-0"
        }`}
      >
        <div className="container py-6 mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
