import React, { useEffect, useState } from 'react';
import { ShoppingBag, Truck, CheckCircle2, AlertCircle, Loader2, User } from 'lucide-react';
import { getDashboardStats, getFleetSummary } from '../services/dashboardService';
import type { OrderStatusCount, FleetSummary } from '../services/dashboardService';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, fleetData] = await Promise.all([
          getDashboardStats(),
          getFleetSummary()
        ]);
        setStats(statsData);
        setFleet(fleetData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
        gridTemplateColumns: '2fr 1fr',
        gap: '1.5rem'
      }}>
        <div className="card" style={{ minHeight: '350px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '1.5rem', fontWeight: 600 }}>Distribución de Estados</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.map((s) => (
              <div key={s.status} style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                  <span style={{ fontWeight: 500 }}>{s.status}</span>
                  <span style={{ color: '#64748b' }}>{s.count} pedidos ({totalOrders > 0 ? ((s.count / totalOrders) * 100).toFixed(1) : 0}%)</span>
                </div>
                <div style={{ height: '8px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${totalOrders > 0 ? (s.count / totalOrders) * 100 : 0}%`, 
                    backgroundColor: s.status === 'DELIVERED' ? '#22c55e' : s.status === 'IN_TRANSIT' ? '#f59e0b' : '#3b82f6',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            ))}
            {stats.length === 0 && (
              <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '4rem' }}>
                <ShoppingBag size={48} style={{ opacity: 0.2, marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
                <p>No hay pedidos registrados para mostrar estadísticas.</p>
              </div>
            )}
          </div>
        </div>

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
