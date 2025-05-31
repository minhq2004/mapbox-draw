import { useMapDrawingTools } from "@/hooks/useMapDrawingTools";
import { useEffect, useState } from "react";
import { Shape } from "@/lib/shapes/Shape";
import { useMapStore } from "@/store/useMapStore";

export const SlideList = () => {
  const { map, shapeManager } = useMapStore();
  const [shapes, setShapes] = useState<Shape[]>([]);

  useEffect(() => {
    if (!shapeManager) return;

    const update = () => {
      setShapes([...shapeManager.getAllShapes()]);
    };

    shapeManager.subscribe(update);
    update();

    return () => shapeManager.unsubscribe(update);
  }, [shapeManager]);

  const toggleOrder = (id: string) => {
    if (!shapeManager || !map) return;
    const shape = shapeManager.getShape(id);
    if (!shape) return;

    if (shape.presentationOrder === null) {
      const max =
        Math.max(
          0,
          ...shapeManager.getAllShapes().map((s) => s.presentationOrder ?? -1)
        ) + 1;
      shape.presentationOrder = max;
    } else {
      shape.presentationOrder = null;
    }

    shape.draw(map);
    setShapes([...shapeManager.getAllShapes()]);
  };

  return (
    <div className="p-4 space-y-2">
      <h2 className="font-bold mb-2 text-black">Slides</h2>
      {shapes.map((shape) => (
        <div
          key={shape.id}
          className={`
          flex items-center justify-between p-1 rounded
          ${shape.isSelected ? "bg-blue-100" : ""}
        `}
        >
          <span className="text-black">{shape.type}</span>
          <label className="flex items-center gap-1 text-black">
            <input
              type="checkbox"
              checked={shape.presentationOrder !== null}
              onChange={() => toggleOrder(shape.id)}
            />
            {shape.presentationOrder !== null
              ? `#${shape.presentationOrder}`
              : "Always"}
          </label>
        </div>
      ))}
    </div>
  );
};
