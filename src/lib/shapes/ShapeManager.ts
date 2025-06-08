import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import { Rectangle } from "./Rectangle";
import { Arrow } from "./Arrow";
import { Circle } from "./Circle";
import { Curve } from "./Curve";
import { Text } from "./Text";
import type { FeatureCollection, Point } from "geojson";

export class ShapeManager {
  private shapes = new Map<string, Shape>();
  private selectedShapeId: string | null = null;

  private handleSourceId = "shape-handles-source";
  private handleLayerId = "shape-handles-layer";

  constructor(private map: mapboxgl.Map) {
    // Rectangle
    const rect1 = new Rectangle("rectangle-1749356559906", {
      coordinates: [
        new mapboxgl.LngLat(105.73023579121099, 20.960929045561713),
        new mapboxgl.LngLat(105.82832341390326, 21.005053017119337),
      ],
    });
    rect1.strokeColor = "#ff0000";
    rect1.strokeWidth = 4;
    this.addShape(rect1);

    // Text 1
    const text1 = new Text("text-1749356623113", {
      position: new mapboxgl.LngLat(105.77749363011179, 20.996725615062232),
      content: "Căn cứ địch",
      color: "#000",
      fontSize: 16,
    });
    text1.strokeColor = "#000";
    text1.strokeWidth = 4;
    this.addShape(text1);

    // Arrow 1
    const arrow1 = new Arrow("arrow-1749356635523", {
      anchors: [
        new mapboxgl.LngLat(105.62949909576616, 21.073287275612998),
        new mapboxgl.LngLat(105.72577582305593, 21.06664460249884),
        new mapboxgl.LngLat(105.73558737381057, 21.02919291721625),
      ],
    });
    arrow1.strokeColor = "#2270ca";
    arrow1.strokeWidth = 4;
    this.addShape(arrow1);

    // Arrow 2
    const arrow2 = new Arrow("arrow-1749356641725", {
      anchors: [
        new mapboxgl.LngLat(105.91660493174487, 21.047503228492772),
        new mapboxgl.LngLat(105.85151116584296, 21.064143276054367),
        new mapboxgl.LngLat(105.82030624297118, 21.0233603625569),
      ],
    });
    arrow2.strokeColor = "#2270ca";
    arrow2.strokeWidth = 4;
    this.addShape(arrow2);

    // Arrow 3
    const arrow3 = new Arrow("arrow-1749356647218", {
      anchors: [
        new mapboxgl.LngLat(105.91928057009278, 20.884296891780508),
        new mapboxgl.LngLat(105.83545685282337, 20.862633021890204),
        new mapboxgl.LngLat(105.81405540987328, 20.931779144189505),
      ],
    });
    arrow3.strokeColor = "#2270ca";
    arrow3.strokeWidth = 4;
    this.addShape(arrow3);

    // Circle
    const circle1 = new Circle("circle-1749356806712", {
      center: new mapboxgl.LngLat(105.54010836430763, 20.76873302145212),
      radius: 6411.097633758871,
    });
    circle1.strokeColor = "#2270ca";
    circle1.strokeWidth = 12;
    this.addShape(circle1);

    // Arrow 4
    const arrow4 = new Arrow("arrow-1749356827697", {
      anchors: [
        new mapboxgl.LngLat(105.70437778308326, 20.969253666097188),
        new mapboxgl.LngLat(105.57688831450469, 20.879304907090898),
        new mapboxgl.LngLat(105.5583381256306, 20.8410299413885),
      ],
    });
    arrow4.strokeColor = "#ff0e0e";
    arrow4.strokeWidth = 4;
    this.addShape(arrow4);

    // Arrow 5
    const arrow5 = new Arrow("arrow-1749356839597", {
      anchors: [
        new mapboxgl.LngLat(105.75699164394541, 20.918453616014887),
        new mapboxgl.LngLat(105.7417389251597, 20.814297901353918),
        new mapboxgl.LngLat(105.62068654240244, 20.791862461395894),
      ],
    });
    arrow5.strokeColor = "#fc1a1a";
    arrow5.strokeWidth = 4;
    this.addShape(arrow5);

    // Curve
    const curve1 = new Curve("curve-1749356895172", {
      controlPoints: [
        new mapboxgl.LngLat(105.98170261029884, 21.11566846917978),
        new mapboxgl.LngLat(106.0583924587313, 21.037465175886055),
        new mapboxgl.LngLat(105.97546041333368, 20.935073237401795),
        new mapboxgl.LngLat(106.05571723146181, 20.866772961684276),
        new mapboxgl.LngLat(105.987944807264, 20.762596895940675),
      ],
    });
    curve1.strokeColor = "#7ed321";
    curve1.strokeWidth = 12;
    this.addShape(curve1);

    // Text 2
    const text2 = new Text("text-1749356921990", {
      position: new mapboxgl.LngLat(105.53804162557958, 20.78476093865099),
      content: "Căn cứ ta",
      color: "#8b572a",
      fontSize: 16,
    });
    text2.strokeColor = "#000";
    text2.strokeWidth = 4;
    this.addShape(text2);

    // ...rest of ShapeManager...
  }

  private listeners: (() => void)[] = [];

  subscribe(listener: () => void) {
    this.listeners.push(listener);
  }

  unsubscribe(listener: () => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  private notifyChange() {
    for (const listener of this.listeners) listener();
  }

  addShape(shape: Shape): void {
    this.shapes.set(shape.id, shape);
    shape.draw(this.map);
    this.notifyChange();
  }

  removeShape(id: string): void {
    const shape = this.shapes.get(id);
    if (!shape) return;
    shape.remove(this.map);
    this.shapes.delete(id);
    if (this.selectedShapeId === id) {
      this.clearHandles();
    }
    this.notifyChange();
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
    this.notifyChange();
  }

  deselectShape(id: string): void {
    const shape = this.shapes.get(id);
    if (shape) shape.deselect();
    if (this.selectedShapeId === id) {
      this.selectedShapeId = null;
      this.clearHandles();
    }
    this.notifyChange();
  }

  clearSelection(): void {
    if (this.selectedShapeId) {
      this.deselectShape(this.selectedShapeId);
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

  setShapes(newShapes: Shape[]): void {
    this.shapes.clear();
    for (const shape of newShapes) {
      this.shapes.set(shape.id, shape);
    }
    this.notifyChange();
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
    this.notifyChange();
  }
}
