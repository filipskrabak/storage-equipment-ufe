import { Component, Host, h, Prop, State, Event, EventEmitter, Element } from '@stencil/core';
import { EquipmentItem } from '../../api/storage-equipment/models';

@Component({
  tag: 'steq-equipment-detail',
  styleUrl: 'steq-equipment-detail.css',
  shadow: true,
})
export class SteqEquipmentDetail {
  @Element() el: HTMLElement;
  @Prop() equipmentId: string;
  @State() equipment: EquipmentItem;
  @State() loading: boolean = true;
  @State() error: string = null;
  @State() showEditMode: boolean = false;

  @Event() back: EventEmitter;

  componentWillLoad() {
    if (this.equipmentId) {
      this.loadEquipment();
    }
  }

  async loadEquipment() {
    try {
      this.loading = true;
      const response = await fetch(`http://localhost:5000/api/equipment/${this.equipmentId}`);

      if (!response.ok) {
        throw new Error(`Failed to load equipment details: ${response.statusText}`);
      }

      this.equipment = await response.json();
      this.error = null;
    } catch (err) {
      this.error = err.message || 'Failed to load equipment details';
      console.error(this.error);
    } finally {
      this.loading = false;
    }
  }

  formatDate(dateValue: string | Date): string {
    if (!dateValue) return 'Not specified';

    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch (e) {
      console.error('Error formatting date:', e);
      return typeof dateValue === 'string' ? dateValue : dateValue.toString();
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

  getStatusColor(status: string): string {
    switch(status) {
      case 'operational': return 'success';
      case 'in_repair': return 'warning';
      case 'faulty': return 'error';
      case 'decommissioned': return 'disabled';
      default: return 'default';
    }
  }

  handleBack = () => {
    this.back.emit();
  }

  toggleEditMode = () => {
    this.showEditMode = !this.showEditMode;
  }

  handleUpdateComplete = (event: CustomEvent) => {
    this.equipment = event.detail;
    this.showEditMode = false;
  }

  render() {
    if (this.loading) {
      return (
        <Host>
          <div class="loading-container">
            <md-circular-progress indeterminate></md-circular-progress>
            <p>Loading equipment details...</p>
          </div>
        </Host>
      );
    }

    if (this.error) {
      return (
        <Host>
          <div class="error-container">
            <md-icon>error</md-icon>
            <h3>Failed to load equipment</h3>
            <p>{this.error}</p>
            <md-outlined-button onClick={this.handleBack}>
              <md-icon slot="icon">arrow_back</md-icon>
              Back to List
            </md-outlined-button>
          </div>
        </Host>
      );
    }

    if (!this.equipment) {
      return (
        <Host>
          <div class="not-found-container">
            <md-icon>search_off</md-icon>
            <h3>Equipment not found</h3>
            <p>The requested equipment could not be found</p>
            <md-outlined-button onClick={this.handleBack}>
              <md-icon slot="icon">arrow_back</md-icon>
              Back to List
            </md-outlined-button>
          </div>
        </Host>
      );
    }

    if (this.showEditMode) {
      return (
        <Host>
          <steq-equipment-form
            equipment={this.equipment}
            onCancel={this.toggleEditMode}
            onEquipmentUpdated={this.handleUpdateComplete}
          />
        </Host>
      );
    }

    return (
      <Host>
        <div class="equipment-detail">
          <header class="detail-header">
            <md-outlined-button onClick={this.handleBack}>
              <md-icon slot="icon">arrow_back</md-icon>
              Back to List
            </md-outlined-button>

            <div class="header-content">
              <div class="equipment-title">
                <h1>{this.equipment.name}</h1>
                <md-assist-chip
                  class={`status-chip status-${this.getStatusColor(this.equipment.status)}`}
                  label={this.equipment.status?.replace('_', ' ') || 'Unknown'}
                >
                  <md-icon slot="icon">{this.getStatusIcon(this.equipment.status)}</md-icon>
                </md-assist-chip>
              </div>
            </div>

            <md-filled-button onClick={this.toggleEditMode}>
              <md-icon slot="icon">edit</md-icon>
              Edit Equipment
            </md-filled-button>
          </header>

          <div class="detail-content">
            <div class="info-card">
              <div class="card-content">
                <div class="card-header">
                  <md-icon>info</md-icon>
                  <h2>Basic Information</h2>
                </div>

                <md-divider></md-divider>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>inventory_2</md-icon>
                      Name
                    </div>
                    <div class="info-value">{this.equipment.name}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>tag</md-icon>
                      Serial Number
                    </div>
                    <div class="info-value">{this.equipment.serialNumber}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>business</md-icon>
                      Manufacturer
                    </div>
                    <div class="info-value">{this.equipment.manufacturer}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>category</md-icon>
                      Model
                    </div>
                    <div class="info-value">{this.equipment.model || 'Not specified'}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>location_on</md-icon>
                      Location
                    </div>
                    <div class="info-value">{this.equipment.location}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="info-card">
              <div class="card-content">
                <div class="card-header">
                  <md-icon>build</md-icon>
                  <h2>Service Information</h2>
                </div>

                <md-divider></md-divider>

                <div class="info-grid">
                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>event</md-icon>
                      Installation Date
                    </div>
                    <div class="info-value">{this.formatDate(this.equipment.installationDate)}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>schedule</md-icon>
                      Service Interval
                    </div>
                    <div class="info-value">
                      {this.equipment.serviceInterval ? `${this.equipment.serviceInterval} days` : 'Not specified'}
                    </div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>history</md-icon>
                      Last Service
                    </div>
                    <div class="info-value">{this.formatDate(this.equipment.lastService)}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>schedule_send</md-icon>
                      Next Service
                    </div>
                    <div class="info-value">{this.formatDate(this.equipment.nextService)}</div>
                  </div>

                  <div class="info-item">
                    <div class="info-label">
                      <md-icon>timeline</md-icon>
                      Life Expectancy
                    </div>
                    <div class="info-value">
                      {this.equipment.lifeExpectancy ? `${this.equipment.lifeExpectancy} years` : 'Not specified'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {this.equipment.notes && (
              <div class="info-card notes-card">
                <div class="card-content">
                  <div class="card-header">
                    <md-icon>notes</md-icon>
                    <h2>Notes</h2>
                  </div>

                  <md-divider></md-divider>

                  <div class="notes-content">
                    {this.equipment.notes}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
