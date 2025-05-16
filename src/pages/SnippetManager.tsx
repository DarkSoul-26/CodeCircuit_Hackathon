
import { useState, useEffect } from "react";
import { FileCode, Search, Plus, Copy, Trash2, Check, Tag, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  tags: string[];
  createdAt: number;
}

const languages = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "bash", label: "Bash" },
  { value: "json", label: "JSON" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Plain Text" },
];

const SnippetManager = () => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [newSnippet, setNewSnippet] = useState<Partial<CodeSnippet>>({
    title: "",
    code: "",
    language: "javascript",
    tags: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [isAddingSnippet, setIsAddingSnippet] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [showCopied, setShowCopied] = useState<string | null>(null);

  useEffect(() => {
    const savedSnippets = getFromStorage<CodeSnippet[]>("code_snippets", []);
    setSnippets(savedSnippets);
  }, []);

  useEffect(() => {
    saveToStorage("code_snippets", snippets);
  }, [snippets]);

  const addSnippet = () => {
    if (!newSnippet.title || !newSnippet.code) return;

    const snippet: CodeSnippet = {
      id: Date.now().toString(),
      title: newSnippet.title,
      code: newSnippet.code,
      language: newSnippet.language || "javascript",
      tags: newSnippet.tags || [],
      createdAt: Date.now(),
    };

    setSnippets([snippet, ...snippets]);
    setNewSnippet({
      title: "",
      code: "",
      language: "javascript",
      tags: [],
    });
    setIsAddingSnippet(false);
    toast.success("Snippet added successfully");
  };

  const deleteSnippet = (id: string) => {
    setSnippets(snippets.filter((snippet) => snippet.id !== id));
    toast.success("Snippet deleted");
  };

  const addTagToSnippet = () => {
    if (!newTag.trim()) return;
    
    setNewSnippet({
      ...newSnippet,
      tags: [...(newSnippet.tags || []), newTag.trim()],
    });
    
    setNewTag("");
  };

  const removeTagFromSnippet = (tag: string) => {
    setNewSnippet({
      ...newSnippet,
      tags: (newSnippet.tags || []).filter((t) => t !== tag),
    });
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setShowCopied(id);
    setTimeout(() => setShowCopied(null), 2000);
    toast.success("Code copied to clipboard");
  };

  // Extract all unique tags from snippets
  const allTags = Array.from(
    new Set(snippets.flatMap((snippet) => snippet.tags))
  );

  // Filter snippets based on search term, language and tag
  const filteredSnippets = snippets.filter((snippet) => {
    const matchesSearch =
      searchTerm === "" ||
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLanguage =
      filterLanguage === "" || snippet.language === filterLanguage;

    const matchesTag =
      filterTag === "" || snippet.tags.includes(filterTag);

    return matchesSearch && matchesLanguage && matchesTag;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Snippet Manager</h1>
          <p className="text-muted-foreground">Organize and save code snippets</p>
        </div>
        <Dialog open={isAddingSnippet} onOpenChange={setIsAddingSnippet}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Snippet
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add New Code Snippet</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <Input
                    placeholder="Snippet Title"
                    value={newSnippet.title || ""}
                    onChange={(e) =>
                      setNewSnippet({ ...newSnippet, title: e.target.value })
                    }
                  />
                </div>
                <Select
                  value={newSnippet.language || "javascript"}
                  onValueChange={(value) =>
                    setNewSnippet({ ...newSnippet, language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((language) => (
                      <SelectItem key={language.value} value={language.value}>
                        {language.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Textarea
                  placeholder="Paste your code here..."
                  value={newSnippet.code || ""}
                  onChange={(e) =>
                    setNewSnippet({ ...newSnippet, code: e.target.value })
                  }
                  className="font-mono h-56"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newSnippet.tags?.map((tag) => (
                    <div
                      key={tag}
                      className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeTagFromSnippet(tag)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagToSnippet();
                      }
                    }}
                  />
                  <Button variant="outline" onClick={addTagToSnippet}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={addSnippet} disabled={!newSnippet.title || !newSnippet.code}>
                  Save Snippet
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="col-span-1 md:col-span-2 md:row-span-2">
          <CardHeader className="border-b">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search snippets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredSnippets.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                {snippets.length === 0 
                  ? "No snippets yet. Add your first snippet!" 
                  : "No matching snippets found"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredSnippets.map((snippet) => (
                  <div key={snippet.id} className="p-4">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{snippet.title}</h3>
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                          {languages.find((l) => l.value === snippet.language)?.label || snippet.language}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyToClipboard(snippet.code, snippet.id)}
                        >
                          {showCopied === snippet.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteSnippet(snippet.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="overflow-x-auto rounded-md bg-muted/50">
                      <pre className="p-3 text-sm font-mono">
                        {snippet.code}
                      </pre>
                    </div>
                    {snippet.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {snippet.tags.map((tag) => (
                          <div
                            key={tag}
                            className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded-md text-xs cursor-pointer hover:bg-secondary/80"
                            onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                          >
                            #{tag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">Language</label>
              <Select
                value={filterLanguage}
                onValueChange={setFilterLanguage}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Languages</SelectItem>
                  {languages.map((language) => (
                    <SelectItem key={language.value} value={language.value}>
                      {language.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium block mb-2">Tags</label>
              <Select
                value={filterTag}
                onValueChange={setFilterTag}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Tags</SelectItem>
                  {allTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      #{tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline"
              className="w-full"
              onClick={() => {
                setSearchTerm("");
                setFilterLanguage("");
                setFilterTag("");
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FolderPlus className="h-5 w-5" />
              Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Snippets</span>
                <span className="font-medium">{snippets.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Languages</span>
                <span className="font-medium">
                  {new Set(snippets.map((s) => s.language)).size}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tags</span>
                <span className="font-medium">{allTags.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SnippetManager;
