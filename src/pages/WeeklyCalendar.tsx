
import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, isToday, isSameDay, parseISO } from "date-fns";
import { Plus, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  category: string;
}

const timeSlots = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

const categories = [
  { value: "work", label: "Work", color: "bg-blue-100 border-blue-300 text-blue-700" },
  { value: "personal", label: "Personal", color: "bg-green-100 border-green-300 text-green-700" },
  { value: "meeting", label: "Meeting", color: "bg-purple-100 border-purple-300 text-purple-700" },
  { value: "task", label: "Task", color: "bg-yellow-100 border-yellow-300 text-yellow-700" },
  { value: "other", label: "Other", color: "bg-gray-100 border-gray-300 text-gray-700" },
];

const getCategoryColor = (category: string) => {
  return categories.find((c) => c.value === category)?.color || categories[4].color;
};

const WeeklyCalendar = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [newEvent, setNewEvent] = useState<Omit<CalendarEvent, "id">>({
    title: "",
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "09:00",
    endTime: "10:00",
    category: "work",
  });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const savedEvents = getFromStorage<CalendarEvent[]>("calendar_events", []);
    setEvents(savedEvents);
  }, []);

  useEffect(() => {
    saveToStorage("calendar_events", events);
  }, [events]);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start from Monday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const addEvent = () => {
    const event: CalendarEvent = {
      id: Date.now().toString(),
      ...newEvent,
    };

    setEvents((prev) => [...prev, event]);
    setIsDialogOpen(false);
    resetNewEvent();
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((event) => event.id !== id));
  };

  const resetNewEvent = () => {
    setNewEvent({
      title: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "09:00",
      endTime: "10:00",
      category: "work",
    });
  };

  const calculateEventPosition = (event: CalendarEvent) => {
    const [startHour] = event.startTime.split(":").map(Number);
    const [endHour] = event.endTime.split(":").map(Number);
    const duration = endHour - startHour;
    
    return {
      gridRowStart: startHour + 1, // +1 because grid starts from 1
      gridRowEnd: `span ${duration || 1}`, // Ensure minimum span of 1
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Weekly Calendar</h1>
          <p className="text-muted-foreground">Visualize your weekly schedule</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Event</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Enter event title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Select
                    value={newEvent.startTime}
                    onValueChange={(value) => setNewEvent({ ...newEvent, startTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Start Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={`start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Select
                    value={newEvent.endTime}
                    onValueChange={(value) => setNewEvent({ ...newEvent, endTime: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="End Time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newEvent.category}
                  onValueChange={(value) => setNewEvent({ ...newEvent, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addEvent} disabled={!newEvent.title}>
                Add Event
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Week of {format(weekStart, "MMMM d, yyyy")}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-8 border rounded-md overflow-hidden">
            {/* Time column */}
            <div className="border-r">
              <div className="h-16 border-b bg-muted/50 text-center"></div>
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-16 border-b px-2 py-1 text-xs text-muted-foreground"
                >
                  {time}
                </div>
              ))}
            </div>

            {/* Days columns */}
            {weekDays.map((day, index) => (
              <div key={index} className="relative">
                <div
                  className={`h-16 border-b p-2 text-center ${
                    isToday(day) ? "bg-primary/10" : "bg-muted/50"
                  }`}
                >
                  <div className="font-medium">{format(day, "EEE")}</div>
                  <div
                    className={`text-sm ${
                      isToday(day)
                        ? "inline-flex items-center justify-center h-6 w-6 rounded-full bg-primary text-white"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                </div>

                {/* Events */}
                <div className="relative grid grid-rows-[repeat(24,4rem)]">
                  {/* Time slots background */}
                  {timeSlots.map((time, i) => (
                    <div
                      key={`slot-${i}`}
                      className={`border-b border-dashed ${
                        i % 2 === 0 ? "bg-muted/10" : ""
                      }`}
                    ></div>
                  ))}

                  {/* Events for the day */}
                  {events
                    .filter((event) =>
                      isSameDay(parseISO(event.date), day)
                    )
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`absolute w-full p-1 overflow-hidden ${getCategoryColor(
                          event.category
                        )} border rounded-md shadow-sm m-0.5 cursor-pointer hover:shadow-md transition-shadow`}
                        style={{
                          top: `${parseInt(event.startTime.split(":")[0]) * 4}rem`,
                          height: `${
                            (parseInt(event.endTime.split(":")[0]) -
                              parseInt(event.startTime.split(":")[0])) *
                            4
                          }rem`,
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-xs line-clamp-1">
                              {event.title}
                            </div>
                            <div className="text-xs opacity-70">
                              {event.startTime} - {event.endTime}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 opacity-0 hover:opacity-100"
                            onClick={() => deleteEvent(event.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyCalendar;
