import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { useDrawingStore } from "../store/useDrawingStore";
import { Shape } from "@/lib/shapes/Shape";

export const useSelectTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  options?: { showBoundingBox?: boolean }
) => {
  const selectedIdRef = useRef<string | null>(null);
  const dragStartRef = useRef<mapboxgl.LngLat | null>(null);
  const copiedShapeRef = useRef<Shape | null>(null);
  const resizingHandleIndex = useRef<number | null>(null);
  const { setActiveTool } = useDrawingStore();

  useEffect(() => {
    if (!map || !shapeManager) return;

    // Nếu không showBoundingBox thì clear selection và không đăng ký event
    if (options && options.showBoundingBox === false) {
      shapeManager.clearSelection?.();
      return;
    }

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point);
      const target = features.find((f) => f.layer?.id?.includes("-layer-"));

      if (target?.layer?.id) {
        const id = target.layer.id.split("-layer-")[1];
        shapeManager.selectShape(id);
        selectedIdRef.current = id;
        setActiveTool("select");
      } else {
        shapeManager.clearSelection();
        selectedIdRef.current = null;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.ctrlKey || e.metaKey;

      if (
        document.activeElement &&
        document.activeElement.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedIdRef.current
      ) {
        shapeManager.removeShape(selectedIdRef.current);
        selectedIdRef.current = null;
      }

      if (isCmd && e.key.toLowerCase() === "c" && selectedIdRef.current) {
        const shape = shapeManager.getShape(selectedIdRef.current);
        if (shape) {
          copiedShapeRef.current = shape.clone();
        }
      }

      if (isCmd && e.key.toLowerCase() === "v" && copiedShapeRef.current) {
        const shape = copiedShapeRef.current.clone();
        shape.moveByDelta(0.025, -0.025, map!);
        shapeManager.addShape(shape);
        shapeManager.selectShape(shape.id);
        selectedIdRef.current = shape.id;
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

      // Case resize handle
      if (resizingHandleIndex.current !== null) {
        const shape = shapeManager.getShape(id);
        if (shape) {
          shape.resizeByHandle(resizingHandleIndex.current, e.lngLat, map);
          shapeManager.drawHandlesForSelectedShape();
        }
        return;
      }

      // Case move shape
      const dx = e.lngLat.lng - start.lng;
      const dy = e.lngLat.lat - start.lat;
      shapeManager.moveShapeByDelta(id, dx, dy);
      shapeManager.drawHandlesForSelectedShape();
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
  }, [map, shapeManager, options?.showBoundingBox]);
};
