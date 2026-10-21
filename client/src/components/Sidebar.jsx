import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  Receipt,
  Users,
  Building2,
  UserCog,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/sidebar.module.css';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/quotations', label: 'Quotations', icon: FileCheck },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/settings/company', label: 'Company Settings', icon: Building2 },
  { to: '/settings/account', label: 'Account Settings', icon: UserCog },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const displayName =
    user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'User');
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <>
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}
        aria-label="Application navigation"
      >
        <div className={styles.logoArea}>
          <NavLink to="/dashboard" className={styles.brand} onClick={handleNavClick}>
            <img
              src="/quoteflow-icon.svg"
              alt="QuoteFlow Logo"
              className={styles.logoIcon}
              style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'contain' }}
            />
            <span className={styles.brandName}>QuoteFlow</span>
          </NavLink>

          <button
            type="button"
            className={styles.closeMobileBtn}
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                }
              >
                <Icon className={styles.navIcon} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className={styles.avatar}>{initial}</div>
            <div className={styles.userMeta}>
              <span className={styles.userName} title={displayName}>
                {displayName}
              </span>
              <span className={styles.userRole}>Business Owner</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.logoutBtn}
            onClick={logout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>
    </>
  );
}
