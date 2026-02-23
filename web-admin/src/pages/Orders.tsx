import React, { useEffect, useState } from 'react';
import { Search, Loader2, Plus, X, Package, Trash2, MapPin, User, Phone, Mail, Calendar, Info, RefreshCw, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';
import { getAllOrders, createOrder, deleteOrder, updateOrderStatus } from '../services/orderService';
import type { Order } from '../services/orderService';
import { getAllRoutes } from '../services/routeService';
import type { Route } from '../services/routeService';
import api from '../services/api';
import Pagination from '../components/Pagination';

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Update Status Form state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [reason, setReason] = useState('');

  // Create Order Form state
  const [formData, setFormData] = useState({
    trackingNumber: '',
    externalReference: '',
    routeId: '',
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    deliveryAddress: '',
    deliveryCity: 'Lima',
    deliveryDistrict: '',
    priority: 0,
    latitude: -12.095,
    longitude: -77.020
  });

  const [isGeocoding, setIsGeocoding] = useState(false);

  const handleGeocode = async () => {
    if (!formData.deliveryAddress || formData.deliveryAddress.length < 5) {
      alert('Por favor ingrese una dirección más específica para localizar.');
      return;
    }

    setIsGeocoding(true);
    try {
      // Usamos el servicio gratuito de Nominatim (OpenStreetMap)
      const query = `${formData.deliveryAddress}, ${formData.deliveryDistrict || ''}, ${formData.deliveryCity}, Peru`;
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData({
          ...formData,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        });
        alert(`📍 Dirección localizada: ${data[0].display_name}`);
      } else {
        alert('No se encontraron coordenadas para esa dirección. Se usará la ubicación por defecto.');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsGeocoding(false);
    }
  };

  const fetchData = async () => {
    try {
      const [ordersData, routesData] = await Promise.all([
        getAllOrders(),
        getAllRoutes()
      ]);
      setOrders(ordersData);
      setRoutes(routesData);
      
      if (selectedOrder) {
        const updated = ordersData.find(o => o.id === selectedOrder.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
    setIsUpdatingStatus(false);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este pedido?')) {
      try {
        await deleteOrder(id);
        fetchData();
        if (selectedOrder?.id === id) setIsDetailModalOpen(false);
      } catch (error) {
        alert('Error al eliminar el pedido');
      }
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOrder({
        ...formData,
        routeId: formData.routeId ? parseInt(formData.routeId) : undefined,
        latitude: formData.latitude,
        longitude: formData.longitude
      });
      setIsCreateModalOpen(false);
      setFormData({
        trackingNumber: '', externalReference: '', routeId: '',
        recipientName: '', recipientPhone: '', recipientEmail: '',
        deliveryAddress: '', deliveryCity: 'Lima', deliveryDistrict: '',
        priority: 0,
        latitude: -12.095,
        longitude: -77.020
      });
      fetchData();
    } catch (error) {
      alert('Error al crear el pedido');
    }
  };

  const handleStatusUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !newStatus || !reason) return;
    try {
      await updateOrderStatus(selectedOrder.id, newStatus, reason);
      setIsUpdatingStatus(false);
      setNewStatus('');
      setReason('');
      fetchData();
    } catch (error) {
      alert('Error al actualizar el estado');
    }
  };

  const handleDownloadPdf = async (orderId: number, trackingNumber: string) => {
    try {
      const response = await api.get(`/delivery-proofs/${orderId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprobante_${trackingNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('No se pudo descargar el PDF. Asegúrese de que el pedido tenga una evidencia registrada.');
    }
  };

  const handleSimulateDelivery = async (orderId: number) => {
    if (!window.confirm('¿Desea simular la entrega con evidencia digital para este pedido?')) return;
    
    try {
      const deliveryBody = {
        orderId: orderId,
        imageUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKma1gAAAABJRU5ErkJggg==",
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKma1gAAAABJRU5ErkJggg==",
        receiverName: "Entrega desde Dashboard",
        receiverDni: "00000000",
        latitude: -12.095,
        longitude: -77.020
      };
      
      await api.post('/delivery-proofs', deliveryBody);
      alert('¡Evidencia registrada con éxito! El pedido ahora es DELIVERED.');
      fetchData();
    } catch (error) {
      alert('Error al registrar la evidencia.');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          order.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate paginated data
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'DELIVERED': return { bg: '#dcfce7', text: '#166534' };
      case 'IN_TRANSIT': return { bg: '#fef3c7', text: '#92400e' };
      case 'FAILED': return { bg: '#fee2e2', text: '#991b1b' };
      case 'PENDING': return { bg: '#f1f5f9', text: '#475569' };
      case 'RETURNED': return { bg: '#fae8ff', text: '#701a75' };
      default: return { bg: '#eff6ff', text: '#1e40af' };
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><Loader2 className="animate-spin" size={48} color="#2563eb" /></div>;
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 className="header-title" style={{ margin: 0 }}>Gestión de Pedidos</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input type="text" placeholder="Buscar tracking..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', width: '250px', outline: 'none' }} />
          </div>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} style={{ padding: '0.625rem 1rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', outline: 'none', backgroundColor: '#fff' }}>
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">PENDING</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="IN_TRANSIT">IN_TRANSIT</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="FAILED">FAILED</option>
            <option value="RETURNED">RETURNED</option>
          </select>
          <button onClick={() => setIsCreateModalOpen(true)} style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Nuevo Pedido
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>TRACKING</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CLIENTE</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>RUTA</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ESTADO</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {currentOrders.map((order) => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{order.trackingNumber}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{order.recipientName}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{order.routeId ? <span style={{ color: '#2563eb', fontWeight: 600 }}>Ruta #{order.routeId}</span> : 'Sin asignar'}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{ padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600, backgroundColor: getStatusStyle(order.status).bg, color: getStatusStyle(order.status).text }}>
                    {order.status}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => handleOpenDetail(order)} style={{ color: '#2563eb', background: 'none' }} title="Detalles"><Info size={18} /></button>
                    <button onClick={() => { setSelectedOrder(order); setIsDetailModalOpen(true); setIsUpdatingStatus(true); }} style={{ color: '#f59e0b', background: 'none' }} title="Cambiar Estado"><RefreshCw size={18} /></button>
                    <button onClick={() => handleDelete(order.id)} style={{ color: '#ef4444', background: 'none' }} title="Eliminar"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <Pagination 
          currentPage={currentPage}
          totalItems={filteredOrders.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => setCurrentPage(page)}
        />

        {filteredOrders.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <Package size={48} style={{ opacity: 0.2, marginBottom: '1rem', marginLeft: 'auto', marginRight: 'auto' }} />
            <p>No se encontraron pedidos registrados.</p>
          </div>
        )}
      </div>

      {/* Modal: Nuevo Pedido */}
      {isCreateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', position: 'relative' }}>
            <button onClick={() => setIsCreateModalOpen(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none' }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Registrar Nuevo Pedido</h3>
            <form onSubmit={handleCreateSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>N° Tracking</label>
                <input style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.trackingNumber} onChange={e => setFormData({...formData, trackingNumber: e.target.value.toUpperCase()})} placeholder="Ej: ECO-12345" minLength={5} maxLength={50} required />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Vincular a Ruta</label>
                <select style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.routeId} onChange={e => setFormData({...formData, routeId: e.target.value})}>
                  <option value="">-- Sin Ruta --</option>
                  {routes.map(r => <option key={r.id} value={r.id}>Ruta #{r.id} - {r.routeDate}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nombre Cliente</label>
                <input style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.recipientName} onChange={e => setFormData({...formData, recipientName: e.target.value})} placeholder="Ej: Ana García" maxLength={255} required />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Dirección</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    style={{ flex: 1, padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                    value={formData.deliveryAddress} 
                    onChange={e => setFormData({...formData, deliveryAddress: e.target.value})} 
                    placeholder="Ej: Calle Los Pinos 450" 
                    required 
                  />
                  <button 
                    type="button" 
                    onClick={handleGeocode}
                    disabled={isGeocoding}
                    style={{ 
                      padding: '0.5rem', 
                      backgroundColor: '#f1f5f9', 
                      borderRadius: '0.25rem', 
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Obtener coordenadas GPS"
                  >
                    {isGeocoding ? <Loader2 className="animate-spin" size={16} /> : <MapPin size={16} />}
                  </button>
                </div>
                <small style={{ fontSize: '0.6rem', color: '#94a3b8' }}>Coordenadas: {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}</small>
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Teléfono Cliente</label>
                <input style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.recipientPhone} onChange={e => setFormData({...formData, recipientPhone: e.target.value})} placeholder="Ej: 912345678" pattern="^9[0-9]{8}$" title="9 dígitos, empezar con 9" required />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Email Cliente</label>
                <input type="email" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.recipientEmail} onChange={e => setFormData({...formData, recipientEmail: e.target.value})} placeholder="ejemplo@correo.com" />
              </div>
              <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsCreateModalOpen(false)} style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.6rem 1.25rem', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600 }}>Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalle e Incidencia */}
      {isDetailModalOpen && selectedOrder && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative', padding: '2rem' }}>
            <button onClick={() => setIsDetailModalOpen(false)} style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none' }}><X size={24} /></button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>Pedido #{selectedOrder.trackingNumber}</h3>

            {!isUpdatingStatus ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: getStatusStyle(selectedOrder.status).bg, color: getStatusStyle(selectedOrder.status).text, fontWeight: 700 }}>
                  Estado: {selectedOrder.status}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><User size={16} /> {selectedOrder.recipientName}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><Phone size={16} /> {selectedOrder.recipientPhone || 'N/A'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><Mail size={16} /> {selectedOrder.recipientEmail || 'N/A'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><MapPin size={16} /> {selectedOrder.deliveryAddress}, {selectedOrder.deliveryDistrict}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}><Calendar size={16} /> Creado: {new Date(selectedOrder.createdAt).toLocaleDateString()}</div>
                </div>

                {selectedOrder.status === 'DELIVERED' && (
                  <button 
                    onClick={() => handleDownloadPdf(selectedOrder.id, selectedOrder.trackingNumber)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem', 
                      padding: '0.75rem', 
                      backgroundColor: '#10b981', 
                      color: '#fff', 
                      borderRadius: '0.5rem', 
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    <FileText size={18} /> Descargar Comprobante PDF
                  </button>
                )}

                {selectedOrder.status !== 'DELIVERED' && (
                  <button 
                    onClick={() => handleSimulateDelivery(selectedOrder.id)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '0.5rem', 
                      padding: '0.75rem', 
                      backgroundColor: '#3b82f6', 
                      color: '#fff', 
                      borderRadius: '0.5rem', 
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      marginTop: '1rem'
                    }}
                  >
                    <CheckCircle2 size={18} /> Registrar Entrega (Simulación)
                  </button>
                )}

                <button onClick={() => setIsUpdatingStatus(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', border: '1px solid #2563eb', color: '#2563eb', borderRadius: '0.5rem', fontWeight: 600, backgroundColor: 'transparent', marginTop: '0.5rem' }}>
                  <RefreshCw size={18} /> Forzar Cambio de Estado
                </button>
              </div>
            ) : (
              <form onSubmit={handleStatusUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ backgroundColor: '#fff7ed', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #fdba74', color: '#9a3412', display: 'flex', gap: '0.5rem', fontSize: '0.8rem' }}>
                  <AlertCircle size={16} />
                  <span>Esta acción quedará registrada en auditoría.</span>
                </div>
                <select style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }} value={newStatus} onChange={e => setNewStatus(e.target.value)} required>
                  <option value="">-- Nuevo Estado --</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="FAILED">FAILED</option>
                  <option value="RETURNED">RETURNED</option>
                </select>
                <textarea style={{ width: '100%', padding: '0.6rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem', minHeight: '80px' }} placeholder="Motivo del cambio..." value={reason} onChange={e => setReason(e.target.value)} required />
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={() => setIsUpdatingStatus(false)} style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#f1f5f9' }}>Atrás</button>
                  <button type="submit" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600 }}>Confirmar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
