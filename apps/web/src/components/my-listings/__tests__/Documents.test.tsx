import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Documents } from '../Documents';

const listDocuments = jest.fn();

jest.mock('@/lib/api-client', () => ({
  propertiesApi: {
    listDocuments: (...args: unknown[]) => listDocuments(...args),
  },
}));

jest.mock('../UploadDocumentModal', () => ({
  UploadDocumentModal: () => null,
}));

const MOCK_DOC = {
  id: 'doc-1',
  property_id: 'prop-1',
  title: 'Sale Agreement',
  category: 'listing',
  description: null,
  status: 'current',
  access_level: 'team',
  file_url: 'https://storage.example.com/docs/sale-agreement.pdf',
  file_name: 'sale-agreement.pdf',
  file_size: 204800,
  file_type: 'application/pdf',
  is_required: true,
  expiration_date: null,
  tags: [],
  created_at: '2026-03-01T10:00:00.000Z',
};

describe('Documents', () => {
  const defaultProps = { propertyId: 'prop-1', authToken: 'tok-abc' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loaded documents', async () => {
    listDocuments.mockResolvedValue([MOCK_DOC]);
    render(<Documents {...defaultProps} />);
    const matches = await screen.findAllByText('Sale Agreement');
    expect(matches.length).toBeGreaterThan(0);
  });

  it('shows an error banner when the API call fails', async () => {
    listDocuments.mockRejectedValue(new Error('Failed to fetch'));
    render(<Documents {...defaultProps} />);
    expect(await screen.findByText('Failed to fetch')).toBeInTheDocument();
  });

  it('shows generic error message for non-Error rejections', async () => {
    listDocuments.mockRejectedValue('network gone');
    render(<Documents {...defaultProps} />);
    expect(await screen.findByText('Failed to load documents')).toBeInTheDocument();
  });

  it('opens file_url in new tab when View is clicked', async () => {
    listDocuments.mockResolvedValue([MOCK_DOC]);
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);
    render(<Documents {...defaultProps} />);
    await screen.findAllByText('Sale Agreement');
    fireEvent.click(screen.getByTitle('View'));
    expect(openSpy).toHaveBeenCalledWith(
      'https://storage.example.com/docs/sale-agreement.pdf',
      '_blank',
      'noopener,noreferrer',
    );
    openSpy.mockRestore();
  });

  it('triggers anchor download when Download is clicked', async () => {
    listDocuments.mockResolvedValue([MOCK_DOC]);
    const clickSpy = jest.fn();
    const anchor = { href: '', download: '', rel: '', click: clickSpy } as unknown as HTMLAnchorElement;
    const originalCreateElement = document.createElement.bind(document);
    const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') return anchor;
      return originalCreateElement(tag);
    });
    render(<Documents {...defaultProps} />);
    await screen.findAllByText('Sale Agreement');
    fireEvent.click(screen.getByTitle('Download'));
    expect(anchor.href).toBe('https://storage.example.com/docs/sale-agreement.pdf');
    expect(anchor.download).toBe('Sale Agreement');
    expect(clickSpy).toHaveBeenCalled();
    createSpy.mockRestore();
  });

  it('calls listDocuments with correct token and propertyId', async () => {
    listDocuments.mockResolvedValue([]);
    render(<Documents {...defaultProps} />);
    await waitFor(() => {
      expect(listDocuments).toHaveBeenCalledWith('tok-abc', 'prop-1');
    });
  });
});
