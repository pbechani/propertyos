import { fireEvent, render, screen } from '@testing-library/react';
import { OpenHouses } from '../OpenHouses';

const getPropertyOpenHouses = jest.fn();
const mockCreatedOpenHouse = {
  id: 'oh-new',
  property_id: 'property-1',
  property_title: 'Greenstone Home',
  agent_id: 'agent-1',
  scheduled_at: '2026-03-22T11:00:00.000Z',
  end_at: '2026-03-22T13:00:00.000Z',
  max_attendees: 40,
  description: 'Freshly scheduled showcase',
  status: 'scheduled',
  cancel_reason: null,
  rescheduled_at: null,
  rescheduled_reason: null,
  preparation_checklist: [],
  marketing_options: [],
  created_at: '2026-03-17T09:00:00.000Z',
};

jest.mock('@/lib/api-client', () => ({
  propertiesApi: {
    getPropertyOpenHouses: (...args: unknown[]) => getPropertyOpenHouses(...args),
  },
}));

jest.mock('../ScheduleOpenHouseModal', () => ({
  ScheduleOpenHouseModal: ({
    onSuccess,
    openHouseRecord,
  }: {
    onSuccess?: (openHouse: typeof mockCreatedOpenHouse) => void;
    openHouseRecord?: { description?: string | null; max_attendees?: number | null };
  }) => (
    <div>
      {openHouseRecord && (
        <span data-testid="prefilled-description">{openHouseRecord.description}</span>
      )}
      {openHouseRecord?.max_attendees != null && (
        <span data-testid="prefilled-max-attendees">{openHouseRecord.max_attendees}</span>
      )}
      <button type="button" onClick={() => onSuccess?.(mockCreatedOpenHouse)}>
        Mock schedule open house
      </button>
    </div>
  ),
}));

jest.mock('../OpenHouseDetailModal', () => ({
  OpenHouseDetailModal: ({ onEdit }: { onEdit?: () => void }) => (
    <button type="button" onClick={onEdit}>
      Mock edit open house
    </button>
  ),
}));

describe('OpenHouses', () => {
  beforeEach(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const upcomingStart = new Date(currentYear, currentMonth, 18, 9, 0, 0).toISOString();
    const upcomingEnd = new Date(currentYear, currentMonth, 18, 12, 0, 0).toISOString();
    const pastStart = new Date(currentYear, currentMonth, 10, 14, 0, 0).toISOString();
    const pastEnd = new Date(currentYear, currentMonth, 10, 17, 0, 0).toISOString();

    getPropertyOpenHouses.mockResolvedValue([
      {
        id: 'oh-1',
        property_id: 'property-1',
        property_title: 'Greenstone Home',
        agent_id: 'agent-1',
        scheduled_at: upcomingStart,
        end_at: upcomingEnd,
        max_attendees: 30,
        description: 'Morning showcase',
        status: 'scheduled',
        cancel_reason: null,
        rescheduled_at: null,
        rescheduled_reason: null,
        preparation_checklist: [],
        marketing_options: [],
        created_at: '2026-03-10T08:00:00.000Z',
      },
      {
        id: 'oh-2',
        property_id: 'property-1',
        property_title: 'Greenstone Home',
        agent_id: 'agent-1',
        scheduled_at: pastStart,
        end_at: pastEnd,
        max_attendees: 20,
        description: 'Investor walk-through',
        status: 'completed',
        cancel_reason: null,
        rescheduled_at: null,
        rescheduled_reason: null,
        preparation_checklist: [],
        marketing_options: [],
        created_at: '2026-03-01T08:00:00.000Z',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the default grouped list view', async () => {
    render(
      <OpenHouses
        propertyId="property-1"
        authToken="token"
        propertyAddress="123 Test Street"
        currentAgentName="Test Agent"
      />,
    );

    await screen.findByText('Morning showcase');

    expect(screen.getAllByText('Upcoming').length).toBeGreaterThan(0);
    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.getByText('Morning showcase')).toBeInTheDocument();
    expect(screen.getByText('Investor walk-through')).toBeInTheDocument();
  });

  it('switches to calendar view and shows the selected day details', async () => {
    render(
      <OpenHouses
        propertyId="property-1"
        authToken="token"
        propertyAddress="123 Test Street"
        currentAgentName="Test Agent"
      />,
    );

    const monthLabel = new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

    await screen.findByText('Morning showcase');

    fireEvent.click(screen.getByRole('radio', { name: 'Calendar view' }));

    expect(await screen.findByText('Open House Calendar')).toBeInTheDocument();
    expect(screen.getByText(monthLabel)).toBeInTheDocument();
    expect(screen.getByText('Selected Day')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
  });

  it('pre-populates description and max attendees when editing an open house', async () => {
    render(
      <OpenHouses
        propertyId="property-1"
        authToken="token"
        propertyAddress="123 Test Street"
        currentAgentName="Test Agent"
      />,
    );

    // Wait for the list, then click the card to open the detail modal
    await screen.findByText('Morning showcase');
    fireEvent.click(screen.getByText('Morning showcase').closest('button')!);

    // Detail modal renders with an edit button — click it
    fireEvent.click(await screen.findByRole('button', { name: 'Mock edit open house' }));

    // Schedule modal should now receive the full record and render pre-filled sentinel values
    expect(await screen.findByTestId('prefilled-description')).toHaveTextContent('Morning showcase');
    expect(screen.getByTestId('prefilled-max-attendees')).toHaveTextContent('30');
  });

  it('shows a newly created open house immediately after scheduling', async () => {
    render(
      <OpenHouses
        propertyId="property-1"
        authToken="token"
        propertyAddress="123 Test Street"
        currentAgentName="Test Agent"
      />,
    );

    await screen.findByText('Morning showcase');

    fireEvent.click(screen.getByRole('button', { name: 'Mock schedule open house' }));

    expect(screen.getByText('Open Houses (3)')).toBeInTheDocument();
    expect(screen.getByText('Freshly scheduled showcase')).toBeInTheDocument();
  });

  it('places a scheduled-but-already-ended open house in the Past section, not Upcoming', async () => {
    const now = new Date();
    const endedStart = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(); // 2 h ago
    const endedEnd = new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString();   // 1 h ago

    getPropertyOpenHouses.mockResolvedValue([
      {
        id: 'oh-ended',
        property_id: 'property-1',
        property_title: 'Greenstone Home',
        agent_id: 'agent-1',
        scheduled_at: endedStart,
        end_at: endedEnd,
        max_attendees: null,
        description: 'Ended but still scheduled',
        status: 'scheduled',
        cancel_reason: null,
        rescheduled_at: null,
        rescheduled_reason: null,
        preparation_checklist: [],
        marketing_options: [],
        created_at: '2026-03-10T08:00:00.000Z',
      },
    ]);

    render(
      <OpenHouses
        propertyId="property-1"
        authToken="token"
        propertyAddress="123 Test Street"
        currentAgentName="Test Agent"
      />,
    );

    await screen.findByText('Ended but still scheduled');

    // Should appear under "Past" (it ended), not "Upcoming"
    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument();
  });

  it('places a currently-running open house in the In Progress section', async () => {
    const now = new Date();
    const inProgressStart = new Date(now.getTime() - 30 * 60 * 1000).toISOString(); // started 30 min ago
    const inProgressEnd = new Date(now.getTime() + 30 * 60 * 1000).toISOString();   // ends in 30 min

    getPropertyOpenHouses.mockResolvedValue([
      {
        id: 'oh-live',
        property_id: 'property-1',
        property_title: 'Greenstone Home',
        agent_id: 'agent-1',
        scheduled_at: inProgressStart,
        end_at: inProgressEnd,
        max_attendees: null,
        description: 'Currently running',
        status: 'scheduled',
        cancel_reason: null,
        rescheduled_at: null,
        rescheduled_reason: null,
        preparation_checklist: [],
        marketing_options: [],
        created_at: '2026-03-10T08:00:00.000Z',
      },
    ]);

    render(
      <OpenHouses
        propertyId="property-1"
        authToken="token"
        propertyAddress="123 Test Street"
        currentAgentName="Test Agent"
      />,
    );

    await screen.findByText('Currently running');

    // Should appear under "In Progress", not "Upcoming" or "Past"
    expect(screen.getAllByText('In Progress').length).toBeGreaterThan(0);
    expect(screen.queryByText('Upcoming')).not.toBeInTheDocument();
    expect(screen.queryByText('Past')).not.toBeInTheDocument();
  });
});