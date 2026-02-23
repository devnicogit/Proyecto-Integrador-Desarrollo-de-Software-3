import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TrackingMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{
    id: number | string;
    position: [number, number];
    title: string;
    subtitle?: string;
  }>;
  path?: Array<[number, number]>;
  plannedPath?: Array<[number, number]>;
}

const TrackingMap: React.FC<TrackingMapProps> = ({ 
  center = [-12.046374, -77.042793], // Default to Lima
  zoom = 13, 
  markers = [],
  path = [],
  plannedPath = []
}) => {
  return (
    <div style={{ height: '100%', width: '100%', borderRadius: '0.75rem', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      <MapContainer center={center} zoom={zoom} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Planned Route (The "should-do" path in Gray) */}
        {plannedPath.length > 1 && (
          <Polyline positions={plannedPath} color="#94a3b8" weight={2} opacity={0.6} dashArray="10, 10" />
        )}

        {/* Real GPS History (The "did-do" path in Blue) */}
        {path.length > 1 && (
          <Polyline positions={path} color="#2563eb" weight={4} opacity={0.8} />
        )}

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position}>
            <Popup>
              <div style={{ fontWeight: 600 }}>{marker.title}</div>
              {marker.subtitle && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{marker.subtitle}</div>}
            </Popup>
            <Tooltip permanent direction="top" offset={[0, -32]} opacity={0.9}>
              <span style={{ fontWeight: 700, fontSize: '0.7rem' }}>
                {marker.title.includes('Parada') ? marker.title.split(':')[0] : marker.title}
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default TrackingMap;
