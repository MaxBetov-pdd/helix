<script lang="ts">
	export let folds: {
		fold_index: number;
		train_start: string;
		train_end: string;
		test_start: string;
		test_end: string;
	}[] = [];

	export let totalStart: string = '';
	export let totalEnd: string = '';

	function getPosition(dateStr: string): number {
		if (!totalStart || !totalEnd) return 0;
		const start = new Date(totalStart).getTime();
		const end = new Date(totalEnd).getTime();
		const current = new Date(dateStr).getTime();
		return ((current - start) / (end - start)) * 100;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString();
	}
</script>

<div class="fold-visualization">
	{#if folds.length === 0}
		<div class="text-gray-400 text-sm">Configure splits to see fold preview</div>
	{:else}
		<div class="space-y-2">
			{#each folds as fold, index}
				<div class="flex items-center gap-3">
					<span class="text-gray-400 text-xs w-12">Fold {index + 1}</span>
					<div class="flex-1 h-6 bg-gray-700 rounded relative">
						<!-- Train segment -->
						<div
							class="absolute h-full bg-blue-600/60 rounded-l"
							style="left: {getPosition(fold.train_start)}%; width: {getPosition(fold.train_end) - getPosition(fold.train_start)}%;"
							title="Train: {formatDate(fold.train_start)} - {formatDate(fold.train_end)}"
						></div>
						<!-- Test segment -->
						<div
							class="absolute h-full bg-green-600/60 rounded-r"
							style="left: {getPosition(fold.test_start)}%; width: {getPosition(fold.test_end) - getPosition(fold.test_start)}%;"
							title="Test: {formatDate(fold.test_start)} - {formatDate(fold.test_end)}"
						></div>
					</div>
				</div>
			{/each}
		</div>

		<div class="flex justify-between text-xs text-gray-500 mt-2">
			<span>{formatDate(totalStart)}</span>
			<span>{formatDate(totalEnd)}</span>
		</div>

		<div class="flex gap-4 mt-3 text-xs">
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 bg-blue-600/60 rounded"></div>
				<span class="text-gray-400">Training</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="w-3 h-3 bg-green-600/60 rounded"></div>
				<span class="text-gray-400">Testing (OOS)</span>
			</div>
		</div>
	{/if}
</div>
