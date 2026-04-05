import React, { useEffect, useState } from 'react';
import { FileText, Download, Filter, BarChart3, TrendingUp, Clock, AlertTriangle, Loader2, X } from 'lucide-react';
import { getOrdersSummary, getDriverPerformance, getRouteEfficiency } from '../services/reportService';
import type { OrdersSummary, DriverPerformance } from '../services/reportService';
import { getAllDrivers } from '../services/driverService';
import type { Driver } from '../services/driverService';
import { Bar } from 'react-chartjs-2';
import Pagination from '../components/Pagination';

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: `4px solid ${color}` }}>
    <div style={{ backgroundColor: `${color}15`, color: color, padding: '0.75rem', borderRadius: '0.5rem', display: 'flex' }}>{icon}</div>
    <div>
      <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
      <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.25rem' }}>{value}</h3>
    </div>
  </div>
);

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<OrdersSummary | null>(null);
  const [driverPerformance, setDriverPerformance] = useState<DriverPerformance[]>([]);
  const [routeEfficiency, setRouteEfficiency] = useState<{ district: string; orderCount: number }[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ driverId: '', startDate: '', endDate: '' });

  // Pagination for route efficiency table
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const driverIdNum = filters.driverId ? parseInt(filters.driverId) : undefined;
      const startDate = filters.startDate || undefined;
      const endDate = filters.endDate || undefined;

      const [summaryData, driverPerfData, routeData, driversData] = await Promise.all([
        getOrdersSummary(driverIdNum, startDate, endDate),
        getDriverPerformance(driverIdNum),
        getRouteEfficiency(startDate, endDate),
        getAllDrivers()
      ]);

      setSummary(summaryData);
      setDriverPerformance(driverPerfData);
      setRouteEfficiency(routeData);
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filters]);

  const totalOrders = summary?.ordersByStatus?.reduce((acc, curr) => acc + curr.count, 0) || 0;

  const handleExportCsv = () => {
    if (routeEfficiency.length === 0) return;
    const header = 'Distrito,Cantidad de Pedidos\n';
    const rows = routeEfficiency.map(r => `"${r.district || 'Sin Distrito'}",${r.orderCount}`).join('\n');
    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_eficiencia_rutas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  // Chart data for driver performance
  const chartColors = [
    'rgba(59, 130, 246, 0.6)',
    'rgba(16, 185, 129, 0.6)',
    'rgba(245, 158, 11, 0.6)',
    'rgba(139, 92, 246, 0.6)',
    'rgba(236, 72, 153, 0.6)',
  ];

  const chartData = {
    labels: driverPerformance.map(d => d.name),
    datasets: [
      {
        label: 'Entregas Realizadas',
        data: driverPerformance.map(d => d.count),
        backgroundColor: driverPerformance.map((_, i) => chartColors[i % chartColors.length]),
        borderColor: driverPerformance.map((_, i) => chartColors[i % chartColors.length].replace('0.6', '1')),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => ` Entregas: ${context.raw}`,
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1, font: { weight: 'bold' as const } },
        title: { display: true, text: 'Cantidad de Pedidos' }
      },
      x: {
        ticks: { font: { weight: 'bold' as const } }
      }
    }
  };

  // Paginated route efficiency
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRoutes = routeEfficiency.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Loader2 className="animate-spin" size={48} color="#2563eb" /></div>;
  }

  return (
    <div className="main-content" style={{ overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileText size={28} color="#2563eb" />
          <h2 className="header-title" style={{ margin: 0 }}>Reportes y Anal&iacute;tica</h2>
        </div>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Actualizado hoy a las {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f8fafc' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b' }}><Filter size={18} /><span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Filtros:</span></div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#94a3b8' }}>CONDUCTOR</label>
            <select value={filters.driverId} onChange={e => setFilters({ ...filters, driverId: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', outline: 'none', fontSize: '0.875rem' }}>
              <option value="">Todos los conductores</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#94a3b8' }}>DESDE</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
          </div>
          <div style={{ flex: 1, minWidth: '150px' }}>
            <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, marginBottom: '0.3rem', color: '#94a3b8' }}>HASTA</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} style={{ width: '100%', padding: '0.5rem', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.875rem' }} />
          </div>
          <button onClick={() => setFilters({ driverId: '', startDate: '', endDate: '' })} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>
            <X size={16} /> Limpiar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <StatCard title="Total Pedidos" value={totalOrders} icon={<BarChart3 size={24} />} color="#2563eb" />
        <StatCard title="Entregas a Tiempo" value={summary?.onTimeDeliveries || 0} icon={<Clock size={24} />} color="#22c55e" />
        <StatCard title="Entregas Retrasadas" value={summary?.delayedDeliveries || 0} icon={<AlertTriangle size={24} />} color="#ef4444" />
      </div>

      {/* Chart Section */}
      <div className="card" style={{ marginBottom: '2rem', minHeight: '400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#2563eb" /> Rendimiento por Conductor
          </h3>
        </div>
        <div style={{ height: '300px' }}>
          {driverPerformance.length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '100px' }}>Sin datos de rendimiento de conductores.</p>
          )}
        </div>
      </div>

      {/* Route Efficiency Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Eficiencia por Distrito / Ruta</h3>
          <button onClick={handleExportCsv} style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <Download size={16} /> Exportar CSV
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>#</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DISTRITO</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CANTIDAD DE PEDIDOS</th>
            </tr>
          </thead>
          <tbody>
            {currentRoutes.map((route, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 1.5rem', color: '#94a3b8' }}>{indexOfFirstItem + index + 1}</td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{route.district || 'Sin Distrito'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: '#eff6ff', color: '#1e40af' }}>
                    {route.orderCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination
          currentPage={currentPage}
          totalItems={routeEfficiency.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />

        {routeEfficiency.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <FileText size={48} style={{ opacity: 0.2, marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
            <p>No se encontraron datos de eficiencia de rutas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
