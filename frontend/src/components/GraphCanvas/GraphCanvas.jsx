import React, { useMemo, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import CustomNode from "./CustomNode";
import {
  Share2,
  Maximize2,
  Filter,
  Layers,
  ArrowRightLeft,
  CreditCard,
  Laptop,
  Flame,
  Globe,
  MapPin
} from "lucide-react";

const nodeTypes = {
  customNode: CustomNode
};

// Automatic layout positioning with Dagre
const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,
    ranksep: 90
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 170, height: 95 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 85,
        y: nodeWithPosition.y - 47
      }
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function GraphCanvas({
  subgraph,
  reasoningPath = [],
  selectedNode,
  onSelectNode,
  onSelectEdge
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Transform raw backend graph data into React Flow elements
  useEffect(() => {
    if (!subgraph || !subgraph.nodes || subgraph.nodes.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const reasoningSet = new Set(reasoningPath);

    // Build raw React Flow nodes
    const rawNodes = subgraph.nodes.map((n) => {
      const isPath = reasoningSet.has(n.id);
      return {
        id: n.id,
        type: "customNode",
        data: {
          ...n,
          isReasoningPath: isPath
        },
        position: { x: 0, y: 0 }
      };
    });

    // Check if edge connects two nodes on the reasoning path
    const isEdgeOnReasoningPath = (u, v) => {
      const idxU = reasoningPath.indexOf(u);
      const idxV = reasoningPath.indexOf(v);
      if (idxU !== -1 && idxV !== -1) {
        return Math.abs(idxU - idxV) === 1;
      }
      return false;
    };

    // Build raw React Flow edges
    const rawEdges = (subgraph.edges || []).map((e) => {
      const u = e.from;
      const v = e.to;
      const onPath = isEdgeOnReasoningPath(u, v);

      return {
        id: e.id || `e_${u}_${v}`,
        source: u,
        target: v,
        label: e.type,
        className: onPath ? "suspicious-edge" : "",
        animated: onPath,
        style: {
          stroke: onPath ? "#ef4444" : "#475569",
          strokeWidth: onPath ? 2.5 : 1.5
        },
        labelStyle: {
          fill: onPath ? "#fca5a5" : "#94a3b8",
          fontWeight: onPath ? 700 : 500,
          fontSize: 9,
          fontFamily: "monospace"
        },
        labelBgStyle: {
          fill: "rgba(10, 15, 25, 0.95)",
          fillOpacity: 0.95
        },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: onPath ? "#ef4444" : "#64748b"
        },
        data: e
      };
    });

    // Compute automatic layout (Left-to-Right gives an intuitive flow from Transaction -> Incident)
    const layouted = getLayoutedElements(rawNodes, rawEdges, "LR");
    setNodes(layouted.nodes);
    setEdges(layouted.edges);
  }, [subgraph, reasoningPath]);

  const handleNodeClick = useCallback(
    (_, node) => {
      if (onSelectNode) onSelectNode(node.data);
    },
    [onSelectNode]
  );

  const handleEdgeClick = useCallback(
    (_, edge) => {
      if (onSelectEdge) onSelectEdge(edge.data);
    },
    [onSelectEdge]
  );

  return (
    <div className="relative w-full h-[580px] rounded-xl overflow-hidden glass-panel border border-slate-800">
      {/* Top Header Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-center gap-2 backdrop-blur-md">
          <Share2 className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-100">
            Investigation Subgraph
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 font-bold">
            {nodes.length} Nodes
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-cyan-300 font-bold">
            {edges.length} Relationships
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400 pl-1.5 border-l border-slate-700">
            Cloud Graph: 28 Nodes • 35 Relationships
          </span>
        </div>

        {reasoningPath && reasoningPath.length > 0 && (
          <div className="px-2.5 py-1.5 rounded-lg bg-red-950/80 border border-red-800/80 text-xs font-mono text-red-300 flex items-center gap-1.5 backdrop-blur-md animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span>Fraud Syndicate Path Active</span>
          </div>
        )}
      </div>

      {/* Floating Bottom-Left Legend */}
      <div className="absolute bottom-3 left-3 z-10 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-mono backdrop-blur-md space-y-1 shadow-lg">
        <div className="text-slate-400 uppercase font-bold tracking-wider mb-1">
          Graph Legend
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-slate-300">Transaction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-slate-300">Account</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-300">Device</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-slate-300">Incident</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="text-slate-300">IP Address</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-slate-300">Customer</span>
          </div>
        </div>
      </div>

      {/* React Flow Core Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={2.0}
      >
        <Background color="#1e293b" gap={20} size={1} />
        <Controls className="!bottom-3 !right-3" />
        <MiniMap
          nodeColor={(node) => {
            if (node.data?.isReasoningPath) return "#ef4444";
            if (node.data?.label === "Transaction") return "#f43f5e";
            if (node.data?.label === "Account") return "#38bdf8";
            if (node.data?.label === "Device") return "#fbbf24";
            if (node.data?.label === "Incident") return "#dc2626";
            return "#475569";
          }}
          className="!bottom-14 !right-3"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
