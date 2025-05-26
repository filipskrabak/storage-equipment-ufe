import { newE2EPage } from '@stencil/core/testing';

describe('steq-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<steq-app></steq-app>');

    const element = await page.find('steq-app');
    expect(element).toHaveClass('hydrated');
  });
});
