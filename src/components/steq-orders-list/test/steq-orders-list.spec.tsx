import { newSpecPage } from '@stencil/core/testing';
import { SteqOrdersList } from '../steq-orders-list';

describe('steq-orders-list', () => {
  it('renders', async () => {
    const page = await newSpecPage({
      components: [SteqOrdersList],
      html: `<steq-orders-list></steq-orders-list>`,
    });
    expect(page.root).toEqualHtml(`
      <steq-orders-list>
        <mock:shadow-root>
          Steq
          <slot></slot>
        </mock:shadow-root>
      </steq-orders-list>
    `);
  });
});
