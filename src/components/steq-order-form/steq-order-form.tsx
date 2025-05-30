import { Component, Host, h, Prop, State, Event, EventEmitter } from '@stencil/core';
import { Order } from '../../api/storage-equipment';
import { apiRequest, getApiConfig, ApiError } from '../../utils/api-config';

interface OrderFormData {
  requestedBy?: string;
  requestorDepartment?: string;
  status?: 'pending' | 'delivered' | 'cancelled';
  notes?: string;
  items?: Array<{
    equipmentName: string;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
}

@Component({
  tag: 'steq-order-form',
  styleUrl: 'steq-order-form.css',
  shadow: true,
})
export class SteqOrderForm {
  @Prop() order?: Order;

  @State() formData: OrderFormData = {
    requestedBy: '',
    requestorDepartment: '',
    status: 'pending',
    notes: '',
    items: []
  };

  @State() loading: boolean = false;
  @State() error: string = null;
  @State() validationErrors: Record<string, string> = {};

  @Event() cancel: EventEmitter;
  @Event() orderCreated: EventEmitter<Order>;
  @Event() orderUpdated: EventEmitter<Order>;

  componentWillLoad() {
    if (this.order) {
      this.formData = {
        ...this.order,
        items: this.order.items || []
      };
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

  handleItemChange = (index: number, field: string, value: string | number) => {
    const updatedItems = [...this.formData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };

    // Recalculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      const item = updatedItems[index];
      item.totalPrice = (item.quantity || 0) * (item.unitPrice || 0);
    }

    this.formData = {
      ...this.formData,
      items: updatedItems
    };
  }

  addItem = () => {
    this.formData = {
      ...this.formData,
      items: [
        ...this.formData.items,
        {
          equipmentName: '',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0
        }
      ]
    };
  }

  removeItem = (index: number) => {
    this.formData = {
      ...this.formData,
      items: this.formData.items.filter((_, i) => i !== index)
    };
  }

  validateForm(): boolean {
    const errors: Record<string, string> = {};
    const required = ['requestedBy', 'requestorDepartment'];

    if(!this.formData['requestedBy']) {
      errors['requestedBy'] = 'This field is required';
    }

    // Validate items
    if (!this.formData.items || this.formData.items.length === 0) {
      errors.items = 'At least one item is required';
    } else {
      this.formData.items.forEach((item, index) => {
        if (!item.equipmentName) {
          errors[`item_${index}_name`] = 'Equipment name is required';
        }
        if (!item.quantity || item.quantity <= 0) {
          errors[`item_${index}_quantity`] = 'Valid quantity is required';
        }
        if (item.unitPrice < 0) {
          errors[`item_${index}_price`] = 'Price cannot be negative';
        }
      });
    }

    this.validationErrors = errors;
    return Object.keys(errors).length === 0;
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

      if (this.order) {
        // Update existing order
        const updatedOrder = await apiRequest<Order>(
          config.endpoints.orderById(this.order.id),
          {
            method: 'PATCH',
            body: JSON.stringify(this.formData),
          }
        );
        
        this.orderUpdated.emit(updatedOrder);
      } else {
        // Create new order
        const createdOrder = await apiRequest<Order>(
          config.endpoints.orders,
          {
            method: 'POST',
            body: JSON.stringify(this.formData),
          }
        );
        
        this.orderCreated.emit(createdOrder);
      }

    } catch (err) {
      console.error('Failed to save order:', err);
      if (err instanceof ApiError) {
        this.error = `Failed to save order: ${err.message}`;
      } else {
        this.error = 'Failed to save order';
      }
    } finally {
      this.loading = false;
    }
  }

  getTotalOrderValue(): number {
    return this.formData.items?.reduce((total, item) => total + (item.totalPrice || 0), 0) || 0;
  }

  render() {
    const isEditMode = !!this.order;

    return (
      <Host>
        <md-dialog open>
          <div slot="headline">
            <md-icon>
              {isEditMode ? 'edit' : 'add'}
            </md-icon>
            {isEditMode ? 'Edit Order' : 'Create New Order'}
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
                <h3>Order Information</h3>

                <md-outlined-text-field
                  label="Requested By"
                  required
                  value={this.formData.requestedBy || ''}
                  error={!!this.validationErrors.requestedBy}
                  error-text={this.validationErrors.requestedBy || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('requestedBy', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">person</md-icon>
                </md-outlined-text-field>

                <md-outlined-text-field
                  label="Department"
                  required
                  value={this.formData.requestorDepartment || ''}
                  error={!!this.validationErrors.requestorDepartment}
                  error-text={this.validationErrors.requestorDepartment || ''}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('requestorDepartment', (e.target as HTMLInputElement).value)
                  }
                >
                  <md-icon slot="leading-icon">business</md-icon>
                </md-outlined-text-field>

                <md-outlined-select
                  label="Status"
                  value={this.formData.status}
                  onInput={(e: InputEvent) =>
                    this.handleInputChange('status', (e.target as HTMLSelectElement).value)
                  }
                >
                  <md-icon slot="leading-icon">info</md-icon>
                  <md-select-option value="pending">
                    <div slot="headline">Pending</div>
                  </md-select-option>
                  <md-select-option value="delivered">
                    <div slot="headline">Delivered</div>
                  </md-select-option>
                  <md-select-option value="cancelled">
                    <div slot="headline">Cancelled</div>
                  </md-select-option>
                </md-outlined-select>
              </section>

              <section class="form-section">
                <div class="section-header">
                  <h3>Order Items</h3>
                  <md-outlined-button onClick={this.addItem} type="button">
                    <md-icon slot="icon">add</md-icon>
                    Add Item
                  </md-outlined-button>
                </div>

                {this.validationErrors.items && (
                  <div class="field-error">
                    <md-icon>error</md-icon>
                    <span>{this.validationErrors.items}</span>
                  </div>
                )}

                <div class="items-list">
                  {this.formData.items?.map((item, index) => (
                    <div class="item-card" key={index}>
                      <div class="item-header">
                        <h4>Item {index + 1}</h4>
                        <md-icon-button onClick={() => this.removeItem(index)}>
                          <md-icon>delete</md-icon>
                        </md-icon-button>
                      </div>

                      <div class="item-fields">
                        <md-outlined-text-field
                          label="Equipment Name"
                          required
                          value={item.equipmentName || ''}
                          error={!!this.validationErrors[`item_${index}_name`]}
                          error-text={this.validationErrors[`item_${index}_name`] || ''}
                          onInput={(e: InputEvent) =>
                            this.handleItemChange(index, 'equipmentName', (e.target as HTMLInputElement).value)
                          }
                        >
                          <md-icon slot="leading-icon">inventory_2</md-icon>
                        </md-outlined-text-field>

                        <md-outlined-text-field
                          label="Quantity"
                          type="number"
                          min="1"
                          required
                          value={item.quantity?.toString() || ''}
                          error={!!this.validationErrors[`item_${index}_quantity`]}
                          error-text={this.validationErrors[`item_${index}_quantity`] || ''}
                          onInput={(e: InputEvent) =>
                            this.handleItemChange(index, 'quantity', parseInt((e.target as HTMLInputElement).value) || 0)
                          }
                        >
                          <md-icon slot="leading-icon">numbers</md-icon>
                        </md-outlined-text-field>

                        <md-outlined-text-field
                          label="Unit Price ($)"
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice?.toString() || ''}
                          error={!!this.validationErrors[`item_${index}_price`]}
                          error-text={this.validationErrors[`item_${index}_price`] || ''}
                          onInput={(e: InputEvent) =>
                            this.handleItemChange(index, 'unitPrice', parseFloat((e.target as HTMLInputElement).value) || 0)
                          }
                        >
                          <md-icon slot="leading-icon">attach_money</md-icon>
                        </md-outlined-text-field>

                        <div class="total-price">
                          <span class="total-label">Total:</span>
                          <span class="total-value">${(item.totalPrice || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {(!this.formData.items || this.formData.items.length === 0) && (
                    <div class="no-items">
                      <md-icon>inventory</md-icon>
                      <p>No items added yet</p>
                      <p>Click "Add Item" to add new order item</p>
                    </div>
                  )}
                </div>

                {this.formData.items?.length > 0 && (
                  <div class="order-summary">
                    <md-divider></md-divider>
                    <div class="summary-row">
                      <span class="summary-label">Total Order Value:</span>
                      <span class="summary-value">${this.getTotalOrderValue().toFixed(2)}</span>
                    </div>
                  </div>
                )}
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
              {this.loading ? 'Saving...' : (isEditMode ? 'Update Order' : 'Create Order')}
            </md-filled-button>
          </div>
        </md-dialog>
      </Host>
    );
  }
}