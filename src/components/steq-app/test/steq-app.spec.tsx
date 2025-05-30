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
              <nav class="section-nav">
                <button class="active">
                  Equipment
                </button>
                <button class="">
                  Orders
                </button>
              </nav>
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
    page.rootInstance.currentSection = 'equipment';
    await page.waitForChanges();

    const detailComponent = page.root.shadowRoot.querySelector('steq-equipment-detail');
    expect(detailComponent).toBeTruthy();
    expect(detailComponent.getAttribute('equipmentid')).toBe('test-id'); // Note: Stencil converts camelCase to lowercase
  });

  it('renders orders list when section is orders', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    // Switch to orders section
    page.rootInstance.currentSection = 'orders';
    page.rootInstance.currentView = 'list';
    await page.waitForChanges();

    const ordersList = page.root.shadowRoot.querySelector('steq-order-list');
    expect(ordersList).toBeTruthy();

    const equipmentList = page.root.shadowRoot.querySelector('steq-equipment-list');
    expect(equipmentList).toBeFalsy();
  });

  it('renders order detail when orderId is set', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    // Set order detail view
    page.rootInstance.orderId = 'order-123';
    page.rootInstance.currentSection = 'orders';
    page.rootInstance.currentView = 'detail';
    await page.waitForChanges();

    const orderDetail = page.root.shadowRoot.querySelector('steq-order-detail');
    expect(orderDetail).toBeTruthy();
    expect(orderDetail.getAttribute('orderid')).toBe('order-123');
  });

  it('updates API base URL when apiBase prop changes', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app api-base="http://test.com/api"></steq-app>`,
    });

    expect(page.rootInstance.apiBase).toBe('http://test.com/api');
  });

  it('shows active class on current section button', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    // Equipment should be active by default
    const equipmentButton = page.root.shadowRoot.querySelector('nav button:first-child');
    const ordersButton = page.root.shadowRoot.querySelector('nav button:last-child');

    expect(equipmentButton.className).toBe('active');
    expect(ordersButton.className).toBe('');

    // Switch to orders
    page.rootInstance.currentSection = 'orders';
    await page.waitForChanges();

    expect(equipmentButton.className).toBe('');
    expect(ordersButton.className).toBe('active');
  });

  it('defaults to equipment section and list view', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    expect(page.rootInstance.currentSection).toBe('equipment');
    expect(page.rootInstance.currentView).toBe('list');
    expect(page.rootInstance.equipmentId).toBeNull();
    expect(page.rootInstance.orderId).toBeNull();
  });

  it('has default API base URL', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    expect(page.rootInstance.apiBase).toBe('http://localhost:8080/api');
  });

  it('has empty basePath by default', async () => {
    const page = await newSpecPage({
      components: [SteqApp],
      html: `<steq-app></steq-app>`,
    });

    expect(page.rootInstance.basePath).toBe('');
  });
});
