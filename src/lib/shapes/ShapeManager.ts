import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { FeatureCollection, Point } from "geojson";

export class ShapeManager {
  private shapes = new Map<string, Shape>();
  private selectedShapeId: string | null = null;

  private handleSourceId = "shape-handles-source";
  private handleLayerId = "shape-handles-layer";

  constructor(private map: mapboxgl.Map) {}

  addShape(shape: Shape): void {
    this.shapes.set(shape.id, shape);
    shape.draw(this.map);
  }

  removeShape(id: string): void {
    const shape = this.shapes.get(id);
    if (!shape) return;
    shape.remove(this.map);
    this.shapes.delete(id);
    if (this.selectedShapeId === id) {
      this.clearHandles();
      this.selectedShapeId = null;
    }
  }

  selectShape(id: string): void {
    if (this.selectedShapeId && this.selectedShapeId !== id) {
      this.deselectShape(this.selectedShapeId);
    }
    const shape = this.shapes.get(id);
    if (shape) {
      shape.select();
      this.selectedShapeId = id;
      this.drawHandlesForSelectedShape();
    }
  }

  deselectShape(id: string): void {
    const shape = this.shapes.get(id);
    if (shape) shape.deselect();
    if (this.selectedShapeId === id) {
      this.selectedShapeId = null;
      this.clearHandles();
    }
  }

  moveShapeByDelta(id: string, dx: number, dy: number): void {
    const shape = this.shapes.get(id);
    if (shape) shape.moveByDelta(dx, dy, this.map);
  }

  getShape(id: string): Shape | undefined {
    return this.shapes.get(id);
  }

  getSelectedShape(): Shape | null {
    return this.selectedShapeId
      ? this.shapes.get(this.selectedShapeId) ?? null
      : null;
  }

  getAllShapes(): Shape[] {
    return [...this.shapes.values()];
  }

  drawHandlesForSelectedShape(): void {
    if (!this.selectedShapeId) return;

    const shape = this.shapes.get(this.selectedShapeId);
    if (!shape) return;

    const handles = shape.getBoundingBoxHandles();
    const features = handles.map(
      (lngLat, i): GeoJSON.Feature<Point> => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lngLat.lng, lngLat.lat],
        },
        properties: {
          index: i,
        },
      })
    );

    const geojson: FeatureCollection<Point> = {
      type: "FeatureCollection",
      features,
    };

    const existingSource = this.map.getSource(
      this.handleSourceId
    ) as mapboxgl.GeoJSONSource;
    if (existingSource) {
      existingSource.setData(geojson);
    } else {
      this.map.addSource(this.handleSourceId, {
        type: "geojson",
        data: geojson,
      });

      this.map.addLayer({
        id: this.handleLayerId,
        type: "circle",
        source: this.handleSourceId,
        paint: {
          "circle-radius": 4,
          "circle-color": "#f00",
        },
      });
    }
  }

  clearHandles(): void {
    if (this.map.getLayer(this.handleLayerId)) {
      this.map.removeLayer(this.handleLayerId);
    }
    if (this.map.getSource(this.handleSourceId)) {
      this.map.removeSource(this.handleSourceId);
    }
  }
}
