import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { TextShape } from "../lib/shapes/Text";
import { useDrawingStore } from "../store/useDrawingStore";

export const useTextTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  const startRef = useRef<mapboxgl.Point | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const lastDragPos = useRef<mapboxgl.LngLat | null>(null);

  useEffect(() => {
    if (!map || !shapeManager) return;

    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (isActive) {
        startRef.current = e.point;
        return;
      }

      const features = map.queryRenderedFeatures(e.point, {
        layers: Array.from(map.getStyle().layers ?? [])
          .filter((l) => l.id.startsWith("text-layer-"))
          .map((l) => l.id),
      });

      const layer = features[0]?.layer?.id;
      if (layer?.startsWith("text-layer-")) {
        const id = layer.replace("text-layer-", "");
        draggingIdRef.current = id;
        lastDragPos.current = e.lngLat;
      }
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (isActive && startRef.current) {
        const end = e.point;
        const start = startRef.current;
        startRef.current = null;

        const left = Math.min(start.x, end.x);
        const top = Math.min(start.y, end.y);
        const width = Math.abs(start.x - end.x);
        const height = Math.abs(start.y - end.y);

        if (width < 10 || height < 10) return;

        const topLeft = map.unproject(new mapboxgl.Point(left, top));

        const textarea = document.createElement("textarea");
        Object.assign(textarea.style, {
          position: "absolute",
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: `${height}px`,
          fontSize: "16px",
          zIndex: "999",
          color: "black",
          border: "1px solid #333",
          resize: "none",
          overflow: "hidden",
          outline: "none",
          padding: "4px",
        });

        document.body.appendChild(textarea);
        textarea.focus();
        textareaRef.current = textarea;

        textarea.addEventListener("keydown", (ke) => {
          if (ke.key === "Enter" && !ke.shiftKey) {
            ke.preventDefault();
            const value = textarea.value.trim();
            if (value.length > 0) {
              const id = `text-${Date.now()}`;
              const shape = new TextShape(id, {
                position: topLeft,
                content: value,
              });
              shapeManager.addShape(shape);
            }
            textarea.remove();
            textareaRef.current = null;
            useDrawingStore.getState().setActiveTool("select");
          }
        });

        textarea.addEventListener("blur", () => {
          textarea.remove();
          textareaRef.current = null;
        });
      }

      draggingIdRef.current = null;
      lastDragPos.current = null;
    };

    const handleDblClick = (e: mapboxgl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: Array.from(map.getStyle().layers ?? [])
          .filter((l) => l.id.startsWith("text-layer-"))
          .map((l) => l.id),
      });

      const layer = features[0]?.layer?.id;
      if (!layer?.startsWith("text-layer-")) return;

      const id = layer.replace("text-layer-", "");
      const shape = shapeManager.getShape(id);
      if (!(shape instanceof TextShape)) return;

      const canvasRect = map.getCanvas().getBoundingClientRect();
      const screenX = e.originalEvent.clientX - canvasRect.left;
      const screenY = e.originalEvent.clientY - canvasRect.top;

      const textarea = document.createElement("textarea");
      Object.assign(textarea.style, {
        position: "absolute",
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: `150px`,
        height: `50px`,
        fontSize: "16px",
        color: "black",
        zIndex: "999",
        border: "1px solid #333",
        resize: "none",
        overflow: "hidden",
        outline: "none",
        padding: "4px",
      });

      textarea.value = shape.data.content;
      document.body.appendChild(textarea);
      textarea.focus();
      textareaRef.current = textarea;

      textarea.addEventListener("keydown", (ke) => {
        if (ke.key === "Enter" && !ke.shiftKey) {
          ke.preventDefault();

          // cập nhật nội dung mới
          shape.update({
            ...shape.data,
            content: textarea.value,
          });

          // nếu shape đã không còn trong manager, thêm lại
          if (!shapeManager.getShape(shape.id)) {
            shapeManager.addShape(shape); // re-add vào manager
          }

          // đảm bảo chọn lại & vẽ lại bounding box
          shape.select();
          shape.draw(map);
          shapeManager.selectShape(shape.id);

          // cleanup
          textarea.remove();
          textareaRef.current = null;
        }
      });

      textarea.addEventListener("blur", () => {
        textarea.remove();
        textareaRef.current = null;
      });
    };

    map.on("mousedown", handleMouseDown);
    map.on("mouseup", handleMouseUp);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mouseup", handleMouseUp);
      map.off("dblclick", handleDblClick);

      if (textareaRef.current) {
        textareaRef.current.remove();
        textareaRef.current = null;
      }
    };
  }, [map, shapeManager, isActive]);
};
