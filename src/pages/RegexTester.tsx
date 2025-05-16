
import { useState, useEffect, useMemo } from "react";
import { Search, Copy, Clock, InfoIcon, AlertTriangle, CheckCircle, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface RegexSave {
  id: string;
  pattern: string;
  flags: {
    global: boolean;
    caseInsensitive: boolean;
    multiline: boolean;
    dotAll: boolean;
  };
  testString: string;
  name: string;
  timestamp: number;
}

const RegexTester = () => {
  const [pattern, setPattern] = useState("");
  const [testString, setTestString] = useState("");
  const [flags, setFlags] = useState({
    global: true,
    caseInsensitive: false,
    multiline: false,
    dotAll: false,
  });
  const [isValid, setIsValid] = useState(true);
  const [saved, setSaved] = useState<RegexSave[]>([]);
  const [saveName, setSaveName] = useState("");

  useEffect(() => {
    const savedRegexes = getFromStorage<RegexSave[]>("regex_saves", []);
    setSaved(savedRegexes);
  }, []);

  useEffect(() => {
    saveToStorage("regex_saves", saved);
  }, [saved]);

  const flagString = useMemo(() => {
    return (
      (flags.global ? "g" : "") +
      (flags.caseInsensitive ? "i" : "") +
      (flags.multiline ? "m" : "") +
      (flags.dotAll ? "s" : "")
    );
  }, [flags]);

  const matches = useMemo(() => {
    try {
      if (!pattern || !testString) return [];

      const regex = new RegExp(pattern, flagString);
      setIsValid(true);

      if (flags.global) {
        const allMatches = [...testString.matchAll(regex)];
        return allMatches.map((match) => ({
          fullMatch: match[0],
          groups: match.slice(1),
          index: match.index || 0,
          input: match.input,
        }));
      } else {
        const match = testString.match(regex);
        if (!match) return [];
        
        return [{
          fullMatch: match[0],
          groups: match.slice(1),
          index: match.index || 0,
          input: match.input,
        }];
      }
    } catch (error) {
      setIsValid(false);
      return [];
    }
  }, [pattern, testString, flagString]);

  const highlightedText = useMemo(() => {
    if (!isValid || !pattern || !testString) return testString;

    try {
      const regex = new RegExp(pattern, `${flagString.replace("g", "")}g`);
      return testString.replace(regex, (match) => `<mark>${match}</mark>`);
    } catch {
      return testString;
    }
  }, [pattern, testString, flagString, isValid]);

  const explainRegex = () => {
    if (!pattern) return "Enter a regex pattern to see an explanation.";
    
    let explanation = "";
    
    // Start of explanation
    explanation += "Your regular expression:\n";
    explanation += `/${pattern}/${flagString}\n\n`;
    
    // Explain flags
    explanation += "Flags:\n";
    if (flags.global) explanation += "- g (global): Find all matches rather than stopping after the first match\n";
    if (flags.caseInsensitive) explanation += "- i (case-insensitive): Match will be case-insensitive\n";
    if (flags.multiline) explanation += "- m (multiline): ^ and $ will match start and end of each line\n";
    if (flags.dotAll) explanation += "- s (dotAll): . will match newlines too\n";
    if (!flagString) explanation += "- None\n";
    
    explanation += "\nPattern breakdown:\n";
    
    // Very basic explanation of common regex patterns
    if (pattern.includes("^")) explanation += "- ^ matches the start of a string\n";
    if (pattern.includes("$")) explanation += "- $ matches the end of a string\n";
    if (pattern.includes(".")) explanation += "- . matches any character (except newline unless using dotAll flag)\n";
    if (pattern.includes("\\d")) explanation += "- \\d matches any digit (0-9)\n";
    if (pattern.includes("\\w")) explanation += "- \\w matches any word character (A-Z, a-z, 0-9, _)\n";
    if (pattern.includes("\\s")) explanation += "- \\s matches any whitespace character\n";
    if (pattern.includes("\\b")) explanation += "- \\b matches a word boundary\n";
    
    // Quantifiers
    if (pattern.includes("*")) explanation += "- * means 'zero or more' of the preceding character/group\n";
    if (pattern.includes("+")) explanation += "- + means 'one or more' of the preceding character/group\n";
    if (pattern.includes("?")) explanation += "- ? means 'zero or one' of the preceding character/group\n";
    
    // Character classes
    const characterClassRegex = /\[([^\]]+)\]/g;
    const characterClasses = [...pattern.matchAll(characterClassRegex)];
    if (characterClasses.length > 0) {
      characterClasses.forEach((match, index) => {
        explanation += `- [${match[1]}] matches any character within the brackets\n`;
      });
    }
    
    // Capturing groups
    const groupCount = (pattern.match(/\([^?]/g) || []).length;
    if (groupCount > 0) {
      explanation += `- Contains ${groupCount} capturing group(s)\n`;
    }
    
    return explanation;
  };

  const saveRegex = () => {
    if (!pattern) return;
    
    const newSave: RegexSave = {
      id: Date.now().toString(),
      pattern,
      flags,
      testString,
      name: saveName || `Regex ${saved.length + 1}`,
      timestamp: Date.now(),
    };
    
    setSaved([...saved, newSave]);
    setSaveName("");
    toast.success("Regex pattern saved");
  };

  const loadSaved = (save: RegexSave) => {
    setPattern(save.pattern);
    setFlags(save.flags);
    setTestString(save.testString);
  };

  const deleteSaved = (id: string) => {
    setSaved(saved.filter((save) => save.id !== id));
  };

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Regex Tester</h1>
        <p className="text-muted-foreground">Test and debug regular expressions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" /> Regex Pattern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pattern">Pattern</Label>
                  {!isValid && (
                    <div className="text-destructive flex items-center gap-1 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      Invalid regex pattern
                    </div>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-lg text-muted-foreground">/</span>
                  <Input
                    id="pattern"
                    placeholder="Enter regex pattern"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                    className={!isValid ? "border-destructive" : ""}
                  />
                  <span className="text-lg text-muted-foreground">/</span>
                  <div className="text-muted-foreground">{flagString}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="global"
                    checked={flags.global}
                    onCheckedChange={(checked) =>
                      setFlags({ ...flags, global: checked })
                    }
                  />
                  <Label htmlFor="global">Global (g)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="case-insensitive"
                    checked={flags.caseInsensitive}
                    onCheckedChange={(checked) =>
                      setFlags({ ...flags, caseInsensitive: checked })
                    }
                  />
                  <Label htmlFor="case-insensitive">Case Insensitive (i)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="multiline"
                    checked={flags.multiline}
                    onCheckedChange={(checked) =>
                      setFlags({ ...flags, multiline: checked })
                    }
                  />
                  <Label htmlFor="multiline">Multiline (m)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dotAll"
                    checked={flags.dotAll}
                    onCheckedChange={(checked) =>
                      setFlags({ ...flags, dotAll: checked })
                    }
                  />
                  <Label htmlFor="dotAll">Dot All (s)</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-string">Test String</Label>
                <Textarea
                  id="test-string"
                  placeholder="Enter text to test the regex against"
                  value={testString}
                  onChange={(e) => setTestString(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Matches ({matches.length})</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(pattern, "Pattern copied to clipboard")}
                    className="h-7"
                  >
                    <Copy className="h-3 w-3 mr-1" /> Copy Pattern
                  </Button>
                </div>

                {isValid && pattern && (
                  <div className="border rounded-md p-4 overflow-auto">
                    {matches.length > 0 ? (
                      <div>
                        <div 
                          className="mb-4"
                          dangerouslySetInnerHTML={{ __html: highlightedText }}
                        ></div>
                        <Separator className="my-4" />
                        {matches.map((match, index) => (
                          <div key={index} className="mb-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium">
                                Match {index + 1} at position {match.index}
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(match.fullMatch, "Match copied to clipboard")}
                                className="h-7"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="font-mono bg-muted/50 p-2 rounded mt-2 break-all">
                              {match.fullMatch}
                            </div>
                            {match.groups.length > 0 && (
                              <div className="mt-2 space-y-2">
                                <h5 className="text-sm font-medium text-muted-foreground">
                                  Capturing Groups:
                                </h5>
                                {match.groups.map((group, groupIndex) => (
                                  <div key={groupIndex} className="ml-4 flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      Group {groupIndex + 1}:
                                    </span>
                                    <span className="font-mono bg-muted p-1 rounded text-sm">
                                      {group}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No matches found
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Save Pattern</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter a name for this regex"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                  />
                  <Button
                    onClick={saveRegex}
                    disabled={!pattern}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="h-5 w-5" /> Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-sm">{explainRegex()}</pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" /> Saved Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              {saved.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No saved patterns yet
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {saved.map((save) => (
                    <div
                      key={save.id}
                      className="p-3 border rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => loadSaved(save)}
                    >
                      <div className="flex justify-between">
                        <h4 className="font-medium">{save.name}</h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSaved(save.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-sm font-mono mt-1 truncate">
                        /{save.pattern}/{save.flags.global ? "g" : ""}
                        {save.flags.caseInsensitive ? "i" : ""}
                        {save.flags.multiline ? "m" : ""}
                        {save.flags.dotAll ? "s" : ""}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(save.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RegexTester;
