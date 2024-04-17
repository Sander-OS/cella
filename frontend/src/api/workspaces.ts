import { ApiError, workspaceClient as client } from '.';
export type CreateWorkspaceParams = Parameters<(typeof client.workspaces)['$post']>['0']['json'];

// Create a new workspace
export const createWorkspace = async (params: CreateWorkspaceParams) => {
  const response = await client.workspaces.$post({
    json: params,
  });

  const json = await response.json();
  if ('error' in json) throw new ApiError(json.error);
  return json.data;
};

// export type UpdateOrganizationParams = Parameters<(typeof client.organizations)[':organizationIdentifier']['$put']>['0']['json'];

// // Update an organization
// export const updateOrganization = async (organizationIdentifier: string, params: UpdateOrganizationParams) => {
//   const response = await client.organizations[':organizationIdentifier'].$put({
//     param: { organizationIdentifier },
//     json: params,
//   });

//   const json = await response.json();
//   if ('error' in json) throw new ApiError(json.error);
//   return json.data;
// };

// export type GetOrganizationsParams = Partial<
//   Omit<Parameters<(typeof client.organizations)['$get']>['0']['query'], 'limit' | 'offset'> & {
//     limit: number;
//     page: number;
//   }
// >;

// // Get a list of organizations
// export const getOrganizations = async (
//   { q, sort = 'id', order = 'asc', page = 0, limit = 50 }: GetOrganizationsParams = {},
//   signal?: AbortSignal,
// ) => {
//   const response = await client.organizations.$get(
//     {
//       query: {
//         q,
//         sort,
//         order,
//         offset: String(page * limit),
//         limit: String(limit),
//       },
//     },
//     {
//       fetch: (input: RequestInfo | URL, init?: RequestInit) => {
//         return fetch(input, {
//           ...init,
//           credentials: 'include',
//           signal,
//         });
//       },
//     },
//   );

//   const json = await response.json();
//   if ('error' in json) throw new ApiError(json.error);
//   return json.data;
// };

// Get an workspace by its slug or ID
export const getWorkspaceBySlugOrId = async (workspaceIdentifier: string) => {
  const response = await client.workspaces[':workspaceIdentifier'].$get({
    param: { workspaceIdentifier },
  });

  const json = await response.json();
  if ('error' in json) throw new ApiError(json.error);
  return json.data;
};

// // Delete organizations
// export const deleteOrganizations = async (organizationIds: string[]) => {
//   const response = await client.organizations.$delete({
//     query: { ids: organizationIds },
//   });

//   const json = await response.json();
//   if ('error' in json) throw new ApiError(json.error);
//   return;
// };

// export type GetMembersParams = Partial<
//   Omit<Parameters<(typeof client.organizations)[':organizationIdentifier']['members']['$get']>['0']['query'], 'limit' | 'offset'> & {
//     limit: number;
//     page: number;
//   }
// >;

// // Get a list of members in an organization
// export const getMembersByOrganizationIdentifier = async (
//   organizationIdentifier: string,
//   { q, sort = 'id', order = 'asc', role, page = 0, limit = 50 }: GetMembersParams = {},
//   signal?: AbortSignal,
// ) => {
//   const response = await client.organizations[':organizationIdentifier'].members.$get(
//     {
//       param: { organizationIdentifier },
//       query: {
//         q,
//         sort,
//         order,
//         offset: String(page * limit),
//         limit: String(limit),
//         role,
//       },
//     },
//     {
//       fetch: (input: RequestInfo | URL, init?: RequestInit) => {
//         return fetch(input, {
//           ...init,
//           credentials: 'include',
//           signal,
//         });
//       },
//     },
//   );

//   const json = await response.json();
//   if ('error' in json) throw new ApiError(json.error);
//   return json.data;
// };

// // INFO: Send newsletter to organizations (not implemented)
// export const sendNewsletter = async ({
//   organizationIds,
//   subject,
//   content,
// }: {
//   organizationIds: string[];
//   subject: string;
//   content: string;
// }) => {
//   console.info('Sending newsletter to organizations', organizationIds, subject, content);

//   return { success: true };
// };