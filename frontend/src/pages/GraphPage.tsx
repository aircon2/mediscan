import { useEffect, useRef } from "react";
import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";

type MockData = {
  medications: Record<
    string,
    {
      name: string;
      ingredients: string[];
      sideEffects: string[];
      symptomsTreated: string[];
    }
  >;
};

type LayoutAttributes = {
  highlighted?: boolean;
};

const GraphPage = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = new Graph();
    let renderer: Sigma | null = null;
    let layout: ForceSupervisor | null = null;
    let isMounted = true;

    const buildGraph = (data: MockData) => {
      const medication = data.medications.Tylenol;
      if (!medication) return;

      const centerId = medication.name;
      graph.addNode(centerId, {
        x: 0,
        y: 0,
        size: 16,
        color: "#F76B5B",
        label: medication.name,
      });

      const radius = 1;
      const angleStep =
        (Math.PI * 2) / Math.max(medication.ingredients.length, 1);

      medication.ingredients.forEach((ingredient, index) => {
        const angle = index * angleStep;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        graph.addNode(ingredient, {
          x,
          y,
          size: 9,
          color: chroma("#4A79F7").brighten(0.2).hex(),
          label: ingredient,
        });

        graph.addEdge(centerId, ingredient);
      });

      layout = new ForceSupervisor(graph, {
        isNodeFixed: (_: string, attr: LayoutAttributes) =>
          Boolean(attr.highlighted),
      });
      layout.start();

      renderer = new Sigma(graph, containerRef.current as HTMLDivElement, {
        minCameraRatio: 0.5,
        maxCameraRatio: 2,
      });

      let draggedNode: string | null = null;
      let isDragging = false;

      renderer.on("downNode", (e: { node: string }) => {
        isDragging = true;
        draggedNode = e.node;
        graph.setNodeAttribute(draggedNode, "highlighted", true);
        if (!renderer?.getCustomBBox())
          renderer?.setCustomBBox(renderer.getBBox());
      });

      renderer.on("moveBody", ({ event }: { event: any }) => {
        if (!isDragging || !draggedNode) return;

        const pos = renderer?.viewportToGraph(event);
        if (!pos) return;

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
    };

    fetch("/mock.json")
      .then((response) => response.json())
      .then((data: MockData) => {
        if (!isMounted) return;
        buildGraph(data);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
      renderer?.kill();
      layout?.kill();
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
