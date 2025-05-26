// src/hooks/useMapDrawingTools.ts

import mapboxgl from "mapbox-gl";
import { useDrawingStore } from "../store/useDrawingStore";
import { useRectangleTool } from "./useRectangleTool";
import { useEffect, useState } from "react";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { useSelectTool } from "./useSelectTool";
import { useCircleTool } from "./useCircleTool";
import { useArrowTool } from "./useArrowTool";
import { useTextTool } from "./useTextTool";
import { usePolylineTool } from "./usePolylineTool";
import { useCurveTool } from "./useCurveTool";

export const useMapDrawingTools = (map: mapboxgl.Map | null) => {
  const { activeTool } = useDrawingStore();
  const [shapeManager, setShapeManager] = useState<ShapeManager | null>(null);

  useEffect(() => {
    if (map && !shapeManager) {
      setShapeManager(new ShapeManager(map));
    }
  }, [map, shapeManager]);

  // Gọi các hook công cụ vẽ tương ứng
  useRectangleTool(map, shapeManager, activeTool === "rectangle");
  useCircleTool(map, shapeManager, activeTool === "circle");
  useArrowTool(map, shapeManager, activeTool === "arrow");
  useTextTool(map, shapeManager, activeTool === "text");
  usePolylineTool(map, shapeManager, activeTool === "polyline");
  useCurveTool(map, shapeManager, activeTool === "curve");
  useSelectTool(map, shapeManager);

  // Có thể mở rộng ở đây:
  // etc.

  return {
    shapeManager,
  };
};
