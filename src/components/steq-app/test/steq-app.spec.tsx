import { newSpecPage } from '@stencil/core/testing';
import { SteqApp } from '../steq-app';

describe('steq-app', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });
    expect(page.root).toEqualHtml(`
      <steq-app>
        <mock:shadow-root>
          <steq-orders-list></steq-orders-list>
        </mock:shadow-root>
      </steq-app>
    `);
  });
});
