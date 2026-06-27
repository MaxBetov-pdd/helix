import type { PageLoad } from './$types';
import { getHelixDashboard } from '$lib/api';
import type { HelixDashboardResponse } from '$lib/api';

export const ssr = false;

export const load: PageLoad = async () => {
	const dashboardResult = await Promise.allSettled([getHelixDashboard()]);
	const dashboard = dashboardResult[0].status === 'fulfilled' ? dashboardResult[0].value : null;
	return { dashboard } satisfies { dashboard: HelixDashboardResponse | null };
};
