export const ROLE_DEFINITIONS = {
  admin: {
    label: 'Administrator',
    variant: 'default',
    canApprove: true,
    canUpload: true,
    canManageAllDocuments: true
  },
  employee: {
    label: 'Employee',
    variant: 'teal',
    canApprove: false,
    canUpload: true,
    canManageAllDocuments: false
  },
  viewer: {
    label: 'Viewer',
    variant: 'outline',
    canApprove: false,
    canUpload: false,
    canManageAllDocuments: false
  }
}

export function getRoleInfo(role) {
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.viewer
}
