import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { EquipmentItem } from '../../api/storage-equipment/models';

// Import Material Design components
import '@material/web/button/filled-button';
import '@material/web/button/text-button';
import '@material/web/textfield/outlined-text-field';
import '@material/web/select/outlined-select';
import '@material/web/select/select-option';
import '@material/web/dialog/dialog';
import '@material/web/icon/icon';
import '@material/web/progress/circular-progress';

interface EquipmentFormData {
  name?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  installationDate?: string;
  location?: string;
  serviceInterval?: number;
  lastService?: string;
  lifeExpectancy?: number;
  status?: 'operational' | 'in_repair' | 'faulty' | 'decommissioned';
  notes?: string;
}

@Component({
  tag: 'steq-equipment-form',
  styleUrl: 'steq-equipment-form.css',
  shadow: true,
})
export class SteqEquipmentForm {
  @Prop() equipment?: EquipmentItem;

  @State() formData: EquipmentFormData = {
    name: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    installationDate: this.getCurrentDate(),
    location: '',
    serviceInterval: 90,
    lastService: this.getCurrentDate(),
    lifeExpectancy: 10,
    status: 'operational',
    notes: ''
  };

  @State() loading: boolean = false;
  @State() error: string = null;
  @State() validationErrors: Record<string, string> = {};

  @Event() cancel: EventEmitter;
  @Event() equipmentCreated: EventEmitter<EquipmentItem>;
  @Event() equipmentUpdated: EventEmitter<EquipmentItem>;

  componentWillLoad() {
    if (this.equipment) {
      this.formData = {
        ...this.equipment,
        installationDate: this.formatDateForInput(this.equipment.installationDate),
        lastService: this.formatDateForInput(this.equipment.lastService),
      };
    }
  }

  getCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  formatDateForInput(dateValue: string | Date): string {
    if (!dateValue) return '';

    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date for input:', e);
      return '';
    }
  }

  handleInputChange = (field: string, value: string | number) => {
    this.formData = {
      ...this.formData,
      [field]: value
    };

    if (this.validationErrors[field]) {
      const newErrors = { ...this.validationErrors };
      delete newErrors[field];
      this.validationErrors = newErrors;
    }
  }

  validateForm(): boolean {
    const errors: Record<string, string> = {};
    const required = ['name', 'serialNumber', 'manufacturer', 'location'];

    required.forEach(field => {
      if (!this.formData[field]) {
        errors[field] = 'This field is required';
      }
    });

    if (this.formData.installationDate && !this.isValidDate(this.formData.installationDate)) {
      errors.installationDate = 'Please provide a valid date';
    }

    if (this.formData.lastService && !this.isValidDate(this.formData.lastService)) {
      errors.lastService = 'Please provide a valid date';
    }

    this.validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  handleCancel = () => {
    this.cancel.emit();
  }

  handleSubmit = async () => {
    if (!this.validateForm()) {
      return;
    }

    try {
      this.loading = true;

      if (this.equipment) {
        const response = await fetch(`http://localhost:5000/api/equipment/${this.equipment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.formData),
        });

        if (!response.ok) {
          throw new Error(`Failed to update equipment: ${response.statusText}`);
        }

        const updatedEquipment = await response.json();
        this.equipmentUpdated.emit(updatedEquipment);
      } else {
        const response = await fetch('http://localhost:5000/api/equipment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(this.formData),
        });

        if (!response.ok) {
          throw new Error(`Failed to create equipment: ${response.statusText}`);
        }

        const createdEquipment = await response.json();
        this.equipmentCreated.emit(createdEquipment);
      }

      this.error = null;
    } catch (err) {
      this.error = err.message || 'Failed to save equipment';
      console.error(this.error);
    } finally {
      this.loading = false;
    }
  }

  render() {
    const isEditMode = !!this.equipment;

    return (
      <Host>
        <md-dialog open>
          <div slot="headline">
            <md-icon>
              {isEditMode ? 'edit' : 'add'}
            </md-icon>
            {isEditMode ? 'Edit Equipment' : 'Add New Equipment'}
          </div>

          <form slot="content" class="form-content">
            {this.error && (
              <div class="error-banner">
                <md-icon>error</md-icon>
                <span>{this.error}</span>
              </div>
            )}

            <div class="form-sections">
              <section class="form-section">
                <h3>Basic Information</h3>

                <md-outlined-text-field
                  label="Name"
                  required
                  value={this.formData.name || ''}
                  error={!!this.validationErrors.name}
                  error-text={this.validationErrors.name || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('name', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">inventory_2</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Serial Number"
                  required
                  value={this.formData.serialNumber || ''}
                  error={!!this.validationErrors.serialNumber}
                  error-text={this.validationErrors.serialNumber || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('serialNumber', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">tag</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Manufacturer"
                  required
                  value={this.formData.manufacturer || ''}
                  error={!!this.validationErrors.manufacturer}
                  error-text={this.validationErrors.manufacturer || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('manufacturer', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">business</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Model"
                  value={this.formData.model || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('model', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">category</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Location"
                  required
                  value={this.formData.location || ''}
                  error={!!this.validationErrors.location}
                  error-text={this.validationErrors.location || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('location', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">location_on</md-icon>
                </md-outlined-text-field>
              </section>

              <section class="form-section">
                <h3>Service Information</h3>

                <md-outlined-text-field
                  label="Installation Date"
                  type="date"
                  value={this.formData.installationDate || ''}
                  error={!!this.validationErrors.installationDate}
                  error-text={this.validationErrors.installationDate || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('installationDate', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">event</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Service Interval (days)"
                  type="number"
                  min="0"
                  value={this.formData.serviceInterval?.toString() || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('serviceInterval', parseInt((e.target as HTMLInputElement).value) || 0)
                  }
                >
                  <md-icon slot="leading-icon">schedule</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Last Service Date"
                  type="date"
                  value={this.formData.lastService || ''}
                  error={!!this.validationErrors.lastService}
                  error-text={this.validationErrors.lastService || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('lastService', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">build</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Life Expectancy (years)"
                  type="number"
                  min="0"
                  value={this.formData.lifeExpectancy?.toString() || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('lifeExpectancy', parseInt((e.target as HTMLInputElement).value) || 0)
                  }
                >
                  <md-icon slot="leading-icon">timeline</md-icon>
                </md-outlined-text-field>

                <md-outlined-select
                  label="Status"
                  value={this.formData.status}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('status', (e.target as HTMLSelectElement).value)
                  }
                >
                  <md-icon slot="leading-icon">info</md-icon>
                  <md-select-option value="operational">
                    <div slot="headline">Operational</div>
                  </md-select-option>
                  <md-select-option value="in_repair">
                    <div slot="headline">In Repair</div>
                  </md-select-option>
                  <md-select-option value="faulty">
                    <div slot="headline">Faulty</div>
                  </md-select-option>
                  <md-select-option value="decommissioned">
                    <div slot="headline">Decommissioned</div>
                  </md-select-option>
                </md-outlined-select>
              </section>
            </div>

            <md-outlined-text-field
              label="Notes"
              type="textarea"
              rows={4}
              value={this.formData.notes || ''}
              onInput={(e: InputEvent) =>
                this.handleInputChange('notes', (e.target as HTMLTextAreaElement).value)
              }
            >
              <md-icon slot="leading-icon">notes</md-icon>
            </md-outlined-text-field>

            <p class="required-note">* Required fields</p>
          </form>

          <div slot="actions">
            <md-text-button onClick={this.handleCancel}>
              Cancel
            </md-text-button>

            <md-filled-button
              onClick={this.handleSubmit}
              disabled={this.loading}
            >
              {this.loading && <md-circular-progress indeterminate slot="icon"></md-circular-progress>}
              {!this.loading && <md-icon slot="icon">{isEditMode ? 'save' : 'add'}</md-icon>}
              {this.loading ? 'Saving...' : (isEditMode ? 'Update Equipment' : 'Create Equipment')}
            </md-filled-button>
          </div>
        </md-dialog>
      </Host>
    );
  }
}
