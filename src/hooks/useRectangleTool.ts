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

      // Thêm hoặc cập nhật rectangle preview
      shapeManager.removeShape("temp-rectangle");
      const preview = new Rectangle("temp-rectangle", data);
      preview.strokeColor = "#888";
      shapeManager.addShape(preview);
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isDrawing || !startPointRef.current) return;
      setIsDrawing(false);

      const endLngLat = e.lngLat;
      const start = startPointRef.current;

      // Kiểm tra khoảng cách giữa hai điểm
      const deltaLng = Math.abs(endLngLat.lng - start.lng);
      const deltaLat = Math.abs(endLngLat.lat - start.lat);

      // Nếu quá nhỏ => bỏ qua
      const MIN_DISTANCE = 0.0001;
      if (deltaLng < MIN_DISTANCE || deltaLat < MIN_DISTANCE) {
        shapeManager.removeShape("temp-rectangle");
        startPointRef.current = null;
        return;
      }

      const id = `rectangle-${Date.now()}`;
      const data = {
        coordinates: [start, endLngLat] as [mapboxgl.LngLat, mapboxgl.LngLat],
      };

      shapeManager.removeShape("temp-rectangle");
      shapeManager.addShape(new Rectangle(id, data));
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
      // Xoá preview nếu còn
      if (shapeManager) shapeManager.removeShape("temp-rectangle");
    };
  }, [map, shapeManager, isDrawing, isActive]);
};
