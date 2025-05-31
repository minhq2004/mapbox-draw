import { useEffect, useState } from "react";
import { SketchPicker } from "react-color";
import { useMapStore } from "@/store/useMapStore";
import { Text } from "@/lib/shapes/Text";

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

  return (
    <div
      className="absolute top-4 right-4 bg-white p-4 border rounded shadow z-50 w-64 text-black"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <h3 className="font-bold mb-2">Text Style</h3>

      <div className="mb-4">
        <label className="block mb-1">Font Size</label>
        <input
          type="range"
          min={8}
          max={48}
          value={fontSize}
          onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
        />
        <div>{fontSize}px</div>
      </div>

      <div className="mb-4">
        <label className="block mb-1">Color</label>
        <SketchPicker color={color} onChange={(color) => setColor(color.hex)} />
      </div>
    </div>
  );
};
