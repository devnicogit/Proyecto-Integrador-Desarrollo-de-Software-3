import React, { useEffect, useState } from 'react';
import { UserPlus, Search, Edit2, Trash2, Loader2, CheckCircle, XCircle, X } from 'lucide-react';
import { getAllDrivers, deleteDriver, createDriver, updateDriver } from '../services/driverService';
import type { Driver } from '../services/driverService';

const Drivers: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    licenseNumber: '',
    phoneNumber: '',
    email: '',
    isActive: true
  });

  const fetchDrivers = async () => {
    try {
      const data = await getAllDrivers();
      setDrivers(data);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ firstName: '', lastName: '', licenseNumber: '', phoneNumber: '', email: '', isActive: true });
    setIsModalOpen(true);
  };

  const handleEdit = (driver: Driver) => {
    setEditingId(driver.id);
    setFormData({
      firstName: driver.firstName,
      lastName: driver.lastName,
      licenseNumber: driver.licenseNumber,
      phoneNumber: driver.phoneNumber || '',
      email: driver.email || '',
      isActive: driver.isActive
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este conductor?')) {
      try {
        await deleteDriver(id);
        setDrivers(drivers.filter(d => d.id !== id));
      } catch (error) {
        alert('Error al eliminar conductor');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDriver(editingId, formData);
      } else {
        await createDriver(formData);
      }
      setIsModalOpen(false);
      fetchDrivers();
    } catch (error) {
      alert(editingId ? 'Error al actualizar conductor' : 'Error al crear conductor');
    }
  };

  const filteredDrivers = drivers.filter(d => 
    `${d.firstName} ${d.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h2 className="header-title" style={{ margin: 0 }}>Gestión de Conductores</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o licencia..." 
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
            <UserPlus size={18} /> Nuevo Conductor
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Nombre Completo</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Licencia</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Contacto</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Estado</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => (
              <tr key={driver.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontWeight: 600 }}>{driver.firstName} {driver.lastName}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>ID: {driver.id}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 500, color: '#475569' }}>{driver.licenseNumber}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontSize: '0.875rem' }}>{driver.phoneNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{driver.email}</div>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  {driver.isActive ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>
                      <CheckCircle size={14} /> ACTIVO
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                      <XCircle size={14} /> INACTIVO
                    </span>
                  )}
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button onClick={() => handleEdit(driver)} style={{ color: '#2563eb', backgroundColor: 'transparent' }}><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(driver.id)} style={{ color: '#ef4444', backgroundColor: 'transparent' }}><Trash2 size={18} /></button>
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
            <h3 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Editar Conductor' : 'Registrar Nuevo Conductor'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Nombre</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.firstName} 
                  onChange={e => setFormData({...formData, firstName: e.target.value})} 
                  placeholder="Ej: Juan"
                  maxLength={50}
                  required 
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Apellido</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.lastName} 
                  onChange={e => setFormData({...formData, lastName: e.target.value})} 
                  placeholder="Ej: Pérez"
                  maxLength={50}
                  required 
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>N° Licencia</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.licenseNumber} 
                  onChange={e => setFormData({...formData, licenseNumber: e.target.value.toUpperCase()})} 
                  placeholder="Ej: Q12345678"
                  pattern="^[A-Z][0-9]{8}$"
                  title="Formato: Una letra mayúscula seguida de 8 números"
                  required 
                />
                <small style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Formato: Letra + 8 dígitos</small>
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Teléfono</label>
                <input 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.phoneNumber} 
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                  placeholder="Ej: 987654321"
                  pattern="^9[0-9]{8}$"
                  title="Debe empezar con 9 y tener 9 dígitos"
                  required
                />
              </div>
              <div style={{ gridColumn: 'span 1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Email</label>
                <input 
                  type="email" 
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }} 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="ejemplo@correo.com"
                  maxLength={100}
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} />
                  Conductor Activo
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

export default Drivers;
