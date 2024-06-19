import { fileURLToPath } from 'node:url';

import { $fetch, setup } from '@nuxt/test-utils/e2e';
import { describe, expect, it } from 'vitest';

describe('middleware', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('./fixtures/usingMiddleware', import.meta.url)),
  });

  it('renders the index page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/');
    expect(html).toContain('<div>Using middleware</div>');
    expect(html).toContain('This is only rendered on the server. Product: product 1');
  });

  it('does not have DB at about page', async () => {
    // Get response to a server-rendered page with `$fetch`.
    const html = await $fetch('/about');
    expect(html).toContain('<div>Using middleware</div>');
    expect(html).toContain('This is only rendered on the server. Product: No product for you!');
  });
});
