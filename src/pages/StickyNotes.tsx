
import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
}

const COLORS = [
  "#FEF7CD", // yellow
  "#F2FCE2", // green
  "#D3E4FD", // blue
  "#FFDEE2", // pink
  "#FDE1D3", // peach
  "#F1F0FB", // gray
];

const StickyNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteColor, setNewNoteColor] = useState(COLORS[0]);

  useEffect(() => {
    const savedNotes = getFromStorage<Note[]>("sticky_notes", []);
    setNotes(savedNotes);
  }, []);

  useEffect(() => {
    saveToStorage("sticky_notes", notes);
  }, [notes]);

  const addNote = () => {
    if (!newNoteTitle.trim() && !newNoteContent.trim()) return;

    const newNote: Note = {
      id: Date.now().toString(),
      title: newNoteTitle.trim() || "Untitled",
      content: newNoteContent,
      color: newNoteColor,
    };

    setNotes((prev) => [...prev, newNote]);
    setNewNoteTitle("");
    setNewNoteContent("");
    // Randomly choose next color
    setNewNoteColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  };

  const updateNote = (id: string, field: keyof Note, value: string) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, [field]: value } : note))
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Sticky Notes</h1>
        <p className="text-muted-foreground">Create and organize colorful notes</p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Input
              placeholder="Note title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
            />
            <Textarea
              placeholder="Note content..."
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={3}
            />
            <div className="flex flex-wrap gap-2 mb-4">
              {COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border hover:scale-110 transition-transform ${
                    color === newNoteColor ? "ring-2 ring-offset-2 ring-primary" : ""
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewNoteColor(color)}
                />
              ))}
            </div>
            <Button className="w-full" onClick={addNote}>
              <Plus className="mr-2 h-4 w-4" /> Add Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {notes.length === 0 ? (
        <div className="text-center p-8 border rounded-lg bg-muted/20">
          <p className="text-muted-foreground">No notes yet. Create your first note above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-md shadow-sm overflow-hidden border border-muted transition-all hover:shadow-md"
              style={{ backgroundColor: note.color }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <Input
                    value={note.title}
                    onChange={(e) => updateNote(note.id, "title", e.target.value)}
                    className="font-medium border-none bg-transparent focus-visible:ring-0 focus-visible:outline-dashed focus-visible:outline-1 px-0"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteNote(note.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={note.content}
                  onChange={(e) => updateNote(note.id, "content", e.target.value)}
                  className="min-h-[100px] border-none bg-transparent focus-visible:ring-0 focus-visible:outline-dashed focus-visible:outline-1 resize-none px-0"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StickyNotes;
