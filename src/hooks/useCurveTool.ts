import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Curve } from "../lib/shapes/Curve";
import { ShapeManager } from "../lib/shapes/ShapeManager";
import type { Feature } from "geojson";

export const useCurveTool = (
  map: mapboxgl.Map | null,
  shapeManager: ShapeManager | null,
  isActive: boolean
) => {
  const pointsRef = useRef<mapboxgl.LngLat[]>([]);
  const previewLayerId = "curve-preview";

  useEffect(() => {
    if (!map || !shapeManager || !isActive) return;

    const drawPreview = () => {
      const tmp = new Curve("preview", { controlPoints: pointsRef.current });
      const geojson: Feature = {
        type: "Feature",
        geometry: tmp.getGeoJSONGeometry(),
        properties: {},
      };

      const source = map.getSource(previewLayerId);
      if (source && "setData" in source) {
        (source as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(previewLayerId, {
          type: "geojson",
          data: geojson,
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

    const complete = () => {
      const id = `curve-${Date.now()}`;
      const shape = new Curve(id, { controlPoints: [...pointsRef.current] });
      shapeManager.addShape(shape);
      pointsRef.current = [];

      if (map.getLayer(previewLayerId)) map.removeLayer(previewLayerId);
      if (map.getSource(previewLayerId)) map.removeSource(previewLayerId);
    };

    const handleClick = (e: mapboxgl.MapMouseEvent) => {
      pointsRef.current.push(e.lngLat);
      if (pointsRef.current.length > 1) drawPreview();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && pointsRef.current.length > 1) {
        complete();
      }
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
