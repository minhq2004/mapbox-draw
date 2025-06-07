import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { useMapStore } from "@/store/useMapStore";
import { useMapDrawingTools } from "@/hooks/useMapDrawingTools";
import { usePresentationStore } from "@/store/usePresentationStore";
import { FaLock, FaUnlock } from "react-icons/fa";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

export const Map = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const { isViewportLocked, toggleViewportLock, shapeManager } = useMapStore();
  const { isPresenting, currentStep, setStep } = usePresentationStore();

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Initialize map
    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/standard",
      center: [106.8272, 15.8231], // [longitude, latitude]
      zoom: 5,
      preserveDrawingBuffer: true,
    });

    if (isViewportLocked && mapRef.current) {
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
      mapRef.current.touchPitch.disable();
    }

    return () => {
      if (mapRef.current) {
        useMapStore.getState().setMap(mapRef.current);
      }
    };
  }, [mapRef.current]);

  useMapDrawingTools();

  // Khi bắt đầu hoặc kết thúc trình chiếu, cập nhật trạng thái shape
  useEffect(() => {
    if (!mapRef.current || !shapeManager) return;

    const all = shapeManager.getAllShapes();

    if (isPresenting) {
      // 1. Ẩn toàn bộ shape có presentationOrder
      all.forEach((shape) => {
        if (shape.presentationOrder !== null) {
          shape.remove(mapRef.current!);
        }
      });
      // 2. Hiện toàn bộ shape không có presentationOrder
      all.forEach((shape) => {
        if (shape.presentationOrder === null) {
          shape.draw(mapRef.current!);
        }
      });
    } else {
      // Khi thoát trình chiếu, hiện lại toàn bộ shape
      all.forEach((shape) => {
        shape.draw(mapRef.current!);
      });
    }
  }, [isPresenting, shapeManager, setStep]);

  // Trình chiếu: nhấn mũi tên để hiện/ẩn shape theo thứ tự
  useEffect(() => {
    if (!mapRef.current || !shapeManager || !isPresenting) return;

    const all = shapeManager.getAllShapes();
    const ordered = all
      .filter((s) => s.presentationOrder !== null)
      .sort((a, b) => a.presentationOrder! - b.presentationOrder!);

    // Hiện các shape theo currentStep
    ordered.forEach((shape) => {
      if (shape.presentationOrder! <= currentStep) {
        shape.draw(mapRef.current!);
      } else {
        shape.remove(mapRef.current!);
      }
    });
  }, [currentStep, isPresenting, shapeManager]);

  // Xử lý phím mũi tên khi trình chiếu
  useEffect(() => {
    if (!isPresenting || !shapeManager) return;

    const all = shapeManager.getAllShapes();
    const orderedSteps = Array.from(
      new Set(
        all
          .filter((s) => s.presentationOrder !== null)
          .map((s) => s.presentationOrder!)
      )
    ).sort((a, b) => a - b);

    orderedSteps.unshift(0);

    const handleKey = (e: KeyboardEvent) => {
      const idx = orderedSteps.indexOf(currentStep);

      if (e.key === "ArrowRight" && idx < orderedSteps.length - 1) {
        const next = orderedSteps[idx + 1];
        setStep(next);
      }

      if (e.key === "ArrowLeft" && idx > 0) {
        const prev = orderedSteps[idx - 1];
        setStep(prev);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isPresenting, currentStep, shapeManager]);

  // Toggle viewport lock
  const handleToggleViewport = () => {
    if (!mapRef.current) return;

    if (!isViewportLocked) {
      // Lock viewport - disable interactions
      mapRef.current.dragPan.disable();
      mapRef.current.scrollZoom.disable();
      mapRef.current.doubleClickZoom.disable();
      mapRef.current.touchZoomRotate.disable();
      mapRef.current.boxZoom.disable();
      mapRef.current.touchPitch.disable();
      mapRef.current.dragRotate.disable();
      mapRef.current.keyboard.disable();
    } else {
      // Unlock viewport - enable interactions
      mapRef.current.dragPan.enable();
      mapRef.current.scrollZoom.enable();
      mapRef.current.doubleClickZoom.enable();
      mapRef.current.touchZoomRotate.enable();
      mapRef.current.boxZoom.enable();
      mapRef.current.touchPitch.enable();
      mapRef.current.dragRotate.enable();
      mapRef.current.keyboard.enable();
    }

    // Update state in store
    toggleViewportLock();
  };

  return (
    <div className="flex flex-col w-full h-full">
      <div className="relative flex-grow">
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
          {!isPresenting && (
            <button
              onClick={handleToggleViewport}
              className="px-4 py-2 bg-white text-[#f3353d] rounded shadow"
              title={isViewportLocked ? "Unlock" : "Lock"}
            >
              {isViewportLocked ? <FaUnlock /> : <FaLock />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
