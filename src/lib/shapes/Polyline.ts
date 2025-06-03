import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { LineString } from "geojson";

export interface PolylineData {
  coordinates: mapboxgl.LngLat[];
  color?: string;
}

export class Polyline extends Shape {
  data: PolylineData;
  sourceId: string;
  layerId: string;

  constructor(id: string, data: PolylineData) {
    super(id, "polyline");
    this.data = data;
    this.sourceId = `polyline-source-${id}`;
    this.layerId = `polyline-layer-${id}`;
  }

  getGeoJSONGeometry(): LineString {
    return {
      type: "LineString",
      coordinates: this.data.coordinates.map((p) => [p.lng, p.lat]),
    };
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    const coords = this.data.coordinates;
    if (coords.length < 2) return [];

    const lats = coords.map((p) => p.lat);
    const lngs = coords.map((p) => p.lng);
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
    const coords = this.data.coordinates;
    if (coords.length < 2) return;

    const lats = coords.map((p) => p.lat);
    const lngs = coords.map((p) => p.lng);

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    let scaleX = 1;
    let scaleY = 1;

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

    this.data.coordinates = coords.map(
      (p) =>
        new mapboxgl.LngLat(
          centerLng + (p.lng - centerLng) * scaleX,
          centerLat + (p.lat - centerLat) * scaleY
        )
    );

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(this.toGeoJSON());
    }
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

  update(data: PolylineData): void {
    this.data = data;
  }

  moveByDelta(dx: number, dy: number, map: mapboxgl.Map): void {
    this.data.coordinates = this.data.coordinates.map(
      (p) => new mapboxgl.LngLat(p.lng + dx, p.lat + dy)
    );
    this.draw(map);
  }

  clone(): Shape {
    const id = `polyline-${Date.now()}`;
    const cloned = new Polyline(id, {
      coordinates: this.data.coordinates.map(
        (p) => new mapboxgl.LngLat(p.lng, p.lat)
      ),
      color: this.data.color,
    });
    cloned.strokeColor = this.strokeColor;
    cloned.strokeWidth = this.strokeWidth;
    return cloned;
  }

  remove(map: mapboxgl.Map): void {
    if (map.getLayer(this.layerId)) map.removeLayer(this.layerId);
    if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
  }
}
