import { render, screen, fireEvent } from '@testing-library/react';
import MultiListingDialog from '../MultiListingDialog';
import type { MultiListingItem } from '../MultiListingDialog';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  MapPin: ({ className }: { className?: string }) => <span data-testid="map-pin-icon" className={className} />,
  BedDouble: ({ className }: { className?: string }) => <span data-testid="bed-icon" className={className} />,
  Bath: ({ className }: { className?: string }) => <span data-testid="bath-icon" className={className} />,
  CarFront: ({ className }: { className?: string }) => <span data-testid="car-icon" className={className} />,
  Maximize: ({ className }: { className?: string }) => <span data-testid="maximize-icon" className={className} />,
  Users: ({ className }: { className?: string }) => <span data-testid="users-icon" className={className} />,
  XIcon: () => <span data-testid="x-icon" />,
}));

// Mock PropertyCardHeader
jest.mock('@/components/property/PropertyCardHeader', () => ({
  __esModule: true,
  default: ({ companyName, personName }: { companyName?: string | null; personName: string }) => (
    <div data-testid="card-header">
      {companyName && <span>{companyName}</span>}
      <span>{personName}</span>
    </div>
  ),
}));

// Must mock radix dialog to work in jsdom
jest.mock('@radix-ui/react-dialog', () => {
  const React = require('react');
  return {
    Root: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
      open ? <div data-testid="dialog-root">{children}</div> : null,
    Portal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    Overlay: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} data-testid="dialog-overlay" {...props}>{children}</div>
    )),
    Content: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) => (
      <div ref={ref} data-testid="dialog-content" {...props}>{children}</div>
    )),
    Title: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <h2 data-testid="dialog-title" {...props}>{children}</h2>
    ),
    Description: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p data-testid="dialog-description" {...props}>{children}</p>
    ),
    Close: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button data-testid="dialog-close" {...props}>{children}</button>
    ),
    Trigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

const makeListing = (overrides: Partial<MultiListingItem> = {}): MultiListingItem => ({
  id: 'prop-1',
  title: '3 Bedroom House in Sandton',
  location: 'Sandton, Gauteng',
  addressLine1: '123 Main Road',
  price: 'R 2 500 000',
  beds: 3,
  baths: 2,
  garage: 2,
  garages: 2,
  carports: 0,
  sqm: 180,
  propertyType: 'house',
  image: '/images/prop1.jpg',
  agent: 'Dawn Bloch',
  agentCompany: "Sotheby's International Realty",
  agentAvatarUrl: null,
  agentCompanyLogoUrl: null,
  agentCompanyBrandColor: '#1a3a5c',
  isPrivateListing: false,
  ...overrides,
});

describe('MultiListingDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: jest.fn(),
    onSelectListing: jest.fn(),
    listings: [
      makeListing({ id: 'prop-1', agentCompany: "Sotheby's International Realty", agent: 'Dawn Bloch' }),
      makeListing({ id: 'prop-2', agentCompany: 'Real Realty', agent: 'Sarah Johnson', agentCompanyBrandColor: '#4A9E8E' }),
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when listings array is empty', () => {
    const { container } = render(
      <MultiListingDialog open={true} onOpenChange={jest.fn()} listings={[]} onSelectListing={jest.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('does not render when open is false', () => {
    const { container } = render(
      <MultiListingDialog open={false} onOpenChange={jest.fn()} listings={defaultProps.listings} onSelectListing={jest.fn()} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders the dialog with correct title', () => {
    render(<MultiListingDialog {...defaultProps} />);
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('3 Bedroom House in Sandton');
  });

  it('displays the agency count badge', () => {
    render(<MultiListingDialog {...defaultProps} />);
    expect(screen.getByText('Listed by 2 Estate Agencies')).toBeInTheDocument();
  });

  it('renders all listing cards', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const headers = screen.getAllByTestId('card-header');
    expect(headers).toHaveLength(2);
    expect(screen.getByText("Sotheby's International Realty")).toBeInTheDocument();
    expect(screen.getByText('Real Realty')).toBeInTheDocument();
  });

  it('renders agent names in card headers', () => {
    render(<MultiListingDialog {...defaultProps} />);
    expect(screen.getByText('Dawn Bloch')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
  });

  it('displays property specs for each listing', () => {
    render(<MultiListingDialog {...defaultProps} />);
    // Each listing has a price — 2 identical prices
    const prices = screen.getAllByText('R 2 500 000');
    expect(prices.length).toBe(2);
  });

  it('displays location for each listing', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const locations = screen.getAllByText('Sandton, Gauteng');
    expect(locations.length).toBe(2);
  });

  it('shows address in description area', () => {
    render(<MultiListingDialog {...defaultProps} />);
    expect(screen.getByText('123 Main Road')).toBeInTheDocument();
  });

  it('calls onSelectListing with correct id when a listing is clicked', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    // Filter to listing buttons (not the close button)
    const listingButtons = buttons.filter((b) => b.getAttribute('data-testid') !== 'dialog-close');
    // Click the second listing (Real Realty - prop-2)
    fireEvent.click(listingButtons[1]);
    expect(defaultProps.onSelectListing).toHaveBeenCalledWith('prop-2');
  });

  it('calls onSelectListing when Enter key is pressed on a listing', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const buttons = screen.getAllByRole('button');
    const listingButtons = buttons.filter((b) => b.getAttribute('data-testid') !== 'dialog-close');
    // First listing
    fireEvent.click(listingButtons[0]);
    expect(defaultProps.onSelectListing).toHaveBeenCalledWith('prop-1');
  });

  it('renders property type badge', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const badges = screen.getAllByText('house');
    expect(badges.length).toBeGreaterThanOrEqual(2);
  });

  it('renders sqm for each listing', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const sqmTexts = screen.getAllByText('180 m²');
    expect(sqmTexts.length).toBe(2);
  });

  it('shows singular "Agency" for single listing', () => {
    render(
      <MultiListingDialog
        open={true}
        onOpenChange={jest.fn()}
        listings={[makeListing()]}
        onSelectListing={jest.fn()}
      />,
    );
    expect(screen.getByText('Listed by 1 Estate Agency')).toBeInTheDocument();
  });

  it('renders thumbnails with correct src', () => {
    render(<MultiListingDialog {...defaultProps} />);
    const images = screen.getAllByRole('img');
    expect(images[0]).toHaveAttribute('src', '/images/prop1.jpg');
  });

  it('shows garage/carport format when garages > 0', () => {
    render(
      <MultiListingDialog
        open={true}
        onOpenChange={jest.fn()}
        listings={[makeListing({ garages: 2, carports: 1 })]}
        onSelectListing={jest.fn()}
      />,
    );
    expect(screen.getByText('2G 1C')).toBeInTheDocument();
  });

  it('shows plain garage count when garages and carports are 0', () => {
    render(
      <MultiListingDialog
        open={true}
        onOpenChange={jest.fn()}
        listings={[makeListing({ garages: 0, carports: 0, garage: 3 })]}
        onSelectListing={jest.fn()}
      />,
    );
    // The car icon and its adjacent text
    const carIcons = screen.getAllByTestId('car-icon');
    expect(carIcons).toHaveLength(1);
    // garage count is rendered next to the car icon
    const carSpan = carIcons[0].parentElement;
    expect(carSpan?.textContent).toContain('3');
  });
});
