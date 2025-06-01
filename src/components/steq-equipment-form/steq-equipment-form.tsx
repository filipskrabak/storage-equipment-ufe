import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { EquipmentItem } from '../../api/storage-equipment/models';
import { apiRequest, getApiConfig, ApiError } from '../../utils/api-config';

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

  validateForm(): boolean {
    const errors: Record<string, string> = {};
    const required = ['name', 'serialNumber', 'manufacturer', 'location'];

    // Required field validation
    required.forEach(field => {
      if (!this.formData[field] || this.formData[field].toString().trim() === '') {
        errors[field] = 'This field is required';
      }
    });

    console.log(this.formData.serviceInterval, this.formData.lifeExpectancy);

    if (this.formData.serviceInterval !== undefined && this.formData.serviceInterval !== null && this.formData.serviceInterval < 0) {
      errors.serviceInterval = 'Service interval cannot be negative';
    }

    if (this.formData.lifeExpectancy !== undefined && this.formData.lifeExpectancy !== null && this.formData.lifeExpectancy < 0) {
      errors.lifeExpectancy = 'Life expectancy cannot be negative';
    }

    // Name validation
    if (this.formData.name && this.formData.name.length < 3) {
      errors.name = 'Equipment name must be at least 3 characters long';
    }
    if (this.formData.name && this.formData.name.length > 100) {
      errors.name = 'Equipment name cannot exceed 100 characters';
    }

    // Serial number validation
    if (this.formData.serialNumber) {
      const serialRegex = /^[A-Z0-9\-_]+$/i;
      if (!serialRegex.test(this.formData.serialNumber)) {
        errors.serialNumber = 'Serial number can only contain letters, numbers, hyphens, and underscores';
      }
      if (this.formData.serialNumber.length < 3) {
        errors.serialNumber = 'Serial number must be at least 3 characters long';
      }
      if (this.formData.serialNumber.length > 50) {
        errors.serialNumber = 'Serial number cannot exceed 50 characters';
      }
    }

    // Manufacturer validation
    if (this.formData.manufacturer && this.formData.manufacturer.length < 2) {
      errors.manufacturer = 'Manufacturer name must be at least 2 characters long';
    }
    if (this.formData.manufacturer && this.formData.manufacturer.length > 50) {
      errors.manufacturer = 'Manufacturer name cannot exceed 50 characters';
    }

    // Model validation (optional but if provided, validate)
    if (this.formData.model && this.formData.model.length > 50) {
      errors.model = 'Model name cannot exceed 50 characters';
    }

    // Location validation
    if (this.formData.location && this.formData.location.length < 3) {
      errors.location = 'Location must be at least 3 characters long';
    }
    if (this.formData.location && this.formData.location.length > 100) {
      errors.location = 'Location cannot exceed 100 characters';
    }

    // Date validation
    if (this.formData.installationDate && !this.isValidDate(this.formData.installationDate)) {
      errors.installationDate = 'Please provide a valid installation date';
    }

    if (this.formData.lastService && !this.isValidDate(this.formData.lastService)) {
      errors.lastService = 'Please provide a valid last service date';
    }

    // Business logic date validation
    if (this.formData.installationDate && this.isValidDate(this.formData.installationDate)) {
      const installationDate = new Date(this.formData.installationDate);
      const today = new Date();
      const futureLimit = new Date();
      futureLimit.setFullYear(today.getFullYear() + 1); // Allow up to 1 year in the future

      // Installation date cannot be too far in the future
      if (installationDate > futureLimit) {
        errors.installationDate = 'Installation date cannot be more than 1 year in the future';
      }

      // Installation date cannot be too far in the past (50 years)
      const pastLimit = new Date();
      pastLimit.setFullYear(today.getFullYear() - 50);
      if (installationDate < pastLimit) {
        errors.installationDate = 'Installation date cannot be more than 50 years in the past';
      }
    }

    // Service interval validation
    if (this.formData.serviceInterval !== undefined && this.formData.serviceInterval !== null) {
      if (this.formData.serviceInterval <= 0) {
        errors.serviceInterval = 'Service interval must be a positive number';
      }
      if (this.formData.serviceInterval < 1) {
        errors.serviceInterval = 'Service interval must be at least 1 day';
      }
      if (this.formData.serviceInterval > 3650) { // 10 years max
        errors.serviceInterval = 'Service interval cannot exceed 10 years (3650 days)';
      }
      if (!Number.isInteger(this.formData.serviceInterval)) {
        errors.serviceInterval = 'Service interval must be a whole number of days';
      }
    }

    // Life expectancy validation
    if (this.formData.lifeExpectancy !== undefined && this.formData.lifeExpectancy !== null) {
      if (this.formData.lifeExpectancy <= 0) {
        errors.lifeExpectancy = 'Life expectancy must be a positive number';
      }
      if (this.formData.lifeExpectancy < 1) {
        errors.lifeExpectancy = 'Life expectancy must be at least 1 year';
      }
      if (this.formData.lifeExpectancy > 100) {
        errors.lifeExpectancy = 'Life expectancy cannot exceed 100 years';
      }
      if (!Number.isInteger(this.formData.lifeExpectancy)) {
        errors.lifeExpectancy = 'Life expectancy must be a whole number of years';
      }
    }

    // Notes validation (optional but if provided, validate length)
    if (this.formData.notes && this.formData.notes.length > 1000) {
      errors.notes = 'Notes cannot exceed 1000 characters';
    }

    // Cross-field validation: Service interval vs Life expectancy
    if (this.formData.serviceInterval && this.formData.lifeExpectancy) {
      const totalServiceDays = this.formData.lifeExpectancy * 365;
      if (this.formData.serviceInterval > totalServiceDays) {
        errors.serviceInterval = 'Service interval should not exceed the equipment life expectancy';
      }
    }

    this.validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    const isValidDate = date instanceof Date && !isNaN(date.getTime());

    // Additional check: ensure the date string matches the parsed date
    // This catches cases like "2023-02-30" which would be parsed as "2023-03-02"
    if (isValidDate) {
      const [year, month, day] = dateString.split('-').map(Number);
      return date.getFullYear() === year &&
             date.getMonth() === month - 1 &&
             date.getDate() === day;
    }

    return false;
  }

  handleInputChange = (field: string, value: string | number) => {
    // Special handling for numeric fields
    if (field === 'serviceInterval' || field === 'lifeExpectancy') {
      const numValue = typeof value === 'string' ? parseInt(value) : value;

      // Only update if it's a valid number or empty
      if (value === '' || value === null || !isNaN(numValue)) {
        this.formData = {
          ...this.formData,
          [field]: value === '' ? null : numValue
        };
      }
    } else {
      this.formData = {
        ...this.formData,
        [field]: value
      };
    }

    // Clear validation error for this field
    if (this.validationErrors[field]) {
      const newErrors = { ...this.validationErrors };
      delete newErrors[field];
      this.validationErrors = newErrors;
    }
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
      this.error = null;

      const config = getApiConfig();

      if (this.equipment) {
        // Update existing equipment
        const updatedEquipment = await apiRequest<EquipmentItem>(
          config.endpoints.equipmentById(this.equipment.id),
          {
            method: 'PUT',
            body: JSON.stringify(this.formData),
          }
        );

        this.equipmentUpdated.emit(updatedEquipment);
      } else {
        // Create new equipment
        const createdEquipment = await apiRequest<EquipmentItem>(
          config.endpoints.equipment,
          {
            method: 'POST',
            body: JSON.stringify(this.formData),
          }
        );

        this.equipmentCreated.emit(createdEquipment);
      }

    } catch (err) {
      console.error('Failed to save equipment:', err);
      if (err instanceof ApiError) {
        this.error = `Failed to save equipment: ${err.message}`;
      } else {
        this.error = 'Failed to save equipment';
      }
    } finally {
      this.loading = false;
    }
  }

  calculateNextServiceDate(): string {
    if (!this.formData.lastService || !this.formData.serviceInterval) {
      return '';
    }

    const lastServiceDate = new Date(this.formData.lastService);
    const nextServiceDate = new Date(lastServiceDate);
    nextServiceDate.setDate(lastServiceDate.getDate() + this.formData.serviceInterval);

    return this.formatDateForInput(nextServiceDate);
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
                  min="1"
                  max="3650"
                  step="1"
                  value={this.formData.serviceInterval?.toString() || ''}
                  error={!!this.validationErrors.serviceInterval}
                  error-text={this.validationErrors.serviceInterval || ''}
                  supporting-text="How often the equipment needs service (1-3650 days)"
                  onInput={(e: InputEvent) => {
                    const value = (e.target as HTMLInputElement).value;
                    this.handleInputChange('serviceInterval', value === '' ? null : parseInt(value));
                  }}
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
                  min="1"
                  max="100"
                  step="1"
                  value={this.formData.lifeExpectancy?.toString() || ''}
                  error={!!this.validationErrors.lifeExpectancy}
                  error-text={this.validationErrors.lifeExpectancy || ''}
                  supporting-text="Expected lifespan of the equipment (1-100 years)"
                  onInput={(e: InputEvent) => {
                    const value = (e.target as HTMLInputElement).value;
                    this.handleInputChange('lifeExpectancy', value === '' ? null : parseInt(value));
                  }}
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
              error={!!this.validationErrors.notes}
              error-text={this.validationErrors.notes || ''}
              supporting-text={`${(this.formData.notes || '').length}/1000 characters`}
              onInput={(e: InputEvent) =>
                this.handleInputChange('notes', (e.target as HTMLTextAreaElement).value)
              }
            >
              <md-icon slot="leading-icon">notes</md-icon>
            </md-outlined-text-field>

            {this.formData.lastService && this.formData.serviceInterval && (
              <div class="info-display">
                <md-icon>info</md-icon>
                <span>Next service due: {this.calculateNextServiceDate() || 'Unable to calculate'}</span>
              </div>
            )}

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
