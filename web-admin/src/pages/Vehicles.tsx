import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, Loader2, CheckCircle, XCircle, X } from 'lucide-react';
import { getAllVehicles, deleteVehicle, createVehicle, updateVehicle } from '../services/vehicleService';
import type { Vehicle } from '../services/vehicleService';

const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    plateNumber: '',
    model: '',
    brand: '',
    capacityKg: 0,
    capacityM3: 0,
    isActive: true
  });

  const fetchVehicles = async () => {
    try {
      const data = await getAllVehicles();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ plateNumber: '', model: '', brand: '', capacityKg: 0, capacityM3: 0, isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingId(vehicle.id);
    setFormData({
      plateNumber: vehicle.plateNumber,
      model: vehicle.model || '',
      brand: vehicle.brand || '',
      capacityKg: vehicle.capacityKg || 0,
      capacityM3: vehicle.capacityM3 || 0,
      isActive: vehicle.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este vehículo?')) {
      try {
        await deleteVehicle(id);
        setVehicles(vehicles.filter(v => v.id !== id));
      } catch (error) {
        alert('Error al eliminar vehículo');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateVehicle(editingId, formData);
      } else {
        await createVehicle(formData);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (error) {
      alert(editingId ? 'Error al actualizar vehículo' : 'Error al crear vehículo');
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.model.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="header-title" style={{ margin: 0 }}>Gestión de Vehículos</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              placeholder="Buscar por placa o modelo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                borderRadius: '0.5rem',
                border: '1px solid #e2e8f0',
                width: '300px',
                outline: 'none',
                fontSize: '0.875rem'
              }}
            />
          </div>
          <button 
            onClick={openCreateModal}
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
            <Plus size={18} /> Nuevo Vehículo
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Placa</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Modelo / Marca</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Capacidad</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 700, color: '#1e40af' }}>{vehicle.plateNumber}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 500 }}>{vehicle.model}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{vehicle.brand}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>{vehicle.capacityKg} Kg</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{vehicle.capacityM3} m³</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {vehicle.isActive ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle size={14} /> OPERATIVO
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      <XCircle size={14} /> TALLER
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => handleEdit(vehicle)} style={{ color: '#2563eb', backgroundColor: 'transparent' }}><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(vehicle.id)} style={{ color: '#ef4444', backgroundColor: 'transparent' }}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', color: '#64748b', background: 'none' }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Vehículo' : 'Registrar Nuevo Vehículo'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>N° Placa</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.plateNumber} 
                  onChange={e => setFormData({...formData, plateNumber: e.target.value.toUpperCase()})} 
                  placeholder="Ej: ABC-123"
                  pattern="^[A-Z0-9]{3}-[A-Z0-9]{3}$"
                  title="Formato: 3 caracteres, guion, 3 caracteres (Ej: ABC-123)"
                  required 
                />
                <small style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Formato estándar: ABC-123</small>
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Marca</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.brand} 
                  onChange={e => setFormData({...formData, brand: e.target.value})} 
                  placeholder="Ej: Toyota"
                  maxLength={50}
                  required 
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Modelo</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.model} 
                  onChange={e => setFormData({...formData, model: e.target.value})} 
                  placeholder="Ej: Hilux"
                  maxLength={50}
                  required 
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Capacidad (Kg)</label>
                <input type="number" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.capacityKg} onChange={e => setFormData({...formData, capacityKg: parseFloat(e.target.value)})} />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Capacidad (m³)</label>
                <input type="number" step="0.1" style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} value={formData.capacityM3} onChange={e => setFormData({...formData, capacityM3: parseFloat(e.target.value)})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  Vehículo Operativo
                </label>
              </div>
              <div style={{ gridColumn: 'span 2', marginTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#f1f5f9' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600 }}>
                  {editingId ? 'Guardar Cambios' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;
