import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import BondCalculator from '../BondCalculator';

describe('BondCalculator', () => {
  const defaultProps = { price: 1_500_000, currency: 'ZAR' };

  it('renders the Bond Calculator heading', () => {
    render(<BondCalculator {...defaultProps} />);
    expect(screen.getByText('Bond Calculator')).toBeInTheDocument();
  });

  it('shows a non-zero monthly payment for default inputs', () => {
    render(<BondCalculator {...defaultProps} />);
    // Monthly Payment label should exist and the formatted amount should not be ZAR 0
    const label = screen.getByText('Monthly Payment');
    expect(label).toBeInTheDocument();
    // The value is in the sibling element
    const value = label.closest('div')?.querySelector('.text-lg');
    expect(value).toBeTruthy();
    expect(value?.textContent).not.toContain('R\u00a00');
  });

  it('renders 3 input fields: deposit, rate, term', () => {
    render(<BondCalculator {...defaultProps} />);
    expect(screen.getByLabelText('Deposit')).toBeInTheDocument();
    expect(screen.getByLabelText('Interest Rate (% p.a.)')).toBeInTheDocument();
    expect(screen.getByLabelText('Loan Term (years)')).toBeInTheDocument();
  });

  it('changing deposit updates the monthly payment', () => {
    render(<BondCalculator {...defaultProps} />);
    const depositInput = screen.getByLabelText('Deposit');
    const getMonthly = () =>
      screen.getByText('Monthly Payment').closest('div')?.querySelector('.text-lg')?.textContent;

    const before = getMonthly();
    fireEvent.change(depositInput, { target: { value: '300000' } });
    const after = getMonthly();
    expect(before).not.toBe(after);
  });

  it('shows total repayment and total interest', () => {
    render(<BondCalculator {...defaultProps} />);
    expect(screen.getByText('Total Repayment')).toBeInTheDocument();
    expect(screen.getByText('Total Interest')).toBeInTheDocument();
  });

  it('handles zero price gracefully', () => {
    render(<BondCalculator price={0} currency="ZAR" />);
    // Should still render without crashing
    expect(screen.getByText('Bond Calculator')).toBeInTheDocument();
  });

  it('clamps term to max 30 years', () => {
    render(<BondCalculator {...defaultProps} />);
    const termInput = screen.getByLabelText('Loan Term (years)') as HTMLInputElement;
    fireEvent.change(termInput, { target: { value: '50' } });
    expect(termInput.value).toBe('30');
  });
});
