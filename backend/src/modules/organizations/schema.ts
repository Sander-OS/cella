import { z } from 'zod';

import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { organizationsTable } from '../../db/schema/organizations';
import {
  idSchema,
  imageUrlSchema,
  nameSchema,
  paginationQuerySchema,
  validDomainsSchema,
  validSlugSchema,
  validUrlSchema,
} from '../../lib/common-schemas';
import { actionReqTableSchema } from '../general/schema';
import { apiMembershipSchema } from '../memberships/schema';
import { apiUserSchema } from '../users/schema';

export const apiOrganizationUserSchema = z.object({
  ...apiUserSchema.shape,
  membershipId: idSchema,
  organizationRole: apiMembershipSchema.shape.role,
});

export const apiOrganizationSchema = z.object({
  ...createSelectSchema(organizationsTable).shape,
  createdAt: z.string(),
  modifiedAt: z.string().nullable(),
  languages: z.array(z.string()),
  emailDomains: z.array(z.string()).nullable(),
  authStrategies: z.array(z.string()).nullable(),
  userRole: apiMembershipSchema.shape.role.nullable(),
  counts: z.object({
    admins: z.number(),
    members: z.number(),
  }),
});
// .extend({
//   createdAt: z.string(),
//   modifiedAt: z.string().nullable(),
//   languages: z.array(z.string()).nullable(),
//   emailDomains: z.array(z.string()).nullable(),
//   authStrategies: z.array(z.string()).nullable(),
//   userRole: membershipSchema.shape.role,
// });

export const createOrganizationJsonSchema = z.object({
  name: nameSchema,
  slug: validSlugSchema,
});

export const updateOrganizationJsonSchema = createInsertSchema(organizationsTable, {
  slug: validSlugSchema,
  name: nameSchema,
  shortName: nameSchema,
  languages: z.array(z.string()).min(1).optional(),
  emailDomains: validDomainsSchema,
  authStrategies: z.array(z.string()).optional(),
  websiteUrl: validUrlSchema,
  thumbnailUrl: imageUrlSchema,
  bannerUrl: imageUrlSchema,
  logoUrl: imageUrlSchema,
})
  .pick({
    slug: true,
    name: true,
    shortName: true,
    country: true,
    timezone: true,
    defaultLanguage: true,
    languages: true,
    notificationEmail: true,
    emailDomains: true,
    brandColor: true,
    thumbnailUrl: true,
    logoUrl: true,
    bannerUrl: true,
    websiteUrl: true,
    welcomeText: true,
    authStrategies: true,
    chatSupport: true,
  })
  .partial();

export const getUsersByOrganizationQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(['id', 'name', 'email', 'organizationRole', 'createdAt', 'lastSeenAt']).default('createdAt').optional(),
  role: z.enum(['admin', 'member']).default('member').optional(),
});

export const getOrganizationsQuerySchema = paginationQuerySchema.merge(
  z.object({
    sort: z.enum(['id', 'name', 'userRole', 'createdAt']).default('createdAt').optional(),
  }),
);

export const getRequestsSchema = z.object({
  requestsInfo: z.array(
    z.object({
      id: idSchema,
      email: z.string(),
      createdAt: z.string(),
      type: actionReqTableSchema.shape.type,
      message: z.string().nullable(),
      userId: z.string().nullable(),
      userName: z.string().nullable(),
      userThumbnail: z.string().nullable(),
      organizationId: z.string().nullable(),
      organizationName: z.string().nullable(),
      organizationThumbnail: z.string().nullable(),
      organizationSlug: z.string().nullable(),
    }),
  ),
  total: z.number(),
});

export const getRequestsQuerySchema = paginationQuerySchema.merge(
  z.object({
    sort: z.enum(['id', 'email', 'type', 'createdAt']).default('createdAt').optional(),
  }),
);
