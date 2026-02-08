import { useEffect, useRef } from "react";
import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";
import { v4 as uuid } from "uuid";

type NodeAttributes = {
  x: number;
  y: number;
  size: number;
  color: string;
  highlighted?: boolean;
};

type ClosestNode = {
  nodeId: string;
  distance: number;
};

const GraphPage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph();
    graph.addNode("n1", { x: 0, y: 0, size: 10, color: chroma.random().hex() });
    graph.addNode("n2", {
      x: -5,
      y: 5,
      size: 10,
      color: chroma.random().hex(),
    });
    graph.addNode("n3", { x: 5, y: 5, size: 10, color: chroma.random().hex() });
    graph.addNode("n4", {
      x: 0,
      y: 10,
      size: 10,
      color: chroma.random().hex(),
    });
    graph.addEdge("n1", "n2");
    graph.addEdge("n2", "n4");
    graph.addEdge("n4", "n3");
    graph.addEdge("n3", "n1");

    const layout = new ForceSupervisor(graph, {
      isNodeFixed: (_: string, attr: { highlighted?: boolean }) =>
        Boolean(attr.highlighted),
    });
    layout.start();

    const renderer = new Sigma(graph, containerRef.current, {
      minCameraRatio: 0.5,
      maxCameraRatio: 2,
    });

    let draggedNode: string | null = null;
    let isDragging = false;

    renderer.on("downNode", (e: { node: string }) => {
      isDragging = true;
      draggedNode = e.node;
      graph.setNodeAttribute(draggedNode, "highlighted", true);
      if (!renderer.getCustomBBox()) renderer.setCustomBBox(renderer.getBBox());
    });

    renderer.on("moveBody", ({ event }: { event: any }) => {
      if (!isDragging || !draggedNode) return;

      const pos = renderer.viewportToGraph(event);
      graph.setNodeAttribute(draggedNode, "x", pos.x);
      graph.setNodeAttribute(draggedNode, "y", pos.y);

      event.preventSigmaDefault();
      event.original.preventDefault();
      event.original.stopPropagation();
    });

    const handleUp = () => {
      if (draggedNode) {
        graph.removeNodeAttribute(draggedNode, "highlighted");
      }
      isDragging = false;
      draggedNode = null;
    };

    renderer.on("upNode", handleUp);
    renderer.on("upStage", handleUp);

    renderer.on(
      "clickStage",
      ({ event }: { event: { x: number; y: number } }) => {
        const coordForGraph = renderer.viewportToGraph({
          x: event.x,
          y: event.y,
        });

        const node = {
          ...coordForGraph,
          size: 10,
          color: chroma.random().hex(),
        };

        const closestNodes: ClosestNode[] = graph
          .nodes()
          .map((nodeId: string) => {
            const attrs = graph.getNodeAttributes(nodeId) as NodeAttributes;
            const distance =
              Math.pow(node.x - attrs.x, 2) + Math.pow(node.y - attrs.y, 2);
            return { nodeId, distance };
          })
          .sort((a: ClosestNode, b: ClosestNode) => a.distance - b.distance)
          .slice(0, 2);

        const id = uuid();
        graph.addNode(id, node);

        closestNodes.forEach((e: ClosestNode) => graph.addEdge(id, e.nodeId));
      },
    );

    return () => {
      renderer.kill();
      layout.kill();
    };
  }, []);

  return (
    <section className="graph-page">
      <div className="graph-header">
        <h2>Interactive graph</h2>
        <p>Click the canvas to add nodes. Drag nodes to pin them in place.</p>
      </div>
      <div id="sigma-container" className="graph-canvas" ref={containerRef} />
    </section>
  );
};

export default GraphPage;
