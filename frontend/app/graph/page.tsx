"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import BackButton from "../components/BackButton";
import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";
import { getIngredient, getMedication } from "../../utils/api";
import type { Ingredient, Medication } from "../../types/graph";

type NodeType = "medication" | "ingredient";

type NodeAttributes = {
  label: string;
  color: string;
  size: number;
  nodeType: NodeType;
};

type LayoutAttributes = {
  highlighted?: boolean;
};

export default function GraphPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let graph: Graph | null = null;
    let renderer: Sigma | null = null;
    let layout: ForceSupervisor | null = null;
    let layoutStopId: number | null = null;
    let isMounted = true;
    let draggedNode: string | null = null;
    let isDragging = false;
    let centerNodeId: string | null = null;
    const graphBounds = {
      x: [-800, 800] as [number, number],
      y: [-800, 800] as [number, number],
    };
    const clamp = (value: number, min: number, max: number) =>
      Math.min(Math.max(value, min), max);

    const scheduleLayoutStop = (delayMs: number) => {
      if (layoutStopId !== null) {
        window.clearTimeout(layoutStopId);
      }
      layoutStopId = window.setTimeout(() => {
        layout?.stop();
        renderer?.refresh();
      }, delayMs);
    };

    const destroyGraph = () => {
      if (layoutStopId !== null) {
        window.clearTimeout(layoutStopId);
      }
      layoutStopId = null;
      renderer?.kill();
      layout?.kill();
      graph = null;
      renderer = null;
      layout = null;
      draggedNode = null;
      isDragging = false;
      centerNodeId = null;
    };

    const initGraph = () => {
      graph = new Graph();
      layout = new ForceSupervisor(graph, {
        isNodeFixed: (_: string, attr: LayoutAttributes) =>
          Boolean(attr.highlighted),
        settings: {
          attraction: 0.0003,
          repulsion: 0.4,
          gravity: 0.0001,
          inertia: 0.6,
          maxMove: 200,
        },
      });
      layout.stop();

      renderer = new Sigma(graph, containerRef.current as HTMLDivElement, {
        minCameraRatio: 0.5,
        maxCameraRatio: 2,
        autoRescale: false,
        defaultDrawNodeLabel: (context, data, settings) => {
          if (!data.label) return;
          const size = settings.labelSize;
          const font = settings.labelFont;
          const weight = settings.labelWeight;

          context.fillStyle = "#000";
          context.font = `${weight} ${size}px ${font}`;
          context.fillText(data.label, data.x, data.y + data.size + 12);
        },
      });

      renderer.on("downNode", (e: { node: string }) => {
        if (!graph) return;
        isDragging = true;
        draggedNode = e.node;
        graph.setNodeAttribute(draggedNode, "highlighted", true);
        layout?.start();
        scheduleLayoutStop(3000);
      });

      renderer.on("moveBody", ({ event }: { event: any }) => {
        if (!isDragging || !draggedNode || !graph || !renderer) return;

        const pos = renderer.viewportToGraph(event);
        if (!pos) return;

        const minX = graphBounds.x[0];
        const maxX = graphBounds.x[1];
        const minY = graphBounds.y[0];
        const maxY = graphBounds.y[1];
        const x = clamp(pos.x, minX, maxX);
        const y = clamp(pos.y, minY, maxY);

        graph.setNodeAttribute(draggedNode, "x", x);
        graph.setNodeAttribute(draggedNode, "y", y);

        event.preventSigmaDefault();
        event.original.preventDefault();
        event.original.stopPropagation();
      });

      const handleUp = () => {
        if (!graph) return;
        if (draggedNode) {
          graph.removeNodeAttribute(draggedNode, "highlighted");
        }
        isDragging = false;
        draggedNode = null;
        scheduleLayoutStop(1500);
      };

      renderer.on("upNode", handleUp);
      renderer.on("upStage", handleUp);

      renderer.on("clickNode", (e: { node: string }) => {
        if (isDragging || !graph) return;
        if (centerNodeId && e.node === centerNodeId) return;
        const attrs = graph.getNodeAttributes(e.node) as NodeAttributes;
        if (attrs?.nodeType === "ingredient") {
          void loadIngredient(e.node);
          return;
        }
        if (attrs?.nodeType === "medication") {
          void loadMedication(e.node);
        }
      });
    };

    const buildMedicationGraph = (medication: Medication) => {
      if (!graph) return;
      const g = graph;
      const centerId = medication.name;
      centerNodeId = centerId;
      g.addNode(centerId, {
        x: 0,
        y: 0,
        size: 12,
        color: "#F76B5B",
        label: medication.name,
        nodeType: "medication",
      } as NodeAttributes);

      const radius = 550;
      const angleStep =
        (Math.PI * 2) / Math.max(medication.ingredients.length, 1);

      medication.ingredients.forEach((ingredient, index) => {
        const angle = index * angleStep;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        g.addNode(ingredient, {
          x,
          y,
          size: 7,
          color: chroma("#4A79F7").brighten(0.2).hex(),
          label: ingredient,
          nodeType: "ingredient",
        } as NodeAttributes);

        g.addEdge(centerId, ingredient);
      });

      layout?.start();
      scheduleLayoutStop(2000);

      // Zoom in camera for better default view
      if (renderer) {
        renderer.getCamera().setState({ ratio: 0.6 });
      }
    };

    const buildIngredientGraph = (ingredient: Ingredient) => {
      if (!graph) return;
      const g = graph;
      const centerId = ingredient.name;
      centerNodeId = centerId;
      g.addNode(centerId, {
        x: 0,
        y: 0,
        size: 10,
        color: chroma("#4A79F7").brighten(0.2).hex(),
        label: ingredient.name,
        nodeType: "ingredient",
      } as NodeAttributes);

      const radius = 550;
      const angleStep =
        (Math.PI * 2) / Math.max(ingredient.medications.length, 1);

      ingredient.medications.forEach((medicationName, index) => {
        const angle = index * angleStep;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        g.addNode(medicationName, {
          x,
          y,
          size: 8,
          color: "#F76B5B",
          label: medicationName,
          nodeType: "medication",
        } as NodeAttributes);

        g.addEdge(centerId, medicationName);
      });

      layout?.start();
      scheduleLayoutStop(2000);

      // Zoom in camera for better default view
      if (renderer) {
        renderer.getCamera().setState({ ratio: 0.6 });
      }
    };

    const loadMedication = async (name: string) => {
      try {
        const medication = await getMedication(name);
        if (!isMounted) return;
        destroyGraph();
        initGraph();
        buildMedicationGraph(medication);
      } catch {
        return;
      }
    };

    const loadIngredient = async (name: string) => {
      try {
        const ingredient = await getIngredient(name);
        if (!isMounted) return;
        destroyGraph();
        initGraph();
        buildIngredientGraph(ingredient);
      } catch {
        return;
      }
    };

    void loadMedication("Tylenol");

    return () => {
      isMounted = false;
      destroyGraph();
    };
  }, []);

  return (
    <section className="flex flex-col h-screen bg-[#f7f2ea] relative">
      <BackButton />

      <div className="p-6 bg-white border-b border-gray-200">
        <h2 className="text-2xl font-semibold text-gray-900">
          Interactive Graph
        </h2>
        <p className="text-gray-600 mt-1">
          Click on nodes to explore medications and ingredients. Drag to
          reposition.
        </p>
      </div>
      <div
        ref={containerRef}
        className="flex-1 w-full"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(232, 111, 58, 0.18), transparent 55%), radial-gradient(circle at 20% 80%, rgba(58, 110, 232, 0.12), transparent 50%), #f7f2ea",
        }}
      />
    </section>
  );
}
