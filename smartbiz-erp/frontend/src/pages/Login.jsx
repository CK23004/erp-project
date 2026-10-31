import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, TextField, Button, Typography, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material'
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import { login as loginApi } from '../api/userApi'

export default function Login() {
  const { login } = useAuth()
  const navigate  = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await loginApi(form)
      login(res.data.token, { name: res.data.name, email: res.data.email, role: res.data.role })
      navigate('/dashboard')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
    }}>
      {/* Left branding panel */}
      <Box sx={{
        flex: 1, display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', p: 6, position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', top: -100, left: -100 }} />
        <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', bottom: 50, right: -80 }} />

        <Box sx={{ position: 'relative', textAlign: 'center' }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '24px', mb: 3, mx: 'auto',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 20px 40px rgba(99,102,241,0.4)',
          }}>
            <Typography sx={{ fontSize: 36 }}>⚡</Typography>
          </Box>
          <Typography variant="h3" fontWeight={800} color="white" mb={1}>SmartBiz ERP</Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 400, maxWidth: 340 }}>
            Unified business management for modern teams
          </Typography>
          <Box sx={{ mt: 5, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {['Manage inventory & stock in real-time', 'Track sales orders & invoices', 'Centralized HR & team management'].map(f => (
              <Box key={f} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#818cf8', flexShrink: 0 }} />
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{f}</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Right login form */}
      <Box sx={{
        width: { xs: '100%', md: 480 }, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'white', borderRadius: { md: '24px 0 0 24px' }, p: { xs: 3, md: 6 },
      }}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>
          <Box sx={{ mb: 5 }}>
            <Typography variant="h4" fontWeight={800} color="text.primary" mb={1}>Welcome back</Typography>
            <Typography variant="body1" color="text.secondary">Sign in to your SmartBiz account</Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.8}>Email address</Typography>
              <TextField
                type="email" fullWidth required placeholder="you@example.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment> }}
              />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600} color="text.primary" mb={0.8}>Password</Typography>
              <TextField
                type={showPass ? 'text' : 'password'} fullWidth required placeholder="••••••••"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                InputProps={{
                  startAdornment: <InputAdornment position="start"><Lock sx={{ color: '#94a3b8', fontSize: 20 }} /></InputAdornment>,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(!showPass)} size="small">
                        {showPass ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>

            <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
              sx={{ mt: 1, py: 1.5, fontSize: '1rem', borderRadius: 3 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
            </Button>
          </Box>

          <Box sx={{ mt: 4, p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600} mb={1}>Demo credentials</Typography>
            <Typography variant="body2" color="text.secondary">admin@smartbiz.com</Typography>
            <Typography variant="body2" color="text.secondary">Password: admin123</Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
