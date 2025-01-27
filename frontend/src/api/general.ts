import type { PageResourceType } from 'backend/types/common';
import { type UploadParams, UploadType, type User } from '~/types';
import { generalClient as client, handleResponse } from '.';

// Get upload token to securely upload files with imado: https://imado.eu
export const getUploadToken = async (type: UploadType, query: UploadParams = { public: false, organizationId: undefined }) => {
  const id = query.organizationId;

  if (!id && type === UploadType.Organization) {
    return console.error('Organization id required for organization uploads');
  }

  if (id && type === UploadType.Personal) {
    return console.error('Personal uploads should be typed as personal');
  }

  const preparedQuery = {
    public: String(query.public),
    organizationId: id,
  };

  const response = await client['upload-token'].$get({ query: preparedQuery });

  const json = await handleResponse(response);
  return json.data;
};

export interface InviteSystemProps {
  emails: string[];
  role?: User['role'];
}

// Invite users
export const invite = async (values: InviteSystemProps) => {
  const response = await client.invite.$post({
    json: values,
  });

  await handleResponse(response);
};

// Check if slug is available
export const checkSlugAvailable = async (params: {
  slug: string;
  type: PageResourceType;
}) => {
  const response = await client['check-slug'][':type'][':slug'].$get({
    param: params,
  });

  const json = await handleResponse(response);
  return json.data;
};

// Check token validation
export const checkToken = async (token: string) => {
  const response = await client['check-token'][':token'].$get({
    param: { token },
  });

  const json = await handleResponse(response);
  return json.data;
};

// Get suggestions
export const getSuggestions = async (query: string, type?: PageResourceType | undefined) => {
  const response = await client.suggestions.$get({
    query: { q: query, type },
  });

  const json = await handleResponse(response);
  return json.data;
};

// Accept an invitation
export const acceptInvite = async ({
  token,
  password,
  oauth,
}: {
  token: string;
  password?: string;
  oauth?: 'github' | 'google' | 'microsoft';
}) => {
  const response = await client['accept-invite'][':token'].$post({
    param: { token },
    json: { password, oauth },
  });

  const json = await handleResponse(response);
  return json.success;
};

interface ActionRequestProp {
  email: string;
  type: 'ORGANIZATION_REQUEST' | 'WAITLIST_REQUEST' | 'NEWSLETTER_REQUEST' | 'CONTACT_REQUEST';
  userId?: string;
  organizationId?: string;
  message?: string;
}
// Action request
export const requestAction = async (requestInfo: ActionRequestProp) => {
  const response = await client['action-request'].$post({
    json: {
      type: requestInfo.type,
      email: requestInfo.email,
      userId: requestInfo.userId || null,
      organizationId: requestInfo.organizationId || null,
      message: requestInfo.message || null,
    },
  });

  await handleResponse(response);
};

export type GetRequestsParams = Partial<
  Omit<Parameters<(typeof client.requests)['$get']>['0']['query'], 'limit' | 'offset'> & {
    limit: number;
    page: number;
  }
>;

// TODO: fix this
// Get system action requests
export const actionRequests = async ({ q, sort = 'id', order = 'asc', page = 0, limit = 50 }: GetRequestsParams = {}, signal?: AbortSignal) => {
  const response = await client.requests.$get(
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
