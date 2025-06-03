import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { MultiLineString } from "geojson";

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

  getGeoJSONGeometry(): MultiLineString {
    const { anchors, headLength = 0.2, headWidth = 0.2 } = this.data;
    const [p0, p1, p2] = anchors;
    const curve = getQuadraticBezierPoints(p0, p1, p2, 30);
    const lineCoords = curve.map(([lng, lat]) => [lng, lat]);

    // Scale head theo linewidth
    const scale = this.strokeWidth || 1;
    const scaledHeadLength = headLength * scale * 0.3; // 1.5 là hệ số, bạn có thể chỉnh
    const scaledHeadWidth = headWidth * scale * 0.3; // 1.2 là hệ số, bạn có thể chỉnh

    // Tính toán đầu mũi tên (arrow head)
    const [bx, by] = curve[curve.length - 2];
    const [tx, ty] = curve[curve.length - 1];
    const angle = Math.atan2(ty - by, tx - bx);

    // Hai nhánh chữ V của đầu mũi tên
    const left: [number, number] = [
      tx -
        scaledHeadLength * Math.cos(angle) +
        scaledHeadWidth * Math.sin(angle),
      ty -
        scaledHeadLength * Math.sin(angle) -
        scaledHeadWidth * Math.cos(angle),
    ];
    const right: [number, number] = [
      tx -
        scaledHeadLength * Math.cos(angle) -
        scaledHeadWidth * Math.sin(angle),
      ty -
        scaledHeadLength * Math.sin(angle) +
        scaledHeadWidth * Math.cos(angle),
    ];

    return {
      type: "MultiLineString",
      coordinates: [
        lineCoords, // thân
        [left, [tx, ty], right],
      ],
    };
  }

  draw(map: mapboxgl.Map): void {
    const geojson = this.toGeoJSON();

    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: "geojson",
        data: geojson,
      });
    } else {
      const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
      source.setData(geojson);
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
    const clonned = new Arrow(id, {
      anchors: this.data.anchors.map(
        (p) => new mapboxgl.LngLat(p.lng, p.lat)
      ) as [mapboxgl.LngLat, mapboxgl.LngLat, mapboxgl.LngLat],
      thickness: this.data.thickness,
      headLength: this.data.headLength,
      headWidth: this.data.headWidth,
    });
    clonned.strokeColor = this.strokeColor;
    clonned.strokeWidth = this.strokeWidth;
    return clonned;
  }

  remove(map: mapboxgl.Map): void {
    if (map.getLayer(this.layerId)) map.removeLayer(this.layerId);
    if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    // 3 anchor
    const anchors = this.data.anchors;
    // 4 góc bounding box
    const allPoints = anchors.map((p) => [p.lng, p.lat]);
    const xs = allPoints.map((p) => p[0]);
    const ys = allPoints.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs);
    const minY = Math.min(...ys),
      maxY = Math.max(...ys);
    // 4 góc: TL, TR, BR, BL
    const corners = [
      new mapboxgl.LngLat(minX, maxY), // top-left
      new mapboxgl.LngLat(maxX, maxY), // top-right
      new mapboxgl.LngLat(maxX, minY), // bottom-right
      new mapboxgl.LngLat(minX, minY), // bottom-left
    ];
    return [...anchors, ...corners];
  }

  resizeByHandle(
    index: number,
    newPoint: mapboxgl.LngLat,
    map: mapboxgl.Map
  ): void {
    if (index < 3) {
      // Anchor: chỉnh như cũ
      this.data.anchors[index] = newPoint;
    } else {
      // Scale theo bounding box
      // 3 anchor gốc
      const anchors = this.data.anchors;
      // 4 góc cũ
      const allPoints = anchors.map((p) => [p.lng, p.lat]);
      const xs = allPoints.map((p) => p[0]);
      const ys = allPoints.map((p) => p[1]);
      const minX = Math.min(...xs),
        maxX = Math.max(...xs);
      const minY = Math.min(...ys),
        maxY = Math.max(...ys);

      // Xác định góc nào đang kéo
      // 3: TL, 4: TR, 5: BR, 6: BL
      let oldCorner: [number, number];
      let fixedCorner: [number, number];
      switch (index) {
        case 3: // top-left
          oldCorner = [minX, maxY];
          fixedCorner = [maxX, minY];
          break;
        case 4: // top-right
          oldCorner = [maxX, maxY];
          fixedCorner = [minX, minY];
          break;
        case 5: // bottom-right
          oldCorner = [maxX, minY];
          fixedCorner = [minX, maxY];
          break;
        case 6: // bottom-left
          oldCorner = [minX, minY];
          fixedCorner = [maxX, maxY];
          break;
        default:
          return;
      }

      // Scale các anchor theo 2 góc: fixedCorner (giữ nguyên), oldCorner (kéo thành newPoint)
      const oldW = oldCorner[0] - fixedCorner[0];
      const oldH = oldCorner[1] - fixedCorner[1];
      const newW = newPoint.lng - fixedCorner[0];
      const newH = newPoint.lat - fixedCorner[1];

      // Tránh chia 0
      const scaleX = oldW !== 0 ? newW / oldW : 1;
      const scaleY = oldH !== 0 ? newH / oldH : 1;

      // Scale từng anchor
      this.data.anchors = anchors.map((p) => {
        const x = fixedCorner[0] + (p.lng - fixedCorner[0]) * scaleX;
        const y = fixedCorner[1] + (p.lat - fixedCorner[1]) * scaleY;
        return new mapboxgl.LngLat(x, y);
      }) as [mapboxgl.LngLat, mapboxgl.LngLat, mapboxgl.LngLat];
    }
    this.draw(map);
  }

  static fromJSON(obj: any): Arrow {
    const anchors = obj.data.anchors.map(
      (p: any) => new mapboxgl.LngLat(p.lng, p.lat)
    ) as [mapboxgl.LngLat, mapboxgl.LngLat, mapboxgl.LngLat];
    const arrow = new Arrow(obj.id, {
      anchors,
      thickness: obj.data.thickness,
      headLength: obj.data.headLength,
      headWidth: obj.data.headWidth,
    });
    arrow.strokeColor = obj.strokeColor;
    arrow.strokeWidth = obj.strokeWidth;
    arrow.presentationOrder = obj.presentationOrder ?? null;
    return arrow;
  }

  toJSON(): any {
    return {
      id: this.id,
      type: this.type,
      data: {
        anchors: this.data.anchors.map((p) => ({
          lng: p.lng,
          lat: p.lat,
        })),
        thickness: this.data.thickness,
        headLength: this.data.headLength,
        headWidth: this.data.headWidth,
      },
      strokeColor: this.strokeColor,
      strokeWidth: this.strokeWidth,
      presentationOrder: this.presentationOrder,
    };
  }
}

// Helper function: Bezier curve
function getQuadraticBezierPoints(
  p0: mapboxgl.LngLat,
  p1: mapboxgl.LngLat,
  p2: mapboxgl.LngLat,
  steps: number
): [number, number][] {
  const pts: [number, number][] = [];
  for (let t = 0; t <= 1; t += 1 / steps) {
    const x =
      (1 - t) ** 2 * p0.lng + 2 * (1 - t) * t * p1.lng + t ** 2 * p2.lng;
    const y =
      (1 - t) ** 2 * p0.lat + 2 * (1 - t) * t * p1.lat + t ** 2 * p2.lat;
    pts.push([x, y]);
  }
  return pts;
}
