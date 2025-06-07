import { useMapStore } from "@/store/useMapStore";
import { Shape } from "@/lib/shapes/Shape";
import {
  RiSendBackward,
  RiSendToBack,
  RiBringForward,
  RiBringToFront,
} from "react-icons/ri";
import React, { useState } from "react";
import { useDrawingStore } from "@/store/useDrawingStore";

interface Props {
  shape: Shape;
}

export const LayerOrderControls = ({ shape }: Props) => {
  const { shapeManager, map } = useMapStore();
  const { triggerForceUpdate } = useDrawingStore();

  if (!shapeManager || !map) return null;

  const shapes = shapeManager.getAllShapes();
  const idx = shapes.findIndex((s: Shape) => s.id === shape.id);

  // Di chuyển shape trong mảng và cập nhật thứ tự layer trên map
  const moveShape = (from: number, to: number) => {
    if (from === to) return;
    const newShapes = [...shapes];
    const [removed] = newShapes.splice(from, 1);
    newShapes.splice(to, 0, removed);

    // Cập nhật lại thứ tự layer trên mapbox (chỉ cần gọi moveLayer cho shape vừa di chuyển)
    const movingLayerId = removed.layerId;
    const beforeLayerId =
      to < newShapes.length - 1 ? newShapes[to + 1].layerId : undefined;
    try {
      map.moveLayer(movingLayerId, beforeLayerId);
    } catch (e) {}

    // Nếu bạn cần đồng bộ lại shapes trong shapeManager, hãy cập nhật lại ở đây (nếu có hàm setShapes)
    shapeManager.setShapes(newShapes);

    triggerForceUpdate();
  };

  const bringToFront = () => {
    if (idx === shapes.length - 1) return;
    moveShape(idx, shapes.length - 1);
  };

  const bringForward = () => {
    if (idx === shapes.length - 1) return;
    moveShape(idx, idx + 1);
  };

  const sendBackward = () => {
    if (idx === 0) return;
    moveShape(idx, idx - 1);
  };

  const sendToBack = () => {
    if (idx === 0) return;
    moveShape(idx, 0);
  };

  return (
    <div className="flex gap-2 mt-2">
      <button
        className={`p-1 border rounded hover:bg-gray-100 ${
          idx === shapes.length - 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Bring to Front"
        onClick={bringToFront}
        disabled={idx === shapes.length - 1}
      >
        <RiBringToFront />
      </button>
      <button
        className={`p-1 border rounded hover:bg-gray-100 ${
          idx === shapes.length - 1 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Bring Forward"
        onClick={bringForward}
        disabled={idx === shapes.length - 1}
      >
        <RiBringForward />
      </button>
      <button
        className={`p-1 border rounded hover:bg-gray-100 ${
          idx === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Send Backward"
        onClick={sendBackward}
        disabled={idx === 0}
      >
        <RiSendBackward />
      </button>
      <button
        className={`p-1 border rounded hover:bg-gray-100 ${
          idx === 0 ? "opacity-50 cursor-not-allowed" : ""
        }`}
        title="Send to Back"
        onClick={sendToBack}
        disabled={idx === 0}
      >
        <RiSendToBack />
      </button>
    </div>
  );
};
