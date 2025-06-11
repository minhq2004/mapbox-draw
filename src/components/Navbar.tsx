import { ComponentType, useState } from "react";
import {
  MousePointer,
  MoveUpRight,
  Slash,
  Spline,
  RectangleHorizontal,
  Circle,
  Type,
  PlayIcon,
} from "lucide-react";
import { useDrawingStore } from "@/store/useDrawingStore";
import type { DrawingTool } from "@/store/useDrawingStore";
import { usePresentationStore } from "@/store/usePresentationStore";
import { useMapStore } from "@/store/useMapStore";

export const Navbar = () => {
  const { activeTool, setActiveTool } = useDrawingStore();
  const { startPresentation } = usePresentationStore();
  const { isViewportLocked, toggleViewportLock } = useMapStore();

  const [hint, setHint] = useState<string | null>(null);

  const handlePresent = () => {
    if (!isViewportLocked) {
      toggleViewportLock();
    }
    startPresentation();
  };

  const handleToolSelect = (tool: DrawingTool) => {
    setActiveTool(tool);
    // Gợi ý cho từng tool
    if (tool === "rectangle") {
      setHint("Drag the start and end points to create a rectangle.");
    } else if (tool === "arrow") {
      setHint("Select 3 points to create an arrow");
    } else if (tool === "circle") {
      setHint("Select 1 point and drag to create a circle");
    } else if (tool === "polyline") {
      setHint("Select each point to create a polyline. Press enter to finish");
    } else if (tool === "curve") {
      setHint("Select each point to create a curve. Press enter to finish");
    } else if (tool === "text") {
      setHint(
        "Drag and drop an area to create a text box. Press enter when finish typing"
      );
    } else {
      setHint(null);
    }
  };

  return (
    <>
      <div className="bg-white shadow-md w-full px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="font-bold text-xl text-[#f3353d]">MapDraw</div>
        </div>

        {/* Drawing tools */}
        <div className="flex space-x-2">
          <ToolButton
            name="select"
            label="Select"
            active={activeTool === "select"}
            onClick={() => handleToolSelect("select")}
            icon={MousePointer}
          />
          <ToolButton
            name="text"
            label="Text"
            active={activeTool === "text"}
            onClick={() => handleToolSelect("text")}
            icon={Type}
          />
          <ToolButton
            name="rectangle"
            label="Rectangle"
            active={activeTool === "rectangle"}
            onClick={() => handleToolSelect("rectangle")}
            icon={RectangleHorizontal}
          />
          <ToolButton
            name="circle"
            label="Circle"
            active={activeTool === "circle"}
            onClick={() => handleToolSelect("circle")}
            icon={Circle}
          />
          <ToolButton
            name="arrow"
            label="Arrow"
            active={activeTool === "arrow"}
            onClick={() => handleToolSelect("arrow")}
            icon={MoveUpRight}
          />
          <ToolButton
            name="polyline"
            label="Polyline"
            active={activeTool === "polyline"}
            onClick={() => handleToolSelect("polyline")}
            icon={Slash}
          />
          <ToolButton
            name="curve"
            label="Curve"
            active={activeTool === "curve"}
            onClick={() => handleToolSelect("curve")}
            icon={Spline}
          />
        </div>

        {/* Function buttons */}
        <div className="flex space-x-2">
          <button
            className="px-3 py-1 bg-[#f3353d] text-white rounded hover:bg-[#f3353edd] flex gap-2 items-center font-bold"
            onClick={handlePresent}
          >
            <PlayIcon className="size-5"></PlayIcon>
            Present
          </button>
        </div>
      </div>
      {/* Hiển thị hint ở góc dưới bên phải */}
      {hint && activeTool !== "select" && (
        <div className="fixed bottom-6 right-6 z-50 bg-black/80 text-white px-4 py-2 rounded shadow-lg text-sm pointer-events-none select-none">
          {hint}
        </div>
      )}
    </>
  );
};

// Component cho nút công cụ
interface ToolButtonProps {
  name: DrawingTool;
  label: string;
  active: boolean;
  onClick: () => void;
  icon: ComponentType;
}

const ToolButton = ({
  name,
  label,
  active,
  onClick,
  icon: Icon,
}: ToolButtonProps) => {
  const { isViewportLocked } = useMapStore();
  return (
    <button
      className={`px-3 py-1 rounded text-black ${
        active ? "bg-red-500 text-white" : "hover:bg-red-200"
      } ${!isViewportLocked && "cursor-not-allowed bg-gray-200 opacity-80"}`}
      onClick={onClick}
      title={label}
      disabled={!isViewportLocked}
    >
      <Icon />
    </button>
  );
};
