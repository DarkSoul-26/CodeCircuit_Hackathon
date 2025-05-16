
import { useState, useEffect } from "react";
import { Code, Check, X, Search, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { saveToStorage, getFromStorage } from "@/lib/storage";

const JsonViewer = () => {
  const [jsonInput, setJsonInput] = useState<string>("");
  const [parsedJson, setParsedJson] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(["root"]));

  useEffect(() => {
    const savedJson = getFromStorage<string>("json_input", "");
    if (savedJson) {
      setJsonInput(savedJson);
      try {
        setParsedJson(JSON.parse(savedJson));
        setError(null);
      } catch (err) {
        setError("Invalid JSON format");
        setParsedJson(null);
      }
    }
  }, []);

  useEffect(() => {
    if (jsonInput) {
      saveToStorage("json_input", jsonInput);
    }
  }, [jsonInput]);

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    try {
      if (!value.trim()) {
        setParsedJson(null);
        setError(null);
        return;
      }
      const parsed = JSON.parse(value);
      setParsedJson(parsed);
      setError(null);
    } catch (err) {
      setError("Invalid JSON format");
      setParsedJson(null);
    }
  };

  const handlePrettify = () => {
    try {
      if (!jsonInput.trim()) {
        toast.error("No JSON to prettify");
        return;
      }
      const parsed = JSON.parse(jsonInput);
      const pretty = JSON.stringify(parsed, null, 2);
      setJsonInput(pretty);
      setParsedJson(parsed);
      setError(null);
      toast.success("JSON formatted successfully");
    } catch (err) {
      toast.error("Invalid JSON format");
    }
  };

  const handleValidate = () => {
    try {
      if (!jsonInput.trim()) {
        toast.error("No JSON to validate");
        return;
      }
      JSON.parse(jsonInput);
      toast.success("JSON is valid");
    } catch (err) {
      if (err instanceof Error) {
        toast.error(`Invalid JSON: ${err.message}`);
      } else {
        toast.error("Invalid JSON format");
      }
    }
  };

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const isExpanded = (path: string) => {
    return expandedPaths.has(path);
  };

  // Helper to check if a string contains the search term
  const matchesSearch = (str: string) => {
    return !searchTerm || str.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // Recursive component for rendering JSON nodes
  const JsonNode = ({
    data,
    path = "root",
    depth = 0,
  }: {
    data: any;
    path?: string;
    depth?: number;
  }) => {
    const expanded = isExpanded(path);
    const isObject = data !== null && typeof data === "object";
    const isArray = Array.isArray(data);

    // Check if this node or any of its children match the search
    const hasMatch = () => {
      if (!searchTerm) return true;

      // Check if the path itself matches
      if (matchesSearch(path)) return true;

      // For leaf nodes, check the value
      if (!isObject) return matchesSearch(String(data));

      // For objects/arrays, check if any children match
      return Object.entries(data).some(([key, value]) => {
        const childPath = `${path}.${key}`;
        if (matchesSearch(key)) return true;
        if (typeof value !== "object" || value === null) return matchesSearch(String(value));
        return hasMatch();
      });
    };

    if (!hasMatch()) return null;

    const toggleNode = () => toggleExpand(path);

    if (!isObject) {
      // Primitive value
      return (
        <div
          className={`pl-${depth * 4} flex items-start group ${
            searchTerm && matchesSearch(String(data)) ? "bg-yellow-50" : ""
          }`}
        >
          <span
            className={`font-mono ${
              typeof data === "string"
                ? "text-green-600"
                : typeof data === "number"
                ? "text-blue-600"
                : typeof data === "boolean"
                ? "text-purple-600"
                : data === null
                ? "text-gray-500 italic"
                : ""
            }`}
          >
            {typeof data === "string"
              ? `"${data}"`
              : data === null
              ? "null"
              : String(data)}
          </span>
        </div>
      );
    }

    const entries = Object.entries(data);

    return (
      <div className="pl-4">
        <div
          className={`flex items-center gap-1 cursor-pointer hover:bg-muted/50 -ml-4 pl-4 ${
            searchTerm && matchesSearch(path.split(".").pop() || "") ? "bg-yellow-50" : ""
          }`}
          onClick={toggleNode}
        >
          <button className="w-4 h-4 flex items-center justify-center">
            {expanded ? (
              <Minus className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </button>
          <span className="font-mono">
            {isArray ? "[" : "{"} {entries.length} {isArray ? "items" : "properties"}
          </span>
        </div>

        {expanded && (
          <div className="pl-4 border-l border-dashed border-muted-foreground/30">
            {entries.map(([key, value], index) => {
              const childPath = `${path}.${key}`;
              return (
                <div key={childPath} className="mt-1">
                  <div className="flex items-start">
                    <span
                      className={`font-mono mr-2 ${
                        searchTerm && matchesSearch(key) ? "bg-yellow-50 font-semibold" : ""
                      }`}
                    >
                      {isArray ? index : `"${key}"`}:
                    </span>
                    <JsonNode data={value} path={childPath} depth={depth + 1} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="font-mono">{isArray ? "]" : "}"}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">JSON Viewer</h1>
        <p className="text-muted-foreground">View and edit JSON with structured formatting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span className="flex items-center gap-2">
                <Code className="h-5 w-5" /> JSON Input
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrettify}
                >
                  Prettify
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleValidate}
                >
                  Validate
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder='Enter JSON here, e.g., {"name": "John", "age": 30}'
              value={jsonInput}
              onChange={(e) => handleJsonChange(e.target.value)}
              className="font-mono h-[60vh] resize-none"
            />
            {error && (
              <div className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <X className="h-4 w-4" /> {error}
              </div>
            )}
            {!error && parsedJson && (
              <div className="mt-2 text-sm text-green-500 flex items-center gap-1">
                <Check className="h-4 w-4" /> Valid JSON
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>JSON Viewer</span>
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-48"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto h-[60vh] border rounded-md p-4">
              {parsedJson ? (
                <JsonNode data={parsedJson} />
              ) : (
                <div className="text-center p-8 text-muted-foreground">
                  {error
                    ? "Fix JSON errors to see tree view"
                    : "Enter valid JSON to see tree view"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JsonViewer;
