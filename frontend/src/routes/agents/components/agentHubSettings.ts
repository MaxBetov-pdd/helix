export type AccentColor = 'cyan' | 'green' | 'amber' | 'rose';

export interface AgentHubSettings {
	pollInterval: number;
	taskQueueCount: number;
	compactCards: boolean;
	dateFormat: 'relative' | 'absolute';
	accent: AccentColor;
	soundOnComplete: boolean;
	showInternalWorkers: boolean;
	showSchedulerErrors: boolean;
}
