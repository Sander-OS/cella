import { type DefaultError, infiniteQueryOptions, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Member, Membership } from '~/types';

import { updateMembership } from '~/api/memberships';
import { type GetMembersParams, getOrganizationMembers } from '~/api/organizations';
import { DataTable } from '~/modules/common/data-table';

import type { getUsersByOrganizationQuerySchema } from 'backend/modules/organizations/schema';
import { Bird } from 'lucide-react';
import type { RowsChangeData, SortColumn } from 'react-data-grid';
import type { z } from 'zod';
import { useDebounce } from '~/hooks/use-debounce';
import { useMutateInfiniteQueryData } from '~/hooks/use-mutate-query-data';
import { queryClient } from '~/lib/router';
import ContentPlaceholder from '~/modules/common/content-placeholder';
import { OrganizationContext } from '~/modules/organizations/organization';
import { OrganizationMembersRoute } from '~/routes/organizations';
import useSaveInSearchParams from '../../../hooks/use-save-in-search-params';
import { useColumns } from './columns';
import Toolbar from './toolbar';

const LIMIT = 40;

export type MembersSearch = z.infer<typeof getUsersByOrganizationQuerySchema>;

export const membersQueryOptions = (idOrSlug: string, { q, sort: initialSort, order: initialOrder, role }: GetMembersParams) => {
  const sort = initialSort || 'createdAt';
  const order = initialOrder || 'desc';

  return infiniteQueryOptions({
    queryKey: ['members', idOrSlug, q, sort, order, role],
    initialPageParam: 0,
    queryFn: async ({ pageParam, signal }) => {
      const fetchedData = await getOrganizationMembers(
        idOrSlug,
        {
          page: pageParam,
          q,
          sort,
          order,
          role,
          limit: LIMIT,
        },
        signal,
      );

      return fetchedData;
    },
    getNextPageParam: (_lastPage, allPages) => allPages.length,
    refetchOnWindowFocus: false,
  });
};

export const useUpdateUserInOrganizationMutation = (idOrSlug: string) => {
  return useMutation<
    Membership,
    DefaultError,
    {
      id: string;
      role: Member['organizationRole'];
    }
  >({
    mutationKey: ['members', 'update', idOrSlug],
    mutationFn: (params) => updateMembership({ membershipId: params.id, role: params.role }),
    // TODO: Review onSuccess
    onSuccess: (membership) => {
      const member = queryClient.getQueryData<Member>(['users', idOrSlug]);
      if (!member) return;
      queryClient.setQueryData<Member>(['users', idOrSlug], {
        ...member,
        organizationRole: membership.role,
      });
    },
    gcTime: 1000 * 10,
  });
};

const MembersTable = () => {
  const { t } = useTranslation();
  const { organization } = useContext(OrganizationContext);
  const [columns, setColumns] = useColumns();
  const search = useSearch({
    from: OrganizationMembersRoute.id,
  });
  const { mutate: mutateMember } = useUpdateUserInOrganizationMutation(organization.slug);

  const [rows, setRows] = useState<Member[]>([]);
  const [selectedRows, setSelectedRows] = useState(new Set<string>());
  const [sortColumns, setSortColumns] = useState<SortColumn[]>(
    search.sort && search.order
      ? [{ columnKey: search.sort, direction: search.order === 'asc' ? 'ASC' : 'DESC' }]
      : [{ columnKey: 'createdAt', direction: 'DESC' }],
  );
  const [query, setQuery] = useState<MembersSearch['q']>(search.q);
  const [role, setRole] = useState<MembersSearch['role']>(search.role);

  const debounceQuery = useDebounce(query, 300);
  // Save filters in search params
  const filters = useMemo(
    () => ({
      q: debounceQuery,
      sort: sortColumns[0]?.columnKey,
      order: sortColumns[0]?.direction.toLowerCase(),
      role,
    }),
    [debounceQuery, role, sortColumns],
  );
  useSaveInSearchParams(filters, {
    sort: 'createdAt',
    order: 'desc',
  });

  const callback = useMutateInfiniteQueryData([
    'members',
    organization.slug,
    debounceQuery,
    sortColumns[0]?.columnKey,
    sortColumns[0]?.direction.toLowerCase(),
    role,
  ]);

  const queryResult = useInfiniteQuery(
    membersQueryOptions(organization.slug, {
      q: debounceQuery,
      sort: sortColumns[0]?.columnKey as MembersSearch['sort'],
      order: sortColumns[0]?.direction.toLowerCase() as MembersSearch['order'],
      role,
      limit: LIMIT,
    }),
  );

  const onRowsChange = (records: Member[], { column, indexes }: RowsChangeData<Member>) => {
    // mutate member
    for (const index of indexes) {
      const member = records[index];
      if (column.key === 'membershipId') {
        mutateMember({ id: member.membershipId, role: member.organizationRole });
      }
    }

    setRows(records);
  };

  const isFiltered = role !== undefined || !!debounceQuery;

  const onResetFilters = () => {
    setQuery('');
    setSelectedRows(new Set<string>());
    setRole(undefined);
  };

  useEffect(() => {
    const data = queryResult.data?.pages?.flatMap((page) => page.items);

    if (data) {
      setSelectedRows(new Set<string>([...selectedRows].filter((id) => data.some((row) => row.id === id))));
      setRows(data);
    }
  }, [queryResult.data]);

  return (
    <div className="space-y-4 h-full">
      <Toolbar
        isFiltered={isFiltered}
        total={queryResult.data?.pages[0].total}
        query={query}
        columns={columns}
        setColumns={setColumns}
        refetch={queryResult.refetch}
        setQuery={setQuery}
        callback={callback}
        onResetFilters={onResetFilters}
        onResetSelectedRows={() => setSelectedRows(new Set<string>())}
        role={role}
        sort={sortColumns[0]?.columnKey as MembersSearch['sort']}
        order={sortColumns[0]?.direction.toLowerCase() as MembersSearch['order']}
        selectedMembers={rows.filter((row) => selectedRows.has(row.id))}
        setRole={setRole}
      />
      <DataTable<Member>
        {...{
          columns: columns.filter((column) => column.visible),
          rows,
          totalCount: queryResult.data?.pages[0].total,
          rowHeight: 42,
          rowKeyGetter: (row) => row.id,
          enableVirtualization: false,
          error: queryResult.error,
          isLoading: queryResult.isLoading,
          isFetching: queryResult.isFetching,
          fetchMore: queryResult.fetchNextPage,
          overflowNoRows: true,
          limit: LIMIT,
          isFiltered,
          selectedRows,
          onRowsChange,
          onSelectedRowsChange: setSelectedRows,
          sortColumns,
          onSortColumnsChange: setSortColumns,
          NoRowsComponent: <ContentPlaceholder Icon={Bird} title={t('common:no_resource_yet', { resource: t('common:members').toLowerCase() })} />,
        }}
      />
    </div>
  );
};

export default MembersTable;
