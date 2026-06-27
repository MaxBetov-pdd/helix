import type { PageLoad } from './$types';
import { getTaskAudit } from '$lib/api';
import type { TaskContainer, TaskAuditEvent } from '$lib/api';

export const ssr = false;

export const load: PageLoad = async ({ params }) => {
	const taskId = params.id ?? '';
	try {
		const details = await getTaskAudit(taskId);
		return {
			taskId,
			task: details.task,
			auditLog: Array.isArray(details.audit_log) ? details.audit_log : [],
			toolCalls: Array.isArray(details.tool_calls) ? details.tool_calls : [],
			loadError: null,
		} satisfies {
			taskId: string;
			task: TaskContainer | null;
			auditLog: TaskAuditEvent[];
			toolCalls: Array<Record<string, unknown>>;
			loadError: string | null;
		};
	} catch (e) {
		return {
			taskId,
			task: null,
			auditLog: [] as TaskAuditEvent[],
			toolCalls: [] as Array<Record<string, unknown>>,
			loadError: e instanceof Error ? e.message : 'Failed to load task details',
		} satisfies {
			taskId: string;
			task: TaskContainer | null;
			auditLog: TaskAuditEvent[];
			toolCalls: Array<Record<string, unknown>>;
			loadError: string | null;
		};
	}
};
