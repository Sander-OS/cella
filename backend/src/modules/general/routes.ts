import { z } from '@hono/zod-openapi';
import { errorResponses, successResponseWithDataSchema, successResponseWithoutDataSchema } from '../../lib/common-responses';
import { resourceTypeSchema } from '../../lib/common-schemas';
import { createRouteConfig } from '../../lib/route-config';
import { isAuthenticated, isPublicAccess, isSystemAdmin } from '../../middlewares/guard';
import { authRateLimiter, rateLimiter } from '../../middlewares/rate-limiter';
import {
  acceptInviteJsonSchema,
  actionRequestSchema,
  actionResponseSchema,
  checkTokenSchema,
  getRequestsQuerySchema,
  getRequestsSchema,
  inviteJsonSchema,
  suggestionsSchema,
} from './schema';

export const getUploadTokenRouteConfig = createRouteConfig({
  method: 'get',
  path: '/upload-token',
  guard: isAuthenticated,
  tags: ['general'],
  summary: 'Get upload token',
  description:
    'This endpoint is used to get an upload token for a user or organization. The token can be used to upload public or private images/files to your S3 bucket using imado.',
  request: {
    query: z.object({
      public: z.string().optional().default('false'),
      organization: z.string().optional(),
      width: z.string().optional(),
      height: z.string().optional(),
      quality: z.string().optional(),
      format: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Upload token with a scope for a user or organization',
      content: {
        'application/json': {
          schema: successResponseWithDataSchema(
            z.string().openapi({
              description: 'The upload token (JWT)',
            }),
          ),
        },
      },
    },
    ...errorResponses,
  },
});

export const checkSlugRouteConfig = createRouteConfig({
  method: 'get',
  path: '/check-slug/{type}/{slug}',
  guard: isAuthenticated,
  tags: ['general'],
  summary: 'Check if a slug is available',
  description: 'This endpoint is used to check if a slug is available. It is used for organizations and users.',
  request: {
    params: z.object({
      type: z.string().toUpperCase().pipe(resourceTypeSchema),
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'User',
      content: {
        'application/json': {
          schema: successResponseWithDataSchema(z.boolean()),
        },
      },
    },
    ...errorResponses,
  },
});

export const checkTokenRouteConfig = createRouteConfig({
  method: 'get',
  path: '/check-token/{token}',
  guard: isPublicAccess,
  tags: ['general'],
  summary: 'Token validation check',
  description: 'This endpoint is used to check if a token is still valid. It is used for reset password and invitation tokens.',
  request: {
    params: z.object({
      token: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Token is valid',
      content: {
        'application/json': {
          schema: successResponseWithDataSchema(checkTokenSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const inviteRouteConfig = createRouteConfig({
  method: 'post',
  path: '/invite',
  guard: [isAuthenticated, isSystemAdmin],
  middleware: [rateLimiter({ points: 10, duration: 60 * 60, blockDuration: 60 * 10, keyPrefix: 'invite_success' }, 'success')],
  tags: ['general'],
  summary: 'Invite a new member(user) to system',
  description: `
    Permissions:
      - Users with role 'ADMIN'
  `,
  request: {
    body: {
      content: {
        'application/json': {
          schema: inviteJsonSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Invitation was sent',
      content: {
        'application/json': {
          schema: successResponseWithoutDataSchema,
        },
      },
    },
    ...errorResponses,
  },
});

export const acceptInviteRouteConfig = createRouteConfig({
  method: 'post',
  path: '/accept-invite/{token}',
  guard: isPublicAccess,
  middleware: [authRateLimiter],
  tags: ['auth'],
  summary: 'Accept invitation',
  request: {
    params: z.object({
      token: z.string(),
    }),
    body: {
      content: {
        'application/json': {
          schema: acceptInviteJsonSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Invitation was accepted',
      content: {
        'application/json': {
          schema: successResponseWithoutDataSchema,
        },
      },
    },
    302: {
      description: 'Redirect to github',
      headers: z.object({
        Location: z.string(),
      }),
    },
    ...errorResponses,
  },
});

export const paddleWebhookRouteConfig = createRouteConfig({
  method: 'post',
  path: '/paddle-webhook',
  guard: isPublicAccess,
  tags: ['general'],
  summary: 'Paddle webhook',
  description: 'Paddle webhook for subscription events',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.unknown(),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Paddle webhook received',
      content: {
        'application/json': {
          schema: successResponseWithoutDataSchema,
        },
      },
    },
    ...errorResponses,
  },
});

export const suggestionsConfig = createRouteConfig({
  method: 'get',
  path: '/suggestions',
  guard: isAuthenticated,
  tags: ['general'],
  summary: 'Get search suggestions',
  request: {
    query: z.object({
      q: z.string().optional().openapi({ description: 'Search by name through all page resources' }),
      type: resourceTypeSchema.optional().openapi({ description: 'Type of page resource' }),
    }),
  },
  responses: {
    200: {
      description: 'Suggestions',
      content: {
        'application/json': {
          schema: successResponseWithDataSchema(suggestionsSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const requestActionConfig = createRouteConfig({
  method: 'post',
  path: '/action-request',
  guard: isPublicAccess,
  middleware: [authRateLimiter],
  tags: ['general'],
  summary: 'Create access-request',
  request: {
    body: {
      content: {
        'application/json': {
          schema: actionRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Access requests',
      content: {
        'application/json': {
          schema: successResponseWithDataSchema(actionResponseSchema),
        },
      },
    },
    ...errorResponses,
  },
});

export const actionRequestsConfig = createRouteConfig({
  method: 'get',
  path: '/requests',
  guard: [isAuthenticated, isSystemAdmin],
  tags: ['general'],
  summary: 'Get requests',
  request: {
    query: getRequestsQuerySchema,
  },
  responses: {
    200: {
      description: 'System access requests',
      content: {
        'application/json': {
          schema: successResponseWithDataSchema(getRequestsSchema),
        },
      },
    },
    ...errorResponses,
  },
});
