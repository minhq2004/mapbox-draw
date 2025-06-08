import { useEffect, useState } from "react";
import { Shape } from "@/lib/shapes/Shape";
import { useMapStore } from "@/store/useMapStore";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RxCross2 } from "react-icons/rx";
import { useDrawingStore } from "@/store/useDrawingStore";
import { Rectangle } from "@/lib/shapes/Rectangle";
import { Arrow } from "@/lib/shapes/Arrow";
import { Polyline } from "@/lib/shapes/Polyline";
import { Curve } from "@/lib/shapes/Curve";
import { Circle } from "@/lib/shapes/Circle";
import { Text } from "@/lib/shapes/Text";

function SortableItem({
  shape,
  selected,
  onSelect,
  onDelete,
  onSetOrder,
  onToggleStep,
  maxOrder,
}: {
  shape: Shape;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onSetOrder: (order: number) => void;
  onToggleStep: (checked: boolean) => void;
  maxOrder: number;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shape.id });

  const [editingOrder, setEditingOrder] = useState(false);
  const [orderValue, setOrderValue] = useState(shape.presentationOrder ?? "");

  useEffect(() => {
    setOrderValue(shape.presentationOrder ?? "");
  }, [shape.presentationOrder]);

  const isStep =
    shape.presentationOrder !== null && shape.presentationOrder !== undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
      }}
      className={`flex items-center justify-between p-1 rounded group ${
        selected ? "bg-red-200" : "hover:bg-red-100"
      }`}
      onClick={onSelect}
      tabIndex={0}
    >
      <span className="text-black capitalize">{shape.type}</span>
      <div className="flex items-center gap-2 text-black">
        <label className="flex items-center gap-1 text-xs">
          <input
            type="checkbox"
            checked={isStep}
            onChange={(e) => {
              e.stopPropagation();
              onToggleStep(e.target.checked);
            }}
          />
          {isStep ? "" : "#"}
        </label>
        {isStep &&
          (editingOrder ? (
            <input
              type="number"
              className="w-10 text-xs border rounded px-1"
              value={orderValue}
              autoFocus
              min={1}
              onChange={(e) => {
                setOrderValue(e.target.value);
                e.stopPropagation();
              }}
              onBlur={() => {
                setEditingOrder(false);
                const val = parseInt(orderValue as string, 10);
                if (!isNaN(val)) onSetOrder(val);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setEditingOrder(false);
                  const val = parseInt(orderValue as string, 10);
                  if (!isNaN(val)) onSetOrder(val);
                }
              }}
            />
          ) : (
            <button
              className="text-xs hover:text-blue-600 border rounded px-1"
              onClick={(e) => {
                setEditingOrder(true);
              }}
            >
              #{shape.presentationOrder ?? "-"}
            </button>
          ))}
        <button
          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove shape"
        >
          <RxCross2 />
        </button>
        <span
          {...attributes}
          {...listeners}
          className="ml-1 cursor-grab text-gray-400 hover:text-gray-700"
          title="Drag to change shape's order"
          onClick={(e) => e.stopPropagation()}
        >
          &#9776;
        </span>
      </div>
    </div>
  );
}

export const ShapeList = () => {
  const { shapeManager, map } = useMapStore();
  const [shapes, setShapes] = useState<Shape[]>([]);
  const { triggerForceUpdate } = useDrawingStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!shapeManager) return;

    const update = () => {
      const all = [...shapeManager.getAllShapes()];
      setShapes(all);
      setSelectedId(shapeManager.getSelectedShape()?.id ?? null);
    };

    shapeManager.subscribe(update);
    update();

    return () => shapeManager.unsubscribe(update);
  }, [shapeManager]);

  // DND-kit setup
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = shapes.findIndex((s) => s.id === active.id);
    const newIndex = shapes.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newShapes = arrayMove(shapes, oldIndex, newIndex);

    // Cập nhật lại thứ tự trong shapeManager và đồng bộ thứ tự layer trên map
    if (shapeManager && map && shapeManager.setShapes) {
      shapeManager.setShapes(newShapes);

      // Đồng bộ lại thứ tự layer trên mapbox
      for (let i = 0; i < newShapes.length; i++) {
        const layerId = newShapes[i].layerId;
        const beforeLayerId =
          i < newShapes.length - 1 ? newShapes[i + 1].layerId : undefined;
        try {
          map.moveLayer(layerId, beforeLayerId);
        } catch (e) {}
      }
      triggerForceUpdate();
    }

    setShapes([...newShapes]);
  };

  const handleSelect = (id: string) => {
    if (!shapeManager) return;
    shapeManager.selectShape(id);
    setSelectedId(id);
    useDrawingStore.getState().setActiveTool("select");
  };

  const handleDelete = (id: string) => {
    if (!shapeManager) return;
    shapeManager.removeShape(id);
  };

  const handleSetOrder = (id: string, order: number) => {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    shape.presentationOrder = order;
    setShapes([...shapes]);
  };

  const handleToggleStep = (id: string, checked: boolean) => {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    if (checked) {
      // Gán bước mới: max + 1
      const maxOrder = Math.max(
        0,
        ...shapes
          .map((s) => s.presentationOrder ?? 0)
          .filter((n) => typeof n === "number")
      );
      shape.presentationOrder = maxOrder + 1;
    } else {
      shape.presentationOrder = null;
    }
    setShapes([...shapes]);
  };

  // Hàm log thông tin shape
  const handleLogShapes = () => {
    if (!shapeManager) return;
    const all = shapeManager.getAllShapes();
    const log = all.map((s) => {
      let coords: any = undefined;
      let extra: any = {};

      if (s.type === "rectangle") {
        const rect = s as Rectangle;
        coords = rect.data.coordinates;
      } else if (s.type === "arrow") {
        const arrow = s as Arrow;
        coords = arrow.data.anchors;
      } else if (s.type === "polyline") {
        const poly = s as Polyline;
        coords = poly.data.coordinates;
      } else if (s.type === "curve") {
        const curve = s as Curve;
        coords = curve.data.controlPoints;
      } else if (s.type === "circle") {
        const circle = s as Circle;
        coords = {
          center: circle.data.center,
          radius: circle.data.radius,
        };
      } else if (s.type === "text") {
        const text = s as Text;
        coords = text.data.position;
        extra.content = text.data?.content ?? text.data.content;
        extra.color = text.data?.color ?? text.strokeColor;
        extra.fontSize = text.data?.fontSize;
      }

      return {
        id: s.id,
        type: s.type,
        coordinates: coords,
        strokeColor: s.strokeColor,
        strokeWidth: s.strokeWidth,
        ...extra,
        presentationOrder: s.presentationOrder,
      };
    });
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    console.log("Current shapes:", log);
    alert("Đã copy log shapes vào clipboard!");
  };

  const maxOrder = Math.max(
    0,
    ...shapes
      .map((s) => s.presentationOrder ?? 0)
      .filter((n) => typeof n === "number")
  );

  return (
    <div className="p-4 space-y-2 ">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-bold text-black">
          Layers{" "}
          {(shapeManager?.getAllShapes()?.length ?? 0) > 0 &&
            ": " + shapeManager?.getAllShapes()?.length + " shape"}{" "}
        </h2>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={shapes.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {[...shapes].reverse().map((shape) => (
            <SortableItem
              key={shape.id}
              shape={shape}
              selected={selectedId === shape.id}
              onSelect={() => handleSelect(shape.id)}
              onDelete={() => handleDelete(shape.id)}
              onSetOrder={(order) => handleSetOrder(shape.id, order)}
              onToggleStep={(checked) => handleToggleStep(shape.id, checked)}
              maxOrder={maxOrder}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
