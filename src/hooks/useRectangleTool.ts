// src/hooks/useRectangleTool.ts

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Rectangle } from "../lib/shapes/Rectangle";
import { ShapeManager } from "../lib/shapes/ShapeManager";

export const useRectangleTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  const [isDrawing, setIsDrawing] = useState(false);
  const startPointRef = useRef<mapboxgl.LngLat | null>(null);

  useEffect(() => {
    if (!map || !shapeManager || !isActive) return;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      startPointRef.current = e.lngLat;
      setIsDrawing(true);
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !startPointRef.current) return;

      const endLngLat = e.lngLat;
      const data = {
        coordinates: [startPointRef.current, endLngLat] as [
          mapboxgl.LngLat,
          mapboxgl.LngLat
        ],
      };

      shapeManager.removeShape("temp-rectangle");
      const tempRectangle = new Rectangle("temp-rectangle", data);
      shapeManager.addShape(tempRectangle);
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !startPointRef.current) return;
      setIsDrawing(false);

      const endLngLat = e.lngLat;
      const id = `rectangle-${Date.now()}`;
      const data = {
        coordinates: [startPointRef.current, endLngLat] as [
          mapboxgl.LngLat,
          mapboxgl.LngLat
        ],
      };

      shapeManager.removeShape("temp-rectangle");

      const rectangle = new Rectangle(id, data);
      shapeManager.addShape(rectangle);

      startPointRef.current = null;
    };

    map.getCanvas().style.cursor = "crosshair";
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.getCanvas().style.cursor = "";
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
    };
  }, [map, shapeManager, isDrawing, isActive]);
};
