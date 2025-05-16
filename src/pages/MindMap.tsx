import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Save, Download, Upload, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { saveToStorage, getFromStorage } from "@/lib/storage";

interface Node {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  parentId?: string;
}

interface Connection {
  source: string;
  target: string;
}

interface MindMap {
  id: string;
  name: string;
  nodes: Node[];
  connections: Connection[];
  createdAt: number;
}

const defaultColors = [
  "#f87171", // red
  "#fb923c", // orange
  "#fbbf24", // amber
  "#a3e635", // lime
  "#34d399", // emerald
  "#22d3ee", // cyan
  "#60a5fa", // blue
  "#818cf8", // indigo
  "#a78bfa", // violet
  "#e879f9", // fuchsia
];

const MindMap = () => {
  const [maps, setMaps] = useState<MindMap[]>([]);
  const [currentMap, setCurrentMap] = useState<MindMap | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNodeText, setNewNodeText] = useState("");
  const [newNodeColor, setNewNodeColor] = useState(defaultColors[0]);
  const [newMapName, setNewMapName] = useState("");
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [viewSettings, setViewSettings] = useState({
    showGrid: true,
    snapToGrid: true,
    gridSize: 20,
    zoomLevel: 1,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const savedMaps = getFromStorage<MindMap[]>("mind_maps", []);
    setMaps(savedMaps);

    if (savedMaps.length > 0) {
      setCurrentMap(savedMaps[0]);
    }
  }, []);

  useEffect(() => {
    if (maps.length > 0) {
      saveToStorage("mind_maps", maps);
    }
  }, [maps]);

  const createNewMap = () => {
    if (!newMapName.trim()) return;

    const newMap: MindMap = {
      id: Date.now().toString(),
      name: newMapName,
      nodes: [
        {
          id: "root",
          text: "Central Idea",
          x: 400,
          y: 300,
          color: defaultColors[0],
        },
      ],
      connections: [],
      createdAt: Date.now(),
    };

    setMaps([...maps, newMap]);
    setCurrentMap(newMap);
    setNewMapName("");
    setIsCreatingMap(false);
  };

  const deleteMap = (id: string) => {
    const updatedMaps = maps.filter((map) => map.id !== id);
    setMaps(updatedMaps);

    if (currentMap?.id === id) {
      setCurrentMap(updatedMaps.length > 0 ? updatedMaps[0] : null);
    }
  };

  const addNode = () => {
    if (!currentMap || !selectedNode || !newNodeText.trim()) return;

    const parentNode = currentMap.nodes.find((node) => node.id === selectedNode);
    if (!parentNode) return;

    // Calculate position for new node
    const angle = Math.random() * Math.PI * 2;
    const distance = 150;
    const x = parentNode.x + Math.cos(angle) * distance;
    const y = parentNode.y + Math.sin(angle) * distance;

    const newNode: Node = {
      id: Date.now().toString(),
      text: newNodeText,
      x,
      y,
      color: newNodeColor,
      parentId: selectedNode,
    };

    const newConnection: Connection = {
      source: selectedNode,
      target: newNode.id,
    };

    const updatedMap = {
      ...currentMap,
      nodes: [...currentMap.nodes, newNode],
      connections: [...currentMap.connections, newConnection],
    };

    updateMap(updatedMap);
    setNewNodeText("");
    setIsAddingNode(false);
  };

  const deleteNode = (id: string) => {
    if (!currentMap) return;

    // Don't delete the root node
    if (id === "root") return;

    // Remove the node and all its connections
    const updatedNodes = currentMap.nodes.filter((node) => node.id !== id);
    const updatedConnections = currentMap.connections.filter(
      (conn) => conn.source !== id && conn.target !== id
    );

    const updatedMap = {
      ...currentMap,
      nodes: updatedNodes,
      connections: updatedConnections,
    };

    updateMap(updatedMap);
    if (selectedNode === id) {
      setSelectedNode(null);
    }
  };

  const updateNodeText = (id: string, text: string) => {
    if (!currentMap) return;

    const updatedNodes = currentMap.nodes.map((node) =>
      node.id === id ? { ...node, text } : node
    );

    const updatedMap = {
      ...currentMap,
      nodes: updatedNodes,
    };

    updateMap(updatedMap);
  };

  const updateMap = (updatedMap: MindMap) => {
    setCurrentMap(updatedMap);
    setMaps(maps.map((map) => (map.id === updatedMap.id ? updatedMap : map)));
  };

  const handleNodeMouseDown = (
    e: React.MouseEvent<SVGGElement>,
    nodeId: string
  ) => {
    if (!currentMap) return;

    const node = currentMap.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setIsDragging(true);
    setDraggedNodeId(nodeId);

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    const offsetX = e.clientX - svgRect.left - node.x;
    const offsetY = e.clientY - svgRect.top - node.y;
    setDragOffset({ x: offsetX, y: offsetY });

    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging || !draggedNodeId || !currentMap) return;

    const svgRect = svgRef.current?.getBoundingClientRect();
    if (!svgRect) return;

    let newX = e.clientX - svgRect.left - dragOffset.x;
    let newY = e.clientY - svgRect.top - dragOffset.y;

    // Snap to grid if enabled
    if (viewSettings.snapToGrid) {
      newX = Math.round(newX / viewSettings.gridSize) * viewSettings.gridSize;
      newY = Math.round(newY / viewSettings.gridSize) * viewSettings.gridSize;
    }

    const updatedNodes = currentMap.nodes.map((node) =>
      node.id === draggedNodeId ? { ...node, x: newX, y: newY } : node
    );

    const updatedMap = {
      ...currentMap,
      nodes: updatedNodes,
    };

    setCurrentMap(updatedMap);
  };

  const handleMouseUp = () => {
    if (isDragging && currentMap) {
      // Save the updated map
      setMaps(maps.map((map) => (map.id === currentMap.id ? currentMap : map)));
    }
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  const exportMap = () => {
    if (!currentMap) return;

    const dataStr = JSON.stringify(currentMap);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;

    const exportFileDefaultName = `${currentMap.name.replace(/\s+/g, "_")}_mindmap.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const importMap = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedMap = JSON.parse(event.target?.result as string) as MindMap;
        
        // Validate the imported data
        if (!importedMap.id || !importedMap.name || !Array.isArray(importedMap.nodes)) {
          throw new Error("Invalid mind map data");
        }
        
        // Check if a map with the same ID already exists
        const existingMapIndex = maps.findIndex((map) => map.id === importedMap.id);
        
        if (existingMapIndex >= 0) {
          // Update existing map
          const updatedMaps = [...maps];
          updatedMaps[existingMapIndex] = importedMap;
          setMaps(updatedMaps);
        } else {
          // Add as a new map
          setMaps([...maps, importedMap]);
        }
        
        setCurrentMap(importedMap);
      } catch (error) {
        console.error("Error importing mind map:", error);
        alert("Failed to import mind map. The file may be corrupted or in the wrong format.");
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    e.target.value = "";
  };

  const renderGrid = () => {
    if (!viewSettings.showGrid) return null;

    const gridSize = viewSettings.gridSize;
    const width = 800;
    const height = 600;

    const horizontalLines = [];
    const verticalLines = [];

    for (let i = 0; i <= width; i += gridSize) {
      verticalLines.push(
        <line
          key={`v-${i}`}
          x1={i}
          y1={0}
          x2={i}
          y2={height}
          stroke="#ddd"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      );
    }

    for (let i = 0; i <= height; i += gridSize) {
      horizontalLines.push(
        <line
          key={`h-${i}`}
          x1={0}
          y1={i}
          x2={width}
          y2={i}
          stroke="#ddd"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      );
    }

    return (
      <g className="grid">
        {horizontalLines}
        {verticalLines}
      </g>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Mind Map</h1>
          <p className="text-muted-foreground">Visualize your ideas and concepts</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Dialog open={isCreatingMap} onOpenChange={setIsCreatingMap}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" /> New Map
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Mind Map</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <Input
                  placeholder="Mind Map Name"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={createNewMap} disabled={!newMapName.trim()}>
                  Create
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" onClick={exportMap} disabled={!currentMap}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>

          <div className="relative">
            <Input
              type="file"
              accept=".json"
              onChange={importMap}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" /> Import
            </Button>
          </div>

          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" /> Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>View Settings</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-grid">Show Grid</Label>
                  <Switch
                    id="show-grid"
                    checked={viewSettings.showGrid}
                    onCheckedChange={(checked) =>
                      setViewSettings({ ...viewSettings, showGrid: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="snap-grid">Snap to Grid</Label>
                  <Switch
                    id="snap-grid"
                    checked={viewSettings.snapToGrid}
                    onCheckedChange={(checked) =>
                      setViewSettings({ ...viewSettings, snapToGrid: checked })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Grid Size</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[viewSettings.gridSize]}
                      min={10}
                      max={50}
                      step={5}
                      onValueChange={(value) =>
                        setViewSettings({ ...viewSettings, gridSize: value[0] })
                      }
                    />
                    <span className="w-12 text-right">{viewSettings.gridSize}px</span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Your Mind Maps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {maps.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No mind maps yet. Create your first one!
              </p>
            ) : (
              maps.map((map) => (
                <div
                  key={map.id}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                    currentMap?.id === map.id
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setCurrentMap(map)}
                >
                  <span className="font-medium truncate">{map.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMap(map.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span>{currentMap?.name || "Select a Mind Map"}</span>
              {currentMap && selectedNode && (
                <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-4 w-4" /> Add Node
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Node</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Input
                        placeholder="Node Text"
                        value={newNodeText}
                        onChange={(e) => setNewNodeText(e.target.value)}
                      />
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {defaultColors.map((color) => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full ${
                                newNodeColor === color
                                  ? "ring-2 ring-offset-2 ring-primary"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => setNewNodeColor(color)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={addNode} disabled={!newNodeText.trim()}>
                        Add
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!currentMap ? (
              <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                Select a mind map or create a new one
              </div>
            ) : (
              <svg
                ref={svgRef}
                width="100%"
                height="600"
                className="bg-white"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {renderGrid()}

                {/* Connections */}
                <g className="connections">
                  {currentMap.connections.map((conn) => {
                    const source = currentMap.nodes.find(
                      (node) => node.id === conn.source
                    );
                    const target = currentMap.nodes.find(
                      (node) => node.id === conn.target
                    );

                    if (!source || !target) return null;

                    return (
                      <line
                        key={`${conn.source}-${conn.target}`}
                        x1={source.x}
                        y1={source.y}
                        x2={target.x}
                        y2={target.y}
                        stroke="#888"
                        strokeWidth="2"
                      />
                    );
                  })}
                </g>

                {/* Nodes */}
                <g className="nodes">
                  {currentMap.nodes.map((node) => (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                      className="cursor-grab active:cursor-grabbing"
                    >
                      <circle
                        r={node.id === "root" ? 50 : 40}
                        fill={node.color}
                        opacity={0.8}
                        className={
                          selectedNode === node.id
                            ? "stroke-2 stroke-primary"
                            : ""
                        }
                      />
                      <foreignObject
                        x={-40}
                        y={-20}
                        width="80"
                        height="40"
                        className="overflow-visible"
                      >
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center text-sm font-medium px-1">
                            {node.text}
                          </div>
                        </div>
                      </foreignObject>
                      {selectedNode === node.id && node.id !== "root" && (
                        <g
                          className="cursor-pointer"
                          onClick={() => deleteNode(node.id)}
                          transform="translate(30, -30)"
                        >
                          <circle r="10" fill="white" />
                          <text
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="red"
                            fontSize="14"
                          >
                            ×
                          </text>
                        </g>
                      )}
                    </g>
                  ))}
                </g>
              </svg>
            )}
          </CardContent>
        </Card>

        {selectedNode && currentMap && (
          <Card className="md:col-span-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Edit Node</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedNode(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {currentMap.nodes
                  .filter((node) => node.id === selectedNode)
                  .map((node) => (
                    <div key={node.id} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Text
                        </label>
                        <Input
                          value={node.text}
                          onChange={(e) =>
                            updateNodeText(node.id, e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium block mb-2">
                          Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {defaultColors.map((color) => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded-full ${
                                node.color === color
                                  ? "ring-2 ring-offset-2 ring-primary"
                                  : ""
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                const updatedNodes = currentMap.nodes.map((n) =>
                                  n.id === node.id ? { ...n, color } : n
                                );
                                updateMap({
                                  ...currentMap,
                                  nodes: updatedNodes,
                                });
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      {node.id !== "root" && (
                        <Button
                          variant="destructive"
                          onClick={() => deleteNode(node.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Node
                        </Button>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MindMap;
