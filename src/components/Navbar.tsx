import { ComponentType } from "react";
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
import { TextStylePanel } from "./TextStylePanel";

export const Navbar = () => {
  const { activeTool, setActiveTool } = useDrawingStore();
  const { startPresentation } = usePresentationStore();

  const handleToolSelect = (tool: DrawingTool) => {
    setActiveTool(tool);
  };

  return (
    <div className="bg-white shadow-md w-full px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="font-bold text-lg text-blue-500">MapDraw</div>
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

      <div className="absolute top-16 right-4 z-50">
        <TextStylePanel />
      </div>

      {/* Function buttons */}
      <div className="flex space-x-2">
        <button
          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex gap-2 items-center font-bold"
          onClick={startPresentation}
        >
          <PlayIcon className="size-5"></PlayIcon>
          Present
        </button>
      </div>
    </div>
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
  return (
    <button
      className={`px-3 py-1 rounded text-black ${
        active ? "bg-blue-200" : "hover:bg-gray-200"
      }`}
      onClick={onClick}
      title={label}
    >
      <Icon />
    </button>
  );
};
