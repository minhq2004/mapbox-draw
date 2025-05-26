import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import { Polyline } from "../lib/shapes/Polyline";
import { useDrawingStore } from "../store/useDrawingStore";
import type { Feature, LineString } from "geojson";

export const usePolylineTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  const pointsRef = useRef<mapboxgl.LngLat[]>([]);
  const previewLayerId = "polyline-preview";

  useEffect(() => {
    if (!map || !shapeManager || !isActive) return;
    pointsRef.current = [];

    const drawPreview = () => {
      if (pointsRef.current.length < 2) return;
      const coords = pointsRef.current.map((p) => [p.lng, p.lat]);

      const data: Feature<LineString> = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: coords,
        },
        properties: {},
      };

      const source = map.getSource(previewLayerId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(data);
      } else {
        map.addSource(previewLayerId, {
          type: "geojson",
          data,
        });

        map.addLayer({
          id: previewLayerId,
          type: "line",
          source: previewLayerId,
          paint: {
            "line-color": "#888",
            "line-dasharray": [2, 2],
            "line-width": 2,
          },
        });
      }
    };

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      if (pointsRef.current.length === 0) {
        pointsRef.current = [];
      }
      pointsRef.current.push(e.lngLat);
      if (pointsRef.current.length > 1) drawPreview();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && pointsRef.current.length >= 2) {
        complete();
      }
    };

    const complete = () => {
      const id = `polyline-${Date.now()}`;
      const shape = new Polyline(id, { coordinates: [...pointsRef.current] });
      shapeManager.addShape(shape);
      pointsRef.current = [];

      if (map.getLayer(previewLayerId)) map.removeLayer(previewLayerId);
      if (map.getSource(previewLayerId)) map.removeSource(previewLayerId);
    };

    map.on("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      map.off("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
      if (map.getLayer(previewLayerId)) map.removeLayer(previewLayerId);
      if (map.getSource(previewLayerId)) map.removeSource(previewLayerId);
    };
  }, [map, shapeManager, isActive]);
};
