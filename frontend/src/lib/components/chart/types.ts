export type ChartDrawingTool = 'cursor' | 'horizontalLine' | 'trendLine';

export interface ChartDrawingPoint {
	time: string;
	price: number;
}

interface ChartDrawingBase {
	id: string;
	color?: string;
	label?: string;
}

export interface HorizontalLineDrawing extends ChartDrawingBase {
	type: 'horizontalLine';
	price: number;
}

export interface TrendLineDrawing extends ChartDrawingBase {
	type: 'trendLine';
	start: ChartDrawingPoint;
	end: ChartDrawingPoint;
}

export type ChartDrawing = HorizontalLineDrawing | TrendLineDrawing;
