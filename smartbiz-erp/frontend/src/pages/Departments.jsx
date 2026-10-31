import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box } from '@mui/material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import Notify, { useNotify } from '../components/Notify'
import { getDepartments, createDepartment } from '../api/userApi'

const EMPTY = { name: '', description: '' }

export default function Departments() {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const { notify, show, hide } = useNotify()

  const load = () => { setLoading(true); getDepartments().then(r => setRows(r.data)).finally(() => setLoading(false)) }
  useEffect(load, [])

  async function handleSave() {
    try {
      await createDepartment(form); show('Department created'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  const columns = [
    { key: 'name',        label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt',   label: 'Created', render: r => new Date(r.createdAt).toLocaleDateString() },
  ]

  return (
    <>
      <PageHeader title="Departments" onAdd={() => { setForm(EMPTY); setOpen(true) }} />
      <DataTable columns={columns} rows={rows} loading={loading} searchKey="name" />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Department</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <TextField label="Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} fullWidth required />
            <TextField label="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} fullWidth multiline rows={2} />
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
