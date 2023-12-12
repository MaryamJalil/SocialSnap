exports.BadRequestResponse = {
  description: 'Bad request response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          status: {
            type: 'number',
            description: 'The HTTP status code of the error response',
            example: 400,
          },
          message: {
            type: 'string',
            description: 'A description of the error',
            example: 'Bad request',
          },
        },
      },
    },
  },
};
