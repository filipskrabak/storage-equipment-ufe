import { newE2EPage } from '@stencil/core/testing';

describe('steq-orders-list', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<steq-orders-list></steq-orders-list>');

    const element = await page.find('steq-orders-list');
    expect(element).toHaveClass('hydrated');
  });
});
