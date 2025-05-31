import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Arrow } from "../lib/shapes/Arrow";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { useDrawingStore } from "@/store/useDrawingStore";

export const useArrowTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  const pointsRef = useRef<mapboxgl.LngLat[]>([]);
  const previewId = "preview-arrow";

  useEffect(() => {
    if (!map || !shapeManager || !isActive) return;

    const reset = () => {
      pointsRef.current = [];
      if (map.getLayer(previewId)) map.removeLayer(previewId);
      if (map.getSource(previewId)) map.removeSource(previewId);
    };

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      const clicked = e.lngLat;

      if (pointsRef.current.length >= 3) {
        reset();
        return;
      }

      pointsRef.current.push(clicked);

      if (pointsRef.current.length === 3) {
        const [start, control, end] = pointsRef.current;
        const id = `arrow-${Date.now()}`;
        shapeManager.removeShape(previewId);
        shapeManager.addShape(
          new Arrow(id, { anchors: [start, control, end] })
        );
        reset();
      }
    };

    const handleMouseMove = (e: mapboxgl.MapMouseEvent) => {
      if (pointsRef.current.length !== 2) return;

      const [start, control] = pointsRef.current;
      const end = e.lngLat;

      const curve = getQuadraticBezierPoints(start, control, end, 32);
      const geojson = {
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: curve,
        },
        properties: {},
      };

      const source = map.getSource(previewId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(geojson);
      } else {
        map.addSource(previewId, {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: previewId,
          type: "line",
          source: previewId,
          paint: {
            "line-color": "#888",
            "line-width": 2,
            "line-dasharray": [2, 2],
          },
        });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") reset();
    };

    map.getCanvas().style.cursor = "crosshair";
    map.on("click", handleClick);
    map.on("mousemove", handleMouseMove);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      map.getCanvas().style.cursor = "";
      map.off("click", handleClick);
      map.off("mousemove", handleMouseMove);
      window.removeEventListener("keydown", handleKeyDown);
      reset();
    };
  }, [map, shapeManager, isActive]);
};

function getQuadraticBezierPoints(
  p0: mapboxgl.LngLat,
  p1: mapboxgl.LngLat,
  p2: mapboxgl.LngLat,
  steps: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    const x =
      (1 - t) ** 2 * p0.lng + 2 * (1 - t) * t * p1.lng + t ** 2 * p2.lng;
    const y =
      (1 - t) ** 2 * p0.lat + 2 * (1 - t) * t * p1.lat + t ** 2 * p2.lat;
    points.push([x, y]);
  }
  return points;
}
