import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Calendar, Truck, User, Loader2, Plus, X, Search, ChevronDown, UserCheck, Navigation } from 'lucide-react';
import { getAllRoutes, createRoute, updateRouteStatus } from '../services/routeService';
import type { Route as RouteModel } from '../services/routeService';
import { getAllDrivers } from '../services/driverService';
import type { Driver } from '../services/driverService';
import { getAllVehicles } from '../services/vehicleService';
import type { Vehicle } from '../services/vehicleService';
import { getVehicleHistory } from '../services/gpsService';
import type { VehicleGpsHistory } from '../services/gpsService';
import TrackingMap from '../components/TrackingMap';

// Custom Searchable Select Component
const SearchableSelect = <T extends { id: number | string; label: string }>({ 
  options, 
  onSelect, 
  placeholder, 
  label,
  icon: Icon
}: { 
  options: T[], 
  onSelect: (id: string) => void, 
  placeholder: string,
  label: string,
  icon: any
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(opt => 
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '1.25rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#475569' }}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '0.75rem 1rem', 
          border: '1px solid #e2e8f0', 
          borderRadius: '0.5rem', 
          backgroundColor: '#fff',
          cursor: 'pointer',
          fontSize: '0.875rem',
          boxShadow: isOpen ? '0 0 0 2px rgba(37, 99, 235, 0.1)' : 'none',
          borderColor: isOpen ? '#2563eb' : '#e2e8f0'
        }}
      >
        <Icon size={18} color={selectedLabel ? '#2563eb' : '#94a3b8'} />
        <span style={{ color: selectedLabel ? '#0f172a' : '#94a3b8', flex: 1 }}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDown size={16} color="#94a3b8" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </div>

      {isOpen && (
        <div style={{ 
          position: 'absolute', 
          top: '100%', 
          left: 0, 
          right: 0, 
          backgroundColor: '#fff', 
          border: '1px solid #e2e8f0', 
          borderRadius: '0.5rem', 
          marginTop: '0.25rem', 
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
          zIndex: 9999,
          maxHeight: '250px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9', backgroundColor: '#f8fafc' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                autoFocus
                type="text" 
                placeholder="Escribe para buscar..." 
                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem', outline: 'none' }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(opt => (
              <div 
                key={opt.id} 
                onClick={() => {
                  onSelect(opt.id.toString());
                  setSelectedLabel(opt.label);
                  setIsOpen(false);
                  setSearch('');
                }}
                style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                {opt.label}
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '1.5rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>
                No se encontraron resultados
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RoutesPage: React.FC = () => {
  const [routes, setRoutes] = useState<RouteModel[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<RouteModel | null>(null);
  const [gpsHistory, setGpsHistory] = useState<VehicleGpsHistory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    driverId: '',
    vehicleId: '',
    routeDate: new Date().toISOString().split('T')[0],
    estimatedStartTime: new Date().toISOString()
  });

  const fetchData = async () => {
    try {
      const [routesData, driversData, vehiclesData] = await Promise.all([
        getAllRoutes().catch(() => []),
        getAllDrivers().catch(() => []),
        getAllVehicles().catch(() => [])
      ]);
      setRoutes(routesData);
      
      // LOGIC: Identify who is busy today
      const today = new Date().toISOString().split('T')[0];
      const busyRoutes = routesData.filter(r => 
        r.routeDate === today && r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
      );
      const busyDriverIds = busyRoutes.map(r => r.driverId);
      const busyVehicleIds = busyRoutes.map(r => r.vehicleId);

      // Only show available ones in the selectors
      setDrivers(driversData.filter(d => d.isActive && !busyDriverIds.includes(d.id)));
      setVehicles(vehiclesData.filter(v => v.isActive && !busyVehicleIds.includes(v.id)));
      
      if (routesData.length > 0 && !selectedRoute) setSelectedRoute(routesData[0]);
    } catch (error) {
      console.error('Error fetching routes data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGpsHistory = async (vehicleId: number) => {
    try {
      const history = await getVehicleHistory(vehicleId);
      setGpsHistory(history);
    } catch (error) {
      console.error('Error fetching GPS history:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRoute) {
      fetchGpsHistory(selectedRoute.vehicleId);
      
      // Auto-refresh GPS history if route is in progress
      let interval: any;
      if (selectedRoute.status === 'IN_PROGRESS') {
        interval = setInterval(() => fetchGpsHistory(selectedRoute.vehicleId), 5000);
      }
      return () => clearInterval(interval);
    }
  }, [selectedRoute]);

  const handleStartRoute = async () => {
    if (!selectedRoute) return;
    try {
      await updateRouteStatus(selectedRoute.id, 'IN_PROGRESS' as any);
      fetchData();
    } catch (error) {
      alert('Error al iniciar la ruta');
    }
  };

  const handleOpenModal = () => {
    setFormData({
      driverId: '',
      vehicleId: '',
      routeDate: new Date().toISOString().split('T')[0],
      estimatedStartTime: new Date().toISOString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.driverId || !formData.vehicleId) {
      alert('Por favor seleccione un conductor y un vehículo');
      return;
    }
    try {
      await createRoute({
        driverId: parseInt(formData.driverId),
        vehicleId: parseInt(formData.vehicleId),
        routeDate: formData.routeDate,
        estimatedStartTime: formData.estimatedStartTime
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Error al crear la ruta');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader2 className="animate-spin" size={48} color="#2563eb" />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="header-title" style={{ margin: 0 }}>Planificación y Seguimiento de Rutas</h2>
        <button 
          onClick={handleOpenModal}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            backgroundColor: '#2563eb', 
            color: '#fff', 
            padding: '0.625rem 1.25rem',
            borderRadius: '0.5rem',
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          <Plus size={18} /> Nueva Ruta
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>Rutas del Día</h3>
          {routes.map((route) => (
            <div 
              key={route.id} 
              onClick={() => setSelectedRoute(route)}
              className="card" 
              style={{ 
                cursor: 'pointer',
                borderColor: selectedRoute?.id === route.id ? '#3b82f6' : '#e2e8f0',
                borderLeft: selectedRoute?.id === route.id ? '6px solid #3b82f6' : '1px solid #e2e8f0',
                padding: '1rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>Ruta #{route.id}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.2rem 0.5rem', 
                  borderRadius: '1rem', 
                  backgroundColor: route.status === 'IN_PROGRESS' ? '#fef3c7' : '#dcfce7',
                  color: route.status === 'IN_PROGRESS' ? '#92400e' : '#166534'
                }}>{route.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={14} /> {route.routeDate}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={14} /> Conductor ID: {route.driverId}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Truck size={14} /> Vehículo ID: {route.vehicleId}</div>
              </div>
            </div>
          ))}
          {routes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '0.75rem' }}>
              No hay rutas planificadas.
            </div>
          )}
        </div>

        <div>
          {selectedRoute ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Seguimiento en Tiempo Real - Ruta #{selectedRoute.id}</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Visualizando ubicación GPS y puntos de entrega</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                   {selectedRoute.status === 'PLANNED' && (
                     <button 
                        onClick={handleStartRoute}
                        style={{ padding: '0.5rem 1rem', backgroundColor: '#22c55e', color: '#fff', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                     >
                        <Navigation size={16} /> Iniciar Ruta
                     </button>
                   )}
                   <span style={{ padding: '0.5rem 1rem', backgroundColor: '#f1f5f9', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 600 }}>
                      Distancia: {selectedRoute.totalDistanceKm} km
                   </span>
                </div>
              </div>
              <TrackingMap 
                zoom={14} 
                center={gpsHistory.length > 0 ? [gpsHistory[0].latitude, gpsHistory[0].longitude] : undefined}
                path={gpsHistory.map(p => [p.latitude, p.longitude] as [number, number]).reverse()}
                markers={gpsHistory.length > 0 ? [
                  { 
                    id: 'truck', 
                    position: [gpsHistory[0].latitude, gpsHistory[0].longitude], 
                    title: "En Ruta", 
                    subtitle: `Velocidad: ${gpsHistory[0].speedKmh} km/h` 
                  }
                ] : []} 
              />
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#94a3b8' }}>
               <MapPin size={48} style={{ marginBottom: '1rem' }} />
               <p>Selecciona una ruta para ver el seguimiento</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', position: 'relative', padding: '2rem' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', color: '#64748b', background: 'none' }}><X size={24} /></button>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700, fontSize: '1.5rem', color: '#0f172a' }}>Planificar Despacho</h3>
            
            <form onSubmit={handleSubmit}>
              <SearchableSelect 
                label="Conductor Asignado"
                icon={UserCheck}
                placeholder="Busque por nombre o licencia..."
                options={drivers.map(d => ({ id: d.id, label: `${d.firstName} ${d.lastName} (${d.licenseNumber})` }))}
                onSelect={(id) => setFormData({...formData, driverId: id})}
              />

              <SearchableSelect 
                label="Vehículo de Flota"
                icon={Truck}
                placeholder="Busque por placa o marca..."
                options={vehicles.map(v => ({ id: v.id, label: `${v.plateNumber} - ${v.brand} ${v.model}` }))}
                onSelect={(id) => setFormData({...formData, vehicleId: id})}
              />

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#475569' }}>Fecha de Ejecución</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="date" 
                    style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem', outline: 'none' }} 
                    value={formData.routeDate} 
                    onChange={e => setFormData({...formData, routeDate: e.target.value})} 
                    required 
                  />
                </div>
              </div>

              <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button type="submit" style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '1rem', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}>
                  Confirmar y Crear Ruta
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', backgroundColor: 'transparent', color: '#64748b', fontWeight: 600, fontSize: '0.875rem' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;
