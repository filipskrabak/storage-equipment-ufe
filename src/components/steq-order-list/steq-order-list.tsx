import { Component, Host, h, Element, State} from '@stencil/core';
import { Order } from '../../api/storage-equipment';
import { getApiConfig, apiRequest, ApiError } from '../../utils/api-config';

@Component({
  tag: 'steq-order-list',
  styleUrl: 'steq-order-list.css',
  shadow: true,
})
export class SteqOrderList {
  @Element() el: HTMLElement;
  @State() orders: Order[] = [];
  @State() loading: boolean = true;
  @State() error: string = null;
  @State() showCreateDialog: boolean = false;

  componentWillLoad() {
    this.loadOrders();
  }

  async loadOrders() {
    try {
      this.loading = true;
      this.error = null;

      const config = getApiConfig();
      const data = await apiRequest<Order[]>(config.endpoints.orders);
      this.orders = data || [];

    } catch (err) {
      console.error('Failed to load orders:', err);
      if (err instanceof ApiError) {
        this.error = `Failed to load orders: ${err.message}`;
      } else {
        this.error = 'Failed to load orders. Please check if the backend server is running.';
      }
    } finally {
      this.loading = false;
    }
  }

  async deleteOrder(id: string) {
    if (!confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    try {
      const config = getApiConfig();
      await apiRequest(config.endpoints.orderById(id), {
        method: 'DELETE',
      });
      
      // Remove from local state
      this.orders = this.orders.filter(order => order.id !== id);
      
    } catch (err) {
      console.error('Failed to cancel order:', err);
      if (err instanceof ApiError) {
        this.error = `Failed to cancel order: ${err.message}`;
      } else {
        this.error = 'Failed to cancel order';
      }
    }
  }

  getStatusChipType(status: string): string {
    switch(status) {
      case 'pending': return 'warning';
      case 'delivered': return 'operational';
      case 'cancelled': return 'error';
      default: return 'default';
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

  toggleCreateDialog() {
    this.showCreateDialog = !this.showCreateDialog;
  }

  handleOrderCreated(event: CustomEvent) {
    this.orders = [...this.orders, event.detail];
    this.showCreateDialog = false;
  }

  formatDate(dateString: Date): string {
    if (!dateString) return 'Not set';
  
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getItemsSummary(order: Order): string {
    if (!order.items || order.items.length === 0) return 'No items';
    if (order.items.length === 1) return order.items[0].equipmentName;
    return `${order.items[0].equipmentName} +${order.items.length - 1} more`;
  }
  

  renderOrdersList() {
    if (this.orders.length === 0) {
      return (
        <div class="empty-state">
          <md-icon class="empty-big-icon">shopping_cart</md-icon>
          <h3>No orders found</h3>
          <p>Start by creating your first equipment order</p>
          <md-filled-button onClick={() => this.toggleCreateDialog()}>
            <md-icon slot="icon">add</md-icon>
            Create Order
          </md-filled-button>
        </div>
      );
    }

    return (
      <md-list>
        {this.orders.map(order => (
          <md-list-item key={order.id} class="order-item">
            <div slot="start" class="order-icon">
              <md-icon>{this.getStatusIcon(order.status)}</md-icon>
            </div>

            <div slot="headline">Order #{order.id?.substring(0, 8) || 'Unknown'}</div>
            <div slot="supporting-text">
              {order.requestedBy} • {order.requestorDepartment || 'Unknown Dept'} • {this.getItemsSummary(order)}
            </div>

            <div slot="trailing-supporting-text">
              Created: {this.formatDate(order.createdAt)}
            </div>

            <div slot="end" class="order-actions">
              <div class="status-priority-chips">
                <md-filter-chip
                  class={`status-chip status-${this.getStatusChipType(order.status)}`}
                  label={order.status?.replace('_', ' ') || 'Unknown'}
                >
                  <md-icon slot="icon">{this.getStatusIcon(order.status)}</md-icon>
                </md-filter-chip>
              </div>

              <div class="action-buttons">
                <md-text-button onClick={() => this.viewOrder(order.id)}>
                  <md-icon slot="icon">visibility</md-icon>
                  View
                </md-text-button>

                <md-outlined-button 
                  disabled={order.status !== 'pending'}
                  class={order.status !== 'pending' ? 'disabled-button' : ''}
                  onClick={() => order.status === 'pending' ? this.editOrder(order.id) : null}
                >
                  <md-icon slot="icon">edit</md-icon>
                  Edit
                </md-outlined-button>

                <md-text-button
                  class={`delete-button ${order.status !== 'pending' ? 'disabled-button' : ''}`}
                  disabled={order.status !== 'pending'}
                  onClick={() => order.status === 'pending' ? this.deleteOrder(order.id) : null}
                >
                  <md-icon slot="icon">cancel</md-icon>
                  Cancel
                </md-text-button>
              </div>
            </div>
          </md-list-item>
        ))}
      </md-list>
    );
  }

  viewOrder(id: string) {
    const event = new CustomEvent('view-order', {
      detail: { id },
      bubbles: true,
      composed: true
    });
    this.el.dispatchEvent(event);
  }

  editOrder(id: string) {
    const event = new CustomEvent('edit-order', {
      detail: { id },
      bubbles: true,
      composed: true
    });
    this.el.dispatchEvent(event);
  }

  render() {
    return (
      <Host>
        <div class="order-container">
          <header class="page-header">
            <div class="header-content">
              <div class="header-text">
                <h1>Equipment Orders</h1>
                <p>Track hospital equipment orders</p>
              </div>

              <md-filled-button onClick={() => this.toggleCreateDialog()}>
                <md-icon slot="icon">add</md-icon>
                Create New Order
              </md-filled-button>
            </div>
          </header>

          {this.error && (
            <div class="error-banner">
              <md-icon>error</md-icon>
              <span>{this.error}</span>
              <md-text-button onClick={() => this.loadOrders()}>
                <md-icon slot="icon">refresh</md-icon>
                Retry
              </md-text-button>
            </div>
          )}

          {this.loading && (
            <div class="loading-container">
              <md-linear-progress indeterminate></md-linear-progress>
              <p>Loading orders data...</p>
            </div>
          )}

          {!this.loading && this.renderOrdersList()}

          {this.showCreateDialog && (
            <steq-order-form
              onCancel={() => this.toggleCreateDialog()}
              onOrderCreated={(e) => this.handleOrderCreated(e)}
            />
          )}
        </div>
      </Host>
    );
  }
}