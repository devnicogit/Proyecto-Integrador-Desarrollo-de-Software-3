import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Map, Users, Truck, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasRole = (roles: string[]) => {
    return user?.roles.some(role => roles.includes(role));
  };

  return (
    <aside style={{
      width: '260px',
      backgroundColor: '#1e293b',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      padding: '1.5rem 0',
      boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0
    }}>
      <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderBottom: '1px solid #334155' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', letterSpacing: '-0.025em' }}>EcoRoute</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', padding: '0.5rem', backgroundColor: '#33415540', borderRadius: '0.5rem' }}>
          <div style={{ padding: '0.4rem', backgroundColor: '#3b82f6', borderRadius: '50%', color: '#fff' }}>
            <UserIcon size={14} />
          </div>
          <div style={{ overflow: 'hidden' }}>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.username || 'Usuario'}</p>
            <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{user?.roles[0] || 'Sin Rol'}</p>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '1.5rem 0' }}>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <li>
            <NavLink to="/" style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1.5rem',
              color: isActive ? '#3b82f6' : '#94a3b8',
              backgroundColor: isActive ? '#1e1b4b' : 'transparent',
              borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
              transition: 'all 0.2s'
            })}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          </li>
          
          {hasRole(['ADMIN', 'DISPATCHER']) && (
            <>
              <li>
                <NavLink to="/orders" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  backgroundColor: isActive ? '#1e1b4b' : 'transparent',
                  borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'all 0.2s'
                })}>
                  <ShoppingCart size={20} />
                  <span>Pedidos</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/routes" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  backgroundColor: isActive ? '#1e1b4b' : 'transparent',
                  borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'all 0.2s'
                })}>
                  <Map size={20} />
                  <span>Rutas</span>
                </NavLink>
              </li>
            </>
          )}

          {hasRole(['ADMIN']) && (
            <>
              <li>
                <NavLink to="/drivers" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  backgroundColor: isActive ? '#1e1b4b' : 'transparent',
                  borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'all 0.2s'
                })}>
                  <Users size={20} />
                  <span>Conductores</span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/vehicles" style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1.5rem',
                  color: isActive ? '#3b82f6' : '#94a3b8',
                  backgroundColor: isActive ? '#1e1b4b' : 'transparent',
                  borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
                  transition: 'all 0.2s'
                })}>
                  <Truck size={20} />
                  <span>Vehículos</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div style={{ padding: '1.5rem', borderTop: '1px solid #334155' }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            color: '#ef4444',
            backgroundColor: 'transparent',
            fontSize: '0.875rem',
            fontWeight: 500,
            width: '100%',
            textAlign: 'left'
          }}
        >
          <LogOut size={20} />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
