
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "@/contexts/SidebarContext";
import { 
  CheckCircle, StickyNote, Clock, FileText, Calendar, 
  Globe, Code, Network, FileCode, Search, LayoutDashboard, Menu, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}

const NavItem = ({ to, icon: Icon, label, isActive }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sidebar-accent transition-colors",
      isActive && "bg-sidebar-accent text-white"
    )}
  >
    <Icon size={18} />
    <span>{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const { isOpen, toggle } = useSidebar();

  const navigationItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard },
    { path: "/tasks", label: "Task List", icon: CheckCircle },
    { path: "/notes", label: "Sticky Notes", icon: StickyNote },
    { path: "/pomodoro", label: "Pomodoro Timer", icon: Clock },
    { path: "/markdown", label: "Markdown Notes", icon: FileText },
    { path: "/calendar", label: "Weekly Calendar", icon: Calendar },
    { path: "/timezone", label: "Time Zone Converter", icon: Globe },
    { path: "/json", label: "JSON Viewer", icon: Code },
    { path: "/mindmap", label: "Mind Map Builder", icon: Network },
    { path: "/snippets", label: "Snippet Manager", icon: FileCode },
    { path: "/regex", label: "Regex Tester", icon: Search },
  ];

  return (
    <>
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-white transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:inset-auto flex flex-col`}
      >
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <h1 className="text-xl font-bold flex items-center">
            <span className="text-primary">Productivity</span>Suite
          </h1>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggle}
            className="lg:hidden text-white hover:bg-sidebar-accent"
          >
            <X size={18} />
          </Button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => (
            <NavItem
              key={item.path}
              to={item.path}
              icon={item.icon}
              label={item.label}
              isActive={location.pathname === item.path}
            />
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border text-xs text-muted-foreground">
          <p>© 2025 ProductivitySuite</p>
        </div>
      </div>
      
      {/* Mobile menu toggle */}
      <Button
        variant="outline"
        size="icon"
        onClick={toggle}
        className={`fixed bottom-4 right-4 z-40 rounded-full shadow-lg lg:hidden ${isOpen ? 'hidden' : 'flex'}`}
      >
        <Menu size={20} />
      </Button>
    </>
  );
};

export default Sidebar;
