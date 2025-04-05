import { Component, Host, h } from '@stencil/core';

@Component({
  tag: 'steq-orders-list',
  styleUrl: 'steq-orders-list.css',
  shadow: true,
})
export class SteqOrdersList {
  render() {
    return (
      <Host>
        Steq
        <slot></slot>
      </Host>
    );
  }
}
