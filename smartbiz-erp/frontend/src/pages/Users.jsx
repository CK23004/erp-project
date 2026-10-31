import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Notify, { useNotify } from '../components/Notify'
import { getUsers, createUser, updateUser, deleteUser } from '../api/userApi'

const EMPTY = { name: '', email: '', password: '', role: 'USER' }

export default function Users() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState(null)
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const { notify, show, hide } = useNotify()

  const load = () => { setLoading(true); getUsers().then(r => setRows(r.data)).finally(() => setLoading(false)) }
  useEffect(load, [])

  function handleOpen(row = null) {
    setForm(row ? { name: row.name, email: row.email, password: '', role: row.role } : EMPTY)
    setEditId(row?.id || null)
    setOpen(true)
  }

  async function handleSave() {
    try {
      if (editId) await updateUser(editId, form); else await createUser(form)
      show(editId ? 'User updated' : 'User created')
      setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  async function handleDelete() {
    try {
      await deleteUser(confirm.id); show('User deleted'); setConfirm({ open: false, id: null }); load()
    } catch { show('Delete failed', 'error') }
  }

  const columns = [
    { key: 'name',  label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'role',  label: 'Role' },
    { key: 'active', label: 'Status', render: r => r.active ? '✅ Active' : '❌ Inactive' },
    { key: 'actions', label: 'Actions', render: r => (
      <Box display="flex" gap={1}>
        <Button size="small" startIcon={<Edit />} onClick={() => handleOpen(r)}>Edit</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => setConfirm({ open: true, id: r.id })}>Delete</Button>
      </Box>
    )},
  ]

  return (
    <>
      <PageHeader title="Users" onAdd={() => handleOpen()} />
      <DataTable columns={columns} rows={rows} loading={loading} searchKey="name" />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} fullWidth required />
            <TextField label="Email" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} fullWidth required />
            <TextField label="Password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} fullWidth placeholder={editId ? 'Leave blank to keep current' : ''} />
            <TextField select label="Role" value={form.role} onChange={e => setForm({...form, role: e.target.value})} fullWidth>
              {['USER','ADMIN','MANAGER'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirm.open} message="Delete this user permanently?" onConfirm={handleDelete} onCancel={() => setConfirm({ open: false, id: null })} />
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
