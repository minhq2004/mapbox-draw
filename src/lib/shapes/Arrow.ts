import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { Geometry, GeometryCollection, Polygon } from "geojson";

export interface ArrowData {
  anchors: [mapboxgl.LngLat, mapboxgl.LngLat, mapboxgl.LngLat];
  thickness?: number;
  headLength?: number;
  headWidth?: number;
}

export class Arrow extends Shape {
  data: ArrowData;
  sourceId: string;
  layerId: string;

  constructor(id: string, data: ArrowData) {
    super(id, "arrow");
    this.data = data;
    this.sourceId = `arrow-source-${id}`;
    this.layerId = `arrow-layer-${id}`;
  }

  getGeoJSONGeometry(): Geometry {
    const {
      anchors,
      thickness = 0.1,
      headLength = 0.5,
      headWidth = 0.5,
    } = this.data;

    const [p0, p1, p2] = anchors;
    const curve = getQuadraticBezierPoints(p0, p1, p2, 30);
    const head = createArrowHead(
      p2,
      curve[curve.length - 2],
      headWidth,
      headLength
    );
    const body = createArrowBody(curve, thickness);

    return {
      type: "GeometryCollection",
      geometries: [body, head],
    };
  }
  toGeoJSON(): GeoJSON.Feature<GeometryCollection> {
    const {
      anchors,
      thickness = 0.2,
      headLength = 0.3,
      headWidth = 0.3,
    } = this.data;

    const [p0, p1, p2] = anchors;
    const coords = getQuadraticBezierPoints(p0, p1, p2, 30);

    const head = createArrowHead(
      p2,
      coords[coords.length - 2],
      headWidth,
      headLength
    );
    const body = createArrowBody(coords, thickness);

    return {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: [body, head],
      },
      properties: {},
    };
  }

  draw(map: mapboxgl.Map): void {
    const geojson = this.toGeoJSON();
    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData(geojson);
    } else {
      map.addSource(this.sourceId, {
        type: "geojson",
        data: geojson,
      });
    }
    if (!map.getLayer(this.layerId)) {
      map.addLayer({
        id: this.layerId,
        type: "line",
        source: this.sourceId,
        paint: {
          "line-color": this.strokeColor,
          "line-width": this.strokeWidth,
        },
      });
    } else {
      map.setPaintProperty(this.layerId, "line-color", this.strokeColor);
      map.setPaintProperty(this.layerId, "line-width", this.strokeWidth);
    }
  }

  update(data: ArrowData): void {
    this.data = data;
  }

  moveByDelta(dx: number, dy: number, map: mapboxgl.Map): void {
    this.data.anchors = this.data.anchors.map(
      (p) => new mapboxgl.LngLat(p.lng + dx, p.lat + dy)
    ) as [mapboxgl.LngLat, mapboxgl.LngLat, mapboxgl.LngLat];

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) source.setData(this.toGeoJSON());
  }

  clone(): Shape {
    const id = `arrow-${Date.now()}`;
    return new Arrow(id, {
      anchors: this.data.anchors.map(
        (p) => new mapboxgl.LngLat(p.lng, p.lat)
      ) as [mapboxgl.LngLat, mapboxgl.LngLat, mapboxgl.LngLat],
      thickness: this.data.thickness,
      headLength: this.data.headLength,
      headWidth: this.data.headWidth,
    });
  }

  remove(map: mapboxgl.Map): void {
    if (map.getLayer(this.layerId)) map.removeLayer(this.layerId);
    if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
  }

  containsPoint(): boolean {
    return false;
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    return this.data.anchors;
  }

  resizeByHandle(
    index: number,
    newPoint: mapboxgl.LngLat,
    map: mapboxgl.Map
  ): void {
    this.data.anchors[index] = newPoint;
    this.draw(map); // cập nhật lại hình
  }
}

// Helper function: Bezier curve
function getQuadraticBezierPoints(
  p0: mapboxgl.LngLat,
  p1: mapboxgl.LngLat,
  p2: mapboxgl.LngLat,
  steps: number
): [number, number][] {
  const points: [number, number][] = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    const x =
      (1 - t) ** 2 * p0.lng + 2 * (1 - t) * t * p1.lng + t ** 2 * p2.lng;
    const y =
      (1 - t) ** 2 * p0.lat + 2 * (1 - t) * t * p1.lat + t ** 2 * p2.lat;
    points.push([x, y]);
  }
  return points;
}

// Helper function: Arrow body (polygon around curve)
function createArrowBody(
  curve: [number, number][],
  thickness: number
): Polygon {
  const left: [number, number][] = [];
  const right: [number, number][] = [];

  for (let i = 0; i < curve.length - 1; i++) {
    const [x1, y1] = curve[i];
    const [x2, y2] = curve[i + 1];
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const dx = (thickness / 2) * Math.sin(angle);
    const dy = (thickness / 2) * -Math.cos(angle);
    left.push([x1 + dx, y1 + dy]);
    right.unshift([x1 - dx, y1 - dy]);
  }

  return {
    type: "Polygon",
    coordinates: [[...left, ...right, left[0]]],
  };
}

// Helper function: Arrow head (triangle polygon)
function createArrowHead(
  tip: mapboxgl.LngLat,
  before: [number, number],
  width: number,
  length: number
): Polygon {
  const angle = Math.atan2(tip.lat - before[1], tip.lng - before[0]);

  const left = [
    tip.lng - length * Math.cos(angle) + width * Math.sin(angle),
    tip.lat - length * Math.sin(angle) - width * Math.cos(angle),
  ];

  const right = [
    tip.lng - length * Math.cos(angle) - width * Math.sin(angle),
    tip.lat - length * Math.sin(angle) + width * Math.cos(angle),
  ];

  return {
    type: "Polygon",
    coordinates: [[[tip.lng, tip.lat], left, right, [tip.lng, tip.lat]]],
  };
}
