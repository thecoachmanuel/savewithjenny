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
          }
        `}</style>
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
        transition: 'margin-left 0.3s ease'
      }} className="main-content">
        <style jsx>{`
          @media (max-width: 1024px) {
            .main-content {
              marginLeft: 0 !important;
            }
          }
        `}</style>
        
        {/* Topbar */}
        <header className="glass" style={{
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
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
              <Menu size={24} />
              <style jsx>{`
                @media (max-width: 1024px) {
                  #sidebar-toggle {
                    display: flex !important;
                  }
                }
              `}</style>
            </button>

            <div className="search-container" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              background: 'var(--bg-tertiary)',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              width: '300px'
            }}>
              <style jsx>{`
                @media (max-width: 640px) {
                  .search-container {
                    display: none !important;
                  }
                }
              `}</style>
              <Search size={18} color="var(--text-muted)" />
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button className="btn-ghost" style={{ position: 'relative', padding: '0.5rem' }}>
              <Bell size={20} />
              <span style={{ 
                position: 'absolute', 
                top: '0.25rem', 
                right: '0.25rem', 
                width: '8px', 
                height: '8px', 
                background: 'var(--accent-primary)', 
                borderRadius: '50%',
                border: '2px solid var(--bg-primary)'
              }}></span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1.5rem', borderLeft: '1px solid var(--glass-border)' }}>
              <div className="user-info" style={{ textAlign: 'right' }}>
                <style jsx>{`
                  @media (max-width: 640px) {
                    .user-info {
                      display: none !important;
                    }
                  }
                `}</style>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{profile?.full_name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{profile?.role}</div>
              </div>
              <div style={{ 
                width: '40px', 
                height: '40px', 
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
                  <UserIcon size={20} color="var(--text-secondary)" />
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '2rem' }} className="content-area">
          <style jsx>{`
            @media (max-width: 640px) {
              .content-area {
                padding: 1rem !important;
              }
            }
          `}</style>
          {children}
        </div>
      </main>
    </div>
  );
}
