import { render, screen } from '@testing-library/react';
import PropertyDaysOnMarket from '../PropertyDaysOnMarket';

jest.mock('lucide-react', () => ({
  Clock: ({ className }: { className?: string }) => <span data-testid="clock-icon" className={className} />,
}));

describe('PropertyDaysOnMarket', () => {
  it('renders nothing when createdAt is empty', () => {
    const { container } = render(<PropertyDaysOnMarket createdAt="" />);
    expect(container.innerHTML).toBe('');
  });

  it('shows "Listed today" for a property created today', () => {
    const today = new Date().toISOString();
    render(<PropertyDaysOnMarket createdAt={today} />);
    expect(screen.getByText('Listed today')).toBeInTheDocument();
  });

  it('shows "1 day on market" for property created yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    render(<PropertyDaysOnMarket createdAt={yesterday} />);
    expect(screen.getByText('1 day on market')).toBeInTheDocument();
  });

  it('shows correct plural form for multiple days', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    render(<PropertyDaysOnMarket createdAt={tenDaysAgo} />);
    expect(screen.getByText('10 days on market')).toBeInTheDocument();
  });

  it('renders the Clock icon', () => {
    const today = new Date().toISOString();
    render(<PropertyDaysOnMarket createdAt={today} />);
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
  });
});
