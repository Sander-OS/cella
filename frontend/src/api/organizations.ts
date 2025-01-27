import { organizationsClient as client, handleResponse } from '.';
export type CreateOrganizationParams = Parameters<(typeof client.organizations)['$post']>['0']['json'];

// Create a new organization
export const createOrganization = async (params: CreateOrganizationParams) => {
  const response = await client.organizations.$post({
    json: params,
  });

  const json = await handleResponse(response);
  return json.data;
};

// Get an organization by slug or ID
export const getOrganizationBySlugOrId = async (organization: string) => {
  const response = await client.organizations[':organization'].$get({
    param: { organization },
  });

  const json = await handleResponse(response);
  return json.data;
};

export type GetOrganizationsParams = Partial<
  Omit<Parameters<(typeof client.organizations)['$get']>['0']['query'], 'limit' | 'offset'> & {
    limit: number;
    page: number;
  }
>;

// Get a list of organizations
export const getOrganizations = async (
  { q, sort = 'id', order = 'asc', page = 0, limit = 50 }: GetOrganizationsParams = {},
  signal?: AbortSignal,
) => {
  const response = await client.organizations.$get(
    {
      query: {
        q,
        sort,
        order,
        offset: String(page * limit),
        limit: String(limit),
      },
    },
    {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          credentials: 'include',
          signal,
        });
      },
    },
  );

  const json = await handleResponse(response);
  return json.data;
};

export type UpdateOrganizationParams = Parameters<(typeof client.organizations)[':organization']['$put']>['0']['json'];

// Update an organization
export const updateOrganization = async (organization: string, params: UpdateOrganizationParams) => {
  const response = await client.organizations[':organization'].$put({
    param: { organization },
    json: params,
  });

  const json = await handleResponse(response);
  return json.data;
};

// Delete organizations
export const deleteOrganizations = async (ids: string[]) => {
  const response = await client.organizations.$delete({
    query: { ids },
  });

  await handleResponse(response);
};

export type GetMembersParams = Partial<
  Omit<Parameters<(typeof client.organizations)[':organization']['members']['$get']>['0']['query'], 'limit' | 'offset'> & {
    limit: number;
    page: number;
  }
>;

// Get a list of members in an organization
export const getOrganizationMembers = async (
  organization: string,
  { q, sort = 'id', order = 'asc', role, page = 0, limit = 50 }: GetMembersParams = {},
  signal?: AbortSignal,
) => {
  const response = await client.organizations[':organization'].members.$get(
    {
      param: { organization },
      query: {
        q,
        sort,
        order,
        offset: String(page * limit),
        limit: String(limit),
        role,
      },
    },
    {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          credentials: 'include',
          signal,
        });
      },
    },
  );

  const json = await handleResponse(response);
  return json.data;
};

// INFO: Send newsletter to organizations (not implemented)
export const sendNewsletter = async ({
  organizationIds,
  subject,
  content,
}: {
  organizationIds: string[];
  subject: string;
  content: string;
}) => {
  console.info('Sending newsletter to organizations', organizationIds, subject, content);

  return { success: true };
};

export type GetRequestsParams = Partial<
  Omit<Parameters<(typeof client.organizations)[':organization']['requests']['$get']>['0']['query'], 'limit' | 'offset'> & {
    limit: number;
    page: number;
  }
>;
// Get become member requests
export const becomeMemberRequests = async (
  organization: string,
  { q, sort = 'id', order = 'asc', page = 0, limit = 50 }: GetRequestsParams = {},
  signal?: AbortSignal,
) => {
  const response = await client.organizations[':organization'].requests.$get(
    {
      param: { organization },
      query: {
        q,
        sort,
        order,
        offset: String(page * limit),
        limit: String(limit),
      },
    },
    {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        return fetch(input, {
          ...init,
          credentials: 'include',
          signal,
        });
      },
    },
  );

  const json = await handleResponse(response);
  return json.data;
};
