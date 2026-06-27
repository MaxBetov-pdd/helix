import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../lib/utils/markdown';

describe('renderMarkdown (safe)', () => {
	it('renders basic markdown', () => {
		const html = renderMarkdown('**bold** and `code`');
		expect(html).toContain('<strong>bold</strong>');
		expect(html).toContain('<code>code</code>');
	});

	it('strips <script> tags', () => {
		const html = renderMarkdown('hello <script>alert(1)</script> world');
		expect(html.toLowerCase()).not.toContain('<script');
		expect(html).toContain('hello');
	});

	it('strips inline event handlers', () => {
		const html = renderMarkdown('<img src="x" onerror="alert(1)">');
		expect(html.toLowerCase()).not.toContain('onerror');
	});

	it('strips javascript: links', () => {
		const html = renderMarkdown('[click](javascript:alert(1))');
		expect(html.toLowerCase()).not.toContain('javascript:');
	});

	it('handles empty / nullish input', () => {
		expect(renderMarkdown('')).toBe('');
		// @ts-expect-error testing nullish
		expect(typeof renderMarkdown(undefined)).toBe('string');
	});
});
