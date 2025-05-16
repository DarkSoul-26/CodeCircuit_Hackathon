
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, BookOpen, Edit, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface MarkdownNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

const MarkdownNotes = () => {
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editableNote, setEditableNote] = useState<MarkdownNote | null>(null);
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  useEffect(() => {
    const savedNotes = getFromStorage<MarkdownNote[]>("markdown_notes", []);
    setNotes(savedNotes);
    if (savedNotes.length > 0) {
      setActiveNoteId(savedNotes[0].id);
      setEditableNote(savedNotes[0]);
    }
  }, []);

  useEffect(() => {
    saveToStorage("markdown_notes", notes);
  }, [notes]);

  const createNewNote = () => {
    const newNote: MarkdownNote = {
      id: Date.now().toString(),
      title: "Untitled Note",
      content: "",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setEditableNote(newNote);
    setActiveTab("write");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
    if (activeNoteId === id) {
      const remainingNotes = notes.filter((note) => note.id !== id);
      if (remainingNotes.length > 0) {
        setActiveNoteId(remainingNotes[0].id);
        setEditableNote(remainingNotes[0]);
      } else {
        setActiveNoteId(null);
        setEditableNote(null);
      }
    }
  };

  const saveNote = () => {
    if (!editableNote) return;

    setNotes((prev) =>
      prev.map((note) =>
        note.id === editableNote.id
          ? { ...editableNote, updatedAt: Date.now() }
          : note
      )
    );
  };

  const selectNote = (id: string) => {
    const note = notes.find((note) => note.id === id);
    if (note) {
      setActiveNoteId(id);
      setEditableNote(note);
    }
  };

  const handleTitleChange = (value: string) => {
    if (editableNote) {
      setEditableNote({ ...editableNote, title: value });
    }
  };

  const handleContentChange = (value: string) => {
    if (editableNote) {
      setEditableNote({ ...editableNote, content: value });
    }
  };

  const activeNote = notes.find((note) => note.id === activeNoteId);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const countCharacters = (text: string) => {
    return text.length;
  };

  const renderMarkdown = (markdown: string) => {
    // Simple markdown renderer
    // Normally we'd use a library like marked or remark
    let html = markdown;

    // Headers
    html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
    html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold mt-3 mb-1">$1</h2>');
    html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-bold mt-2 mb-1">$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');

    // Lists
    html = html.replace(/^\s*\* (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\s*- (.*$)/gm, '<li>$1</li>');
    html = html.replace(/^\s*\d\. (.*$)/gm, '<li>$1</li>');

    // Wrap lists
    html = html.replace(/(<li>.*<\/li>)/gs, '<ul class="ml-5 list-disc my-2">$1</ul>');

    // Paragraphs
    html = html.replace(/^(?!<[uh]|<li|<ul|<ol)(.+)$/gm, '<p class="my-2">$1</p>');

    // Links
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a class="text-primary hover:underline" href="$2">$1</a>'
    );

    // Code blocks
    html = html.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-muted p-2 rounded my-2 overflow-x-auto"><code>$1</code></pre>'
    );

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded">$1</code>');

    // Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Markdown Notes</h1>
        <p className="text-muted-foreground">Take formatted notes with live preview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="col-span-1 md:h-[75vh]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" /> Notes
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={createNewNote}>
              <Plus className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="overflow-auto pb-0 h-[calc(100%-60px)]">
            {notes.length === 0 ? (
              <div className="text-center p-4">
                <p className="text-muted-foreground">No notes yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-1 pr-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-2 rounded-md cursor-pointer flex justify-between items-center ${
                      activeNoteId === note.id
                        ? "bg-primary/10 border-l-2 border-primary"
                        : "hover:bg-secondary"
                    }`}
                    onClick={() => selectNote(note.id)}
                  >
                    <div className="truncate">
                      <div className="font-medium truncate">{note.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(note.updatedAt)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNote(note.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-3 md:h-[75vh]">
          {editableNote ? (
            <div className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex flex-col space-y-2">
                  <Input
                    value={editableNote.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    className="font-medium text-lg focus-visible:ring-1"
                    placeholder="Note title"
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-muted-foreground">
                      Last updated: {formatDate(editableNote.updatedAt)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {countWords(editableNote.content)} words | {countCharacters(editableNote.content)} characters
                    </div>
                  </div>
                </div>
              </CardHeader>
              <Tabs
                defaultValue="write"
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as "write" | "preview")}
                className="flex-1 flex flex-col"
              >
                <div className="border-b px-4">
                  <TabsList className="w-auto -mb-px border-b-0">
                    <TabsTrigger value="write" className="flex items-center gap-1">
                      <Edit className="h-4 w-4" /> Write
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" /> Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
                <div className="flex-1 overflow-auto px-4">
                  <TabsContent value="write" className="mt-0 h-full">
                    <Textarea
                      value={editableNote.content}
                      onChange={(e) => handleContentChange(e.target.value)}
                      placeholder="Start typing your markdown content here..."
                      className="h-full min-h-[calc(100%-30px)] resize-none border-0 focus-visible:ring-0 p-4"
                    />
                  </TabsContent>
                  <TabsContent value="preview" className="mt-0 h-full">
                    <div
                      className="markdown-content p-4 prose prose-sm max-w-none h-full overflow-auto"
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(editableNote.content),
                      }}
                    ></div>
                  </TabsContent>
                </div>
              </Tabs>
              <div className="p-4 border-t">
                <Button onClick={saveNote} className="w-full sm:w-auto">
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-4">
                <p className="text-muted-foreground mb-4">No note selected or create a new note to get started.</p>
                <Button onClick={createNewNote}>
                  <Plus className="h-4 w-4 mr-2" /> Create New Note
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MarkdownNotes;
