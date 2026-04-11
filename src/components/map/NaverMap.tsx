import { useEffect, useRef } from 'react';

interface NaverMapProps {
  markers?: { lat: number; lng: number; title?: string }[];
  onMarkerClick?: (index: number) => void;
  className?: string;
}

declare global {
  interface Window {
    naver: any;
  }
}

const NaverMap = ({ markers = [], onMarkerClick, className }: NaverMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerInstances = useRef<any[]>([]);

  useEffect(() => {
    if (!mapRef.current || !window.naver?.maps) return;

    const center = markers.length > 0
      ? new window.naver.maps.LatLng(markers[0].lat, markers[0].lng)
      : new window.naver.maps.LatLng(36.5, 127.5); // 한국 중심

    mapInstance.current = new window.naver.maps.Map(mapRef.current, {
      center,
      zoom: markers.length > 0 ? 12 : 7,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT,
      },
    });

    return () => {
      // Clear markers first to avoid naver maps internal cleanup crash
      markerInstances.current.forEach(m => m.setMap(null));
      markerInstances.current = [];
      if (mapInstance.current) {
        try {
          mapInstance.current.destroy();
        } catch (e) {
          // Naver maps internal cleanup error - safe to ignore
        }
        mapInstance.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstance.current || !window.naver?.maps) return;

    // Clear existing markers
    markerInstances.current.forEach(m => m.setMap(null));
    markerInstances.current = [];

    markers.forEach((m, idx) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(m.lat, m.lng),
        map: mapInstance.current,
        title: m.title || '',
      });

      if (onMarkerClick) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onMarkerClick(idx);
        });
      }

      markerInstances.current.push(marker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new window.naver.maps.LatLngBounds(
        new window.naver.maps.LatLng(
          Math.min(...markers.map(m => m.lat)),
          Math.min(...markers.map(m => m.lng))
        ),
        new window.naver.maps.LatLng(
          Math.max(...markers.map(m => m.lat)),
          Math.max(...markers.map(m => m.lng))
        )
      );
      mapInstance.current.fitBounds(bounds);
    } else if (markers.length === 1) {
      mapInstance.current.setCenter(new window.naver.maps.LatLng(markers[0].lat, markers[0].lng));
      mapInstance.current.setZoom(14);
    }
  }, [markers, onMarkerClick]);

  return <div ref={mapRef} className={className || 'h-full w-full'} />;
};

export default NaverMap;
