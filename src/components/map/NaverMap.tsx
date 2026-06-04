import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NaverMapProps {
  markers?: { lat: number; lng: number; title?: string; id?: string }[];
  onMarkerClick?: (index: number) => void;
  focusedMarkerId?: string | null;
  className?: string;
}

const isValidKoreaCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= 30 &&
  lat <= 45 &&
  lng >= 120 &&
  lng <= 135;

declare global {
  interface Window {
    naver: any;
    __initNaverMaps?: () => void;
  }
}

let naverMapsLoader: Promise<void> | null = null;

const loadNaverMaps = () => {
  if (window.naver?.maps) return Promise.resolve();
  if (naverMapsLoader) return naverMapsLoader;

  naverMapsLoader = (async () => {
    const { data, error } = await supabase.functions.invoke('naver-map-config');
    if (error || !data || !(data as any).ncpKeyId) throw new Error('네이버 지도 키를 불러오지 못했습니다.');

    await new Promise<void>((resolve, reject) => {
      window.__initNaverMaps = () => resolve();
      const script = document.createElement('script');
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent((data as any).ncpKeyId)}&callback=__initNaverMaps`;
      script.async = true;
      script.onerror = () => reject(new Error('네이버 지도 로딩에 실패했습니다.'));
      document.head.appendChild(script);
    });
  })();

  return naverMapsLoader;
};

const NaverMap = ({ markers = [], onMarkerClick, focusedMarkerId, className }: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstances = useRef<any[]>([]);
  const didInitialFit = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    loadNaverMaps().then(() => setMapReady(true)).catch((e) => setMapError(e.message));
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || !window.naver?.maps || mapInstance.current) return;

    const validMarkers = markers.filter((m) => isValidKoreaCoordinate(m.lat, m.lng));
    const center = validMarkers.length > 0
      ? new window.naver.maps.LatLng(validMarkers[0].lat, validMarkers[0].lng)
      : new window.naver.maps.LatLng(36.5, 127.5);

    mapInstance.current = new window.naver.maps.Map(mapRef.current, {
      center,
      zoom: validMarkers.length > 0 ? 12 : 7,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    return () => {
      markerInstances.current.forEach(m => {
        try { m.setMap(null); } catch (e) { /* ignore */ }
      });
      markerInstances.current = [];
      if (mapInstance.current) {
        try {
          mapInstance.current.destroy();
        } catch (e) {
          // ignore
        }
        mapInstance.current = null;
      }
      didInitialFit.current = false;
    };
  }, [mapReady, markers]);

  // Render markers
  useEffect(() => {
    if (!mapInstance.current || !window.naver?.maps) return;

    markerInstances.current.forEach(m => m.setMap(null));
    markerInstances.current = [];

    const validMarkers = markers.filter((m) => isValidKoreaCoordinate(m.lat, m.lng));

    validMarkers.forEach((m, idx) => {
      const isFocused = focusedMarkerId && m.id === focusedMarkerId;
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(m.lat, m.lng),
        map: mapInstance.current,
        title: m.title || '',
        zIndex: isFocused ? 1000 : 100,
        icon: isFocused
          ? {
              content: `<div style="width:24px;height:24px;border-radius:50%;background:hsl(38 65% 50%);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>`,
              anchor: new window.naver.maps.Point(12, 12),
            }
          : undefined,
      });

      if (onMarkerClick) {
        window.naver.maps.Event.addListener(marker, 'click', () => onMarkerClick(idx));
      }

      markerInstances.current.push(marker);
    });

    // Initial fit only — don't refit on every marker/focus change
    if (!didInitialFit.current && validMarkers.length > 0) {
      if (validMarkers.length > 1) {
        const bounds = new window.naver.maps.LatLngBounds(
          new window.naver.maps.LatLng(
            Math.min(...validMarkers.map(m => m.lat)),
            Math.min(...validMarkers.map(m => m.lng))
          ),
          new window.naver.maps.LatLng(
            Math.max(...validMarkers.map(m => m.lat)),
            Math.max(...validMarkers.map(m => m.lng))
          )
        );
        mapInstance.current.fitBounds(bounds);
      } else {
        mapInstance.current.setCenter(new window.naver.maps.LatLng(validMarkers[0].lat, validMarkers[0].lng));
        mapInstance.current.setZoom(14);
      }
      didInitialFit.current = true;
    }
  }, [markers, focusedMarkerId, onMarkerClick]);

  // Pan/zoom to focused marker
  useEffect(() => {
    if (!mapInstance.current || !window.naver?.maps || !focusedMarkerId) return;
    const target = markers.find(m => m.id === focusedMarkerId);
    if (!target || !isValidKoreaCoordinate(target.lat, target.lng)) return;
    const latlng = new window.naver.maps.LatLng(target.lat, target.lng);
    try {
      mapInstance.current.panTo(latlng);
      mapInstance.current.setZoom(16, true);
    } catch {
      mapInstance.current.setCenter(latlng);
      mapInstance.current.setZoom(16);
    }
  }, [focusedMarkerId, markers]);

  if (mapError) {
    return <div className={className || 'flex h-full w-full items-center justify-center bg-muted text-sm text-muted-foreground'}>{mapError}</div>;
  }

  return <div ref={mapRef} className={className || 'h-full w-full'} />;
};

export default NaverMap;
