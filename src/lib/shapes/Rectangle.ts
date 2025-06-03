import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { Polygon } from "geojson";

interface RectangleData {
  coordinates: [mapboxgl.LngLat, mapboxgl.LngLat];
}

export class Rectangle extends Shape {
  data: RectangleData;
  layerId: string;
  sourceId: string;

  constructor(id: string, data: RectangleData) {
    super(id, "rectangle");
    this.data = data;
    this.sourceId = `rectangle-source-${id}`;
    this.layerId = `rectangle-layer-${id}`;
  }

  getGeoJSONGeometry(): Polygon {
    const [start, end] = this.data.coordinates;
    const coords = [
      [start.lng, start.lat],
      [end.lng, start.lat],
      [end.lng, end.lat],
      [start.lng, end.lat],
      [start.lng, start.lat],
    ];
    return {
      type: "Polygon",
      coordinates: [coords],
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

  update(data: RectangleData): void {
    this.data = data;
  }

  moveByDelta(deltaLng: number, deltaLat: number, map: mapboxgl.Map): void {
    const [start, end] = this.data.coordinates;

    const moved: [mapboxgl.LngLat, mapboxgl.LngLat] = [
      new mapboxgl.LngLat(start.lng + deltaLng, start.lat + deltaLat),
      new mapboxgl.LngLat(end.lng + deltaLng, end.lat + deltaLat),
    ];

    this.data.coordinates = moved;

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(this.toGeoJSON());
    }
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    const [start, end] = this.data.coordinates;
    const x1 = start.lng,
      y1 = start.lat;
    const x2 = end.lng,
      y2 = end.lat;

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    return [
      new mapboxgl.LngLat(x1, y1), // TL
      new mapboxgl.LngLat(midX, y1), // TM
      new mapboxgl.LngLat(x2, y1), // TR
      new mapboxgl.LngLat(x2, midY), // MR
      new mapboxgl.LngLat(x2, y2), // BR
      new mapboxgl.LngLat(midX, y2), // BM
      new mapboxgl.LngLat(x1, y2), // BL
      new mapboxgl.LngLat(x1, midY), // ML
    ];
  }

  resizeByHandle(
    handleIndex: number,
    to: mapboxgl.LngLat,
    map: mapboxgl.Map
  ): void {
    const [start, end] = this.data.coordinates;
    let x1 = start.lng,
      y1 = start.lat;
    let x2 = end.lng,
      y2 = end.lat;

    switch (handleIndex) {
      case 0:
        x1 = to.lng;
        y1 = to.lat;
        break; // TL
      case 1:
        y1 = to.lat;
        break; // TM
      case 2:
        x2 = to.lng;
        y1 = to.lat;
        break; // TR
      case 3:
        x2 = to.lng;
        break; // MR
      case 4:
        x2 = to.lng;
        y2 = to.lat;
        break; // BR
      case 5:
        y2 = to.lat;
        break; // BM
      case 6:
        x1 = to.lng;
        y2 = to.lat;
        break; // BL
      case 7:
        x1 = to.lng;
        break; // ML
    }

    const newCoords: [mapboxgl.LngLat, mapboxgl.LngLat] = [
      new mapboxgl.LngLat(Math.min(x1, x2), Math.min(y1, y2)),
      new mapboxgl.LngLat(Math.max(x1, x2), Math.max(y1, y2)),
    ];

    this.data.coordinates = newCoords;

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(this.toGeoJSON());
    }
  }

  clone(): Shape {
    const id = `rectangle-${Date.now()}`;
    const cloned = new Rectangle(id, {
      coordinates: [
        new mapboxgl.LngLat(
          this.data.coordinates[0].lng,
          this.data.coordinates[0].lat
        ),
        new mapboxgl.LngLat(
          this.data.coordinates[1].lng,
          this.data.coordinates[1].lat
        ),
      ],
    });
    cloned.strokeColor = this.strokeColor;
    cloned.strokeWidth = this.strokeWidth;
    return cloned;
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
