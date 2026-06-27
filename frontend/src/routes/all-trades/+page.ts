import type { PageLoad } from './$types';
import { getHelixAllTrades } from '$lib/api';
import type { HelixTradesPage } from '$lib/api';

export const ssr = false;

export const load: PageLoad = async () => {
	const [result] = await Promise.allSettled([getHelixAllTrades({ limit: 200 })]);
	return {
		initialPage: result.status === 'fulfilled' ? result.value : null,
	} satisfies { initialPage: HelixTradesPage | null };
};
