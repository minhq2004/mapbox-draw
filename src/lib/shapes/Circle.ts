import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { Feature, Point, Polygon } from "geojson";

interface CircleData {
  center: mapboxgl.LngLat;
  radius: number; // đơn vị: mét
  rx?: number;
  ry?: number;
  color?: string;
}

export class Circle extends Shape {
  data: CircleData;
  layerId: string;
  sourceId: string;

  constructor(id: string, data: CircleData) {
    super(id, "circle");
    this.data = data;
    this.sourceId = `circle-source-${id}`;
    this.layerId = `circle-layer-${id}`;
  }

  getGeoJSONGeometry(): Polygon {
    const { center } = this.data;
    const rx = this.data.rx ?? this.data.radius;
    const ry = this.data.ry ?? this.data.radius;
    const points: [number, number][] = [];
    const steps = 64;
    for (let i = 0; i <= steps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const dx = (rx / 111320) * Math.cos(angle);
      const dy = (ry / 110540) * Math.sin(angle);
      points.push([center.lng + dx, center.lat + dy]);
    }
    return {
      type: "Polygon",
      coordinates: [points],
    };
  }

  draw(map: mapboxgl.Map): void {
    const geojson = this.toGeoJSON();

    if (!map.getSource(this.sourceId)) {
      map.addSource(this.sourceId, {
        type: "geojson",
        data: geojson,
      });
    }

    if (!map.getLayer(this.layerId)) {
      map.addLayer({
        id: this.layerId,
        type: "fill",
        source: this.sourceId,
        paint: {
          "fill-color": "#fff",
          "fill-opacity": 0.9,
          "fill-outline-color": this.isSelected ? "#f00" : "#000",
          "circle-stroke-color": "#f00",
        },
      });
    } else {
      const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
      source.setData(geojson);
    }
  }

  update(data: CircleData): void {
    this.data = data;
  }

  moveByDelta(deltaLng: number, deltaLat: number, map: mapboxgl.Map): void {
    const { center } = this.data;
    this.data.center = new mapboxgl.LngLat(
      center.lng + deltaLng,
      center.lat + deltaLat
    );
    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(this.toGeoJSON());
    }
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    const { center, radius } = this.data;
    // Nếu là elip, có thể có rx, ry. Ở đây mặc định là hình tròn.
    const rx = this.data.rx ?? radius;
    const ry = this.data.ry ?? radius;
    const dLngX = rx / 111320;
    const dLatY = ry / 110540;

    return [
      // 0: top
      new mapboxgl.LngLat(center.lng, center.lat + dLatY),
      // 1: top-right
      new mapboxgl.LngLat(center.lng + dLngX, center.lat + dLatY),
      // 2: right
      new mapboxgl.LngLat(center.lng + dLngX, center.lat),
      // 3: bottom-right
      new mapboxgl.LngLat(center.lng + dLngX, center.lat - dLatY),
      // 4: bottom
      new mapboxgl.LngLat(center.lng, center.lat - dLatY),
      // 5: bottom-left
      new mapboxgl.LngLat(center.lng - dLngX, center.lat - dLatY),
      // 6: left
      new mapboxgl.LngLat(center.lng - dLngX, center.lat),
      // 7: top-left
      new mapboxgl.LngLat(center.lng - dLngX, center.lat + dLatY),
    ];
  }

  resizeByHandle(
    handleIndex: number,
    to: mapboxgl.LngLat,
    map: mapboxgl.Map
  ): void {
    const { center } = this.data;
    let rx = this.data.rx ?? this.data.radius;
    let ry = this.data.ry ?? this.data.radius;

    // Tính toán bán kính mới dựa vào vị trí handle
    switch (handleIndex) {
      case 0: // top
        ry = Math.abs(to.lat - center.lat) * 110540;
        break;
      case 2: // right
        rx = Math.abs(to.lng - center.lng) * 111320;
        break;
      case 4: // bottom
        ry = Math.abs(to.lat - center.lat) * 110540;
        break;
      case 6: // left
        rx = Math.abs(to.lng - center.lng) * 111320;
        break;
      case 1: // top-right
      case 3: // bottom-right
      case 5: // bottom-left
      case 7: // top-left
        // Scale đều hai trục, giữ hình tròn
        rx = Math.abs(to.lng - center.lng) * 111320;
        ry = Math.abs(to.lat - center.lat) * 110540;
        const r = Math.max(rx, ry);
        rx = r;
        ry = r;
        break;
    }

    // Lưu lại rx, ry (nếu là hình tròn thì rx=ry)
    this.data.rx = rx;
    this.data.ry = ry;
    this.data.radius = Math.max(rx, ry);

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(this.toGeoJSON());
    }
  }

  containsPoint(_point: mapboxgl.PointLike): boolean {
    return false;
  }

  remove(map: mapboxgl.Map): void {
    if (map.getLayer(this.layerId)) {
      map.removeLayer(this.layerId);
    }
    if (map.getSource(this.sourceId)) {
      map.removeSource(this.sourceId);
    }
  }
}
