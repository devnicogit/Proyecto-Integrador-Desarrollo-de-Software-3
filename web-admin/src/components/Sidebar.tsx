import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Map,
  Users,
  Truck,
  LogOut,
  User as UserIcon,
  Home,
  ShoppingBag,
  BarChart3,
  Menu,
  X,
  UserCog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasRole = (roles: string[]) => {
    return user?.roles.some(role => roles.includes(role));
  };

  const handleNavClick = () => {
    if (isMobile) setMobileOpen(false);
  };

  const sidebarWidth = collapsed && !isMobile ? '60px' : '260px';
  const showLabels = !collapsed || isMobile;
  const sidebarVisible = isMobile ? mobileOpen : true;

  const linkStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: showLabels ? '0.75rem' : '0',
    padding: collapsed && !isMobile ? '0.75rem 0' : '0.75rem 1.5rem',
    justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
    color: isActive ? '#3b82f6' : '#94a3b8',
    backgroundColor: isActive ? '#1e1b4b' : 'transparent',
    borderLeft: isActive ? '4px solid #3b82f6' : '4px solid transparent',
    transition: 'all 0.2s',
    fontWeight: isActive ? 600 : 400,
  });

  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 1001,
            backgroundColor: '#1e293b',
            color: '#f8fafc',
            padding: '0.5rem',
            borderRadius: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          <Menu size={22} />
        </button>
      )}

      {/* Backdrop overlay for mobile */}
      {isMobile && mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
        />
      )}

      {/* Sidebar */}
      {sidebarVisible && (
        <aside style={{
          width: sidebarWidth,
          minWidth: sidebarWidth,
          backgroundColor: '#1e293b',
          color: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.5rem 0',
          boxShadow: '4px 0 10px rgba(0,0,0,0.1)',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          zIndex: 999,
          transition: 'width 0.2s ease',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: collapsed && !isMobile ? '0 0.5rem 1.5rem' : '0 1.5rem 1.5rem', borderBottom: '1px solid #334155' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {showLabels && (
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6', letterSpacing: '-0.025em' }}>EcoRoute</h1>
              )}
              <button
                onClick={isMobile ? () => setMobileOpen(false) : onToggle}
                style={{
                  background: 'none',
                  color: '#94a3b8',
                  padding: '0.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: collapsed && !isMobile ? '0 auto' : undefined,
                }}
                title={collapsed ? 'Expandir' : 'Colapsar'}
              >
                {isMobile ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>

            {/* User card + notifications */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1rem',
              padding: '0.5rem',
              backgroundColor: '#33415540',
              borderRadius: '0.5rem',
              justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
            }}>
              <div style={{ padding: '0.4rem', backgroundColor: '#3b82f6', borderRadius: '50%', color: '#fff', flexShrink: 0 }}>
                <UserIcon size={14} />
              </div>
              {showLabels && (
                <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user?.username || 'Usuario'}</p>
                  <p style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{user?.roles[0] || 'Sin Rol'}</p>
                </div>
              )}
              <NotificationPanel collapsed={collapsed && !isMobile} />
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: '1.5rem 0', overflowY: 'auto' }}>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>
                <NavLink to="/" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                  <Home size={20} />
                  {showLabels && <span>Inicio</span>}
                </NavLink>
              </li>
              <li>
                <NavLink to="/dashboard" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                  <LayoutDashboard size={20} />
                  {showLabels && <span>Dashboard</span>}
                </NavLink>
              </li>

              {hasRole(['ADMIN', 'DISPATCHER']) && (
                <>
                  <li>
                    <NavLink to="/orders" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <ShoppingCart size={20} />
                      {showLabels && <span>Pedidos</span>}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/routes" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <Map size={20} />
                      {showLabels && <span>Rutas</span>}
                    </NavLink>
                  </li>
                </>
              )}

              {hasRole(['ADMIN']) && (
                <>
                  <li>
                    <NavLink to="/drivers" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <Users size={20} />
                      {showLabels && <span>Conductores</span>}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/vehicles" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <Truck size={20} />
                      {showLabels && <span>Vehiculos</span>}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/users" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <UserCog size={20} />
                      {showLabels && <span>Usuarios</span>}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/purchases" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <ShoppingBag size={20} />
                      {showLabels && <span>Compras</span>}
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/reports" onClick={handleNavClick} style={({ isActive }) => linkStyle(isActive)}>
                      <BarChart3 size={20} />
                      {showLabels && <span>Reportes</span>}
                    </NavLink>
                  </li>
                </>
              )}
            </ul>
          </nav>

          {/* Logout */}
          <div style={{ padding: collapsed && !isMobile ? '1.5rem 0.5rem' : '1.5rem', borderTop: '1px solid #334155' }}>
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: showLabels ? '0.75rem' : '0',
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                color: '#ef4444',
                backgroundColor: 'transparent',
                fontSize: '0.875rem',
                fontWeight: 500,
                width: '100%',
                textAlign: 'left',
              }}
            >
              <LogOut size={20} />
              {showLabels && <span>Cerrar Sesion</span>}
            </button>
          </div>
        </aside>
      )}
    </>
  );
};

export default Sidebar;
