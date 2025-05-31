import mapboxgl from "mapbox-gl";
import type { Feature, Geometry } from "geojson";

export type ShapeType =
  | "rectangle"
  | "circle"
  | "arrow"
  | "polyline"
  | "curve"
  | "text";

export interface ShapeProps {
  id: string;
  type: ShapeType;
  isSelected: boolean;
  data: unknown;
}

export abstract class Shape {
  id: string;
  type: ShapeType;
  isSelected: boolean;
  strokeColor: string = "#000";
  strokeWidth: number = 4;
  presentationOrder: number | null = null;

  constructor(id: string, type: ShapeType) {
    this.id = id;
    this.type = type;
    this.isSelected = false;
  }

  abstract draw(map: mapboxgl.Map): void;
  abstract update(data: unknown): void;
  abstract clone(): Shape;
  abstract remove(map: mapboxgl.Map): void;
  abstract moveByDelta(
    deltaLng: number,
    deltaLat: number,
    map: mapboxgl.Map
  ): void;
  abstract getGeoJSONGeometry(): Geometry;
  abstract getBoundingBoxHandles(): mapboxgl.LngLat[];
  abstract resizeByHandle(
    handleIndex: number,
    to: mapboxgl.LngLat,
    map: mapboxgl.Map
  ): void;

  toGeoJSON(): Feature {
    return {
      type: "Feature",
      geometry: this.getGeoJSONGeometry(),
      properties: {},
    };
  }

  select() {
    this.isSelected = true;
  }

  deselect() {
    this.isSelected = false;
  }

  setStyle(color: string, width: number) {
    this.strokeColor = color;
    this.strokeWidth = width;
  }
}
