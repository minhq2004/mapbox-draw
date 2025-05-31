"use client";

import { create } from "zustand";
import { ShapeManager } from "../lib/shapes/ShapeManager";

interface MapState {
  isViewportLocked: boolean;
  toggleViewportLock: () => void;
  map: mapboxgl.Map | null;
  setMap: (map: mapboxgl.Map) => void;
  shapeManager: ShapeManager | null;
  setShapeManager: (sm: ShapeManager) => void;
}

export const useMapStore = create<MapState>((set) => ({
  map: null,
  shapeManager: null,
  setMap: (map) => set({ map }),
  setShapeManager: (sm) => set({ shapeManager: sm }),
  isViewportLocked: true,
  toggleViewportLock: () =>
    set((state) => ({ isViewportLocked: !state.isViewportLocked })),
}));
