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
  @State() equipmentId: string = null;

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

    if (path.includes('/equipment/') || params.has('equipmentId')) {
      this.currentView = 'detail';
      this.equipmentId = path.split('/equipment/')[1] || params.get('equipmentId');
    } else {
      this.currentView = 'list';
      this.equipmentId = null;
    }
  }

  @Listen('view-equipment')
  handleViewEquipment(event: CustomEvent) {
    this.equipmentId = event.detail.id;
    this.currentView = "detail";

    // Update URL
    const newUrl = `${this.basePath}equipment/${event.detail.id}`;
    if (window.navigation && window.navigation.navigate) {
      window.navigation.navigate(newUrl);
    } else {
      window.history.pushState({}, '', newUrl);
    }
  }

  @Listen('edit-equipment')
  handleEditEquipment(event: CustomEvent) {
    this.equipmentId = event.detail.id;
    this.currentView = "detail";

    // Update URL
    const newUrl = `${this.basePath}equipment/${event.detail.id}`;
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

    // Update URL
    const newUrl = this.basePath || '/';
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
          </header>

          <main>
            {this.currentView === "list" && (
              <steq-equipment-list></steq-equipment-list>
            )}

            {this.currentView === "detail" && this.equipmentId && (
              <steq-equipment-detail
                equipmentId={this.equipmentId}
              ></steq-equipment-detail>
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
