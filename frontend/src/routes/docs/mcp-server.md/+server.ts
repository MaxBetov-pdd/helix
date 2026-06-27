import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const GUIDE_PATHS = [
	resolve(process.cwd(), '..', 'docs', 'mcp-server.md'),
	resolve(process.cwd(), 'docs', 'mcp-server.md')
];

export const prerender = true;

export async function GET() {
	const guidePath = GUIDE_PATHS.find((path) => existsSync(path));

	if (!guidePath) {
		return new Response('MCP server guide not found.', { status: 404 });
	}

	const guide = await readFile(guidePath, 'utf-8');

	return new Response(guide, {
		headers: {
			'content-type': 'text/markdown; charset=utf-8'
		}
	});
}
