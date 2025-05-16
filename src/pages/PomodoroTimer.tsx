
import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface TimerSession {
  id: string;
  type: "work" | "break";
  duration: number;
  timestamp: number;
}

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  const [sessions, setSessions] = useState<TimerSession[]>([]);
  const intervalRef = useRef<number | null>(null);
  const notificationPermissionRef = useRef<boolean>(false);

  const workTime = 25 * 60; // 25 minutes in seconds
  const breakTime = 5 * 60; // 5 minutes in seconds

  useEffect(() => {
    const savedSessions = getFromStorage<TimerSession[]>("pomodoro_sessions", []);
    setSessions(savedSessions);
    
    // Ask for notification permission
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission === "granted";
      });
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    saveToStorage("pomodoro_sessions", sessions);
  }, [sessions]);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            handleTimerComplete();
            return mode === "work" ? breakTime : workTime;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive, mode]);

  const handleTimerComplete = () => {
    setIsActive(false);
    
    // Record the session
    const newSession: TimerSession = {
      id: Date.now().toString(),
      type: mode,
      duration: mode === "work" ? workTime : breakTime,
      timestamp: Date.now(),
    };
    
    setSessions((prev) => [newSession, ...prev]);
    
    // Switch modes
    const nextMode = mode === "work" ? "break" : "work";
    setMode(nextMode);
    setTimeLeft(nextMode === "work" ? workTime : breakTime);
    
    // Send notification
    if (notificationPermissionRef.current) {
      new Notification(`${mode === "work" ? "Work" : "Break"} timer completed!`, {
        body: `Time for a ${mode === "work" ? "break" : "work session"}!`,
      });
    }
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === "work" ? workTime : breakTime);
  };

  const switchMode = (newMode: "work" | "break") => {
    setIsActive(false);
    setMode(newMode);
    setTimeLeft(newMode === "work" ? workTime : breakTime);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const calculateProgress = (): number => {
    const totalTime = mode === "work" ? workTime : breakTime;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Pomodoro Timer</h1>
        <p className="text-muted-foreground">Boost productivity with focused work sessions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <Tabs defaultValue="work" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="work" onClick={() => switchMode("work")}>
                  Work
                </TabsTrigger>
                <TabsTrigger value="break" onClick={() => switchMode("break")}>
                  Break
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Timer circle background */}
              <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
              
              {/* Progress circle */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="50%"
                  cy="50%"
                  r="calc(50% - 8px)" // Adjust for border width
                  strokeWidth="8"
                  stroke={mode === "work" ? "hsl(var(--primary))" : "hsl(var(--accent))"}
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * (50 - 4)}%`} // Adjust for border width
                  strokeDashoffset={`${(100 - progress) * (2 * Math.PI * (50 - 4) / 100)}%`}
                  className="transition-all duration-300 ease-linear"
                />
              </svg>
              
              {/* Time display */}
              <div className="text-center z-10">
                <div className="text-5xl font-bold mb-2">{formatTime(timeLeft)}</div>
                <div className="text-sm text-muted-foreground capitalize">{mode} Mode</div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={resetTimer}
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button
                className="h-12 w-12 rounded-full"
                onClick={toggleTimer}
              >
                {isActive ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Session History
            </CardTitle>
          </CardHeader>
          <CardContent className="h-72 overflow-y-auto">
            {sessions.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">No sessions recorded yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-md border ${
                      session.type === "work"
                        ? "border-primary/20 bg-primary/5"
                        : "border-accent/20 bg-accent/5"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="capitalize font-medium">
                        {session.type} Session
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(session.duration)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(session.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t p-4">
            <div className="w-full text-center text-sm text-muted-foreground">
              {sessions.length} {sessions.length === 1 ? "session" : "sessions"} recorded
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default PomodoroTimer;
