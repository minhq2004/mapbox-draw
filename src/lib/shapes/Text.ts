// src/lib/shapes/Text.ts

import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { Point } from "geojson";

export interface TextData {
  position: mapboxgl.LngLat;
  content: string;
  color?: string;
}

export class TextShape extends Shape {
  data: TextData;
  sourceId: string;
  layerId: string;

  constructor(id: string, data: TextData) {
    super(id, "text");
    this.data = data;
    this.sourceId = `text-source-${id}`;
    this.layerId = `text-layer-${id}`;
  }

  getGeoJSONGeometry(): Point {
    return {
      type: "Point",
      coordinates: [this.data.position.lng, this.data.position.lat],
    };
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    // Text không resize được: trả về rỗng
    return [];
  }

  resizeByHandle(): void {
    // Không hỗ trợ resize
  }

  draw(map: mapboxgl.Map): void {
    const geojson = this.toGeoJSON();

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;

    if (source) {
      source.setData(geojson);
      map.setLayoutProperty(this.layerId, "text-field", this.data.content);
    } else {
      map.addSource(this.sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: this.layerId,
        type: "symbol",
        source: this.sourceId,
        layout: {
          "text-field": this.data.content,
          "text-size": 14,
          "text-anchor": "top",
          "text-offset": [0, 0.5],
        },
        paint: {
          "text-color": "#000",
        },
      });
    }
  }

  update(data: TextData): void {
    this.data = data;
  }

  moveByDelta(dx: number, dy: number, map: mapboxgl.Map): void {
    const { position } = this.data;
    const moved = new mapboxgl.LngLat(position.lng + dx, position.lat + dy);
    this.data.position = moved;

    const source = map.getSource(this.sourceId) as mapboxgl.GeoJSONSource;
    if (source) source.setData(this.toGeoJSON());
  }

  containsPoint(): boolean {
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
