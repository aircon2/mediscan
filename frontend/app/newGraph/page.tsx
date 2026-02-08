"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import BackButton from "../components/BackButton";
import chroma from "chroma-js";
import Graph from "graphology";
import ForceSupervisor from "graphology-layout-force/worker";
import Sigma from "sigma";
import { getIngredient, getMedication, getEffect } from "../../utils/api";
import type { Ingredient, Medication, Effect } from "../../types/graph";

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

export default function NewGraphPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const searchParams = useSearchParams();
  const effect = searchParams.get("effect");
  const [effectData, setEffectData] = useState<Effect | null>(null);
  const [selectedMedication, setSelectedMedication] =
    useState<Medication | null>(null);
  const [selectedIngredient, setSelectedIngredient] =
    useState<Ingredient | null>(null);

  // Load effect by name
  const loadEffect = async (effectName: string) => {
    try {
      const data = await getEffect(effectName);
      setEffectData(data);
      setSelectedMedication(null);
      setSelectedIngredient(null);
    } catch (error) {
      console.error("Error fetching effect:", error);
    }
  };

  // Fetch effect data
  useEffect(() => {
    if (!effect) return;

    const fetchEffect = async () => {
      try {
        const data = await getEffect(effect);
        setEffectData(data);
        setSelectedMedication(null); // Reset when effect changes
        setSelectedIngredient(null);
      } catch (error) {
        console.error("Error fetching effect:", error);
      }
    };

    fetchEffect();
  }, [effect]);

  useEffect(() => {
    if (!containerRef.current || !effectData) return;

    let graph: Graph | null = null;
    let renderer: Sigma | null = null;
    let layout: ForceSupervisor | null = null;
    let layoutStopId: number | null = null;
    let renderIntervalId: number | null = null;
    let isMounted = true;
    let draggedNode: string | null = null;
    let isDragging = false;
    let centerNodeId: string | null = null;

    const startRendering = () => {
      if (renderIntervalId !== null) return;
      renderIntervalId = window.setInterval(() => {
        renderer?.refresh();
      }, 16); // ~60fps
    };

    const stopRendering = () => {
      if (renderIntervalId !== null) {
        window.clearInterval(renderIntervalId);
        renderIntervalId = null;
      }
    };

    const scheduleLayoutStop = (delayMs: number) => {
      if (layoutStopId !== null) {
        window.clearTimeout(layoutStopId);
      }
      layoutStopId = window.setTimeout(() => {
        layout?.stop();
        stopRendering();
        renderer?.refresh();
      }, delayMs);
    };

    const destroyGraph = () => {
      if (layoutStopId !== null) {
        window.clearTimeout(layoutStopId);
      }
      stopRendering();
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
          attraction: 0.0005,
          repulsion: 5,
          gravity: 0.001,
          inertia: 0.3,
          maxMove: 400,
        },
      });
      layout.stop();

      renderer = new Sigma(graph, containerRef.current as HTMLDivElement, {
        minCameraRatio: 0.5,
        maxCameraRatio: 2,
        autoRescale: true,
        defaultDrawNodeLabel: (context, data, settings) => {
          if (!data.label) return;
          const size = settings.labelSize;
          const weight = settings.labelWeight;

          context.fillStyle = "#000";
          context.font = `${weight} ${size}px "Space Grotesk", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          context.fillText(data.label, data.x, data.y + data.size + 12);
        },
      });

      renderer.on("downNode", (e: { node: string }) => {
        if (!graph) return;
        isDragging = true;
        draggedNode = e.node;
        graph.setNodeAttribute(draggedNode, "highlighted", true);
        layout?.start();
        startRendering();
        scheduleLayoutStop(5000);
      });

      renderer.on("moveBody", ({ event }: { event: any }) => {
        if (!isDragging || !draggedNode || !graph || !renderer) return;

        const pos = renderer.viewportToGraph(event);
        if (!pos) return;

        graph.setNodeAttribute(draggedNode, "x", pos.x);
        graph.setNodeAttribute(draggedNode, "y", pos.y);

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
        scheduleLayoutStop(3000);
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

    const buildEffectGraph = (effectInfo: Effect) => {
      if (!graph) return;
      const g = graph;
      const centerId = effectInfo.name;
      centerNodeId = centerId;
      g.addNode(centerId, {
        x: 0,
        y: 0,
        size: 12,
        color: "#A0522D",
        label: effectInfo.name,
        nodeType: "medication",
      } as NodeAttributes);

      const medicationMap = new Map<
        string,
        { name: string; type: "causing" | "treating" }
      >();

      effectInfo.medicationsCausingIt.forEach((med) => {
        const key = med.trim().toLowerCase();
        if (!key) return;
        if (!medicationMap.has(key)) {
          medicationMap.set(key, { name: med, type: "causing" });
        }
      });

      effectInfo.medicationsTreatingIt.forEach((med) => {
        const key = med.trim().toLowerCase();
        if (!key) return;
        medicationMap.set(key, { name: med, type: "treating" });
      });

      const allMedications = Array.from(medicationMap.values());

      allMedications.forEach((medication) => {
        // Start all nodes at center with small random offset for animation
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;

        // Only add the node if it doesn't already exist
        if (!g.hasNode(medication.name)) {
          g.addNode(medication.name, {
            x,
            y,
            size: 8,
            color: medication.type === "causing" ? "#EF4444" : "#10B981",
            label: medication.name,
            nodeType: "medication",
          } as NodeAttributes);
        }

        // Only add the edge if it doesn't already exist
        if (!g.hasEdge(centerId, medication.name)) {
          g.addEdge(centerId, medication.name, { color: "#777777" });
        }
      });

      layout?.start();
      startRendering();
      scheduleLayoutStop(4000);
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
        color: "#A855F7",
        label: medication.name,
        nodeType: "medication",
      } as NodeAttributes);

      medication.ingredients.forEach((ingredient) => {
        // Start all nodes at center with small random offset
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;

        g.addNode(ingredient, {
          x,
          y,
          size: 7,
          color: "#3B82F6",
          label: ingredient,
          nodeType: "ingredient",
        } as NodeAttributes);

        g.addEdge(centerId, ingredient, { color: "#777777" });
      });

      layout?.start();
      startRendering();
      scheduleLayoutStop(4000);
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
        color: "#3B82F6",
        label: ingredient.name,
        nodeType: "ingredient",
      } as NodeAttributes);

      ingredient.medications.forEach((medicationName) => {
        // Start all nodes at center with small random offset
        const x = (Math.random() - 0.5) * 50;
        const y = (Math.random() - 0.5) * 50;

        g.addNode(medicationName, {
          x,
          y,
          size: 8,
          color: "#A855F7",
          label: medicationName,
          nodeType: "medication",
        } as NodeAttributes);

        g.addEdge(centerId, medicationName, { color: "#777777" });
      });

      layout?.start();
      startRendering();
      scheduleLayoutStop(4000);
    };

    const loadMedication = async (name: string) => {
      try {
        const medication = await getMedication(name);
        if (!isMounted) return;
        setSelectedMedication(medication);
        setSelectedIngredient(null);
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
        setSelectedIngredient(ingredient);
        setSelectedMedication(null);
        destroyGraph();
        initGraph();
        buildIngredientGraph(ingredient);
      } catch {
        return;
      }
    };

    // Load effect graph
    if (effectData) {
      destroyGraph();
      initGraph();
      buildEffectGraph(effectData);
    }

    return () => {
      isMounted = false;
      destroyGraph();
    };
  }, [effectData]);

  return (
    <div className="relative flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-purple-50 font-sans overflow-hidden">
      {/* Gradient Blur Circles */}
      <div className="absolute -top-20 -right-20 w-96 h-96 opacity-30 bg-gradient-to-bl from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 opacity-30 bg-gradient-to-tr from-blue-700 to-blue-700/0 rounded-full blur-3xl pointer-events-none"></div>

      <BackButton />

      {/* Legend */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {effectData && !selectedMedication && !selectedIngredient ? (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#A0522D" }}
              ></div>
              <span className="text-xs text-blue-600">Effect</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#10B981" }}
              ></div>
              <span className="text-xs text-blue-600">Treats</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#EF4444" }}
              ></div>
              <span className="text-xs text-blue-600">Causes</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#A855F7" }}
              ></div>
              <span className="text-xs text-blue-600">Medications</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#3B82F6" }}
              ></div>
              <span className="text-xs text-blue-600">Ingredients</span>
            </div>
          </>
        )}
      </div>

      {/* Graph Area - Top 60% */}
      <div ref={containerRef} className="h-[60vh] relative z-10"></div>

      {/* Effect Details - Bottom 40% */}
      <div className="flex-1 px-6 py-4 relative z-10 overflow-hidden">
        {selectedIngredient ? (
          <motion.div
            key={selectedIngredient.name}
            className="max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-4xl font-bold text-blue-500 mb-4">
              {selectedIngredient.name}
            </h2>
            {selectedIngredient.description && (
              <p className="text-blue-500 text-base leading-relaxed mb-4">
                {selectedIngredient.description}
              </p>
            )}
            {selectedIngredient.medications.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-blue-500 mb-2">
                  Found in Medications:
                </h3>
                <p className="text-blue-500 text-base leading-relaxed">
                  {selectedIngredient.medications.join(", ")}
                </p>
              </div>
            )}
          </motion.div>
        ) : selectedMedication ? (
          <motion.div
            key={selectedMedication.name}
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="text-5xl font-bold text-purple-500 mb-6">
              {selectedMedication.name}
            </h2>

            {selectedMedication.symptomsTreated.length > 0 && (
              <div className="mb-2">
                <h3 className="text-2xl font-semibold text-green-600 mb-2">
                  Treats
                </h3>
                <div className="flex flex-wrap gap-3">
                  {selectedMedication.symptomsTreated.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => loadEffect(symptom)}
                      className="px-3 py-1 text-blue-500 bg-blue-50 rounded-full shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:scale-[0.98] active:shadow-[0.3rem_0.3rem_0.5rem_0_rgb(225,226,228),-0.3rem_-0.3rem_0.5rem_0_rgb(255,255,255)] transition-all duration-200 cursor-pointer font-medium"
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMedication.sideEffects.length > 0 && (
              <div>
                <h3 className="text-2xl font-semibold text-red-600 mb-3">
                  Causes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedMedication.sideEffects.map((effect) => (
                    <button
                      key={effect}
                      onClick={() => loadEffect(effect)}
                      className="px-3 py-1 text-blue-500 bg-blue-50 rounded-full shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:shadow-[0.625rem_0.625rem_0.875rem_0_rgb(225,226,228),-0.5rem_-0.5rem_1.125rem_0_rgb(255,255,255)] hover:scale-[0.98] active:shadow-[0.3rem_0.3rem_0.5rem_0_rgb(225,226,228),-0.3rem_-0.3rem_0.5rem_0_rgb(255,255,255)] transition-all duration-200 cursor-pointer font-medium"
                    >
                      {effect}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : effectData ? (
          <motion.div
            key={effectData.name}
            className="max-w-md"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2
              className="text-4xl font-bold mb-4"
              style={{ color: "#A0522D" }}
            >
              {effectData.name}
            </h2>
            <p
              className="text-base leading-relaxed"
              style={{ color: "#A0522D" }}
            >
              {effectData.description}
            </p>
          </motion.div>
        ) : null}
      </div>
    </div>
  );
}
