import { Component, Host, h, Prop, State, Element, Event, EventEmitter} from '@stencil/core';
import { Order } from '../../api/storage-equipment';
import { getApiConfig, apiRequest, ApiError } from '../../utils/api-config';

@Component({
  tag: 'steq-order-detail',
  styleUrl: 'steq-order-detail.css',
  shadow: true,
})
export class SteqOrderDetail {
  @Element() el: HTMLElement;
  @Prop() orderId: string;
  @State() order: Order = null;
  @State() loading: boolean = true;
  @State() error: string = null;
  @State() showEditMode: boolean = false;

  @Event() back: EventEmitter;

  componentWillLoad() {
    if (this.orderId) {
      this.loadOrder();
    }
  }

  async loadOrder() {
    try {
      this.loading = true;
      this.error = null;
      const config = getApiConfig();
      this.order = await apiRequest<Order>(config.endpoints.orderById(this.orderId));
    } catch (err) {
      console.error('Failed to load order details:', err);
      if (err instanceof ApiError) {
        this.error = `Failed to load order details: ${err.message}`;
      } else {
        this.error = 'Failed to load order details';
      }
    } finally {
        this.loading = false;
    }
  }

  handleBack = () => {
    this.back.emit();
  }

  toggleEditMode = () => {
    this.showEditMode = !this.showEditMode;
  }

  handleUpdateComplete = (event: CustomEvent) => {
    this.order = event.detail;
    this.showEditMode = false;
  }

  formatDate(dateValue: string | Date): string {
    if (!dateValue) return 'Not specified';

    try {
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return typeof dateValue === 'string' ? dateValue : dateValue.toString();
    }
  }

  getStatusIcon(status: string): string {
    switch(status) {
      case 'pending': return 'schedule';
      case 'delivered': return 'inventory';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }

  getStatusColor(status: string): string {
    switch(status) {
      case 'pending': return 'warning';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  }

  getTotalPrice(): number {
    if (!this.order?.items) return 0;
    return this.order.items.reduce((total, item) => total + (item.totalPrice || 0), 0);
  }

  render() {
  if (this.loading) {
    return (
      <Host>
        <div class="loading-container">
          <md-circular-progress indeterminate></md-circular-progress>
          <p>Loading order details...</p>
        </div>
      </Host>
    );
  }

  if (this.error) {
    return (
      <Host>
        <div class="error-container">
          <md-icon>error</md-icon>
          <h3>Failed to load order</h3>
          <p>{this.error}</p>
          <div class="error-actions">
            <md-outlined-button onClick={() => this.loadOrder()}>
              <md-icon slot="icon">refresh</md-icon>
              Retry
            </md-outlined-button>
            <md-outlined-button onClick={this.handleBack}>
              <md-icon slot="icon">arrow_back</md-icon>
              Back to List
            </md-outlined-button>
          </div>
        </div>
      </Host>
    );
  }

  if (!this.order) {
    return (
      <Host>
        <div class="not-found-container">
          <md-icon>search_off</md-icon>
          <h3>Order not found</h3>
          <p>The requested order could not be found</p>
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
        <steq-order-form
          order={this.order}
          onCancel={this.toggleEditMode}
          onOrderUpdated={this.handleUpdateComplete}
        />
      </Host>
    );
  }

  return (
    <Host>
      <div class="order-detail">
        <header class="detail-header">
          <md-outlined-button onClick={this.handleBack}>
            <md-icon slot="icon">arrow_back</md-icon>
            Back to List
          </md-outlined-button>

          <div class="header-content">
            <div class="order-title">
              <h1>Order #{this.order.id?.substring(0, 8) || 'Unknown'}</h1>
              <md-assist-chip
                class={`status-chip status-${this.getStatusColor(this.order.status)}`}
                label={this.order.status?.replace('_', ' ') || 'Unknown'}
              >
                <md-icon slot="icon">{this.getStatusIcon(this.order.status)}</md-icon>
              </md-assist-chip>
            </div>
          </div>

          {this.order.status === 'pending' && (
            <md-filled-button onClick={this.toggleEditMode}>
              <md-icon slot="icon">edit</md-icon>
              Edit Order
            </md-filled-button>
          )}
        </header>

        <div class="detail-content">
          <div class="info-card">
            <div class="card-content">
              <div class="card-header">
                <md-icon>person</md-icon>
                <h2>Order Information</h2>
              </div>

              <md-divider></md-divider>

              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">
                    <md-icon>badge</md-icon>
                    Requested By
                  </div>
                  <div class="info-value">{this.order.requestedBy}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <md-icon>business</md-icon>
                    Department
                  </div>
                  <div class="info-value">{this.order.requestorDepartment || 'Not specified'}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <md-icon>event</md-icon>
                    Created
                  </div>
                  <div class="info-value">{this.formatDate(this.order.createdAt)}</div>
                </div>

                <div class="info-item">
                  <div class="info-label">
                    <md-icon>update</md-icon>
                    Last Updated
                  </div>
                  <div class="info-value">{this.formatDate(this.order.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="info-card">
            <div class="card-content">
              <div class="card-header">
                <md-icon>shopping_cart</md-icon>
                <h2>Order Items</h2>
              </div>

              <md-divider></md-divider>

              <div class="items-list">
                {this.order.items?.length > 0 ? (
                  this.order.items.map(item => (
                    <div class="item-row">
                      <div class="item-info">
                        <div class="item-name">
                          <md-icon>inventory_2</md-icon>
                          {item.equipmentName}
                        </div>
                        <div class="item-details">
                          Quantity: {item.quantity} • 
                          Unit Price: ${item.unitPrice?.toFixed(2) || '0.00'} • 
                          Total: ${item.totalPrice?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div class="no-items">
                    <md-icon>inventory</md-icon>
                    <p>No items in this order</p>
                  </div>
                )}
              </div>

              {this.order.items?.length > 0 && (
                <div class="order-total">
                  <md-divider></md-divider>
                  <div class="total-row">
                    <span class="total-label">Total Order Value:</span>
                    <span class="total-amount">${this.getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Host>
  );
}
}