
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, StickyNote, Clock, FileText, Calendar, 
  Globe, Code, Network, FileCode, Search 
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  path: string;
}

const ToolCard = ({ title, description, icon: Icon, path }: ToolCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="h-12">{description}</CardDescription>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" className="w-full" onClick={() => navigate(path)}>
          Open {title}
        </Button>
      </CardFooter>
    </Card>
  );
};

const Dashboard = () => {
  const tools = [
    {
      title: "Task List",
      description: "Organize and track your tasks with priority levels",
      icon: CheckCircle,
      path: "/tasks",
    },
    {
      title: "Sticky Notes",
      description: "Create and organize colorful digital sticky notes",
      icon: StickyNote,
      path: "/notes",
    },
    {
      title: "Pomodoro Timer",
      description: "Boost productivity with timed work sessions",
      icon: Clock, 
      path: "/pomodoro",
    },
    {
      title: "Markdown Notes",
      description: "Take formatted notes with live preview",
      icon: FileText,
      path: "/markdown",
    },
    {
      title: "Weekly Calendar",
      description: "Visualize and plan your weekly schedule",
      icon: Calendar,
      path: "/calendar",
    },
    {
      title: "Time Zone Converter",
      description: "Convert times across different time zones",
      icon: Globe,
      path: "/timezone",
    },
    {
      title: "JSON Viewer",
      description: "View and edit JSON with structured formatting",
      icon: Code,
      path: "/json",
    },
    {
      title: "Mind Map Builder",
      description: "Create visual mind maps for brainstorming",
      icon: Network,
      path: "/mindmap",
    },
    {
      title: "Snippet Manager",
      description: "Save and organize code snippets by language",
      icon: FileCode,
      path: "/snippets",
    },
    {
      title: "Regex Tester",
      description: "Test and debug regular expressions",
      icon: Search,
      path: "/regex",
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold">Welcome to ProductivitySuite</h1>
        <p className="text-muted-foreground mt-2">
          All your productivity tools in one place. Select a tool to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <ToolCard key={tool.path} {...tool} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
