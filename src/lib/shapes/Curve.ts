import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { LineString } from "geojson";

export interface CurveData {
  controlPoints: mapboxgl.LngLat[];
  color?: string;
}

export class Curve extends Shape {
  data: CurveData;
  sourceId: string;
  layerId: string;

  constructor(id: string, data: CurveData) {
    super(id, "curve");
    this.data = data;
    this.sourceId = `curve-source-${id}`;
    this.layerId = `curve-layer-${id}`;
  }

  getCurvePoints(): [number, number][] {
    const pts = this.data.controlPoints.map((p) => [p.lng, p.lat]);

    // Simple Catmull-Rom like smoothing
    const smooth: [number, number][] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || pts[i + 1];

      for (let t = 0; t <= 1; t += 0.1) {
        const tt = t * t;
        const ttt = tt * t;

        const q0 = -ttt + 2 * tt - t;
        const q1 = 3 * ttt - 5 * tt + 2;
        const q2 = -3 * ttt + 4 * tt + t;
        const q3 = ttt - tt;

        const x = 0.5 * (p0[0] * q0 + p1[0] * q1 + p2[0] * q2 + p3[0] * q3);
        const y = 0.5 * (p0[1] * q0 + p1[1] * q1 + p2[1] * q2 + p3[1] * q3);
        smooth.push([x, y]);
      }
    }
    return smooth;
  }

  getGeoJSONGeometry(): LineString {
    return {
      type: "LineString",
      coordinates: this.getCurvePoints(),
    };
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    const pts = this.data.controlPoints;
    if (pts.length < 2) return [];
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    return [
      new mapboxgl.LngLat(minLng, minLat),
      new mapboxgl.LngLat(maxLng, minLat),
      new mapboxgl.LngLat(maxLng, maxLat),
      new mapboxgl.LngLat(minLng, maxLat),
      new mapboxgl.LngLat((minLng + maxLng) / 2, minLat),
      new mapboxgl.LngLat(maxLng, (minLat + maxLat) / 2),
      new mapboxgl.LngLat((minLng + maxLng) / 2, maxLat),
      new mapboxgl.LngLat(minLng, (minLat + maxLat) / 2),
    ];
  }

  resizeByHandle(index: number, to: mapboxgl.LngLat, map: mapboxgl.Map): void {
    const control = this.data.controlPoints;
    const lats = control.map((p) => p.lat);
    const lngs = control.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    let scaleX = 1,
      scaleY = 1;
    if ([0, 1, 2, 3].includes(index)) {
      const scaleRefLng = index === 1 || index === 2 ? maxLng : minLng;
      const scaleRefLat = index === 2 || index === 3 ? maxLat : minLat;
      scaleX = (to.lng - centerLng) / (scaleRefLng - centerLng);
      scaleY = (to.lat - centerLat) / (scaleRefLat - centerLat);
    } else if ([4, 6].includes(index)) {
      const scaleRefLat = index === 4 ? minLat : maxLat;
      scaleY = (to.lat - centerLat) / (scaleRefLat - centerLat);
    } else if ([5, 7].includes(index)) {
      const scaleRefLng = index === 5 ? maxLng : minLng;
      scaleX = (to.lng - centerLng) / (scaleRefLng - centerLng);
    }

    this.data.controlPoints = control.map(
      (p) =>
        new mapboxgl.LngLat(
          centerLng + (p.lng - centerLng) * scaleX,
          centerLat + (p.lat - centerLat) * scaleY
        )
    );

    this.draw(map);
  }

  moveByDelta(dx: number, dy: number, map: mapboxgl.Map): void {
    this.data.controlPoints = this.data.controlPoints.map(
      (p) => new mapboxgl.LngLat(p.lng + dx, p.lat + dy)
    );
    this.draw(map);
  }

  draw(map: mapboxgl.Map): void {
    const geojson = this.toGeoJSON();

    const source = map.getSource(this.sourceId);
    if (source && "setData" in source) {
      (source as mapboxgl.GeoJSONSource).setData(geojson);
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

  update(data: CurveData): void {
    this.data = data;
  }

  clone(): Shape {
    const id = `curve-${Date.now()}`;
    return new Curve(id, {
      controlPoints: this.data.controlPoints.map(
        (p) => new mapboxgl.LngLat(p.lng, p.lat)
      ),
      color: this.data.color,
    });
  }

  remove(map: mapboxgl.Map): void {
    if (map.getLayer(this.layerId)) map.removeLayer(this.layerId);
    if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
  }
}
