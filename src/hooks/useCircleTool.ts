import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { Circle } from "../lib/shapes/Circle";

export const useCircleTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  active: boolean
) => {
  const drawing = useRef(false);
  const startPoint = useRef<mapboxgl.LngLat | null>(null);
  const tempCircleRef = useRef<Circle | null>(null);

  useEffect(() => {
    if (!map || !shapeManager || !active) return;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      drawing.current = true;
      startPoint.current = e.lngLat;
      tempCircleRef.current = null;
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!drawing.current || !startPoint.current) return;

      const center = startPoint.current;
      const radius = center.distanceTo(e.lngLat);
      const id = "temp-circle";

      // Chỉ vẽ nếu đủ lớn
      const MIN_RADIUS = 1;
      if (radius < MIN_RADIUS) return;

      // Xoá vòng cũ
      shapeManager.removeShape(id);

      const circle = new Circle(id, {
        center,
        radius,
      });
      circle.strokeColor = "#888";
      shapeManager.addShape(circle);
      tempCircleRef.current = circle;
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!drawing.current || !startPoint.current) return;
      drawing.current = false;

      const center = startPoint.current;
      const radius = center.distanceTo(e.lngLat);
      startPoint.current = null;

      const id = `circle-${Date.now()}`;
      const MIN_RADIUS = 1;
      if (radius < MIN_RADIUS) {
        shapeManager.removeShape("temp-circle");
        return;
      }

      shapeManager.removeShape("temp-circle");
      shapeManager.addShape(
        new Circle(id, {
          center,
          radius,
        })
      );
    };

    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
    };
  }, [map, shapeManager, active]);
};
