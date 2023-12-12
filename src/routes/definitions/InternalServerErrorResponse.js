exports.InternalServerErrorResponse = {
  description: 'Internal server error response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            description: 'The HTTP status code of the error response',
            example: 500,
          },
          message: {
            type: 'string',
            description: 'A description of the error',
            example: 'Internal server error',
          },
        },
      },
    },
  },
};
