onRecordValidate((event) => {
  // JSON fields are exposed as raw JSON through getString().
  const permissions = JSON.parse(event.record.getString('permissions') || '[]')
  if (!Array.isArray(permissions) || permissions.length > 200 || permissions.some((permission) =>
    typeof permission !== 'string' || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(permission)
  ) || new Set(permissions).size !== permissions.length) {
    throw new BadRequestError('Permissions must be a unique array of explicit permission names.')
  }
  event.record.set('permissions', permissions)
  event.next()
}, 'core_roles')
