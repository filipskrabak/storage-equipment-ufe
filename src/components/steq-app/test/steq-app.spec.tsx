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
          <div class="app-container">
            <header>
              <h1>Hospital Equipment Management</h1>
            </header>
            <main>
              <steq-equipment-list></steq-equipment-list>
            </main>
            <footer>
              <p>© ${new Date().getFullYear()} STEQ - Hospital Equipment Management System</p>
            </footer>
          </div>
        </mock:shadow-root>
      </steq-app>
    `);
  });

  it('renders detail view when equipmentId is set', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    // Simulate setting equipmentId
    page.rootInstance.equipmentId = 'test-id';
    page.rootInstance.currentView = 'detail';
    await page.waitForChanges();

    const detailComponent = page.root.shadowRoot.querySelector('steq-equipment-detail');
    expect(detailComponent).toBeTruthy();
    expect(detailComponent.getAttribute('equipmentId')).toBe('test-id');
  });

  it('updates API base URL when apiBase prop changes', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app api-base="http://test.com/api"></steq-app>`,
    });

    expect(page.rootInstance.apiBase).toBe('http://test.com/api');
  });
});
