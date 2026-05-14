export type GeoPoint = {
  latitude: number;
  longitude: number;
};

export type MapViewport = {
  minLatitude: number;
  maxLatitude: number;
  minLongitude: number;
  maxLongitude: number;
  centerLatitude: number;
  centerLongitude: number;
};

export type LeafletMarker = { latitude: number; longitude: number; title?: string; popup?: string };

export type MapSource =
  | { type: 'image'; url: string }
  | { type: 'leaflet'; center: [number, number]; zoom: number; markers: LeafletMarker[] };

export function buildMapViewport(points: GeoPoint[]): MapViewport | null {
  if (points.length === 0) {
    return null;
  }

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);

  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  const latPadding = Math.max(0.03, (maxLatitude - minLatitude) * 0.25 || 0.03);
  const lonPadding = Math.max(0.03, (maxLongitude - minLongitude) * 0.25 || 0.03);

  return {
    minLatitude: minLatitude - latPadding,
    maxLatitude: maxLatitude + latPadding,
    minLongitude: minLongitude - lonPadding,
    maxLongitude: maxLongitude + lonPadding,
    centerLatitude: (minLatitude + maxLatitude) / 2,
    centerLongitude: (minLongitude + maxLongitude) / 2,
  };
}

export function buildViewportMapSource(params: {
  points: (GeoPoint & { title?: string; price?: string })[];
  viewport: MapViewport | null;
  mapboxToken?: string;
}): MapSource | null {
  const { points, viewport, mapboxToken } = params;

  if (!viewport) {
    return null;
  }

  if (mapboxToken) {
    const markers = points
      .slice(0, 20)
      .map((point) => `pin-s+2563eb(${point.longitude},${point.latitude})`)
      .join(',');

    const markerPrefix = markers.length > 0 ? `${markers}/` : '';

    return {
      type: 'image',
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markerPrefix}${viewport.centerLongitude},${viewport.centerLatitude},9/1200x800?access_token=${mapboxToken}`,
    };
  }

  return {
    type: 'leaflet',
    center: [viewport.centerLatitude, viewport.centerLongitude],
    zoom: 9,
    markers: points.map((p) => ({ latitude: p.latitude, longitude: p.longitude, title: p.title, popup: p.price })),
  };
}

export function buildSinglePointMapSource(params: {
  latitude: number;
  longitude: number;
  mapboxToken?: string;
}): MapSource {
  const { latitude, longitude, mapboxToken } = params;

  if (mapboxToken) {
    return {
      type: 'image',
      url: `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/pin-s+2563eb(${longitude},${latitude})/${longitude},${latitude},14/1200x800?access_token=${mapboxToken}`,
    };
  }

  return {
    type: 'leaflet',
    center: [latitude, longitude],
    zoom: 14,
    markers: [{ latitude, longitude }],
  };
}
