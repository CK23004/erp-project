import React from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Add } from '@mui/icons-material'

export default function PageHeader({ title, subtitle, onAdd, addLabel = 'Add New' }) {
  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
      <Box>
        <Typography variant="h5" fontWeight={700} color="text.primary">{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary" mt={0.3}>{subtitle}</Typography>}
      </Box>
      {onAdd && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          sx={{ px: 2.5, py: 1, borderRadius: 2.5, fontWeight: 600 }}
        >
          {addLabel}
        </Button>
      )}
    </Box>
  )
}
