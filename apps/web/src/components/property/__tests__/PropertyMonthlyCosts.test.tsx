import { render, screen } from '@testing-library/react';
import PropertyMonthlyCosts from '../PropertyMonthlyCosts';

// Card is a plain div wrapper — no mock needed
jest.mock('lucide-react', () => ({
  __esModule: true,
}));

describe('PropertyMonthlyCosts', () => {
  it('renders nothing when all costs are null', () => {
    const { container } = render(
      <PropertyMonthlyCosts
        monthlyLevy={null}
        monthlyRates={null}
        monthlyUtilities={null}
        currency="ZAR"
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when all costs are zero', () => {
    const { container } = render(
      <PropertyMonthlyCosts
        monthlyLevy={0}
        monthlyRates={0}
        monthlyUtilities={0}
        currency="ZAR"
      />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders a single cost item without the total row', () => {
    render(
      <PropertyMonthlyCosts
        monthlyLevy={1500}
        monthlyRates={null}
        monthlyUtilities={null}
        currency="ZAR"
      />,
    );
    expect(screen.getByText('Levy')).toBeInTheDocument();
    expect(screen.getByText('Monthly Costs')).toBeInTheDocument();
    // No total row when only one item
    expect(screen.queryByText('Total Monthly')).not.toBeInTheDocument();
  });

  it('renders multiple items with a total row', () => {
    render(
      <PropertyMonthlyCosts
        monthlyLevy={1500}
        monthlyRates={800}
        monthlyUtilities={500}
        currency="ZAR"
      />,
    );
    expect(screen.getByText('Levy')).toBeInTheDocument();
    expect(screen.getByText('Rates & Taxes')).toBeInTheDocument();
    expect(screen.getByText('Utilities')).toBeInTheDocument();
    expect(screen.getByText('Total Monthly')).toBeInTheDocument();
  });

  it('formats amounts using the provided currency', () => {
    render(
      <PropertyMonthlyCosts
        monthlyLevy={2000}
        monthlyRates={null}
        monthlyUtilities={null}
        currency="USD"
      />,
    );
    // Intl.NumberFormat with USD should render a dollar sign
    const levyValue = screen.getByText('Levy').closest('div')?.querySelector('.font-medium');
    expect(levyValue?.textContent).toContain('$');
  });
});
