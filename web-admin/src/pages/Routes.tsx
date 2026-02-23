import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Truck, User, Loader2, Plus, X, ChevronDown, UserCheck, Navigation, Filter, Clock, CheckCircle2, Package } from 'lucide-react';
import { getAllRoutes, createRoute, updateRouteStatus } from '../services/routeService';
import type { Route as RouteModel } from '../services/routeService';
import { getAllDrivers } from '../services/driverService';
import type { Driver } from '../services/driverService';
import { getAllVehicles } from '../services/vehicleService';
import type { Vehicle } from '../services/vehicleService';
import { getVehicleHistory } from '../services/gpsService';
import type { VehicleGpsHistory } from '../services/gpsService';
import { getAllOrders } from '../services/orderService';
import type { Order } from '../services/orderService';
import TrackingMap from '../components/TrackingMap';

// Custom Searchable Select Component
const SearchableSelect = <T extends { id: number | string; label: string }>({ 
  options, onSelect, placeholder, label, icon: Icon
}: { options: T[], onSelect: (id: string) => void, placeholder: string, label: string, icon: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()));
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <div ref={wrapperRef} style={{ position: 'relative', marginBottom: '1.25rem' }}>
      <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#475569' }}>{label}</label>
      <div onClick={() => setIsOpen(!isOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', backgroundColor: '#fff', cursor: 'pointer', fontSize: '0.875rem' }}>
        <Icon size={18} color={selectedLabel ? '#2563eb' : '#94a3b8'} />
        <span style={{ color: selectedLabel ? '#0f172a' : '#94a3b8', flex: 1 }}>{selectedLabel || placeholder}</span>
        <ChevronDown size={16} color="#94a3b8" />
      </div>
      {isOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem', marginTop: '0.25rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 9999, maxHeight: '250px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
            <input autoFocus type="text" placeholder="Escribe para buscar..." style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem', border: '1px solid #e2e8f0', borderRadius: '0.375rem' }} value={search} onChange={e => setSearch(e.target.value)} onClick={e => e.stopPropagation()} />
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {filtered.map(opt => (
              <div key={opt.id} onClick={() => { onSelect(opt.id.toString()); setSelectedLabel(opt.label); setIsOpen(false); setSearch(''); }} style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', cursor: 'pointer' }}>{opt.label}</div>
            ))}
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
  const [selectedRouteOrders, setSelectedRouteOrders] = useState<Order[]>([]);
  const [gpsHistory, setGpsHistory] = useState<VehicleGpsHistory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // OPERATIONAL FILTERS
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'TOMORROW' | 'ALL'>('TODAY');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [formData, setFormData] = useState({
    driverId: '', vehicleId: '',
    routeDate: new Date().toISOString().split('T')[0],
    estimatedStartTime: new Date().toISOString()
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      let targetDate = undefined;
      if (dateFilter === 'TODAY') targetDate = new Date().toISOString().split('T')[0];
      if (dateFilter === 'TOMORROW') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        targetDate = tomorrow.toISOString().split('T')[0];
      }

      const [routesData, driversData, vehiclesData] = await Promise.all([
        getAllRoutes(targetDate, statusFilter === 'ALL' ? undefined : statusFilter),
        getAllDrivers().catch(() => []),
        getAllVehicles().catch(() => [])
      ]);
      
      setRoutes(routesData);
      setDrivers(driversData.filter(d => d.isActive));
      setVehicles(vehiclesData.filter(v => v.isActive));
      
      if (routesData.length > 0 && !selectedRoute) setSelectedRoute(routesData[0]);
      if (routesData.length === 0) {
        setSelectedRoute(null);
        setSelectedRouteOrders([]);
      }
    } catch (error) {
      console.error('Error fetching routes data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateFilter, statusFilter]);

  const fetchGpsHistory = async (vehicleId: number) => {
    try {
      const history = await getVehicleHistory(vehicleId);
      setGpsHistory(history);
    } catch (error) { console.error(error); }
  };

  const fetchRouteOrders = async (routeId: number) => {
    try {
      const allOrders = await getAllOrders();
      const filtered = allOrders.filter(o => o.routeId === routeId);
      setSelectedRouteOrders(filtered);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    if (selectedRoute) {
      fetchGpsHistory(selectedRoute.vehicleId);
      fetchRouteOrders(selectedRoute.id);
      let interval: any;
      if (selectedRoute.status === 'IN_PROGRESS') {
        interval = setInterval(() => {
          fetchGpsHistory(selectedRoute.vehicleId);
          fetchRouteOrders(selectedRoute.id);
        }, 5000);
      }
      return () => clearInterval(interval);
    } else {
      setGpsHistory([]);
      setSelectedRouteOrders([]);
    }
  }, [selectedRoute]);

  const handleStartRoute = async () => {
    if (!selectedRoute) return;
    try {
      const updated = await updateRouteStatus(selectedRoute.id, 'IN_PROGRESS' as any);
      setSelectedRoute(updated);
      fetchData();
    } catch (error) { alert('Error al iniciar la ruta.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRoute({
        driverId: parseInt(formData.driverId),
        vehicleId: parseInt(formData.vehicleId),
        routeDate: formData.routeDate,
        estimatedStartTime: formData.estimatedStartTime
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) { alert('Error al crear la ruta'); }
  };

  // 3. Planned Path calculation (Remaining Stops Only)
  const warehousePos: [number, number] = [-12.046374, -77.042793];
  
  const getSortedOrders = (orders: Order[]) => {
    // Only sort orders that are NOT delivered or failed
    let remaining = [...orders.filter(o => o.latitude && o.longitude && o.status !== 'DELIVERED' && o.status !== 'FAILED')];
    let sorted: Order[] = [];
    
    // Start from current truck position if available, else from warehouse
    let currentPos: [number, number] = gpsHistory.length > 0 
      ? [gpsHistory[0].latitude, gpsHistory[0].longitude] 
      : warehousePos;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDist = Number.MAX_VALUE;
      remaining.forEach((o, idx) => {
        const d = Math.sqrt(Math.pow(o.latitude! - currentPos[0], 2) + Math.pow(o.longitude! - currentPos[1], 2));
        if (d < minDist) {
          minDist = d;
          nearestIdx = idx;
        }
      });
      const nearest = remaining.splice(nearestIdx, 1)[0];
      sorted.push(nearest);
      currentPos = [nearest.latitude!, nearest.longitude!];
    }
    return sorted;
  };

  const sortedPendingOrders = getSortedOrders(selectedRouteOrders);

  const plannedPath: [number, number][] = [
    // If truck is moving, path starts from truck to next order
    ...(gpsHistory.length > 0 ? [[gpsHistory[0].latitude, gpsHistory[0].longitude] as [number, number]] : [warehousePos]),
    ...sortedPendingOrders.map(o => [o.latitude!, o.longitude!] as [number, number]),
    warehousePos
  ];

  // Combined Markers: Truck + Only Pending Orders
  const mapMarkers = [
    ...(gpsHistory.length > 0 ? [{ 
      id: 'truck', 
      position: [gpsHistory[0].latitude, gpsHistory[0].longitude] as [number, number], 
      title: "Camión", 
      subtitle: `${gpsHistory[0].speedKmh} km/h` 
    }] : []),
    ...sortedPendingOrders.map((order, index) => ({
      id: `order-${order.id}`,
      position: [order.latitude!, order.longitude!] as [number, number],
      title: `Parada #${index + 1}: ${order.trackingNumber}`,
      subtitle: `${order.recipientName}`
    }))
  ];

  return (
    <div className="main-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0 }}>
        <div>
          <h2 className="header-title" style={{ margin: 0 }}>Gestión de Despacho</h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Control de flota y seguimiento en tiempo real</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700 }}>
          <Plus size={18} /> Nueva Ruta
        </button>
      </header>

      {/* Operational Filter Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '0.75rem 1.25rem', backgroundColor: '#f8fafc', display: 'flex', gap: '2rem', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', backgroundColor: '#fff', padding: '0.25rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <button onClick={() => setDateFilter('TODAY')} style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, backgroundColor: dateFilter === 'TODAY' ? '#2563eb' : 'transparent', color: dateFilter === 'TODAY' ? '#fff' : '#64748b' }}>Hoy</button>
          <button onClick={() => setDateFilter('TOMORROW')} style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, backgroundColor: dateFilter === 'TOMORROW' ? '#2563eb' : 'transparent', color: dateFilter === 'TOMORROW' ? '#fff' : '#64748b' }}>Mañana</button>
          <button onClick={() => setDateFilter('ALL')} style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', fontSize: '0.8rem', fontWeight: 600, backgroundColor: dateFilter === 'ALL' ? '#2563eb' : 'transparent', color: dateFilter === 'ALL' ? '#fff' : '#64748b' }}>Histórico</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Filter size={16} color="#64748b" />
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }}>
            <option value="ALL">Todos los estados</option>
            <option value="PLANNED">Planeado</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="COMPLETED">Completado</option>
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
          {routes.length} rutas encontradas
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' }}>
        {/* Left Column: Independent Scrollable List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', paddingRight: '0.5rem', height: '100%' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Loader2 className="animate-spin" size={32} color="#2563eb" /></div>
          ) : routes.map((route) => (
            <div key={route.id} onClick={() => setSelectedRoute(route)} className="card" style={{ cursor: 'pointer', borderColor: selectedRoute?.id === route.id ? '#3b82f6' : '#e2e8f0', borderLeft: selectedRoute?.id === route.id ? '6px solid #3b82f6' : '1px solid #e2e8f0', padding: '1.25rem', backgroundColor: selectedRoute?.id === route.id ? '#eff6ff' : '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 800, color: '#1e293b' }}>Ruta #{route.id}</span>
                <span style={{ fontSize: '0.65rem', padding: '0.25rem 0.6rem', borderRadius: '1rem', fontWeight: 800, backgroundColor: route.status === 'IN_PROGRESS' ? '#fef3c7' : route.status === 'PLANNED' ? '#f1f5f9' : '#dcfce7', color: route.status === 'IN_PROGRESS' ? '#92400e' : route.status === 'PLANNED' ? '#475569' : '#166534' }}>{route.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem', color: '#64748b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {route.routeDate}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><CheckCircle2 size={14} /> {route.totalDistanceKm} km</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', gridColumn: 'span 2' }}><User size={14} /> Conductor: {drivers.find(d => d.id === route.driverId)?.firstName || 'ID '+route.driverId}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', gridColumn: 'span 2' }}><Truck size={14} /> Vehículo: {vehicles.find(v => v.id === route.vehicleId)?.plateNumber || 'ID '+route.vehicleId}</div>
              </div>
            </div>
          ))}
          {!loading && routes.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '1rem' }}>
              <MapPin size={48} style={{ marginBottom: '1rem', opacity: 0.2, marginLeft: 'auto', marginRight: 'auto' }} />
              <p>No hay rutas para los filtros seleccionados.</p>
            </div>
          )}
        </div>

        {/* Right Column: Full height Map & Details */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {selectedRoute ? (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Seguimiento en Vivo - #{selectedRoute.id}</h3>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Estado: <span style={{ fontWeight: 700, color: '#2563eb' }}>{selectedRoute.status}</span> | Distancia: {selectedRoute.totalDistanceKm} km</div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ padding: '0.4rem 0.75rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Package size={14} color="#3b82f6" /> {selectedRouteOrders.length} pedidos
                  </div>
                  {selectedRoute.status === 'PLANNED' && (
                    <button onClick={handleStartRoute} style={{ padding: '0.5rem 1rem', backgroundColor: '#22c55e', color: '#fff', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Navigation size={14} /> Iniciar Despacho
                    </button>
                  )}
                </div>
              </div>
              
              <div style={{ flex: 1, position: 'relative' }}>
                <TrackingMap 
                  center={gpsHistory.length > 0 ? [gpsHistory[0].latitude, gpsHistory[0].longitude] : (selectedRouteOrders.length > 0 ? [selectedRouteOrders[0].latitude || 0, selectedRouteOrders[0].longitude || 0] : undefined)}
                  path={gpsHistory.map(p => [p.latitude, p.longitude] as [number, number]).reverse()}
                  plannedPath={plannedPath}
                  markers={mapMarkers} 
                />
              </div>
            </div>
          ) : (
            <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', borderStyle: 'dashed' }}>
               <MapPin size={64} style={{ marginBottom: '1.5rem', opacity: 0.2 }} />
               <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Vista de Seguimiento</h3>
               <p>Selecciona una ruta para monitorear el progreso del conductor.</p>
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
              <SearchableSelect label="Conductor Asignado" icon={UserCheck} placeholder="Busque por nombre o licencia..." options={drivers.map(d => ({ id: d.id, label: `${d.firstName} ${d.lastName} (${d.licenseNumber})` }))} onSelect={(id) => setFormData({...formData, driverId: id})} />
              <SearchableSelect label="Vehículo de Flota" icon={Truck} placeholder="Busque por placa o marca..." options={vehicles.map(v => ({ id: v.id, label: `${v.plateNumber} - ${v.brand} ${v.model}` }))} onSelect={(id) => setFormData({...formData, vehicleId: id})} />
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem', color: '#475569' }}>Fecha de Ejecución</label>
                <input type="date" style={{ width: '100%', padding: '0.75rem 1rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.875rem' }} value={formData.routeDate} onChange={e => setFormData({...formData, routeDate: e.target.value})} required />
              </div>
              <button type="submit" style={{ width: '100%', padding: '0.875rem', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: 700, fontSize: '1rem' }}>Confirmar y Crear Ruta</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesPage;
