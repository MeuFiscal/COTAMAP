"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map, Marker } from "maplibre-gl";

type LocationMapProps = {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
};

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

export function LocationMap({ latitude, longitude, onChange }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const initialCenterRef = useRef<[number, number]>([longitude, latitude]);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const map = new maplibregl.Map({
      container,
      style: OPENFREEMAP_STYLE,
      center: initialCenterRef.current,
      zoom: 17,
      cooperativeGestures: true,
    });
    const marker = new maplibregl.Marker({ color: "#f97316", draggable: true })
      .setLngLat(initialCenterRef.current)
      .addTo(map);

    marker.on("dragend", () => {
      const position = marker.getLngLat();
      onChangeRef.current(position.lat, position.lng);
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.on("error", (event) => console.error("Location map error", event.error));
    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const center: [number, number] = [longitude, latitude];
    marker.setLngLat(center);
    map.easeTo({ center, duration: 350 });
  }, [latitude, longitude]);

  return (
    <div
      ref={containerRef}
      className="relative h-[320px] w-full overflow-hidden rounded-2xl"
      aria-label="Mapa real da localização da loja"
    />
  );
}
