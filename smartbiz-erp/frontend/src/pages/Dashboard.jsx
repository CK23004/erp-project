import React, { useEffect, useState } from 'react'
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Chip, Avatar, LinearProgress } from '@mui/material'
import { People, Inventory2, PersonSearch, ShoppingCart, TrendingUp, Warning } from '@mui/icons-material'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getUsers } from '../api/userApi'
import { getProducts, getLowStock } from '../api/inventoryApi'
import { getCustomers, getOrders } from '../api/salesApi'
import { useAuth } from '../context/AuthContext'

const STATUS_COLOR = { CONFIRMED: '#10b981', DELIVERED: '#6366f1', PENDING: '#f59e0b', CANCELLED: '#ef4444', SHIPPED: '#3b82f6' }

function StatCard({ title, value, icon, gradient, change }) {
  return (
    <Card sx={{ borderRadius: 3, border: 'none', overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ background: gradient, p: 3, pb: 2.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 500, mb: 0.5 }}>{title}</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color: 'white', lineHeight: 1 }}>{value}</Typography>
            {change !== undefined && (
              <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                <TrendingUp sx={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{change}</Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ width: 52, height: 52, bgcolor: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}>
            {icon}
          </Avatar>
        </Box>
      </Box>
    </Card>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <Box sx={{ bgcolor: '#0f172a', color: 'white', px: 2, py: 1.5, borderRadius: 2, boxShadow: 4 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{label}</Typography>
        <Typography variant="body2" fontWeight={700}>${payload[0].value?.toFixed(2)}</Typography>
      </Box>
    )
  }
  return null
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData]         = useState({ users: 0, products: 0, customers: 0, orders: [] })
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([getUsers(), getProducts(), getCustomers(), getOrders(), getLowStock()])
      .then(([u, p, c, o, ls]) => {
        setData({ users: u.data.length, products: p.data.length, customers: c.data.length, orders: o.data })
        setLowStock(ls.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const monthlySales = React.useMemo(() => {
    const map = {}
    data.orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleString('default', { month: 'short' })
      map[month] = (map[month] || 0) + (o.totalAmount || 0)
    })
    return Object.entries(map).map(([month, total]) => ({ month, total }))
  }, [data.orders])

  const totalRevenue = data.orders.reduce((s, o) => s + (o.totalAmount || 0), 0)

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <Box textAlign="center">
        <CircularProgress size={48} thickness={3} />
        <Typography variant="body2" color="text.secondary" mt={2}>Loading dashboard...</Typography>
      </Box>
    </Box>
  )

  return (
    <Box>
      {/* Welcome banner */}
      <Box sx={{
        p: 3, mb: 3, borderRadius: 3,
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 60%, #312e81 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        overflow: 'hidden', position: 'relative',
      }}>
        <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', top: -80, right: 100 }} />
        <Box sx={{ position: 'relative' }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: 'white' }}>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
            Here's what's happening with your business today.
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right', position: 'relative' }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>Total Revenue</Typography>
          <Typography variant="h4" fontWeight={800} sx={{ color: 'white' }}>${totalRevenue.toFixed(0)}</Typography>
        </Box>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2.5} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Users" value={data.users} icon={<People sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg, #6366f1, #4f46e5)" change="Active accounts" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Products" value={data.products} icon={<Inventory2 sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg, #10b981, #059669)" change="In inventory" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Customers" value={data.customers} icon={<PersonSearch sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg, #f59e0b, #d97706)" change="Registered" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Orders" value={data.orders.length} icon={<ShoppingCart sx={{ color: 'white' }} />}
            gradient="linear-gradient(135deg, #ec4899, #db2777)" change="All time" />
        </Grid>
      </Grid>

      <Grid container spacing={2.5}>
        {/* Sales chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Revenue Overview</Typography>
                <Typography variant="body2" color="text.secondary">Monthly sales performance</Typography>
              </Box>
              <Chip label="This Year" size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
            </Box>
            {monthlySales.length === 0 ? (
              <Box display="flex" alignItems="center" justifyContent="center" height={220}>
                <Typography color="text.secondary">No sales data yet</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlySales}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={2.5} fill="url(#salesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        {/* Low stock */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2.5}>
              <Box sx={{ p: 0.8, bgcolor: '#fef3c7', borderRadius: 2 }}>
                <Warning sx={{ fontSize: 18, color: '#f59e0b' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>Low Stock</Typography>
                <Typography variant="caption" color="text.secondary">{lowStock.length} items need attention</Typography>
              </Box>
            </Box>
            {lowStock.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography sx={{ fontSize: 32 }}>✅</Typography>
                <Typography variant="body2" color="text.secondary" mt={1}>All stock levels are healthy</Typography>
              </Box>
            ) : (
              lowStock.slice(0, 6).map(p => (
                <Box key={p.id} mb={2}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 150 }}>{p.name}</Typography>
                    <Typography variant="caption" fontWeight={700} color={p.quantity === 0 ? 'error.main' : 'warning.main'}>
                      {p.quantity} left
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (p.quantity / Math.max(p.lowStockThreshold * 2, 1)) * 100)}
                    sx={{
                      height: 5, borderRadius: 5, bgcolor: '#f1f5f9',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: p.quantity === 0 ? '#ef4444' : p.quantity <= p.lowStockThreshold / 2 ? '#f59e0b' : '#10b981',
                        borderRadius: 5,
                      },
                    }}
                  />
                </Box>
              ))
            )}
          </Card>
        </Grid>

        {/* Recent orders */}
        <Grid item xs={12}>
          <Card sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2.5}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Recent Orders</Typography>
                <Typography variant="caption" color="text.secondary">Latest customer orders</Typography>
              </Box>
              <Chip label={`${data.orders.length} total`} size="small" sx={{ bgcolor: '#f1f5f9', fontWeight: 600 }} />
            </Box>
            {data.orders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body2" color="text.secondary">No orders yet</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Header */}
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr', px: 1.5, py: 1, bgcolor: '#f8fafc', borderRadius: 2, mb: 0.5 }}>
                  {['Order ID', 'Date', 'Items', 'Status', 'Amount'].map(h => (
                    <Typography key={h} variant="caption" fontWeight={700} sx={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.68rem' }}>{h}</Typography>
                  ))}
                </Box>
                {data.orders.slice(0, 6).map(o => (
                  <Box key={o.id} sx={{
                    display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 1fr 1fr',
                    px: 1.5, py: 1.5, borderRadius: 2, alignItems: 'center',
                    '&:hover': { bgcolor: '#f8fafc' }, transition: 'background 0.15s',
                  }}>
                    <Typography variant="body2" fontWeight={600} color="primary.main">#{o.id?.slice(-6)}</Typography>
                    <Typography variant="body2" color="text.secondary">{new Date(o.createdAt).toLocaleDateString()}</Typography>
                    <Typography variant="body2" color="text.secondary">{o.items?.length || 0} items</Typography>
                    <Chip
                      label={o.status}
                      size="small"
                      sx={{
                        bgcolor: STATUS_COLOR[o.status] + '20',
                        color: STATUS_COLOR[o.status],
                        fontWeight: 700, fontSize: '0.7rem', width: 'fit-content',
                        border: `1px solid ${STATUS_COLOR[o.status]}30`,
                      }}
                    />
                    <Typography variant="body2" fontWeight={700}>${o.totalAmount?.toFixed(2)}</Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
