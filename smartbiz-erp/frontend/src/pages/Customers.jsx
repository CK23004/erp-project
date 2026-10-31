import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Notify, { useNotify } from '../components/Notify'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/salesApi'

const EMPTY = { name: '', email: '', phone: '', address: '' }

export default function Customers() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [editId, setEditId]   = useState(null)
  const [confirm, setConfirm] = useState({ open: false, id: null })
  const { notify, show, hide } = useNotify()

  const load = () => { setLoading(true); getCustomers().then(r => setRows(r.data)).finally(() => setLoading(false)) }
  useEffect(load, [])

  function handleOpen(row = null) {
    setForm(row ? { name: row.name, email: row.email, phone: row.phone || '', address: row.address || '' } : EMPTY)
    setEditId(row?.id || null); setOpen(true)
  }

  async function handleSave() {
    try {
      if (editId) await updateCustomer(editId, form); else await createCustomer(form)
      show(editId ? 'Customer updated' : 'Customer created'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  async function handleDelete() {
    try {
      await deleteCustomer(confirm.id); show('Customer deleted')
      setConfirm({ open: false, id: null }); load()
    } catch { show('Delete failed', 'error') }
  }

  const columns = [
    { key: 'name',    label: 'Name' },
    { key: 'email',   label: 'Email' },
    { key: 'phone',   label: 'Phone' },
    { key: 'address', label: 'Address' },
    { key: 'actions', label: 'Actions', render: r => (
      <Box display="flex" gap={1}>
        <Button size="small" startIcon={<Edit />} onClick={() => handleOpen(r)}>Edit</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => setConfirm({ open: true, id: r.id })}>Delete</Button>
      </Box>
    )},
  ]

  return (
    <>
      <PageHeader title="Customers" onAdd={() => handleOpen()} />
      <DataTable columns={columns} rows={rows} loading={loading} searchKey="name" />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name"    value={form.name}    onChange={e => setForm({...form, name: e.target.value})}    fullWidth required />
            <TextField label="Email"   type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} fullWidth required />
            <TextField label="Phone"   value={form.phone}   onChange={e => setForm({...form, phone: e.target.value})}   fullWidth />
            <TextField label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirm.open} message="Delete this customer?" onConfirm={handleDelete} onCancel={() => setConfirm({ open: false, id: null })} />
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
