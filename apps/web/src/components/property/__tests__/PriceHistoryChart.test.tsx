import React from 'react';
import { render, screen } from '@testing-library/react';
import PriceHistoryChart from '../PriceHistoryChart';

describe('PriceHistoryChart', () => {
  const twoEntries = [
    { id: 'ph-1', old_price: null, new_price: '1000000', currency: 'ZAR', change_note: 'Initial listing', created_at: '2024-01-15' },
    { id: 'ph-2', old_price: '1000000', new_price: '1200000', currency: 'ZAR', change_note: 'Price increase', created_at: '2024-06-20' },
  ];

  it('renders nothing when entries have fewer than 2 data points', () => {
    const singleEntry = [
      { id: 'ph-1', old_price: null, new_price: '500000', currency: 'ZAR', change_note: null, created_at: '2024-01-01' },
    ];
    const { container } = render(
      <PriceHistoryChart entries={singleEntry} currentPrice={500000} currency="ZAR" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the Price History heading', () => {
    render(
      <PriceHistoryChart entries={twoEntries} currentPrice={1200000} currency="ZAR" />
    );
    expect(screen.getByText('Price History')).toBeInTheDocument();
  });

  it('renders an SVG chart', () => {
    const { container } = render(
      <PriceHistoryChart entries={twoEntries} currentPrice={1200000} currency="ZAR" />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('shows a percentage change indicator', () => {
    render(
      <PriceHistoryChart entries={twoEntries} currentPrice={1200000} currency="ZAR" />
    );
    // Should display a percentage (20% increase from 1M → 1.2M)
    expect(screen.getByText(/20\.0%/)).toBeInTheDocument();
  });

  it('renders individual price changes in the list', () => {
    render(
      <PriceHistoryChart entries={twoEntries} currentPrice={1200000} currency="ZAR" />
    );
    // The list shows dates and prices for each entry
    const listItems = document.querySelectorAll('.line-through');
    // Second entry has old_price, so there should be at least one crossed-out price
    expect(listItems.length).toBeGreaterThanOrEqual(1);
  });

  it('handles price decrease correctly', () => {
    const decreaseEntries = [
      { id: 'ph-1', old_price: null, new_price: '2000000', currency: 'ZAR', change_note: null, created_at: '2024-01-01' },
      { id: 'ph-2', old_price: '2000000', new_price: '1500000', currency: 'ZAR', change_note: 'Reduced', created_at: '2024-03-01' },
    ];
    render(
      <PriceHistoryChart entries={decreaseEntries} currentPrice={1500000} currency="ZAR" />
    );
    expect(screen.getByText(/25\.0%/)).toBeInTheDocument();
  });
});
