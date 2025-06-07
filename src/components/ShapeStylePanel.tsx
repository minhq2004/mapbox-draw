import { useState, useEffect, useRef } from "react";
import { SketchPicker } from "react-color";
import { Shape } from "@/lib/shapes/Shape";
import { useMapStore } from "@/store/useMapStore";
import { LayerOrderControls } from "./LayerOrderControls";

export const ShapeStylePanel = ({ shape }: { shape: Shape }) => {
  const { map } = useMapStore();

  // controlled state
  const [strokeColor, setStrokeColor] = useState(shape.strokeColor || "#000");
  const [strokeWidth, setStrokeWidth] = useState(shape.strokeWidth || 1);

  const [pos, setPos] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragOffset.current = {
      x: e.clientX - pos.x,
      y: e.clientY - pos.y,
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    });
  };

  const onMouseUp = () => {
    setDragging(false);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };

  // Sync state if shape changes
  useEffect(() => {
    setStrokeColor(shape.strokeColor || "#000");
    setStrokeWidth(shape.strokeWidth || 1);
  }, [shape]);

  const handleColorChange = (color: any) => {
    setStrokeColor(color.hex);
    shape.strokeColor = color.hex;
    shape.draw(map!);
  };

  const commonStrokeWidths = [1, 2, 4, 8, 12, 16, 24, 32, 48, 72, 96];

  return (
    <div className="p-4 bg-white w-full text-black">
      <h3 className="font-bold mb-2">Shape style</h3>

      <div className="mb-3">
        <label className="block mb-1">Stroke color</label>
        <SketchPicker color={strokeColor} onChange={handleColorChange} />
      </div>

      <div className="mb-3 items-center">
        <label className="block mb-1">Stroke width</label>
        <div className="flex items-center gap-2">
          <select
            className="border px-1 py-1"
            value={commonStrokeWidths.includes(strokeWidth) ? strokeWidth : ""}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              setStrokeWidth(val);
              shape.strokeWidth = val;
              shape.draw(map!);
            }}
          >
            <option value="">Custom</option>
            {commonStrokeWidths.map((val) => (
              <option key={val} value={val}>
                {val}px
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={200}
            step={1}
            className="w-16 border px-1 py-1"
            value={strokeWidth}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10) || 1;
              setStrokeWidth(val);
              shape.strokeWidth = val;
              shape.draw(map!);
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <span>px</span>
        </div>
      </div>
      <LayerOrderControls shape={shape} />
    </div>
  );
};
