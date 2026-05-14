/**
 * Listings — Anonymous Mode Padding (Spec 001)
 *
 * TDD tests for FR-002, FR-004, FR-006 (horizontal padding widens for anonymous visitors).
 * Tests FAIL first (red), then PASS after T005–T009 are implemented (green).
 */

// ─── Module mocks (must appear before any import of the mocked module) ────────

jest.mock('@/lib/auth-session', () => ({
  getAccessToken: jest.fn(),
  getStoredUser: jest.fn(() => null),
  getActiveCompanyIdFromToken: jest.fn(() => null),
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/listings',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/router-compat', () => ({
  Link: ({ children, href }: { children: unknown; href: string }) => {
    const React = require('react');
    return React.createElement('a', { href }, children);
  },
  useNavigate: () => jest.fn(),
}));

jest.mock('@/lib/api-client', () => ({
  propertiesApi: {
    search: jest.fn().mockResolvedValue({ data: [] }),
    getSavedProperties: jest.fn().mockResolvedValue({ data: [] }),
    getFeaturedAgents: jest.fn().mockResolvedValue([]),
    getAgentProfile: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(undefined),
    unsave: jest.fn().mockResolvedValue(undefined),
  },
  salesApi: {
    getMySales: jest.fn().mockResolvedValue([]),
    create: jest.fn().mockResolvedValue({}),
  },
  ApiError: class ApiError extends Error {
    constructor(
      public status: number,
      message?: string,
    ) {
      super(message);
      this.name = 'ApiError';
    }
  },
}));

jest.mock('@/lib/map-utils', () => ({
  buildMapViewport: jest.fn(() => ({ latitude: -26, longitude: 28, zoom: 10 })),
  buildViewportMapSource: jest.fn(() => null),
}));

jest.mock('@/components/LeafletMapDynamic', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/property/ListingCardOptA', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@/components/property/MultiListingDialog', () => ({
  __esModule: true,
  default: () => null,
}));

// ─── Imports (after mocks) ────────────────────────────────────────────────────

import { render } from '@testing-library/react';
import { getAccessToken } from '@/lib/auth-session';
import Listings from '@/views/Listings';

const mockGetAccessToken = getAccessToken as jest.Mock;

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Listings — anonymous mode padding (Spec 001)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply default resolved values after clearAllMocks resets them
    const api = require('@/lib/api-client');
    (api.propertiesApi.search as jest.Mock).mockResolvedValue({ data: [] });
    (api.propertiesApi.getSavedProperties as jest.Mock).mockResolvedValue({ data: [] });
    (api.propertiesApi.getFeaturedAgents as jest.Mock).mockResolvedValue([]);
    (api.salesApi.getMySales as jest.Mock).mockResolvedValue([]);
  });

  it('T002: Forest Command Zone has wider anonymous padding when user is not authenticated', () => {
    // Arrange — no token → anonymous visitor
    mockGetAccessToken.mockReturnValue('');

    // Act
    const { getByTestId } = render(<Listings />);

    // Assert — FR-002: container + px-6 lg:px-12 instead of px-4 md:px-8
    const zone = getByTestId('forest-command-zone');
    expect(zone).toHaveClass('container');
    expect(zone).toHaveClass('mx-auto');
    expect(zone).toHaveClass('px-6');
    expect(zone).toHaveClass('pt-8');
    expect(zone).not.toHaveClass('px-4');
    expect(zone).not.toHaveClass('md:px-8');
  });

  it('T003: anonymous mode snapshot shows only padding change, nothing else (FR-005)', () => {
    mockGetAccessToken.mockReturnValue('');
    const { asFragment } = render(<Listings />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('T004: Forest Command Zone has authenticated padding when token is present (SC-003)', () => {
    // Arrange — valid token → authenticated user
    mockGetAccessToken.mockReturnValue('eyJhbGciOiJIUzI1NiJ9.test.token');

    // Act
    const { getByTestId, asFragment } = render(<Listings />);

    // Assert — fr-004: original px-4 md:px-8 preserved for authenticated
    const zone = getByTestId('forest-command-zone');
    expect(zone).toHaveClass('px-4');
    expect(zone).toHaveClass('pt-8');
    expect(zone).not.toHaveClass('container');
    expect(zone).not.toHaveClass('px-6');

    // Snapshot guards against regressions in authenticated layout
    expect(asFragment()).toMatchSnapshot();
  });
});
