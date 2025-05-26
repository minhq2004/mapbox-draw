// src/hooks/useSelectTool.ts

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { useDrawingStore } from "../store/useDrawingStore";

export const useSelectTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null
) => {
  const selectedIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<mapboxgl.LngLat | null>(null);
  const resizingHandleIndex = useRef<number | null>(null);
  const { setActiveTool } = useDrawingStore();

  useEffect(() => {
    if (!map || !shapeManager) return;

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);
      const target = features.find((f) => f.layer?.id?.includes("-layer-"));

      if (target?.layer?.id) {
        const id = target.layer.id.split("-layer-")[1];
        shapeManager.selectShape(id);
        selectedIdRef.current = id;
        setActiveTool("select");
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIdRef.current
      ) {
        shapeManager.removeShape(selectedIdRef.current);
        selectedIdRef.current = null;
      }
    };

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);

      // Ưu tiên kiểm tra handle trước
      const handleFeature = features.find(
        (f) => f.layer?.id === "shape-handles-layer"
      );
      if (handleFeature && handleFeature.properties && selectedIdRef.current) {
        resizingHandleIndex.current = handleFeature.properties.index;
        dragStartRef.current = e.lngLat;
        map.getCanvas().style.cursor = "nwse-resize";
        return;
      }

      // Nếu không phải handle thì kiểm tra shape
      const target = features.find((f) => f.layer?.id?.includes("-layer-"));
      if (target?.layer?.id) {
        const id = target.layer.id.split("-layer-")[1];
        if (selectedIdRef.current === id) {
          dragStartRef.current = e.lngLat;
        }
      }
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      const start = dragStartRef.current;
      const id = selectedIdRef.current;
      if (!start || !id) return;

      // Nếu đang resize handle
      if (resizingHandleIndex.current !== null) {
        const shape = shapeManager.getShape(id);
        if (shape) {
          shape.resizeByHandle(resizingHandleIndex.current, e.lngLat, map);
          shapeManager.drawHandlesForSelectedShape();
        }
        return;
      }

      // Nếu đang move shape
      const dx = e.lngLat.lng - start.lng;
      const dy = e.lngLat.lat - start.lat;
      shapeManager.moveShapeByDelta(id, dx, dy);
      dragStartRef.current = e.lngLat;
    };

    const handleMouseUp = () => {
      dragStartRef.current = null;
      resizingHandleIndex.current = null;
      map && (map.getCanvas().style.cursor = "");
    };

    map.on("click", handleClick);
    map.on("mousedown", handleMouseDown);
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("click", handleClick);
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [map, shapeManager]);
};
