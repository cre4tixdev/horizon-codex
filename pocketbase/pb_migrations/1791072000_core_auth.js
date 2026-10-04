// PocketBase 0.40.4. No account or credential is provisioned by this migration.
migrate((app) => {
  const allowed = '@request.auth.collectionName = "core_users" && @request.auth.active = true && @request.auth.role.active = true'
  const roleDefinition = {
    id: 'hznroles0000001', type: 'base', name: 'core_roles',
    listRule: `${allowed} && id = @request.auth.role`,
    viewRule: `${allowed} && id = @request.auth.role`,
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { type: 'text', name: 'name', required: true, max: 80, pattern: '^[a-z][a-z0-9_]*$' },
      { type: 'text', name: 'label', required: true, max: 120 },
      { type: 'json', name: 'permissions', maxSize: 20000 },
      { type: 'bool', name: 'active' },
      { type: 'autodate', name: 'created', onCreate: true },
      { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
    ],
    indexes: ['CREATE UNIQUE INDEX idx_core_roles_name ON core_roles (name)'],
  }
  const existing = app.findAllCollections()
  const existingRoles = existing.find((collection) => collection.name === 'core_roles')
  const existingUsers = existing.find((collection) => collection.name === 'core_users')
  if (Boolean(existingRoles) !== Boolean(existingUsers)) {
    throw new Error('Core auth adoption refused: both core_roles and core_users must exist together.')
  }
  const roles = existingRoles || new Collection(roleDefinition)
  const userDefinition = {
    id: 'hznusers0000001', type: 'auth', name: 'core_users',
    listRule: `${allowed} && id = @request.auth.id`,
    viewRule: `${allowed} && id = @request.auth.id`,
    createRule: null, updateRule: null, deleteRule: null, manageRule: null,
    authRule: 'active = true && role.active = true',
    passwordAuth: { enabled: true, identityFields: ['email'] },
    oauth2: { enabled: false }, otp: { enabled: false },
    authToken: { duration: 3600 },
    fields: [
      { type: 'email', name: 'email', required: true },
      { type: 'text', name: 'name', required: true, max: 160 },
      { type: 'text', name: 'first_name', max: 80 },
      { type: 'text', name: 'last_name', max: 80 },
      { type: 'email', name: 'public_email' },
      { type: 'relation', name: 'role', required: true, collectionId: roles.id, maxSelect: 1, cascadeDelete: false },
      { type: 'bool', name: 'active' },
      { type: 'file', name: 'avatar', maxSelect: 1, maxSize: 2097152, mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], protected: true },
      { type: 'email', name: 'mail_from' },
      { type: 'autodate', name: 'created', onCreate: true },
      { type: 'autodate', name: 'updated', onCreate: true, onUpdate: true },
    ],
  }

  if (!existingRoles) {
    app.save(roles)
    app.save(new Collection(userDefinition))
    return
  }

  // Adopt compatible UI-created collections without saving or rewriting them.
  // Record ids, field ids, auth secrets, data and unrelated options are preserved.
  function refuse(path) {
    throw new Error(`Core auth adoption refused: incompatible ${path}. Review the existing schema before deploying.`)
  }
  function plain(collection) { return JSON.parse(JSON.stringify(collection)) }
  function normalizeRule(rule) { return typeof rule === 'string' ? rule.replace(/\s+/g, ' ').trim() : rule }
  function assertCollection(actual, expected) {
    if (actual.type !== expected.type) refuse(`${expected.name}.type`)
    for (const key of ['listRule', 'viewRule', 'createRule', 'updateRule', 'deleteRule']) {
      if (normalizeRule(actual[key]) !== normalizeRule(expected[key])) refuse(`${expected.name}.${key}`)
    }
    for (const field of expected.fields) {
      const current = actual.fields.find((item) => item.name === field.name)
      if (!current || current.hidden) refuse(`${expected.name}.${field.name}`)
      for (const key of Object.keys(field)) {
        if (key === 'maxSelect') {
          // PocketBase treats 0 and 1 identically: single relation/file value.
          if (current.maxSelect < 0 || current.maxSelect > 1) refuse(`${expected.name}.${field.name}.${key}`)
        } else if (JSON.stringify(current[key]) !== JSON.stringify(field[key])) {
          refuse(`${expected.name}.${field.name}.${key}`)
        }
      }
    }
  }
  const actualRoles = plain(existingRoles)
  const actualUsers = plain(existingUsers)
  assertCollection(actualRoles, roleDefinition)
  assertCollection(actualUsers, userDefinition)
  const normalizeIndex = (index) => index.replace(/[`"\s]/g, '').toLowerCase()
  if (!actualRoles.indexes.some((index) => normalizeIndex(index) === normalizeIndex(roleDefinition.indexes[0]))) {
    refuse('core_roles.unique_name_index')
  }
  if (actualUsers.manageRule !== null || normalizeRule(actualUsers.authRule) !== normalizeRule(userDefinition.authRule)) {
    refuse('core_users.auth_rules')
  }
  if (!actualUsers.passwordAuth.enabled || JSON.stringify(actualUsers.passwordAuth.identityFields) !== '["email"]' ||
      actualUsers.oauth2.enabled || actualUsers.otp.enabled || actualUsers.authToken.duration !== 3600) {
    refuse('core_users.auth_options')
  }
  for (const record of app.findAllRecords('core_roles')) {
    const permissions = JSON.parse(record.getString('permissions') || 'null')
    if (!Array.isArray(permissions) || permissions.length > 200 || new Set(permissions).size !== permissions.length ||
        permissions.some((permission) => typeof permission !== 'string' || !/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(permission))) {
      refuse('core_roles.permissions_data')
    }
  }
}, () => {
  // An adopted collection belongs to the existing installation, even if empty.
  throw new Error('Core auth rollback refused: preserve existing collections and use a reviewed corrective migration.')
})
