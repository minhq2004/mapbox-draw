import mapboxgl from "mapbox-gl";
import { Shape } from "./Shape";
import type { GeometryCollection, Feature, LineString } from "geojson";

export interface ArrowData {
  coordinates: [mapboxgl.LngLat, mapboxgl.LngLat];
  color?: string;
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

  getGeoJSONGeometry(): LineString {
    const [start, end] = this.data.coordinates;
    return {
      type: "LineString",
      coordinates: [
        [start.lng, start.lat],
        [end.lng, end.lat],
      ],
    };
  }

  private toArrowGeometry(): GeometryCollection {
    const [start, end] = this.data.coordinates;
    const dx = end.lng - start.lng;
    const dy = end.lat - start.lat;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);
    const headLength = length * 0.2;
    const headAngle = Math.PI / 6;

    const head1 = [
      end.lng - headLength * Math.cos(angle - headAngle),
      end.lat - headLength * Math.sin(angle - headAngle),
    ];
    const head2 = [
      end.lng - headLength * Math.cos(angle + headAngle),
      end.lat - headLength * Math.sin(angle + headAngle),
    ];

    return {
      type: "GeometryCollection",
      geometries: [
        {
          type: "LineString",
          coordinates: [
            [start.lng, start.lat],
            [end.lng, end.lat],
          ],
        },
        {
          type: "LineString",
          coordinates: [[end.lng, end.lat], head1],
        },
        {
          type: "LineString",
          coordinates: [[end.lng, end.lat], head2],
        },
      ],
    };
  }

  draw(map: mapboxgl.Map): void {
    const geojson: Feature<GeometryCollection> = {
      type: "Feature",
      geometry: this.toArrowGeometry(),
      properties: {},
    };

    const source = map.getSource(this.sourceId);
    if (source && "setData" in source) {
      (source as mapboxgl.GeoJSONSource).setData(geojson);
    } else {
      map.addSource(this.sourceId, {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: this.layerId,
        type: "line",
        source: this.sourceId,
        paint: {
          "line-color": this.data.color || "#000",
          "line-width": 2,
        },
      });
    }
  }

  update(data: ArrowData): void {
    this.data = data;
  }

  moveByDelta(dx: number, dy: number, map: mapboxgl.Map): void {
    this.data.coordinates = this.data.coordinates.map(
      (p) => new mapboxgl.LngLat(p.lng + dx, p.lat + dy)
    ) as [mapboxgl.LngLat, mapboxgl.LngLat];
    this.draw(map);
  }

  getBoundingBoxHandles(): mapboxgl.LngLat[] {
    return this.data.coordinates;
  }

  resizeByHandle(index: number, to: mapboxgl.LngLat, map: mapboxgl.Map): void {
    this.data.coordinates[index] = to;
    this.draw(map);
  }

  containsPoint(): boolean {
    return false;
  }

  remove(map: mapboxgl.Map): void {
    if (map.getLayer(this.layerId)) map.removeLayer(this.layerId);
    if (map.getSource(this.sourceId)) map.removeSource(this.sourceId);
  }
}
