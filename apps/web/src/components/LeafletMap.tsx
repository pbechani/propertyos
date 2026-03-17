'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon (broken by webpack/next.js bundling)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface MapMarker {
  latitude: number;
  longitude: number;
  title?: string;
  popup?: string;
}

export interface LeafletMapProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
}

export default function LeafletMap({
  center,
  zoom = 14,
  markers = [],
  className = '',
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center,
      zoom,
      scrollWheelZoom: true,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
      },
    ).addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync markers when they change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const layerGroup = L.layerGroup().addTo(map);

    markers.forEach((m) => {
      const marker = L.marker([m.latitude, m.longitude], { icon: defaultIcon }).addTo(layerGroup);
      if (m.title || m.popup) {
        const html = [
          m.title ? `<strong>${m.title}</strong>` : '',
          m.popup ? `<div>${m.popup}</div>` : '',
        ].join('');
        marker.bindPopup(html);
      }
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = L.latLngBounds(markers.map((m) => [m.latitude, m.longitude] as [number, number]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }

    return () => {
      layerGroup.remove();
    };
  }, [markers]);

  // Sync center/zoom on prop changes (single-point maps)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView(center, zoom);
  }, [center, zoom]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
