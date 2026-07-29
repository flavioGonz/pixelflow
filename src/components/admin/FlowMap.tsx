'use client';

import React, { useEffect, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    Position,
    MarkerType,
    Node,
    Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import { LayoutJSON } from '@/store/usePlayerStore';

// Dagre layouting
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 220;
const nodeHeight = 80;

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
    dagreGraph.setGraph({ rankdir: 'LR' }); // Left to Right

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = Position.Left;
        node.sourcePosition = Position.Right;

        // Shift slightly to center
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };
    });

    return { nodes, edges };
};

interface FlowMapProps {
    layouts: LayoutJSON[];
    onEditLayout: (layout: LayoutJSON) => void;
}

export function FlowMap({ layouts, onEditLayout }: FlowMapProps) {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        if (!layouts || layouts.length === 0) return;

        const initialNodes: Node[] = layouts.map(l => ({
            id: l._id || l.id,
            data: { label: l.name },
            position: { x: 0, y: 0 },
            style: {
                background: '#111',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '10px',
                fontSize: '12px',
                width: 200,
                textAlign: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
                fontWeight: 'bold',
                textTransform: 'uppercase'
            }
        }));

        const initialEdges: Edge[] = [];

        layouts.forEach(l => {
            const lid = l._id;
            if (!lid) return;
            l.widgets.forEach(w => {
                if (w.data?.targetLayoutId) {
                    // Check if target exists
                    if (layouts.find(t => t._id === w.data.targetLayoutId)) {
                        initialEdges.push({
                            id: `e-${lid}-${w.id}`,
                            source: lid,
                            target: w.data.targetLayoutId,
                            label: w.type === 'NAV_BUTTON' ? (w.data.label || 'LINK') : w.type,
                            animated: true,
                            style: { stroke: '#3b82f6' },
                            labelStyle: { fill: '#60a5fa', fontSize: 10, fontWeight: 700 },
                            markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
                        });
                    }
                }

                if (w.type === 'CATEGORY_NAV' && w.data?.categories) {
                    w.data.categories.forEach((cat: any) => {
                        if (cat.targetLayoutId && layouts.find(t => t._id === cat.targetLayoutId)) {
                            initialEdges.push({
                                id: `e-${lid}-${cat.id}`,
                                source: lid,
                                target: cat.targetLayoutId,
                                label: cat.label || 'Menu',
                                animated: true,
                                style: { stroke: '#10b981' }, // Green for menu
                                labelStyle: { fill: '#34d399', fontSize: 9, fontWeight: 700 },
                                markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
                            });
                        }
                    });
                }
            });
        });

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
            initialNodes,
            initialEdges
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);

    }, [layouts, setNodes, setEdges]);

    const onNodeClick = useCallback((event: any, node: Node) => {
        const layout = layouts.find(l => l._id === node.id);
        if (layout) {
            onEditLayout(layout);
        }
    }, [layouts, onEditLayout]);

    return (
        <div className="w-full h-full bg-[#050505] relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                fitView
                className="bg-[#050505]"
            >
                <Background color="#333" gap={20} size={1} />
                <Controls className="!bg-[#111] !border-white/10 !fill-white" />
            </ReactFlow>
            <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-md border border-white/10 text-[10px] text-neutral-400 font-mono pointer-events-none uppercase tracking-widest backdrop-blur-sm z-50">
                Clic para editar layout
            </div>
        </div>
    );
}
