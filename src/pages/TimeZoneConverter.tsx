
import { useState, useEffect } from "react";
import { Globe, Clock, PlusCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface Location {
  id: string;
  name: string;
  timezone: string;
}

// Sample common time zones
const commonTimezones = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
];

const TimeZoneConverter = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState<Partial<Location>>({
    name: "",
    timezone: "",
  });
  const [baseTime, setBaseTime] = useState<string>(
    new Date().toISOString().substring(0, 16)
  );

  useEffect(() => {
    const savedLocations = getFromStorage<Location[]>("timezone_locations", []);
    if (savedLocations.length === 0) {
      // Add default locations if none exist
      const defaults = [
        { id: "1", name: "New York", timezone: "America/New_York" },
        { id: "2", name: "London", timezone: "Europe/London" },
        { id: "3", name: "Tokyo", timezone: "Asia/Tokyo" },
      ];
      setLocations(defaults);
      saveToStorage("timezone_locations", defaults);
    } else {
      setLocations(savedLocations);
    }
  }, []);

  useEffect(() => {
    saveToStorage("timezone_locations", locations);
  }, [locations]);

  const addLocation = () => {
    if (!newLocation.name || !newLocation.timezone) return;

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation.name,
      timezone: newLocation.timezone,
    };

    setLocations([...locations, location]);
    setNewLocation({ name: "", timezone: "" });
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter((loc) => loc.id !== id));
  };

  const convertTime = (targetTimezone: string): string => {
    try {
      const date = new Date(baseTime);
      const options: Intl.DateTimeFormatOptions = {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: targetTimezone,
        hour12: true,
      };
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch (error) {
      console.error("Error converting time:", error);
      return "Invalid";
    }
  };

  const formatDateForTimeZone = (timezone: string): string => {
    try {
      const date = new Date(baseTime);
      const options: Intl.DateTimeFormatOptions = {
        weekday: "short",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      };
      return new Intl.DateTimeFormat("en-US", options).format(date);
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
    }
  };

  // Function to check if the date is different (crossing day boundary)
  const isDifferentDay = (timezone: string): boolean => {
    const baseDate = new Date(baseTime);
    const baseDateStr = baseDate.toLocaleDateString("en-US", { timeZone: "UTC" });
    
    const targetDateStr = baseDate.toLocaleDateString("en-US", { timeZone: timezone });
    
    return baseDateStr !== targetDateStr;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Time Zone Converter</h1>
        <p className="text-muted-foreground">Convert times across different time zones</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" /> Base Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Input
              type="datetime-local"
              value={baseTime}
              onChange={(e) => setBaseTime(e.target.value)}
              className="w-full sm:w-auto"
            />
            <span className="text-muted-foreground">
              Set this to the time you want to convert
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" /> Locations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Location Name</label>
                <Input
                  placeholder="e.g., New York, Home Office"
                  value={newLocation.name}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Zone</label>
                <Select
                  value={newLocation.timezone}
                  onValueChange={(value) =>
                    setNewLocation({ ...newLocation, timezone: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonTimezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={addLocation}
                disabled={!newLocation.name || !newLocation.timezone}
                className="md:col-span-2"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add Location
              </Button>
            </div>

            <div className="border rounded-md overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-left p-2 font-medium">Time Zone</th>
                    <th className="text-left p-2 font-medium">Date</th>
                    <th className="text-left p-2 font-medium">Time</th>
                    <th className="text-center p-2 font-medium w-16">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center p-4 text-muted-foreground">
                        No locations added yet
                      </td>
                    </tr>
                  ) : (
                    locations.map((location) => (
                      <tr key={location.id} className="border-t">
                        <td className="p-2">{location.name}</td>
                        <td className="p-2">{location.timezone.replace("_", " ")}</td>
                        <td className="p-2">{formatDateForTimeZone(location.timezone)}</td>
                        <td className="p-2">
                          <span
                            className={
                              isDifferentDay(location.timezone)
                                ? "text-yellow-600 font-medium"
                                : ""
                            }
                          >
                            {convertTime(location.timezone)}
                            {isDifferentDay(location.timezone) && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded">
                                Next Day
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeLocation(location.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeZoneConverter;
