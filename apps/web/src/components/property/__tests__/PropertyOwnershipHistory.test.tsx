import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyOwnershipHistory, { type OwnershipTransfer } from '../PropertyOwnershipHistory';

// Mock formatMoney
jest.mock('@/lib/formatters', () => ({
  formatMoney: (val: string, cur: string) => `${cur} ${val}`,
}));

describe('PropertyOwnershipHistory', () => {
  const transfers: OwnershipTransfer[] = [
    {
      id: '1',
      owner_name: 'Alice Moyo',
      transfer_date: '2024-03-15',
      transfer_price: '1500000',
      transfer_currency: 'ZAR',
      title_deed_url: 'https://example.com/deed-1.pdf',
      notes: 'First purchase',
    },
    {
      id: '2',
      owner_name: 'Bob Nkosi',
      transfer_date: '2020-08-01',
      transfer_price: '1200000',
      transfer_currency: 'ZAR',
      title_deed_url: null,
      notes: null,
    },
  ];

  it('renders nothing when transfers is empty', () => {
    const { container } = render(<PropertyOwnershipHistory transfers={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders owner names', () => {
    render(<PropertyOwnershipHistory transfers={transfers} />);
    expect(screen.getByText('Alice Moyo')).toBeInTheDocument();
    expect(screen.getByText('Bob Nkosi')).toBeInTheDocument();
  });

  it('renders formatted transfer price', () => {
    render(<PropertyOwnershipHistory transfers={transfers} />);
    expect(screen.getByText('ZAR 1500000')).toBeInTheDocument();
    expect(screen.getByText('ZAR 1200000')).toBeInTheDocument();
  });

  it('renders title deed link when url is present', () => {
    render(<PropertyOwnershipHistory transfers={transfers} />);
    const link = screen.getByText('View Title Deed →');
    expect(link).toHaveAttribute('href', 'https://example.com/deed-1.pdf');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('renders notes when present', () => {
    render(<PropertyOwnershipHistory transfers={transfers} />);
    expect(screen.getByText('First purchase')).toBeInTheDocument();
  });

  it('shows "Unknown Owner" for null owner_name', () => {
    const partial: OwnershipTransfer[] = [
      { id: '3', owner_name: null, transfer_date: '2019-01-01', transfer_price: null, transfer_currency: null, title_deed_url: null, notes: null },
    ];
    render(<PropertyOwnershipHistory transfers={partial} />);
    expect(screen.getByText('Unknown Owner')).toBeInTheDocument();
  });

  it('shows "Date unknown" for null transfer_date', () => {
    const partial: OwnershipTransfer[] = [
      { id: '4', owner_name: 'Sam', transfer_date: null, transfer_price: null, transfer_currency: null, title_deed_url: null, notes: null },
    ];
    render(<PropertyOwnershipHistory transfers={partial} />);
    expect(screen.getByText('Date unknown')).toBeInTheDocument();
  });
});
