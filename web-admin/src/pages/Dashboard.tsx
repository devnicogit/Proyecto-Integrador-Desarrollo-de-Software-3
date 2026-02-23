import React, { useEffect, useState } from 'react';
import { ShoppingBag, Truck, CheckCircle2, AlertCircle, Loader2, User, Filter, X } from 'lucide-react';
import { getDashboardStats, getFleetSummary, getDeliveryPerformance, getDeliveriesByDriver } from '../services/dashboardService';
import type { OrderStatusCount, FleetSummary, DeliveryPerformanceStats, DriverPerformance } from '../services/dashboardService';
import { getAllDrivers } from '../services/driverService';
import type { Driver } from '../services/driverService';
import { DeliveryPerformanceChart, DriverPerformanceChart } from '../components/Charts';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${color}` }}>
    <div style={{
      backgroundColor: `${color}15`,
      color: color,
      padding: '0.75rem',
      borderRadius: '0.5rem',
      display: 'flex'
    }}>
      {icon}
    </div>
    <div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</h3>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<OrderStatusCount[]>([]);
  const [fleet, setFleet] = useState<FleetSummary>({ availableDrivers: 0, totalActiveDrivers: 0, availableVehicles: 0, totalActiveVehicles: 0, maintenanceVehicles: 0 });
  const [performance, setPerformance] = useState<DeliveryPerformanceStats>({ onTime: 0, delayed: 0 });
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filters, setFilters] = useState({
    driverId: '',
    startDate: '',
    endDate: ''
  });

  const fetchData = async () => {
    try {
      const [statsData, fleetData, perfData, driversData, driverPerfData] = await Promise.all([
        getDashboardStats(filters.driverId || undefined, filters.startDate, filters.endDate),
        getFleetSummary(),
        getDeliveryPerformance(filters.driverId || undefined),
        getAllDrivers(),
        getDeliveriesByDriver(filters.driverId || undefined)
      ]);
      setStats(statsData);
      setFleet(fleetData);
      setPerformance(perfData);
      setDrivers(driversData);
      setDriverPerformance(driverPerfData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const clearFilters = () => {
    setFilters({ driverId: '', startDate: '', endDate: '' });
  };

  const getCount = (status: string) => {
    return stats.find(s => s.status === status)?.count || 0;
  };

  const totalOrders = stats.reduce((acc, curr) => acc + curr.count, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader2 className="animate-spin" size={48} color="#2563eb" />
      </div>
    );
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="header-title" style={{ margin: 0 }}>Panel de Control Logístico</h2>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Actualizado hoy a las {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}>
            <Filter size={18} />
            <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filtros:</span>
          </div>
          
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#94a3b8', textTransform: 'uppercase' }}>Conductor</label>
            <select 
              value={filters.driverId} 
              onChange={e => setFilters({...filters, driverId: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}
            >
              <option value="">Todos los conductores</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#94a3b8', textTransform: 'uppercase' }}>Desde</label>
            <input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>

          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#94a3b8', textTransform: 'uppercase' }}>Hasta</label>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}
            />
          </div>

          <button 
            onClick={clearFilters}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.875rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
          >
            <X size={16} /> Limpiar
          </button>
        </div>
      </div>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <StatCard title="Total Pedidos" value={totalOrders} icon={<ShoppingBag size={24} />} color="#3b82f6" />
        <StatCard title="En Ruta" value={getCount('IN_TRANSIT')} icon={<Truck size={24} />} color="#f59e0b" />
        <StatCard title="Entregados" value={getCount('DELIVERED')} icon={<CheckCircle2 size={24} />} color="#22c55e" />
        <StatCard title="Pendientes" value={getCount('PENDING') + getCount('ASSIGNED')} icon={<AlertCircle size={24} />} color="#ef4444" />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div className="card" style={{ minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 600 }}>Rendimiento de Entregas (A Tiempo vs Retraso)</h3>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
            {performance.onTime + performance.delayed > 0 ? (
               <div style={{ width: '300px' }}><DeliveryPerformanceChart onTime={performance.onTime} delayed={performance.delayed} /></div>
            ) : (
               <div style={{ textAlign: 'center', color: '#94a3b8' }}>
                 <p>No hay datos de entregas finalizadas aún.</p>
               </div>
            )}
          </div>
        </div>

        <div className="card" style={{ minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 600 }}>Entregas por Conductor</h3>
          <div style={{ height: '300px' }}>
            {driverPerformance.length > 0 ? (
               <DriverPerformanceChart data={driverPerformance} />
            ) : (
               <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                 <p>No hay entregas registradas para conductores.</p>
               </div>
            )}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>

        <div className="card">
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 600 }}>Disponibilidad de Flota</h3>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={18} color="#2563eb" /> Conductores Libres</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{fleet.availableDrivers} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/ {fleet.totalActiveDrivers}</span></span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Truck size={18} color="#22c55e" /> Vehículos Libres</span>
              <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>{fleet.availableVehicles} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 400 }}>/ {fleet.totalActiveVehicles}</span></span>
            </li>
            <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertCircle size={18} color="#ef4444" /> En Mantenimiento</span>
              <span style={{ fontWeight: 600 }}>{fleet.maintenanceVehicles}</span>
            </li>
          </ul>
          
          {(fleet.availableDrivers > 0 && fleet.availableVehicles > 0) ? (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', color: '#1e40af', fontSize: '0.875rem' }}>
              <div style={{ marginBottom: '0.75rem' }}>💡 Tienes recursos disponibles para nuevas rutas.</div>
              <button 
                onClick={() => window.location.href = '/routes'}
                style={{ width: '100%', padding: '0.5rem', backgroundColor: '#2563eb', color: '#fff', borderRadius: '0.375rem', fontWeight: 600, fontSize: '0.75rem' }}
              >
                Planificar Ruta
              </button>
            </div>
          ) : (
            <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '0.5rem', color: '#166534', fontSize: '0.875rem' }}>
              ✅ Capacidad logística al máximo o asignada totalmente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
