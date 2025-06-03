"use client";

import { Map } from "@/components/Map";
import { Navbar } from "@/components/Navbar";
import { useEffect, useRef, useState } from "react";
import { ShapeList } from "@/components/ShapeList";
import { usePresentationStore } from "@/store/usePresentationStore";
import { ShapeStylePanel } from "@/components/ShapeStylePanel";
import { useMapStore } from "@/store/useMapStore";
import { Shape } from "@/lib/shapes/Shape";

export default function HomePage() {
  const { isPresenting, stopPresentation } = usePresentationStore();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { shapeManager } = useMapStore();
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null);

  useEffect(() => {
    if (!shapeManager) return;

    const update = () => {
      const current = shapeManager.getSelectedShape();
      setSelectedShape(current);
    };

    shapeManager.subscribe(update);
    update();

    return () => shapeManager.unsubscribe(update);
  }, [shapeManager]);

  // Tự động bật/tắt fullscreen khi presentationMode thay đổi
  useEffect(() => {
    if (isPresenting && mapContainerRef.current) {
      const el = mapContainerRef.current;
      if (el.requestFullscreen) el.requestFullscreen();
      const onExit = () => stopPresentation();
      document.addEventListener("fullscreenchange", () => {
        if (!document.fullscreenElement) onExit();
      });
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          stopPresentation();
          if (document.fullscreenElement) document.exitFullscreen();
        }
      };
      document.addEventListener("keydown", onKeyDown);
      return () => {
        document.removeEventListener("keydown", onKeyDown);
      };
    }
  }, [isPresenting]);

  return (
    <main className="w-screen h-screen flex flex-col">
      {/* Navbar ở trên cùng */}
      {!isPresenting && <Navbar />}

      {/* Phần còn lại chia đôi: SlideList + Map */}
      <div className="flex flex-1 h-0">
        {/* SlideList bên trái */}
        {!isPresenting && (
          <div className="flex-1/5 border-r border-gray-300 bg-white overflow-y-auto">
            <ShapeList />
          </div>
        )}
        {/* Map chiếm phần còn lại */}
        <div
          ref={mapContainerRef}
          className={
            isPresenting
              ? "fixed inset-0 z-10 w-screen h-screen bg-black"
              : "relative w-full h-full"
          }
        >
          <Map />
          {selectedShape && selectedShape.type != "text" && (
            <div className="absolute top-4 right-4 z-50">
              <ShapeStylePanel shape={selectedShape} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
