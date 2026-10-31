import React from 'react'
import { Snackbar, Alert } from '@mui/material'

export default function Notify({ notify, onClose }) {
  return (
    <Snackbar open={notify.open} autoHideDuration={3500} onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
      <Alert onClose={onClose} severity={notify.severity} variant="filled">
        {notify.message}
      </Alert>
    </Snackbar>
  )
}

// Helper to create a notify state object
export function useNotify() {
  const [notify, setNotify] = React.useState({ open: false, message: '', severity: 'success' })
  const show = (message, severity = 'success') => setNotify({ open: true, message, severity })
  const hide = () => setNotify(n => ({ ...n, open: false }))
  return { notify, show, hide }
}
