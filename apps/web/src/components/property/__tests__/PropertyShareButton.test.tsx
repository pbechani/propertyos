import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PropertyShareButton from '../PropertyShareButton';

jest.mock('lucide-react', () => ({
  Share2: ({ className }: { className?: string }) => <span data-testid="share-icon" className={className} />,
  X: ({ className }: { className?: string }) => <span data-testid="x-icon" className={className} />,
  Check: ({ className }: { className?: string }) => <span data-testid="check-icon" className={className} />,
  Link2: ({ className }: { className?: string }) => <span data-testid="link-icon" className={className} />,
  Mail: ({ className }: { className?: string }) => <span data-testid="mail-icon" className={className} />,
}));

describe('PropertyShareButton', () => {
  beforeEach(() => {
    // Ensure navigator.share is not available by default (fallback menu)
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
  });

  it('renders the share button', () => {
    render(<PropertyShareButton title="Test Property" />);
    expect(screen.getByRole('button', { name: 'Share property' })).toBeInTheDocument();
  });

  it('opens fallback menu when navigator.share is not available', () => {
    render(<PropertyShareButton title="Test Property" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share property' }));
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('closes the menu when close button is clicked', () => {
    render(<PropertyShareButton title="Test Property" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share property' }));
    expect(screen.getByText('Copy link')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close share menu' }));
    expect(screen.queryByText('Copy link')).not.toBeInTheDocument();
  });

  it('copies link to clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText },
      writable: true,
      configurable: true,
    });

    render(<PropertyShareButton title="Test Property" url="https://example.com/property/1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share property' }));
    fireEvent.click(screen.getByText('Copy link'));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('https://example.com/property/1');
    });
  });

  it('uses native share when available', async () => {
    const shareFn = jest.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareFn, writable: true, configurable: true });

    render(<PropertyShareButton title="Test Property" url="https://example.com/property/1" />);
    fireEvent.click(screen.getByRole('button', { name: 'Share property' }));

    await waitFor(() => {
      expect(shareFn).toHaveBeenCalledWith({
        title: 'Test Property',
        url: 'https://example.com/property/1',
      });
    });
    // Menu should NOT be open since native share succeeded
    expect(screen.queryByText('Copy link')).not.toBeInTheDocument();
  });
});
