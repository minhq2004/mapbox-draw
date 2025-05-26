import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { Arrow } from "../lib/shapes/Arrow";
import { useDrawingStore } from "../store/useDrawingStore";

export const useArrowTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  useEffect(() => {
    if (!map || !shapeManager || !isActive) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const start = e.lngLat;
      const end = new mapboxgl.LngLat(start.lng + 1, start.lat + 1); // mặc định

      const id = `arrow-${Date.now()}`;
      const shape = new Arrow(id, { coordinates: [start, end] });
      shapeManager.addShape(shape);
      useDrawingStore.getState().setActiveTool("select");
    };

    map.getCanvas().style.cursor = "crosshair";
    map.on("click", handleClick);

    return () => {
      map.getCanvas().style.cursor = "";
      map.off("click", handleClick);
    };
  }, [map, shapeManager, isActive]);
};
