import { useMapStore } from "@/store/useMapStore";
import { Shape } from "@/lib/shapes/Shape";
import {
  RiSendBackward,
  RiSendToBack,
  RiBringForward,
  RiBringToFront,
} from "react-icons/ri";
import React, { useState } from "react";

interface Props {
  shape: Shape;
}

export const LayerOrderControls = ({ shape }: Props) => {
  const { shapeManager, map } = useMapStore();
  const [_, setForceUpdate] = useState(0); // ép re-render

  if (!shapeManager || !map) return null;

  // Luôn lấy shapes mới nhất mỗi lần render
  const shapes = shapeManager.getAllShapes();
  const idx = shapes.findIndex((s: Shape) => s.id === shape.id);

  // Hàm cập nhật lại thứ tự và vẽ lại
  const updateOrder = (newShapes: Shape[]) => {
    // Xóa tất cả shape khỏi map và khỏi shapeManager
    shapeManager.getAllShapes().forEach((s) => {
      s.remove(map);
      shapeManager.removeShape(s.id);
    });
    // Thêm lại theo thứ tự mới
    newShapes.forEach((s) => shapeManager.addShape(s));
    // Giữ selection
    shapeManager.selectShape(shape.id);
    setForceUpdate((v) => v + 1); // ép re-render để cập nhật trạng thái disable
  };

  const bringToFront = () => {
    const shapesNow = shapeManager.getAllShapes();
    const idxNow = shapesNow.findIndex((s) => s.id === shape.id);
    if (idxNow === shapesNow.length - 1) return;
    const newShapes = shapesNow.filter((s) => s.id !== shape.id);
    newShapes.push(shape);
    updateOrder(newShapes);
  };

  const bringForward = () => {
    const shapesNow = shapeManager.getAllShapes();
    const idxNow = shapesNow.findIndex((s) => s.id === shape.id);
    if (idxNow === shapesNow.length - 1) return;
    const newShapes = [...shapesNow];
    [newShapes[idxNow], newShapes[idxNow + 1]] = [
      newShapes[idxNow + 1],
      newShapes[idxNow],
    ];
    updateOrder(newShapes);
  };

  const sendBackward = () => {
    const shapesNow = shapeManager.getAllShapes();
    const idxNow = shapesNow.findIndex((s) => s.id === shape.id);
    if (idxNow === 0) return;
    const newShapes = [...shapesNow];
    [newShapes[idxNow], newShapes[idxNow - 1]] = [
      newShapes[idxNow - 1],
      newShapes[idxNow],
    ];
    updateOrder(newShapes);
  };

  const sendToBack = () => {
    const shapesNow = shapeManager.getAllShapes();
    const idxNow = shapesNow.findIndex((s) => s.id === shape.id);
    if (idxNow === 0) return;
    const newShapes = shapesNow.filter((s) => s.id !== shape.id);
    newShapes.unshift(shape);
    updateOrder(newShapes);
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
