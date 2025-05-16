
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/contexts/SidebarContext";

import Dashboard from "@/pages/Dashboard";
import TaskList from "@/pages/TaskList";
import StickyNotes from "@/pages/StickyNotes";
import PomodoroTimer from "@/pages/PomodoroTimer";
import MarkdownNotes from "@/pages/MarkdownNotes";
import WeeklyCalendar from "@/pages/WeeklyCalendar";
import TimeZoneConverter from "@/pages/TimeZoneConverter";
import JsonViewer from "@/pages/JsonViewer";
import MindMap from "@/pages/MindMap";
import SnippetManager from "@/pages/SnippetManager";
import RegexTester from "@/pages/RegexTester";
import NotFound from "@/pages/NotFound";
import AppLayout from "@/components/layout/AppLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/notes" element={<StickyNotes />} />
              <Route path="/pomodoro" element={<PomodoroTimer />} />
              <Route path="/markdown" element={<MarkdownNotes />} />
              <Route path="/calendar" element={<WeeklyCalendar />} />
              <Route path="/timezone" element={<TimeZoneConverter />} />
              <Route path="/json" element={<JsonViewer />} />
              <Route path="/mindmap" element={<MindMap />} />
              <Route path="/snippets" element={<SnippetManager />} />
              <Route path="/regex" element={<RegexTester />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
