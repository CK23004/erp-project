import React, { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Box, Drawer, Typography, List, ListItemButton, ListItemIcon,
  ListItemText, IconButton, Divider, Avatar, Menu, MenuItem,
  Tooltip, Badge, Popover, Chip,
} from '@mui/material'
import {
  Dashboard, People, Badge as BadgeIcon, Business, Inventory2,
  Category, LocalShipping, ShoppingCart, Warehouse, PersonSearch,
  Receipt, Payment, BarChart, Menu as MenuIcon, Logout,
  Notifications, Settings, ChevronRight, Warning, CheckCircle,
  FiberManualRecord,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { getLowStock } from '../api/inventoryApi'

const DRAWER_WIDTH = 260

const navGroups = [
  { label: 'Overview', items: [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard', color: '#6366f1' },
  ]},
  { label: 'Human Resources', items: [
    { text: 'Users',       icon: <People />,        path: '/users',       color: '#8b5cf6' },
    { text: 'Employees',   icon: <BadgeIcon />,      path: '/employees',   color: '#8b5cf6' },
    { text: 'Departments', icon: <Business />,       path: '/departments', color: '#8b5cf6' },
  ]},
  { label: 'Inventory', items: [
    { text: 'Products',    icon: <Inventory2 />,    path: '/products',    color: '#10b981' },
    { text: 'Categories',  icon: <Category />,      path: '/categories',  color: '#10b981' },
    { text: 'Suppliers',   icon: <LocalShipping />, path: '/suppliers',   color: '#10b981' },
    { text: 'Purchases',   icon: <ShoppingCart />,  path: '/purchases',   color: '#10b981' },
    { text: 'Stock',       icon: <Warehouse />,     path: '/stock',       color: '#10b981' },
  ]},
  { label: 'Sales', items: [
    { text: 'Customers',   icon: <PersonSearch />,  path: '/customers',   color: '#f59e0b' },
    { text: 'Orders',      icon: <Receipt />,       path: '/orders',      color: '#f59e0b' },
    { text: 'Invoices',    icon: <BarChart />,      path: '/invoices',    color: '#f59e0b' },
    { text: 'Payments',    icon: <Payment />,       path: '/payments',    color: '#f59e0b' },
  ]},
  { label: 'System', items: [
    { text: 'Settings',    icon: <Settings />,      path: '/settings',    color: '#64748b' },
  ]},
]

function SidebarContent({ onNavigate }) {
  const location = useLocation()

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography sx={{ fontSize: 18 }}>⚡</Typography>
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'white', lineHeight: 1.2 }}>SmartBiz</Typography>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', lineHeight: 1 }}>Enterprise ERP</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />

      <Box sx={{
        flex: 1, overflowY: 'auto', px: 1.5, py: 1,
        '&::-webkit-scrollbar': { width: 4 },
        '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: 2 },
      }}>
        {navGroups.map(group => (
          <Box key={group.label} mb={0.5}>
            <Typography variant="caption" sx={{
              px: 1.5, pt: 2, pb: 0.5, display: 'block',
              color: 'rgba(255,255,255,0.3)', fontWeight: 700,
              fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              {group.label}
            </Typography>
            <List disablePadding>
              {group.items.map(item => {
                const active = location.pathname === item.path
                return (
                  <ListItemButton key={item.path} onClick={() => onNavigate(item.path)}
                    sx={{
                      borderRadius: '10px', mb: 0.3, py: 0.9, px: 1.5,
                      bgcolor: active ? 'rgba(99,102,241,0.2)' : 'transparent',
                      '&:hover': { bgcolor: active ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.05)' },
                      transition: 'all 0.15s ease',
                    }}>
                    <ListItemIcon sx={{ minWidth: 36, color: active ? item.color : 'rgba(255,255,255,0.4)' }}>
                      {React.cloneElement(item.icon, { fontSize: 'small' })}
                    </ListItemIcon>
                    <ListItemText primary={item.text} primaryTypographyProps={{
                      fontSize: '0.875rem', fontWeight: active ? 600 : 400,
                      color: active ? 'white' : 'rgba(255,255,255,0.6)',
                    }} />
                    {active && <ChevronRight sx={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />}
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mx: 2 }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.2)' }}>SmartBiz ERP v1.0.0</Typography>
      </Box>
    </Box>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen]       = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [notifAnchor, setNotifAnchor]     = useState(null)
  const [notifications, setNotifications] = useState([])

  // Load low-stock items as notifications on mount
  useEffect(() => {
    getLowStock()
      .then(res => {
        const notifs = res.data.slice(0, 5).map(p => ({
          id: p.id,
          type: 'warning',
          title: 'Low Stock Alert',
          message: `${p.name} has only ${p.quantity} units left`,
          time: 'Just now',
        }))
        setNotifications(notifs)
      })
      .catch(() => {})
  }, [])

  const pageName = navGroups.flatMap(g => g.items).find(i => i.path === location.pathname)?.text || 'Dashboard'

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>

      {/* Desktop Sidebar */}
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0, display: { xs: 'none', sm: 'block' },
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none', boxSizing: 'border-box' },
      }}>
        <SidebarContent onNavigate={navigate} />
      </Drawer>

      {/* Mobile Sidebar */}
      <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: DRAWER_WIDTH, border: 'none' } }}>
        <SidebarContent onNavigate={p => { navigate(p); setMobileOpen(false) }} />
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* ── Topbar ─────────────────────────────────────────────────── */}
        <Box sx={{
          height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 3, bgcolor: 'white', borderBottom: '1px solid #e2e8f0',
          position: 'sticky', top: 0, zIndex: 100,
        }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <IconButton sx={{ display: { sm: 'none' } }} onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">{pageName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>

            {/* ── Notifications Bell ──────────────────────────────────── */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={e => setNotifAnchor(e.currentTarget)}
                sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                <Badge badgeContent={notifications.length} color="error">
                  <Notifications sx={{ fontSize: 20, color: '#64748b' }} />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Notifications Popover */}
            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{ sx: { mt: 1, width: 360, borderRadius: 3, boxShadow: 4, overflow: 'hidden' } }}
            >
              {/* Header */}
              <Box sx={{ px: 2.5, py: 2, bgcolor: '#0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white' }}>Notifications</Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>{notifications.length} new alerts</Typography>
                </Box>
                <Chip label="Clear all" size="small"
                  onClick={() => setNotifications([])}
                  sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.7rem' }} />
              </Box>

              {/* Items */}
              {notifications.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <CheckCircle sx={{ fontSize: 40, color: '#10b981', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">All caught up!</Typography>
                  <Typography variant="caption" color="text.secondary">No new notifications</Typography>
                </Box>
              ) : (
                notifications.map((n, i) => (
                  <Box key={n.id} sx={{
                    px: 2.5, py: 2,
                    borderBottom: i < notifications.length - 1 ? '1px solid #f1f5f9' : 'none',
                    '&:hover': { bgcolor: '#f8fafc' }, cursor: 'default',
                    display: 'flex', gap: 2, alignItems: 'flex-start',
                  }}>
                    <Box sx={{ p: 0.8, bgcolor: '#fef3c7', borderRadius: '8px', flexShrink: 0, mt: 0.2 }}>
                      <Warning sx={{ fontSize: 16, color: '#f59e0b' }} />
                    </Box>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600}>{n.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{n.message}</Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <FiberManualRecord sx={{ fontSize: 6, color: '#94a3b8' }} />
                        <Typography variant="caption" sx={{ color: '#94a3b8' }}>{n.time}</Typography>
                      </Box>
                    </Box>
                  </Box>
                ))
              )}

              {/* Footer */}
              <Box sx={{ px: 2.5, py: 1.5, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                <Typography
                  variant="caption" fontWeight={600} sx={{ color: '#6366f1', cursor: 'pointer' }}
                  onClick={() => { setNotifAnchor(null); navigate('/settings') }}
                >
                  View system health →
                </Typography>
              </Box>
            </Popover>

            {/* ── Settings button ──────────────────────────────────────── */}
            <Tooltip title="Settings & Health">
              <IconButton
                onClick={() => navigate('/settings')}
                sx={{
                  bgcolor: location.pathname === '/settings' ? '#ede9fe' : '#f8fafc',
                  border: `1px solid ${location.pathname === '/settings' ? '#c4b5fd' : '#e2e8f0'}`,
                }}
              >
                <Settings sx={{ fontSize: 20, color: location.pathname === '/settings' ? '#6366f1' : '#64748b' }} />
              </IconButton>
            </Tooltip>

            {/* ── User avatar + menu ───────────────────────────────────── */}
            <Box
              onClick={e => setUserMenuAnchor(e.currentTarget)}
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', ml: 1, pl: 2, borderLeft: '1px solid #e2e8f0' }}
            >
              <Avatar sx={{ width: 36, height: 36, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
              </Box>
            </Box>

            <Menu
              anchorEl={userMenuAnchor} open={Boolean(userMenuAnchor)} onClose={() => setUserMenuAnchor(null)}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              PaperProps={{ sx: { mt: 1, minWidth: 200, borderRadius: 3, boxShadow: 3 } }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
              <Divider />
              <MenuItem onClick={() => { setUserMenuAnchor(null); navigate('/settings') }} sx={{ py: 1.5 }}>
                <ListItemIcon><Settings fontSize="small" sx={{ color: '#64748b' }} /></ListItemIcon>
                Settings & Health
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { setUserMenuAnchor(null); logout(); navigate('/login') }}
                sx={{ py: 1.5, color: 'error.main', fontWeight: 500 }}>
                <ListItemIcon><Logout fontSize="small" sx={{ color: 'error.main' }} /></ListItemIcon>
                Sign out
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Page content */}
        <Box component="main" sx={{ flex: 1, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
