import { useEffect } from "react";
import { useDrawingStore } from "../store/useDrawingStore";
import { useMapStore } from "../store/useMapStore";
import { ShapeManager } from "../lib/shapes/ShapeManager";

import { useRectangleTool } from "./useRectangleTool";
import { useCircleTool } from "./useCircleTool";
import { useArrowTool } from "./useArrowTool";
import { useTextTool } from "./useTextTool";
import { usePolylineTool } from "./usePolylineTool";
import { useCurveTool } from "./useCurveTool";
import { useSelectTool } from "./useSelectTool";
import { usePresentationStore } from "@/store/usePresentationStore";

export const useMapDrawingTools = () => {
  const { activeTool } = useDrawingStore();
  const { isPresenting } = usePresentationStore();
  const { map, shapeManager, setShapeManager } = useMapStore();

  useEffect(() => {
    if (map && !shapeManager) {
      const manager = new ShapeManager(map);
      setShapeManager(manager);
    }
  }, [map, shapeManager, setShapeManager]);

  const toolEnabled = !isPresenting;

  useRectangleTool(
    map,
    shapeManager,
    toolEnabled && activeTool === "rectangle"
  );
  useCircleTool(map, shapeManager, toolEnabled && activeTool === "circle");
  useArrowTool(map, shapeManager, toolEnabled && activeTool === "arrow");
  useTextTool(map, shapeManager, toolEnabled && activeTool === "text");
  usePolylineTool(map, shapeManager, toolEnabled && activeTool === "polyline");
  useCurveTool(map, shapeManager, toolEnabled && activeTool === "curve");
  useSelectTool(map, shapeManager, { showBoundingBox: toolEnabled });

  return { shapeManager };
};
