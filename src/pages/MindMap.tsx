
import { useState, useEffect, useRef } from "react";
import { Network, Plus, Trash2, Download, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface MindMapNode {
  id: string;
  text: string;
  parentId: string | null;
  x: number;
  y: number;
  color: string;
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 50;
const COLORS = [
  "#D6BCFA", // purple
  "#9BE8D8", // teal
  "#FEC6A1", // orange
  "#FEF7CD", // yellow
  "#D3E4FD", // blue
  "#FFDEE2", // pink
];

const MindMap = () => {
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const [newNodeText, setNewNodeText] = useState("");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Initialize with a root node if no nodes exist
  useEffect(() => {
    const savedNodes = getFromStorage<MindMapNode[]>("mindmap_nodes", []);
    
    if (savedNodes.length === 0) {
      const rootNode: MindMapNode = {
        id: "root",
        text: "Central Idea",
        parentId: null,
        x: 500,
        y: 300,
        color: COLORS[0],
      };
      setNodes([rootNode]);
      setSelectedNodeId("root");
    } else {
      setNodes(savedNodes);
    }
  }, []);

  useEffect(() => {
    saveToStorage("mindmap_nodes", nodes);
  }, [nodes]);

  const handleAddNode = () => {
    if (!selectedNodeId || !newNodeText.trim()) return;

    const selectedNode = nodes.find((node) => node.id === selectedNodeId);
    if (!selectedNode) return;

    // Find all existing children of the selected node
    const children = nodes.filter((node) => node.parentId === selectedNodeId);
    
    // Calculate position for the new node
    let offsetX = 0;
    let offsetY = 0;
    
    if (children.length === 0) {
      offsetX = 250;
      offsetY = 0;
    } else {
      // Position new node below existing children
      offsetX = 250;
      offsetY = (children.length * 100);
      
      // Alternate sides for better layout
      if (children.length % 2 === 1) {
        offsetY = -offsetY;
      }
    }

    const newNode: MindMapNode = {
      id: Date.now().toString(),
      text: newNodeText,
      parentId: selectedNodeId,
      x: selectedNode.x + offsetX,
      y: selectedNode.y + offsetY,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    };

    setNodes([...nodes, newNode]);
    setNewNodeText("");
    setIsAddingChild(false);
  };

  const handleDeleteNode = (nodeId: string) => {
    // Get all descendant nodes recursively
    const getDescendants = (id: string): string[] => {
      const children = nodes.filter((node) => node.parentId === id);
      return [
        id,
        ...children.flatMap((child) => getDescendants(child.id)),
      ];
    };

    const idsToDelete = getDescendants(nodeId);
    setNodes(nodes.filter((node) => !idsToDelete.includes(node.id)));
    
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleNodeClick = (node: MindMapNode, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedNodeId(node.id);
  };

  const handleEditNode = (id: string, newText: string) => {
    setNodes(
      nodes.map((node) =>
        node.id === id ? { ...node, text: newText } : node
      )
    );
  };

  const handleMouseDown = (node: MindMapNode, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!svgRef.current) return;
    
    // Get the SVG coordinates
    const svg = svgRef.current.getBoundingClientRect();
    const offsetX = event.clientX - svg.left;
    const offsetY = event.clientY - svg.top;
    
    // Calculate offset from the node position
    const dragOffsetX = offsetX - node.x;
    const dragOffsetY = offsetY - node.y;
    
    setIsDragging(true);
    setDragNodeId(node.id);
    setDragOffset({ x: dragOffsetX, y: dragOffsetY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !dragNodeId || !svgRef.current) return;
    
    // Get the SVG coordinates
    const svg = svgRef.current.getBoundingClientRect();
    const offsetX = event.clientX - svg.left;
    const offsetY = event.clientY - svg.top;
    
    // Update the node position
    setNodes(
      nodes.map((node) =>
        node.id === dragNodeId
          ? {
              ...node,
              x: offsetX - dragOffset.x,
              y: offsetY - dragOffset.y,
            }
          : node
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNodeId(null);
  };

  const exportMindMap = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "mindmap.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast.success("Mind map exported successfully");
    } catch (error) {
      toast.error("Failed to export mind map");
    }
  };

  const importMindMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    
    fileReader.onload = (e) => {
      try {
        if (!e.target || typeof e.target.result !== 'string') return;
        
        const importedNodes = JSON.parse(e.target.result) as MindMapNode[];
        setNodes(importedNodes);
        toast.success("Mind map imported successfully");
      } catch (error) {
        toast.error("Failed to import mind map: Invalid file format");
      }
    };
    
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0]);
    }
  };

  const renderConnections = () => {
    return nodes
      .filter((node) => node.parentId)
      .map((node) => {
        const parent = nodes.find((n) => n.id === node.parentId);
        if (!parent) return null;

        return (
          <line
            key={`connection-${node.id}`}
            x1={parent.x + NODE_WIDTH / 2}
            y1={parent.y + NODE_HEIGHT / 2}
            x2={node.x + NODE_WIDTH / 2}
            y2={node.y + NODE_HEIGHT / 2}
            stroke="#d0d0d0"
            strokeWidth={2}
            strokeDasharray={selectedNodeId === node.id || selectedNodeId === parent.id ? "5,5" : ""}
          />
        );
      });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mind Map Builder</h1>
          <p className="text-muted-foreground">Create visual mind maps for brainstorming</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={exportMindMap}
          >
            <Download className="h-4 w-4" /> Export
          </Button>
          
          <div className="relative">
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Import
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={importMindMap}
                accept=".json"
              />
            </Button>
          </div>
        </div>
      </div>

      <Card className="h-[75vh]">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" /> Mind Map Canvas
            </CardTitle>
            <div className="flex gap-2">
              {selectedNodeId && (
                <>
                  <Dialog open={isAddingChild} onOpenChange={setIsAddingChild}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add Child Node
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Child Node</DialogTitle>
                      </DialogHeader>
                      <div className="py-4">
                        <Input
                          placeholder="Node text"
                          value={newNodeText}
                          onChange={(e) => setNewNodeText(e.target.value)}
                          className="mb-4"
                        />
                        <Button onClick={handleAddNode}>Add Node</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {selectedNodeId !== "root" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteNode(selectedNodeId)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete Node
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden h-[calc(100%-60px)]">
          <div className="relative w-full h-full overflow-auto bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2UwZTBlMCIgb3BhY2l0eT0iMC4yIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] bg-repeat">
            <svg
              ref={svgRef}
              className="w-[2000px] h-[1200px]"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {/* Connections */}
              {renderConnections()}

              {/* Nodes */}
              {nodes.map((node) => (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => handleNodeClick(node, e)}
                  onMouseDown={(e) => handleMouseDown(node, e)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  {/* Node background */}
                  <rect
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    rx={6}
                    fill={node.color}
                    strokeWidth={selectedNodeId === node.id ? 2 : 1}
                    stroke={selectedNodeId === node.id ? "#000" : "#666"}
                    className="shadow-sm"
                  />
                  
                  {/* Editable text - for double-click */}
                  <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT}>
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      className="h-full flex items-center justify-center px-2"
                    >
                      <div
                        contentEditable={selectedNodeId === node.id}
                        suppressContentEditableWarning={true}
                        className={`w-full text-center outline-none ${
                          selectedNodeId === node.id ? "bg-white/30 rounded px-1" : ""
                        }`}
                        onBlur={(e) => handleEditNode(node.id, e.currentTarget.textContent || "")}
                      >
                        {node.text}
                      </div>
                    </div>
                  </foreignObject>
                </g>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MindMap;
