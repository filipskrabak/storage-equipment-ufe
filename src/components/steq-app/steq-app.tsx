import { Component, Host, h, State, Prop, Listen, Watch } from '@stencil/core';
import { setApiBaseUrl } from '../../utils/api-config';

@Component({
  tag: 'steq-app',
  styleUrl: 'steq-app.css',
  shadow: true,
})
export class SteqApp {
  @Prop() basePath: string = "";
  @Prop() apiBase: string = "http://localhost:8080/api";
  @State() currentView: string = "list"; // list, detail, edit
  @State() currentSection: string = "equipment"; // equipment, orders
  @State() equipmentId: string = null;
  @State() orderId: string = null;

  componentWillLoad() {
    // Set the API base URL for all components
    this.updateApiBase();

    // Listen for navigation events
    if (window.navigation) {
      window.navigation.addEventListener('navigate', this.handleNavigate);
    }

    // Parse initial URL
    this.parseCurrentUrl();
  }

  @Watch('apiBase')
  updateApiBase() {
    if (this.apiBase) {
      setApiBaseUrl(this.apiBase);
    }
  }

  disconnectedCallback() {
    if (window.navigation) {
      window.navigation.removeEventListener('navigate', this.handleNavigate);
    }
  }

  handleNavigate = (event: any) => {
    this.parseCurrentUrl();
  }

  private getAppBasePath(): string {
    const currentPath = window.location.pathname;

    // If basePath prop is provided and not root, use it
    if (this.basePath && this.basePath !== "/") {
      return this.basePath.replace(/\/$/, ''); // Remove trailing slash
    }

    // For Polyfea context, detect the base from current path
    if (currentPath.includes('/fea/steq-storage-equipment')) {
      return '/fea/steq-storage-equipment';
    }

    // Extract base path if we're in equipment or orders section
    const equipmentMatch = currentPath.match(/^(.*)\/equipment(?:\/.*)?$/);
    if (equipmentMatch) {
      return equipmentMatch[1] || '';
    }

    const ordersMatch = currentPath.match(/^(.*)\/orders(?:\/.*)?$/);
    if (ordersMatch) {
      return ordersMatch[1] || '';
    }

    // For development mode (localhost:3333)
    if (currentPath === "/" || currentPath === "") {
      return "";
    }

    return currentPath;
  }

  private buildUrl(section: 'equipment' | 'orders', id?: string): string {
    const basePath = this.getAppBasePath();

    if (section === 'equipment') {
      if (id) {
        return basePath ? `${basePath}/equipment/${id}` : `/equipment/${id}`;
      } else {
        return basePath || '/';
      }
    } else { // orders
      if (id) {
        return basePath ? `${basePath}/orders/${id}` : `/orders/${id}`;
      } else {
        return basePath ? `${basePath}/orders` : `/orders`;
      }
    }
  }

  parseCurrentUrl() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Reset state
    this.equipmentId = null;
    this.orderId = null;

    // Check for orders
    const ordersMatch = path.match(/\/orders(?:\/([^\/]+))?/);
    if (ordersMatch) {
      this.currentSection = 'orders';
      if (ordersMatch[1] || params.has('orderID')) {
        this.currentView = 'detail';
        this.orderId = ordersMatch[1] || params.get('orderID');
      } else {
        this.currentView = 'list';
      }
      return;
    }

    // Check for equipment
    const equipmentMatch = path.match(/\/equipment\/([^\/]+)/);
    if (equipmentMatch || params.has('equipmentId')) {
      this.currentSection = 'equipment';
      this.currentView = 'detail';
      this.equipmentId = equipmentMatch ? equipmentMatch[1] : params.get('equipmentId');
      return;
    }

    // Default to equipment list
    this.currentSection = 'equipment';
    this.currentView = 'list';
  }

  private navigate(url: string) {
    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(url);
    } else {
      window.history.pushState({}, '', url);
    }
  }

  navigateToSection(section: 'equipment' | 'orders') {
    this.currentSection = section;
    this.currentView = 'list';
    this.equipmentId = null;
    this.orderId = null;

    const url = this.buildUrl(section);
    this.navigate(url);
  }

  @Listen('view-equipment')
  handleViewEquipment(event: CustomEvent) {
    this.currentSection = 'equipment';
    this.currentView = "detail";
    this.equipmentId = event.detail.id;
    this.orderId = null;

    const url = this.buildUrl('equipment', event.detail.id);
    this.navigate(url);
  }

  @Listen('edit-equipment')
  handleEditEquipment(event: CustomEvent) {
    this.currentSection = 'equipment';
    this.currentView = "detail";
    this.equipmentId = event.detail.id;
    this.orderId = null;

    const url = this.buildUrl('equipment', event.detail.id);
    this.navigate(url);
  }

  @Listen('view-order')
  handleViewOrder(event: CustomEvent) {
    this.currentSection = 'orders';
    this.currentView = "detail";
    this.orderId = event.detail.id;
    this.equipmentId = null;

    const url = this.buildUrl('orders', event.detail.id);
    this.navigate(url);
  }

  @Listen('edit-order')
  handleEditOrder(event: CustomEvent) {
    this.currentSection = 'orders';
    this.currentView = "detail";
    this.orderId = event.detail.id;
    this.equipmentId = null;

    const url = this.buildUrl('orders', event.detail.id);
    this.navigate(url);
  }

  @Listen('back')
  handleBack() {
    this.currentView = "list";
    this.equipmentId = null;
    this.orderId = null;

    const url = this.buildUrl(this.currentSection as 'equipment' | 'orders');
    this.navigate(url);
  }

  render() {
    return (
      <Host>
        <div class="app-container">
          <header>
            <h1>Hospital Equipment Management</h1>
            <nav class="section-nav">
              <button
                class={this.currentSection === 'equipment' ? 'active' : ''}
                onClick={() => this.navigateToSection('equipment')}
              >
                Equipment
              </button>
              <button
                class={this.currentSection === 'orders' ? 'active' : ''}
                onClick={() => this.navigateToSection('orders')}
              >
                Orders
              </button>
            </nav>
          </header>

          <main>
            {this.currentSection === 'equipment' && this.currentView === "list" && (
              <steq-equipment-list></steq-equipment-list>
            )}

            {this.currentSection === 'equipment' && this.currentView === "detail" && this.equipmentId && (
              <steq-equipment-detail
                equipmentId={this.equipmentId}
              ></steq-equipment-detail>
            )}

            {this.currentSection === 'orders' && this.currentView === "list" && (
              <steq-order-list></steq-order-list>
            )}

            {this.currentSection === 'orders' && this.currentView === "detail" && this.orderId && (
              <steq-order-detail
                orderId={this.orderId}
              ></steq-order-detail>
            )}
          </main>

          <footer>
            <p>© {new Date().getFullYear()} STEQ - Hospital Equipment Management System</p>
          </footer>
        </div>
      </Host>
    );
  }
}
