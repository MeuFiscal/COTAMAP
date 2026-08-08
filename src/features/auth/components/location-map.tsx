"use client";

import "leaflet/dist/leaflet.css";

import { useEffect, useRef } from "react";
import type * as Leaflet from "leaflet";

type LocationMapProps = { latitude: number; longitude: number; onChange: (latitude: number, longitude: number) => void };

export function LocationMap({ latitude, longitude, onChange }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet.Map | null>(null);
  const markerRef = useRef<Leaflet.Marker | null>(null);
  const initialCenterRef = useRef({ latitude, longitude });
  const onChangeRef = useRef(onChange);

  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let disposed = false;
    let map: Leaflet.Map | null = null;
    let marker: Leaflet.Marker | null = null;
    void import("leaflet").then((L) => {
      if (disposed || !containerRef.current) return;
      const center = L.latLng(initialCenterRef.current.latitude, initialCenterRef.current.longitude);
      const markerIcon = L.icon({ iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png", iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png", shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png", iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41] });
      map = L.map(containerRef.current, { zoomControl: true, attributionControl: true }).setView(center, 17);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(map);
      marker = L.marker(center, { draggable: true, icon: markerIcon }).addTo(map);
      marker.on("dragend", () => { const position = marker?.getLatLng(); if (position) onChangeRef.current(position.lat, position.lng); });
      map.on("click", (event) => { marker?.setLatLng(event.latlng); onChangeRef.current(event.latlng.lat, event.latlng.lng); });
      mapRef.current = map;
      markerRef.current = marker;
      window.setTimeout(() => map?.invalidateSize(), 0);
    });
    return () => { disposed = true; map?.remove(); markerRef.current = null; mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const center = { lat: latitude, lng: longitude };
    marker.setLatLng(center);
    map.panTo(center, { animate: true, duration: 0.35 });
  }, [latitude, longitude]);

  return <div ref={containerRef} className="h-[320px] w-full overflow-hidden rounded-2xl" aria-label="Mapa OpenStreetMap da localização da loja" />;
}

export default LocationMap;
