
import { useState, useEffect } from "react";
import { CheckCircle, Circle, Trash2, Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { saveToStorage, getFromStorage } from "@/lib/storage";

type Priority = "high" | "medium" | "low";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  progress: number;
}

const getPriorityStyle = (priority: Priority) => {
  switch (priority) {
    case "high":
      return "text-red-500 border-red-300 bg-red-50";
    case "medium":
      return "text-yellow-500 border-yellow-300 bg-yellow-50";
    case "low":
      return "text-green-500 border-green-300 bg-green-50";
    default:
      return "text-gray-500 border-gray-300 bg-gray-50";
  }
};

const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>("medium");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [sortBy, setSortBy] = useState<"priority" | "progress">("priority");

  useEffect(() => {
    const savedTasks = getFromStorage<Task[]>("tasks", []);
    setTasks(savedTasks);
  }, []);

  useEffect(() => {
    saveToStorage("tasks", tasks);
  }, [tasks]);

  const addTask = () => {
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
      priority: newTaskPriority,
      progress: 0,
    };

    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
  };

  const toggleComplete = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, completed: !task.completed, progress: task.completed ? task.progress : 100 }
          : task
      )
    );
  };

  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const updateProgress = (id: string, progress: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              progress,
              completed: progress === 100,
            }
          : task
      )
    );
  };

  const incrementProgress = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              progress: Math.min(task.progress + 10, 100),
              completed: task.progress + 10 >= 100,
            }
          : task
      )
    );
  };

  const decrementProgress = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              progress: Math.max(task.progress - 10, 0),
              completed: false,
            }
          : task
      )
    );
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    } else {
      // Sort by progress (ascending)
      return a.progress - b.progress;
    }
  });

  const taskProgress = tasks.length > 0
    ? Math.round(
        (tasks.filter((task) => task.completed).length / tasks.length) * 100
      )
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Task List</h1>
          <p className="text-muted-foreground">Manage your tasks with priorities</p>
        </div>
        <Card className="w-full sm:w-auto">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm font-medium">Overall Progress</p>
              <Progress value={taskProgress} className="h-2 mt-2" />
              <p className="mt-2 text-lg font-semibold">{taskProgress}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              placeholder="What needs to be done?"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              className="flex-1"
            />
            <Select
              value={newTaskPriority}
              onValueChange={(value) => setNewTaskPriority(value as Priority)}
            >
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addTask} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Add Task
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredTasks.length} tasks shown (
          {tasks.filter((task) => task.completed).length} completed)
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No tasks found. Add some tasks to get started!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 border rounded-lg flex items-center gap-4 transition-opacity ${
                task.completed ? "opacity-70" : ""
              }`}
            >
              <button onClick={() => toggleComplete(task.id)}>
                {task.completed ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Circle className="h-6 w-6 text-gray-400" />
                )}
              </button>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                  <p className={task.completed ? "line-through text-muted-foreground" : ""}>
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-1 rounded border ${getPriorityStyle(
                        task.priority
                      )}`}
                    >
                      {task.priority}
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => decrementProgress(task.id)}
                    disabled={task.progress <= 0}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Progress value={task.progress} className="h-2 flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => incrementProgress(task.id)}
                    disabled={task.progress >= 100}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                    {task.progress}%
                  </span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeTask(task.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskList;
