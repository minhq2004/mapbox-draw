import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { Text } from "../lib/shapes/Text";
import type { Feature } from "geojson";

export const useTextTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  const startRef = useRef<mapboxgl.Point | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [previewId] = useState("text-preview");

  useEffect(() => {
    if (!map || !shapeManager) return;

    // --- DRAW PREVIEW DASHLINE BOX ---
    const handleMouseDown = (e: mapboxgl.MapMouseEvent) => {
      if (isActive) {
        startRef.current = e.point;
      } else {
        // Cho phép drag/move text nếu cần
        const features = map.queryRenderedFeatures(e.point, {
          layers: Array.from(map.getStyle().layers ?? [])
            .filter((l) => l.id.startsWith("text-layer-"))
            .map((l) => l.id),
        });
        const layer = features[0]?.layer?.id;
        if (layer?.startsWith("text-layer-")) {
          const id = layer.replace("text-layer-", "");
        }
      }
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (!isActive || !startRef.current) return;

      const start = startRef.current;
      const end = e.point;
      const topLeft = map.unproject(
        new mapboxgl.Point(Math.min(start.x, end.x), Math.min(start.y, end.y))
      );
      const bottomRight = map.unproject(
        new mapboxgl.Point(Math.max(start.x, end.x), Math.max(start.y, end.y))
      );

      const polygon: Feature = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [topLeft.lng, topLeft.lat],
              [bottomRight.lng, topLeft.lat],
              [bottomRight.lng, bottomRight.lat],
              [topLeft.lng, bottomRight.lat],
              [topLeft.lng, topLeft.lat],
            ],
          ],
        },
        properties: {},
      };

      const source = map.getSource(previewId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(polygon as any);
      } else {
        map.addSource(previewId, {
          type: "geojson",
          data: polygon,
        });

        map.addLayer({
          id: previewId,
          type: "line",
          source: previewId,
          paint: {
            "line-color": "#000",
            "line-width": 1,
            "line-dasharray": [2, 2],
          },
        });
      }
    };

    const handleMouseUp = (e: mapboxgl.MapMouseEvent) => {
      if (!isActive || !startRef.current) return;

      const start = startRef.current;
      startRef.current = null;

      const end = e.point;
      const left = Math.min(start.x, end.x);
      const top = Math.min(start.y, end.y);
      const width = Math.abs(start.x - end.x);
      const height = Math.abs(start.y - end.y);

      // Xoá preview dashline box
      if (map.getLayer(previewId)) map.removeLayer(previewId);
      if (map.getSource(previewId)) map.removeSource(previewId);

      if (width < 10 || height < 10) return;

      const canvasRect = map.getCanvas().getBoundingClientRect();
      const screenX = canvasRect.left + left;
      const screenY = canvasRect.top + top;
      const topLeftCoord = map.unproject(new mapboxgl.Point(left, top));

      // Hiển thị textarea đúng vị trí
      requestAnimationFrame(() => {
        const textarea = document.createElement("textarea");
        Object.assign(textarea.style, {
          position: "absolute",
          left: `${screenX}px`,
          top: `${screenY}px`,
          width: `${width}px`,
          height: `${height}px`,
          fontSize: "16px",
          color: "black",
          zIndex: "999",
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
            if (value) {
              const id = `text-${Date.now()}`;
              const shape = new Text(id, {
                position: topLeftCoord,
                content: value,
              });
              shapeManager.addShape(shape);
            }
            textarea.remove();
            textareaRef.current = null;
          }
        });

        textarea.addEventListener("blur", () => {
          textarea.remove();
          textareaRef.current = null;
        });
      });
    };

    // --- DOUBLE CLICK TO EDIT EXISTING TEXT ---
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
      if (!(shape instanceof Text)) return;

      const screenX = e.originalEvent.clientX;
      const screenY = e.originalEvent.clientY;

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
            shapeManager.addShape(shape);
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
    map.on("mousemove", handleMouseMove);
    map.on("mouseup", handleMouseUp);
    map.on("dblclick", handleDblClick);

    return () => {
      map.off("mousedown", handleMouseDown);
      map.off("mousemove", handleMouseMove);
      map.off("mouseup", handleMouseUp);
      map.off("dblclick", handleDblClick);

      if (map.getLayer(previewId)) map.removeLayer(previewId);
      if (map.getSource(previewId)) map.removeSource(previewId);

      if (textareaRef.current) {
        textareaRef.current.remove();
        textareaRef.current = null;
      }
    };
  }, [map, shapeManager, isActive]);
};
