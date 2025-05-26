"use client";

import { create } from "zustand";

// Định nghĩa các loại công cụ vẽ
export type DrawingTool =
  | "text"
  | "polyline"
  | "curve"
  | "rectangle"
  | "circle"
  | "arrow"
  | "select";

interface DrawingState {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  activeTool: "select",
  setActiveTool: (tool) => set({ activeTool: tool }),
}));
