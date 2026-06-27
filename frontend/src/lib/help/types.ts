/**
 * Types for the educational help system
 */

export interface HelpFormula {
	latex: string;
	plain: string;
	variables: Record<string, string>;
}

export interface HelpInterpretation {
	range: string;
	label: string;
	color: 'red' | 'yellow' | 'green' | 'blue' | 'gray';
	description: string;
}

export interface HelpExample {
	scenario: string;
	calculation: string;
	result: string;
	interpretation: string;
}

export interface HelpContent {
	id: string;
	term: string;
	shortDescription: string;
	category: 'metric' | 'walkforward' | 'optimization' | 'data' | 'strategy' | 'risk';

	// Full educational content
	fullDescription: string;
	formula?: HelpFormula;
	interpretations?: HelpInterpretation[];
	limitations?: string[];
	proTips?: string[];
	examples?: HelpExample[];
	relatedTerms?: string[];
	references?: string[];
}

export type HelpContentMap = Record<string, HelpContent>;
