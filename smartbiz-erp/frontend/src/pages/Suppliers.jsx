import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Notify, { useNotify } from '../components/Notify'
import { getSuppliers, createSupplier } from '../api/inventoryApi'

const EMPTY = { name: '', email: '', phone: '', address: '' }

export default function Suppliers() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const { notify, show, hide } = useNotify()

  const load = () => { setLoading(true); getSuppliers().then(r => setRows(r.data)).finally(() => setLoading(false)) }
  useEffect(load, [])

  async function handleSave() {
    try {
      await createSupplier(form); show('Supplier added'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  const columns = [
    { key: 'name',    label: 'Name' },
    { key: 'email',   label: 'Email' },
    { key: 'phone',   label: 'Phone' },
    { key: 'address', label: 'Address' },
  ]

  return (
    <>
      <PageHeader title="Suppliers" onAdd={() => { setForm(EMPTY); setOpen(true) }} />
      <DataTable columns={columns} rows={rows} loading={loading} searchKey="name" />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Supplier</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name"    value={form.name}    onChange={e => setForm({...form, name: e.target.value})}    fullWidth required />
            <TextField label="Email"   type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} fullWidth />
            <TextField label="Phone"   value={form.phone}   onChange={e => setForm({...form, phone: e.target.value})}   fullWidth />
            <TextField label="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} fullWidth multiline rows={2} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
