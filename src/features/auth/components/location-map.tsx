"use client";

import { useEffect, useRef } from "react";
import type { MutableRefObject } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

type LocationMapProps = {
  latitude: number;
  longitude: number;
  onChange: (latitude: number, longitude: number) => void;
};

export function LocationMap({ latitude, longitude, onChange }: LocationMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const initialCenterRef = useRef<[number, number]>([longitude, latitude]);
  const onChangeRef = useRef(onChange) as MutableRefObject<LocationMapProps["onChange"]>;

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: initialCenterRef.current,
      zoom: 17,
    });
    const marker = new maplibregl.Marker({ color: "#F97316", draggable: true })
      .setLngLat(initialCenterRef.current)
      .addTo(map);
    marker.on("dragend", () => {
      const position = marker.getLngLat();
      onChangeRef.current(position.lat, position.lng);
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
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

  return <div ref={containerRef} className="h-[320px] w-full overflow-hidden rounded-2xl" aria-label="Mapa da localização da loja" />;
}
