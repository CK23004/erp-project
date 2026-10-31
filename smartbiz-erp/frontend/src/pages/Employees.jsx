import React, { useEffect, useState } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Box } from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import PageHeader from '../components/PageHeader'
import DataTable from '../components/DataTable'
import ConfirmDialog from '../components/ConfirmDialog'
import Notify, { useNotify } from '../components/Notify'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getDepartments } from '../api/userApi'

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', departmentId: '', position: '', salary: '' }

export default function Employees() {
  const [rows, setRows]         = useState([])
  const [depts, setDepts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState(false)
  const [form, setForm]         = useState(EMPTY)
  const [editId, setEditId]     = useState(null)
  const [confirm, setConfirm]   = useState({ open: false, id: null })
  const { notify, show, hide }  = useNotify()

  const load = () => {
    setLoading(true)
    Promise.all([getEmployees(), getDepartments()])
      .then(([e, d]) => { setRows(e.data); setDepts(d.data) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  function handleOpen(row = null) {
    setForm(row ? { firstName: row.firstName, lastName: row.lastName, email: row.email,
      phone: row.phone || '', departmentId: row.departmentId, position: row.position || '', salary: row.salary } : EMPTY)
    setEditId(row?.id || null)
    setOpen(true)
  }

  async function handleSave() {
    try {
      if (editId) await updateEmployee(editId, form); else await createEmployee(form)
      show(editId ? 'Employee updated' : 'Employee created'); setOpen(false); load()
    } catch (e) { show(e.response?.data?.message || 'Error', 'error') }
  }

  async function handleDelete() {
    try {
      await deleteEmployee(confirm.id); show('Employee deleted')
      setConfirm({ open: false, id: null }); load()
    } catch { show('Delete failed', 'error') }
  }

  const deptName = id => depts.find(d => d.id === id)?.name || id

  const columns = [
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName',  label: 'Last Name' },
    { key: 'email',     label: 'Email' },
    { key: 'position',  label: 'Position' },
    { key: 'departmentId', label: 'Department', render: r => deptName(r.departmentId) },
    { key: 'salary',    label: 'Salary', render: r => `$${r.salary}` },
    { key: 'actions',   label: 'Actions', render: r => (
      <Box display="flex" gap={1}>
        <Button size="small" startIcon={<Edit />} onClick={() => handleOpen(r)}>Edit</Button>
        <Button size="small" color="error" startIcon={<Delete />} onClick={() => setConfirm({ open: true, id: r.id })}>Delete</Button>
      </Box>
    )},
  ]

  return (
    <>
      <PageHeader title="Employees" onAdd={() => handleOpen()} />
      <DataTable columns={columns} rows={rows} loading={loading} searchKey="firstName" />

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            <Box display="flex" gap={2}>
              <TextField label="First Name" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} fullWidth required />
              <TextField label="Last Name"  value={form.lastName}  onChange={e => setForm({...form, lastName: e.target.value})}  fullWidth required />
            </Box>
            <TextField label="Email"    type="email"  value={form.email}    onChange={e => setForm({...form, email: e.target.value})}    fullWidth required />
            <TextField label="Phone"    value={form.phone}    onChange={e => setForm({...form, phone: e.target.value})}    fullWidth />
            <TextField label="Position" value={form.position} onChange={e => setForm({...form, position: e.target.value})} fullWidth />
            <TextField label="Salary"   type="number" value={form.salary}   onChange={e => setForm({...form, salary: e.target.value})}   fullWidth />
            <TextField select label="Department" value={form.departmentId} onChange={e => setForm({...form, departmentId: e.target.value})} fullWidth required>
              {depts.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog open={confirm.open} message="Delete this employee?" onConfirm={handleDelete} onCancel={() => setConfirm({ open: false, id: null })} />
      <Notify notify={notify} onClose={hide} />
    </>
  )
}
