import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScheduledViewings } from '../ScheduledViewings';
import * as apiClient from '@/lib/api-client';
import type { ListingViewingRecord } from '@/lib/api-client';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/api-client', () => ({
  propertiesApi: { getPropertyViewings: jest.fn() },
  viewingsApi: { confirm: jest.fn(), decline: jest.fn() },
}));

function makeViewing(overrides: Partial<ListingViewingRecord>): ListingViewingRecord {
  return {
    id: 'v1',
    scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    status: 'confirmed',
    viewing_type: 'in_person',
    duration_minutes: 30,
    buyer_feedback: null,
    agent_feedback: null,
    cancel_reason: null,
    declined_at: null,
    rescheduled_at: null,
    created_at: new Date().toISOString(),
    buyer_first_name: 'Alice',
    buyer_last_name: 'Smith',
    buyer_email: 'alice@example.com',
    buyer_phone: null,
    ...overrides,
  };
}

const mockApi = apiClient.propertiesApi as jest.Mocked<typeof apiClient.propertiesApi>;

describe('ScheduledViewings — status grouping', () => {
  it('places a future confirmed viewing in Confirmed Viewings section', async () => {
    const v = makeViewing({ scheduled_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() });
    mockApi.getPropertyViewings.mockResolvedValue([v]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText('Confirmed Viewings')).toBeInTheDocument();
    expect(screen.queryByText('Past Viewings')).toBeNull();
  });

  it('places a currently-running viewing in Confirmed Viewings with In Progress badge', async () => {
    const start = new Date(Date.now() - 10 * 60 * 1000).toISOString(); // started 10 min ago
    const v = makeViewing({ scheduled_at: start, duration_minutes: 60, status: 'confirmed' });
    mockApi.getPropertyViewings.mockResolvedValue([v]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText('Confirmed Viewings')).toBeInTheDocument();
    expect((await screen.findAllByText('In Progress')).length).toBeGreaterThan(0);
    expect(screen.queryByText('Past Viewings')).toBeNull();
  });

  it('places a scheduled-but-already-ended viewing in the Past Viewings section', async () => {
    const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // started 2 hours ago
    const v = makeViewing({ scheduled_at: start, duration_minutes: 30, status: 'confirmed' });
    mockApi.getPropertyViewings.mockResolvedValue([v]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText('Past Viewings')).toBeInTheDocument();
    expect(screen.queryByText('Confirmed Viewings')).toBeNull();
  });

  it('places a completed viewing in the Past Viewings section', async () => {
    const v = makeViewing({ status: 'completed' });
    mockApi.getPropertyViewings.mockResolvedValue([v]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText('Past Viewings')).toBeInTheDocument();
    expect(screen.queryByText('Confirmed Viewings')).toBeNull();
  });

  it('places declined and cancelled viewings in Past Viewings section', async () => {
    const v1 = makeViewing({ id: 'v1', status: 'declined' });
    const v2 = makeViewing({ id: 'v2', status: 'cancelled', buyer_first_name: 'Bob' });
    mockApi.getPropertyViewings.mockResolvedValue([v1, v2]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText('Past Viewings')).toBeInTheDocument();
    expect(screen.queryByText('Confirmed Viewings')).toBeNull();
  });

  it('shows Action Inbox when there are pending requests', async () => {
    const v = makeViewing({ status: 'requested' });
    mockApi.getPropertyViewings.mockResolvedValue([v]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText('Action Required')).toBeInTheDocument();
    expect(screen.getAllByText(/pending/i).length).toBeGreaterThan(0);
  });

  it('shows empty state when no viewings exist', async () => {
    mockApi.getPropertyViewings.mockResolvedValue([]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText(/No viewings scheduled/i)).toBeInTheDocument();
  });

  it('shows outcome nudge when completed viewings have no feedback', async () => {
    const start = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const v = makeViewing({ scheduled_at: start, duration_minutes: 30, status: 'completed', buyer_feedback: null });
    mockApi.getPropertyViewings.mockResolvedValue([v]);

    render(<ScheduledViewings propertyId="prop1" authToken="tok" />);

    expect(await screen.findByText(/need outcomes logged/i)).toBeInTheDocument();
  });
});

