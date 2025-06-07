import { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import { useMapStore } from "@/store/useMapStore";
import { Text } from "@/lib/shapes/Text";
import { LayerOrderControls } from "./LayerOrderControls";

export const TextStylePanel = () => {
  const { map, shapeManager } = useMapStore();
  const [textShape, setTextShape] = useState<Text | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [color, setColor] = useState("#000");

  // Sync panel with selected text shape
  useEffect(() => {
    if (!shapeManager) return;

    const selected = shapeManager.getSelectedShape();
    if (selected instanceof Text) {
      setTextShape(selected);
      setFontSize(selected.data.fontSize ?? 14);
      setColor(selected.data.color ?? "#000");
    } else {
      setTextShape(null);
    }
  }, [shapeManager?.getSelectedShape()]);

  useEffect(() => {
    if (!map || !textShape) return;
    textShape.update({ fontSize, color });
    textShape.draw(map);
  }, [fontSize, color]);

  if (!textShape) return null;

  const commonFontSizes = [8, 10, 12, 14, 16, 18, 24, 32, 48, 64, 96];

  return (
    <div
      className="bg-white p-4 border rounded shadow z-50 w-64 text-black"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <h3 className="font-bold mb-2">Text Style</h3>

      <div className="mb-4">
        <label className="block mb-1">Font Size</label>
        <div className="flex items-center gap-2">
          <select
            className="border px-1 py-1"
            value={commonFontSizes.includes(fontSize) ? fontSize : ""}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <option value="" disabled>
              Custom
            </option>
            {commonFontSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <input
            type="number"
            min={8}
            max={200}
            step={1}
            className="w-16 border px-1 py-1"
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value, 10) || 8)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <span>px</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Color</label>
        <SketchPicker color={color} onChange={(color) => setColor(color.hex)} />
      </div>

      <div className="align-middle my-auto">
        <LayerOrderControls shape={textShape} />
      </div>
    </div>
  );
};
