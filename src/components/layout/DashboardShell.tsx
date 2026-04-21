'use client'

import React from 'react';
import { Menu, X, Bell, Search, User as UserIcon } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface DashboardShellProps {
  children: React.ReactNode;
  profile: any;
  brandConfig: any;
}

export function DashboardShell({ children, profile, brandConfig }: DashboardShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative' }}>
      <style jsx>{`
        .sidebar-wrapper {
          transform: translateX(0);
        }
        @media (max-width: 1024px) {
          .sidebar-wrapper {
            transform: translateX(-100%);
          }
          .sidebar-wrapper.open {
            transform: translateX(0);
          }
          .main-content {
            margin-left: 0 !important;
          }
          #sidebar-toggle {
            display: flex !important;
          }
        }
        @media (max-width: 640px) {
          .search-container,
          .user-info {
            display: none !important;
          }
          .content-area {
            padding: var(--page-padding) !important;
          }
          .topbar-header {
            padding: 0 1rem !important;
          }
        }
      `}</style>

      {/* Sidebar with Overlay for Mobile */}
      <div 
        className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          zIndex: 100,
          transition: 'transform 0.3s ease'
        }}
      >
        <Sidebar userRole={profile?.role} brandConfig={brandConfig} />
      </div>

      {/* Overlay Background */}
      {isSidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 90
          }}
        />
      )}
      
      <main style={{ 
        flex: 1, 
        marginLeft: '280px', 
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        position: 'relative',
        transition: 'margin-left 0.3s ease',
        maxWidth: '100vw',
        overflowX: 'hidden'
      }} className="main-content">
        
        {/* Topbar */}
        <header className="glass topbar-header" style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          borderBottom: '1px solid var(--glass-border)',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          borderRadius: '0',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Mobile Menu Toggle */}
            <button 
              onClick={toggleSidebar}
              className="btn-ghost" 
              style={{ 
                padding: '0.5rem', 
                display: 'none', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}
              id="sidebar-toggle"
            >
              <Menu size={20} />
            </button>

            <div className="search-container" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              background: 'var(--bg-tertiary)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              width: 'clamp(150px, 30vw, 300px)'
            }}>
              <Search size={16} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search..." 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  outline: 'none', 
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  width: '100%'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button className="btn-ghost" style={{ position: 'relative', padding: '0.5rem' }}>
              <Bell size={18} />
              <span style={{ 
                position: 'absolute', 
                top: '0.25rem', 
                right: '0.25rem', 
                width: '6px', 
                height: '6px', 
                background: 'var(--accent-primary)', 
                borderRadius: '50%',
                border: '1.5px solid var(--bg-primary)'
              }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--glass-border)' }}>
              <div className="user-info" style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{profile?.full_name?.split(' ')[0]}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profile?.role}</div>
              </div>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--glass-border)',
                overflow: 'hidden'
              }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={16} color="var(--text-secondary)" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '2rem' }} className="content-area">
          {children}
        </div>
      </main>
    </div>
  );
}
