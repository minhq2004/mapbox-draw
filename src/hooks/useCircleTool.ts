import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { Circle } from "../lib/shapes/Circle";
import { useDrawingStore } from "../store/useDrawingStore";

export const useCircleTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  active: boolean
) => {
  const drawing = useRef(false);
  const startPoint = useRef<mapboxgl.LngLat | null>(null);
  const tempCircleId = useRef<string | null>(null);
  const { setActiveTool } = useDrawingStore();

  useEffect(() => {
    if (!map || !shapeManager || !active) return;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      drawing.current = true;
      startPoint.current = e.lngLat;
      const id = `circle-${Date.now()}`;
      tempCircleId.current = id;
      const circle = new Circle(id, {
        center: e.lngLat,
        radius: 1,
        color: "#00f",
      });
      shapeManager.addShape(circle);
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!drawing.current || !startPoint.current || !tempCircleId.current)
        return;
      const center = startPoint.current;
      const radius = center.distanceTo(e.lngLat);
      const circle = shapeManager.getShape(tempCircleId.current) as Circle;
      if (circle) {
        circle.update({
          center,
          radius,
          color: "#00f",
        });
        circle.draw(map);
      }
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!drawing.current || !startPoint.current || !tempCircleId.current)
        return;
      const center = startPoint.current;
      const radius = center.distanceTo(e.lngLat);
      const circle = shapeManager.getShape(tempCircleId.current) as Circle;
      if (circle) {
        circle.update({
          center,
          radius,
          color: "#00f",
        });
        circle.draw(map);
        shapeManager.selectShape(circle.id);
      }
      drawing.current = false;
      startPoint.current = null;
      tempCircleId.current = null;
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
    };
  }, [map, shapeManager, active, setActiveTool]);
};
