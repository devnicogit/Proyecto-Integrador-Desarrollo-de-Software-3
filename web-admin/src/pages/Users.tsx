import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Loader2, X, Search } from 'lucide-react';
import { getAllUsers, assignRole, removeRole } from '../services/userService';
import type { UserRole } from '../services/userService';
import Pagination from '../components/Pagination';

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form
  const [formData, setFormData] = useState({ userExternalId: '', roleId: 1 });

  const fetchUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await assignRole(formData.userExternalId, formData.roleId);
      setIsModalOpen(false);
      setFormData({ userExternalId: '', roleId: 1 });
      fetchUsers();
    } catch (error) {
      alert('Error al asignar rol');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Desea eliminar esta asignacion de rol?')) {
      try {
        await removeRole(id);
        fetchUsers();
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  const filteredUsers = users.filter(u =>
    u.userExternalId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'ADMIN';
      case 2: return 'DISPATCHER';
      case 3: return 'DRIVER';
      default: return `Rol #${roleId}`;
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 className="header-title" style={{ margin: 0 }}>Gestion de Usuarios</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            <input
              type="text"
              placeholder="Buscar por ID externo..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ padding: '0.625rem 1rem 0.625rem 2.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', width: '250px', outline: 'none' }}
            />
          </div>
          <button
            onClick={() => { setFormData({ userExternalId: '', roleId: 1 }); setIsModalOpen(true); }}
            style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.625rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <UserPlus size={18} /> Asignar Rol
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>ID</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>USER EXTERNAL ID</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>ROL</th>
              <th style={{ padding: '1rem 1.5rem', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '1rem 1.5rem', fontWeight: 600 }}>{user.id}</td>
                <td style={{ padding: '1rem 1.5rem' }}>{user.userExternalId}</td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    backgroundColor: '#eff6ff',
                    color: '#1e40af'
                  }}>
                    {getRoleName(user.roleId)}
                  </span>
                </td>
                <td style={{ padding: '1rem 1.5rem' }}>
                  <button
                    onClick={() => handleDelete(user.id)}
                    style={{ color: '#ef4444', background: 'none' }}
                    title="Eliminar asignacion"
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination
          currentPage={currentPage}
          totalItems={filteredUsers.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
        {filteredUsers.length === 0 && (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
            <p>No se encontraron asignaciones de usuario.</p>
          </div>
        )}
      </div>

      {/* Modal: Asignar Rol */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '450px', position: 'relative' }}>
            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', right: '1rem', top: '1rem', background: 'none' }}><X size={20} /></button>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>Asignar Rol a Usuario</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>User External ID</label>
                <input
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                  value={formData.userExternalId}
                  onChange={e => setFormData({ ...formData, userExternalId: e.target.value })}
                  placeholder="Ej: uuid-de-keycloak"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Rol</label>
                <select
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #e2e8f0', borderRadius: '0.25rem' }}
                  value={formData.roleId}
                  onChange={e => setFormData({ ...formData, roleId: parseInt(e.target.value) })}
                >
                  <option value={1}>ADMIN</option>
                  <option value={2}>DISPATCHER</option>
                  <option value={3}>DRIVER</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#f1f5f9' }}>Cancelar</button>
                <button type="submit" style={{ padding: '0.5rem 1rem', borderRadius: '0.25rem', backgroundColor: '#2563eb', color: '#fff', fontWeight: 600 }}>Asignar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
