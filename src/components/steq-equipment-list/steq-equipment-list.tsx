import { Component, Host, h, State, Element } from '@stencil/core';
import { EquipmentItem } from '../../api/storage-equipment/models';

// Import Material Design components
import '@material/web/button/filled-button';
import '@material/web/button/text-button';
import '@material/web/button/outlined-button';
import '@material/web/list/list';
import '@material/web/list/list-item';
import '@material/web/icon/icon';
import '@material/web/chips/chip-set';
import '@material/web/chips/filter-chip';
import '@material/web/progress/linear-progress';
import '@material/web/dialog/dialog';

@Component({
  tag: 'steq-equipment-list',
  styleUrl: 'steq-equipment-list.css',
  shadow: true,
})
export class SteqEquipmentList {
  @Element() el: HTMLElement;
  @State() equipment: EquipmentItem[] = [];
  @State() loading: boolean = true;
  @State() error: string = null;
  @State() showCreateDialog: boolean = false;

  componentWillLoad() {
    this.loadEquipment();
  }

  async loadEquipment() {
    try {
      this.loading = true;
      const response = await fetch('http://localhost:5000/api/equipment');

      if (!response.ok) {
        throw new Error(`Failed to load equipment: ${response.statusText}`);
      }

      this.equipment = await response.json();
      this.error = null;
    } catch (err) {
      this.error = err.message || 'Failed to load equipment';
      console.error(this.error);
    } finally {
      this.loading = false;
    }
  }

  async deleteEquipment(id: string) {
    if (!confirm('Are you sure you want to delete this equipment?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/equipment/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete equipment: ${response.statusText}`);
      }

      this.equipment = this.equipment.filter(item => item.id !== id);
    } catch (err) {
      this.error = err.message || 'Failed to delete equipment';
      console.error(this.error);
    }
  }

  getStatusChipType(status: string): string {
    switch(status) {
      case 'operational': return 'operational';
      case 'in_repair': return 'warning';
      case 'faulty': return 'error';
      case 'decommissioned': return 'disabled';
      default: return 'default';
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'operational': return 'check_circle';
      case 'in_repair': return 'build';
      case 'faulty': return 'error';
      case 'decommissioned': return 'archive';
      default: return 'help';
    }
  }

  toggleCreateDialog() {
    this.showCreateDialog = !this.showCreateDialog;
  }

  handleEquipmentCreated(event: CustomEvent) {
    this.equipment = [...this.equipment, event.detail];
    this.showCreateDialog = false;
  }

  renderEquipmentList() {
    if (this.equipment.length === 0) {
      return (
        <div class="empty-state">
          <md-icon class="empty-big-icon">inventory_2</md-icon>
          <h3>No equipment found</h3>
          <p>Start by adding your first equipment</p>
          <md-filled-button onClick={() => this.toggleCreateDialog()}>
            <md-icon slot="icon">add</md-icon>
            Add Equipment
          </md-filled-button>
        </div>
      );
    }

    return (
      <md-list>
        {this.equipment.map(item => (
          <md-list-item key={item.id} class="equipment-item">
            <div slot="start" class="equipment-icon">
              <md-icon>{this.getStatusIcon(item.status)}</md-icon>
            </div>

            <div slot="headline">{item.name}</div>
            <div slot="supporting-text">
              {item.manufacturer} {item.model || ''} • {item.location}
            </div>

            <div slot="trailing-supporting-text">
              Next service: {item.nextService || 'Not scheduled'}
            </div>

            <div slot="end" class="equipment-actions">
              <md-filter-chip
                class={`status-chip status-${this.getStatusChipType(item.status)}`}
                label={item.status?.replace('_', ' ') || 'Unknown'}
              >
                <md-icon slot="icon">{this.getStatusIcon(item.status)}</md-icon>
              </md-filter-chip>

              <div class="action-buttons">
                <md-text-button onClick={() => this.viewEquipment(item.id)}>
                  <md-icon slot="icon">visibility</md-icon>
                  View
                </md-text-button>

                <md-outlined-button onClick={() => this.editEquipment(item.id)}>
                  <md-icon slot="icon">edit</md-icon>
                  Edit
                </md-outlined-button>

                <md-text-button
                  class="delete-button"
                  onClick={() => this.deleteEquipment(item.id)}
                >
                  <md-icon slot="icon">delete</md-icon>
                  Delete
                </md-text-button>
              </div>
            </div>
          </md-list-item>
        ))}
      </md-list>
    );
  }

  viewEquipment(id: string) {
    const event = new CustomEvent('view-equipment', {
      detail: { id },
      bubbles: true,
      composed: true
    });
    this.el.dispatchEvent(event);
  }

  editEquipment(id: string) {
    const event = new CustomEvent('edit-equipment', {
      detail: { id },
      bubbles: true,
      composed: true
    });
    this.el.dispatchEvent(event);
  }

  render() {
    return (
      <Host>
        <div class="equipment-container">
          <header class="page-header">
            <div class="header-content">
              <div class="header-text">
                <h1>Hospital Equipment Management</h1>
                <p>Manage your hospital's medical equipment inventory</p>
              </div>

              <md-filled-button onClick={() => this.toggleCreateDialog()}>
                <md-icon slot="icon">add</md-icon>
                Add New Equipment
              </md-filled-button>
            </div>
          </header>

          {this.error && (
            <div class="error-banner">
              <md-icon>error</md-icon>
              <span>{this.error}</span>
            </div>
          )}

          {this.loading && (
            <div class="loading-container">
              <md-linear-progress indeterminate></md-linear-progress>
              <p>Loading equipment data...</p>
            </div>
          )}

          {!this.loading && this.renderEquipmentList()}

          {this.showCreateDialog && (
            <steq-equipment-form
              onCancel={() => this.toggleCreateDialog()}
              onEquipmentCreated={(e) => this.handleEquipmentCreated(e)}
            />
          )}
        </div>
      </Host>
    );
  }
}
