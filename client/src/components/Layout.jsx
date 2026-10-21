import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import styles from '../styles/layout.module.css';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={styles.layout}>
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className={styles.contentWrapper}>
        <header className={styles.mobileHeader}>
          <div className={styles.mobileBrand}>
            <img
              src="/quoteflow-icon.svg"
              alt="QuoteFlow"
              style={{ width: 22, height: 22, borderRadius: 3, objectFit: 'contain' }}
            />
            <span>QuoteFlow</span>
          </div>

          <button
            type="button"
            className={styles.hamburgerBtn}
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>
        </header>

        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
