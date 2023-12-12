exports.AdminUser = {
  type: 'object',
  properties: {
    _id: {
      type: 'string',
      description: 'The unique identifier of the admin user',
      example: '614d1b71e076af0012345678',
    },
    email: {
      type: 'string',
      description: 'The email address of the admin user',
      example: 'admin@example.com',
    },
    is_admin: {
      type: 'boolean',
      description: 'Whether the user is an admin or not',
      example: true,
    },
  },
};
