import React, { useState, useEffect, useCallback } from 'react'
import {
  Grid, Card, Box, Typography, Chip, Button, Divider,
  CircularProgress, Tooltip, LinearProgress,
} from '@mui/material'
import {
  CheckCircle, Error, Refresh, Storage, CloudQueue,
  Speed, SecurityOutlined, People, Inventory2, PointOfSale,
  FiberManualRecord,
} from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import axios from 'axios'

// Hit each service's public health endpoint — no auth required
const SERVICES = [
  {
    id: 'user',
    name: 'User Service',
    description: 'Authentication, users, employees & departments',
    url: import.meta.env.VITE_USER_API,
    healthPath: '/actuator/health',
    port: '8081',
    icon: <People />,
    color: '#6366f1',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  },
  {
    id: 'inventory',
    name: 'Inventory Service',
    description: 'Products, categories, suppliers, stock management',
    url: import.meta.env.VITE_INVENTORY_API,
    healthPath: '/actuator/health',
    port: '8082',
    icon: <Inventory2 />,
    color: '#10b981',
    gradient: 'linear-gradient(135deg, #10b981, #059669)',
  },
  {
    id: 'sales',
    name: 'Sales Service',
    description: 'Customers, orders, invoices & payments',
    url: import.meta.env.VITE_SALES_API,
    healthPath: '/actuator/health',
    port: '8083',
    icon: <PointOfSale />,
    color: '#f59e0b',
    gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
  },
]

function ServiceCard({ service, status, onCheck }) {
  const isUp      = status?.status === 'UP'
  const isChecking = status?.checking
  const isUnknown  = !status

  return (
    <Card sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
      {/* Colour top bar */}
      <Box sx={{ height: 4, background: isChecking ? '#e2e8f0' : isUp ? service.gradient : '#ef4444' }} />

      <Box sx={{ p: 3 }}>
        {/* Header row */}
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2.5}>
          <Box display="flex" gap={2} alignItems="center">
            <Box sx={{
              width: 48, height: 48, borderRadius: '12px',
              background: service.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 8px 16px ${service.color}30`,
            }}>
              {React.cloneElement(service.icon, { sx: { color: 'white', fontSize: 22 } })}
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700}>{service.name}</Typography>
              <Typography variant="caption" color="text.secondary">{service.description}</Typography>
            </Box>
          </Box>

          {/* Status badge */}
          {isChecking ? (
            <Chip icon={<CircularProgress size={12} />} label="Checking..." size="small"
              sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600 }} />
          ) : isUp ? (
            <Chip icon={<CheckCircle sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
              label="Healthy" size="small"
              sx={{ bgcolor: '#d1fae5', color: '#059669', fontWeight: 700, border: '1px solid #a7f3d0' }} />
          ) : isUnknown ? (
            <Chip label="Unknown" size="small" sx={{ bgcolor: '#f1f5f9', color: '#94a3b8', fontWeight: 600 }} />
          ) : (
            <Chip icon={<Error sx={{ fontSize: '14px !important', color: '#ef4444 !important' }} />}
              label="Unreachable" size="small"
              sx={{ bgcolor: '#fee2e2', color: '#dc2626', fontWeight: 700, border: '1px solid #fca5a5' }} />
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Details grid */}
        <Grid container spacing={1.5} mb={2.5}>
          <Grid item xs={6}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Base URL</Typography>
              <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all', fontSize: '0.78rem' }}>
                {service.url}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Port</Typography>
              <Typography variant="body2" fontWeight={600}>{service.port}</Typography>
            </Box>
          </Grid>
          <Grid item xs={3}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary" display="block">Response</Typography>
              <Typography variant="body2" fontWeight={600}>
                {status?.responseTime ? `${status.responseTime}ms` : '—'}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Health endpoint */}
        <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2, mb: 2.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FiberManualRecord sx={{ fontSize: 8, color: isUp ? '#10b981' : '#94a3b8' }} />
          <Typography variant="caption" sx={{ fontFamily: 'monospace', color: '#64748b', fontSize: '0.78rem' }}>
            {service.url}{service.healthPath}
          </Typography>
        </Box>

        <Button
          fullWidth variant="outlined" size="small" startIcon={<Refresh />}
          onClick={() => onCheck(service.id)}
          disabled={isChecking}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}
        >
          Re-check
        </Button>
      </Box>
    </Card>
  )
}

export default function Settings() {
  const [statuses, setStatuses] = useState({})   // { serviceId: { status, responseTime, checking } }
  const [lastChecked, setLastChecked] = useState(null)

  const checkService = useCallback(async (serviceId) => {
    const service = SERVICES.find(s => s.id === serviceId)
    if (!service) return

    setStatuses(prev => ({ ...prev, [serviceId]: { ...prev[serviceId], checking: true } }))
    const t0 = Date.now()
    try {
      const res = await axios.get(`${service.url}${service.healthPath}`, { timeout: 5000 })
      setStatuses(prev => ({
        ...prev,
        [serviceId]: { status: res.data?.status || 'UP', responseTime: Date.now() - t0, checking: false },
      }))
    } catch {
      setStatuses(prev => ({
        ...prev,
        [serviceId]: { status: 'DOWN', responseTime: null, checking: false },
      }))
    }
  }, [])

  const checkAll = useCallback(() => {
    SERVICES.forEach(s => checkService(s.id))
    setLastChecked(new Date())
  }, [checkService])

  useEffect(() => { checkAll() }, [checkAll])

  const allUp    = SERVICES.every(s => statuses[s.id]?.status === 'UP')
  const anyDown  = SERVICES.some(s => statuses[s.id]?.status === 'DOWN')
  const checking = SERVICES.some(s => statuses[s.id]?.checking)
  const upCount  = SERVICES.filter(s => statuses[s.id]?.status === 'UP').length

  return (
    <Box>
      <PageHeader
        title="Settings & System Health"
        subtitle="Monitor backend service connectivity and system status"
        onAdd={checkAll}
        addLabel="Refresh All"
      />

      {/* Overall status banner */}
      <Card sx={{
        mb: 3, borderRadius: 3, overflow: 'hidden',
        border: `1px solid ${checking ? '#e2e8f0' : allUp ? '#a7f3d0' : '#fca5a5'}`,
      }}>
        <Box sx={{
          background: checking ? 'linear-gradient(135deg, #f8fafc, #f1f5f9)' :
            allUp ? 'linear-gradient(135deg, #ecfdf5, #d1fae5)' :
            anyDown ? 'linear-gradient(135deg, #fef2f2, #fee2e2)' :
            'linear-gradient(135deg, #fffbeb, #fef3c7)',
          p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '14px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              bgcolor: checking ? '#e2e8f0' : allUp ? '#d1fae5' : '#fee2e2',
            }}>
              {checking
                ? <CircularProgress size={24} thickness={3} />
                : allUp
                ? <CheckCircle sx={{ color: '#10b981', fontSize: 28 }} />
                : <Error sx={{ color: '#ef4444', fontSize: 28 }} />
              }
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}
                sx={{ color: checking ? '#64748b' : allUp ? '#065f46' : '#991b1b' }}>
                {checking ? 'Checking services...' : allUp ? 'All Systems Operational' : `${upCount}/${SERVICES.length} Services Healthy`}
              </Typography>
              <Typography variant="body2"
                sx={{ color: checking ? '#94a3b8' : allUp ? '#047857' : '#b91c1c' }}>
                {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : 'Checking now...'}
              </Typography>
            </Box>
          </Box>

          {/* Progress bar for up count */}
          <Box sx={{ width: 160, display: { xs: 'none', md: 'block' } }}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">Services Up</Typography>
              <Typography variant="caption" fontWeight={700}>{upCount}/{SERVICES.length}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={(upCount / SERVICES.length) * 100}
              sx={{
                height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.08)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: allUp ? '#10b981' : anyDown ? '#ef4444' : '#f59e0b',
                  borderRadius: 4,
                },
              }}
            />
          </Box>
        </Box>
      </Card>

      {/* Service cards */}
      <Grid container spacing={2.5} mb={4}>
        {SERVICES.map(service => (
          <Grid item xs={12} md={4} key={service.id}>
            <ServiceCard service={service} status={statuses[service.id]} onCheck={checkService} />
          </Grid>
        ))}
      </Grid>

      {/* System info */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
              <Box sx={{ p: 1, bgcolor: '#ede9fe', borderRadius: '8px' }}>
                <Storage sx={{ color: '#6366f1', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Database</Typography>
            </Box>
            {[
              { label: 'Engine', value: 'MongoDB 7.0' },
              { label: 'Users DB', value: 'smartbiz_users' },
              { label: 'Inventory DB', value: 'smartbiz_inventory' },
              { label: 'Sales DB', value: 'smartbiz_sales' },
              { label: 'Connection', value: 'via Docker network' },
            ].map(row => (
              <Box key={row.label} display="flex" justifyContent="space-between" py={1}
                sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
              <Box sx={{ p: 1, bgcolor: '#dbeafe', borderRadius: '8px' }}>
                <CloudQueue sx={{ color: '#3b82f6', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Application Info</Typography>
            </Box>
            {[
              { label: 'Frontend', value: 'React 18 + Vite' },
              { label: 'UI Library', value: 'Material UI v5' },
              { label: 'Backend', value: 'Spring Boot 3.2 (Java 21)' },
              { label: 'Auth', value: 'JWT (jjwt 0.12)' },
              { label: 'Deployment', value: 'Docker Compose' },
            ].map(row => (
              <Box key={row.label} display="flex" justifyContent="space-between" py={1}
                sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
              <Box sx={{ p: 1, bgcolor: '#d1fae5', borderRadius: '8px' }}>
                <SecurityOutlined sx={{ color: '#10b981', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>Security</Typography>
            </Box>
            {[
              { label: 'Authentication', value: 'JWT Bearer Token' },
              { label: 'Password Hashing', value: 'BCrypt (cost 10)' },
              { label: 'CORS Origins', value: 'localhost:5173, :80' },
              { label: 'Session', value: 'Stateless' },
            ].map(row => (
              <Box key={row.label} display="flex" justifyContent="space-between" py={1}
                sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={600}>{row.value}</Typography>
              </Box>
            ))}
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
              <Box sx={{ p: 1, bgcolor: '#fef3c7', borderRadius: '8px' }}>
                <Speed sx={{ color: '#f59e0b', fontSize: 20 }} />
              </Box>
              <Typography variant="h6" fontWeight={700}>API Endpoints</Typography>
            </Box>
            {[
              { label: 'Auth', value: 'POST /api/auth/login' },
              { label: 'Users', value: 'CRUD /api/users' },
              { label: 'Products', value: 'CRUD /api/products' },
              { label: 'Stock', value: 'GET /api/stock/low-stock' },
              { label: 'Orders', value: 'POST /api/orders' },
            ].map(row => (
              <Box key={row.label} display="flex" justifyContent="space-between" py={1}
                sx={{ borderBottom: '1px solid #f1f5f9' }}>
                <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{row.value}</Typography>
              </Box>
            ))}
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
