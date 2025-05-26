"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapStore } from "@/store/useMapStore";
import { useDrawingStore } from "@/store/useDrawingStore";
import { useMapDrawingTools } from "@/hooks/useMapDrawingTools";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const { isViewportLocked, toggleViewportLock } = useMapStore();
  const { activeTool } = useDrawingStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    console.log("Initializing map");

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [106.8272, 15.8231], // [longitude, latitude]
      zoom: 5,
    });

    if (isViewportLocked && mapRef.current) {
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
      mapRef.current.touchPitch.disable();
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const { shapeManager } = useMapDrawingTools(mapRef.current);

  // Toggle viewport lock
  const handleToggleViewport = () => {
    if (!mapRef.current) return;

    if (!isViewportLocked) {
      // Lock viewport - disable interactions
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
      mapRef.current.boxZoom.disable();
      mapRef.current.touchPitch.disable();
      mapRef.current.dragRotate.disable();
      mapRef.current.keyboard.disable();
    } else {
      // Unlock viewport - enable interactions
      mapRef.current.dragPan.enable();
      mapRef.current.scrollZoom.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.touchZoomRotate.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.touchPitch.enable();
      mapRef.current.dragRotate.enable();
      mapRef.current.keyboard.enable();
    }

    // Update state in store
    toggleViewportLock();
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative flex-grow">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          <button
            onClick={handleToggleViewport}
            className="px-4 py-2 bg-white text-black rounded shadow"
          >
            {isViewportLocked ? "🔓 Unlock viewport" : "🔒 Lock viewport"}
          </button>
        </div>
      </div>
    </div>
  );
};
