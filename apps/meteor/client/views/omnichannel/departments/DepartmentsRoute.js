import { Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRouteParameter, useRoute, usePermission, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useState, useRef } from 'react';

import GenericTable from '../../../components/GenericTable';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import DepartmentsPage from './DepartmentsPage';
import EditDepartmentWithData from './EditDepartmentWithData';
import NewDepartment from './NewDepartment';
import RemoveDepartmentButton from './RemoveDepartmentButton';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useDepartmentsQuery = ({ text, itemsPerPage, current }, [column, direction], onlyMyDepartments) =>
	useMemo(
		() => ({
			fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
			text,
			sort: JSON.stringify({
				[column]: sortDir(direction),
				usernames: column === 'name' ? sortDir(direction) : undefined,
			}),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
			onlyMyDepartments,
		}),
		[text, itemsPerPage, current, column, direction, onlyMyDepartments],
	);

function DepartmentsRoute() {
	const t = useTranslation();
	const canViewDepartments = usePermission('manage-livechat-departments');
	const canRemoveDepartments = usePermission('remove-livechat-department');

	const [params, setParams] = useState({
		text: '',
		current: 0,
		itemsPerPage: 25,
	});
	const [sort, setSort] = useState(['name', 'asc']);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const onlyMyDepartments = true;
	const departmentsRoute = useRoute('omnichannel-departments');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	const refetchRef = useRef(() => undefined);

	const handleRefetch = useCallback(() => {
		refetchRef.current();
	}, [refetchRef]);

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const onRowClick = useMutableCallback(
		(id) => () =>
			departmentsRoute.push({
				context: 'edit',
				id,
			}),
	);

	const query = {
		onlyMyDepartments,
		text: debouncedParams.text,
		offset: debouncedParams.current,
		count: debouncedParams.itemsPerPage,
		sort: JSON.stringify({
			[debouncedSort.column]: sortDir(debouncedSort.direction),
			usernames: debouncedSort.column === 'name' ? sortDir(debouncedSort.direction) : undefined,
		}),
		fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
	};

	const getDepartments = useEndpoint('GET', '/v1/livechat/department');

	const { data, refetch } = useQuery(['getDepartments', query], async () => getDepartments(query));

	const reload = useCallback(() => refetch(), [refetch]);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'description'}
					direction={sort[1]}
					active={sort[0] === 'description'}
					onClick={onHeaderClick}
					sort='description'
				>
					{t('Description')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'numAgents'}
					direction={sort[1]}
					active={sort[0] === 'numAgents'}
					onClick={onHeaderClick}
					sort='numAgents'
				>
					{t('Num_Agents')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'enabled'} direction={sort[1]} active={sort[0] === 'enabled'} onClick={onHeaderClick} sort='enabled'>
					{t('Enabled')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'showOnRegistration'}
					direction={sort[1]}
					active={sort[0] === 'showOnRegistration'}
					onClick={onHeaderClick}
					sort='status'
				>
					{t('Show_on_registration_page')}
				</GenericTable.HeaderCell>,
				canRemoveDepartments && (
					<GenericTable.HeaderCell key={'remove'} w='x60'>
						{t('Remove')}
					</GenericTable.HeaderCell>
				),
			].filter(Boolean),
		[sort, onHeaderClick, t, canRemoveDepartments],
	);

	const renderRow = useCallback(
		({ name, _id, description, numAgents, enabled, showOnRegistration }) => (
			<Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
				<Table.Cell withTruncatedText>{name}</Table.Cell>
				<Table.Cell withTruncatedText>{description}</Table.Cell>
				<Table.Cell withTruncatedText>{numAgents || '0'}</Table.Cell>
				<Table.Cell withTruncatedText>{enabled ? t('Yes') : t('No')}</Table.Cell>
				<Table.Cell withTruncatedText>{showOnRegistration ? t('Yes') : t('No')}</Table.Cell>
				{canRemoveDepartments && <RemoveDepartmentButton _id={_id} reload={reload} refetch={handleRefetch} />}
			</Table.Row>
		),
		[canRemoveDepartments, handleRefetch, onRowClick, reload, t],
	);

	if (!canViewDepartments) {
		return <NotAuthorizedPage />;
	}

	if (context === 'new') {
		return <NewDepartment id={id} reload={reload} refetchRef={refetchRef} title={t('New_Department')} />;
	}

	if (context === 'edit') {
		return <EditDepartmentWithData reload={reload} id={id} title={t('Edit_Department')} />;
	}

	return (
		<DepartmentsPage
			setParams={setParams}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			useQuery={useDepartmentsQuery}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Departments')}
		></DepartmentsPage>
	);
}

export default DepartmentsRoute;