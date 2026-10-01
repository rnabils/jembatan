import { Badge } from '../ui/badge'

const STATUS_META = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  rejected: { label: 'Rejected', variant: 'destructive' }
}

export function StatusBadge({ status, className }) {
  const meta = STATUS_META[status] || STATUS_META.pending

  return (
    <Badge variant={meta.variant} className={className}>
      {meta.label}
    </Badge>
  )
}
