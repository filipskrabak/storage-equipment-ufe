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

  parseCurrentUrl() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    if (path.includes('/orders')) {
    this.currentSection = 'orders';
      // Check if we're on a specific order
      if (path.match(/\/orders\/[^\/]+/) || params.has('orderID')) {
        this.currentView = 'detail';
        const pathParts = path.split('/orders/');
        this.orderId = pathParts[1] || params.get('orderID');
      } else {
        this.currentView = 'list';
        this.orderId = null;
      }
      
    this.equipmentId = null; // Clear equipment when in orders
    } 

    else if (path.includes('/equipment/') || params.has('equipmentId')) {
      this.currentSection = 'equipment';
      this.currentView = 'detail';
      const pathParts = path.split('/equipment/');
      this.equipmentId = pathParts[1] || params.get('equipmentId');
      this.orderId = null; // Clear order when in equipment
    } 
    else {
      this.currentSection = 'equipment';
      this.currentView = 'list';
      this.equipmentId = null;
      this.orderId = null;
    }
  }

  private getBasePath(): string {
    const currentPath = window.location.pathname;

    if (this.basePath && this.basePath !== "/") {
      return this.basePath;
    }

    // If we're already on an equipment detail page, extract the base
    if (currentPath.includes('/equipment/')) {
      return currentPath.split('/equipment/')[0];
    }
    if (currentPath.includes('/orders/')) {
    return currentPath.split('/orders/')[0];
    }
    
    if (currentPath === "/orders" || currentPath === "/equipment") {
      return "";
    }
    if (currentPath === "/" || currentPath === "") {
      return "";
    }

    // Otherwise, use the current path as base
    return currentPath;
  }

  //Changes URL based on section
  navigateToSection(section: string) {
  //Clicking nav buttons always goes to list
  this.currentSection = section;
  this.currentView = 'list';
  this.equipmentId = null;
  this.orderId = null;

  const basePath = this.getBasePath();
  const newUrl = section === 'orders' 
    ? (basePath ? `${basePath}/orders` : `/orders`)
    : (basePath || "/");

  if (window.navigation && window.navigation.navigate) {
    window.navigation.navigate(newUrl);
  } else {
    window.history.pushState({}, '', newUrl);
    }
  }

  @Listen('view-equipment')
  handleViewEquipment(event: CustomEvent) {
    this.equipmentId = event.detail.id;
    this.currentSection = 'equipment';
    this.currentView = "detail";

    const basePath = this.getBasePath();
    // Ensure we don't have double slashes
    const newUrl = basePath ? `${basePath}/equipment/${event.detail.id}` : `/equipment/${event.detail.id}`;

    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  @Listen('edit-equipment')
  handleEditEquipment(event: CustomEvent) {
    this.equipmentId = event.detail.id;
    this.currentSection = 'equipment';
    this.currentView = "detail";

    const basePath = this.getBasePath();
    // Ensure we don't have double slashes
    const newUrl = basePath ? `${basePath}/equipment/${event.detail.id}` : `/equipment/${event.detail.id}`;

    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  @Listen('back')
  handleBack() {
    this.currentView = "list";
    this.equipmentId = null;
    this.orderId = null;

    const basePath = this.getBasePath();

    const newUrl = this.currentSection === 'orders' 
    ? (basePath ? `${basePath}/orders` : `/orders`)
    : (basePath || "/");

    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  @Listen('view-order')
  handleViewOrder(event: CustomEvent) {
    this.orderId = event.detail.id;
    this.currentSection = 'orders';
    this.currentView = "detail";

    const basePath = this.getBasePath();
    const newUrl = basePath ? `${basePath}/orders/${event.detail.id}` : `/orders/${event.detail.id}`;

    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  @Listen('edit-order')
  handleEditOrder(event: CustomEvent) {
    this.orderId = event.detail.id;
    this.currentSection = 'orders';
    this.currentView = "detail";

    const basePath = this.getBasePath();
    const newUrl = basePath ? `${basePath}/orders/${event.detail.id}` : `/orders/${event.detail.id}`;

    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
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
