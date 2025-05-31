import { useState, useEffect } from "react";
import { SketchPicker } from "react-color";
import { Shape } from "@/lib/shapes/Shape";
import { useMapStore } from "@/store/useMapStore";

export const ShapeStylePanel = ({ shape }: { shape: Shape }) => {
  const { map } = useMapStore();

  // controlled state
  const [strokeColor, setStrokeColor] = useState(shape.strokeColor || "#000");
  const [strokeWidth, setStrokeWidth] = useState(shape.strokeWidth || 1);

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

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseFloat(e.target.value);
    setStrokeWidth(width);
    shape.strokeWidth = width;
    shape.draw(map!);
  };

  return (
    <div className="p-3 bg-white border rounded shadow w-64 text-black">
      <h3 className="font-bold mb-2">Style</h3>

      <div className="mb-3">
        <label className="block mb-1">Stroke Color</label>
        <SketchPicker color={strokeColor} onChange={handleColorChange} />
      </div>

      <div className="mb-3 items-center">
        <label className="block mb-1">Stroke Width</label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={strokeWidth}
            onChange={handleWidthChange}
          />
          <span>{strokeWidth}px</span>
        </div>
      </div>
    </div>
  );
};
