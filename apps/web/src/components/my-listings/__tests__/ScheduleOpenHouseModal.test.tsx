import { fireEvent, render, screen } from '@testing-library/react';
import { ScheduleOpenHouseModal } from '../ScheduleOpenHouseModal';
import type { OpenHouseRecord } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  agentApi: {
    createOpenHouse: jest.fn(),
    rescheduleOpenHouse: jest.fn(),
  },
}));

const baseProps = {
  open: true,
  onOpenChange: jest.fn(),
  propertyId: 'prop-1',
  authToken: 'token',
  propertyAddress: '123 Test St',
};

/** Fill step-1 date/time fields and advance to step 4 via three Next clicks. */
function navigateToStep4() {
  const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
  fireEvent.change(dateInput, { target: { value: '2026-04-01' } });

  const timeInputs = document.querySelectorAll('input[type="time"]');
  fireEvent.change(timeInputs[0], { target: { value: '10:00' } });
  fireEvent.change(timeInputs[1], { target: { value: '12:00' } });

  // Next → step 2
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  // Next → step 3
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
  // Next → step 4
  fireEvent.click(screen.getByRole('button', { name: 'Next' }));
}

describe('ScheduleOpenHouseModal — preparation checklist (step 4)', () => {
  afterEach(() => jest.clearAllMocks());

  it('shows all default checklist tasks on step 4', () => {
    render(<ScheduleOpenHouseModal {...baseProps} />);
    navigateToStep4();

    expect(screen.getByText('Print marketing materials')).toBeInTheDocument();
    expect(screen.getByText('Install directional signage')).toBeInTheDocument();
    expect(screen.getByText('Set up refreshments')).toBeInTheDocument();
    expect(screen.getByText('Arrange photography')).toBeInTheDocument();
    expect(screen.getByText('Prepare sign-in sheets')).toBeInTheDocument();
  });

  it('adds a custom task when the agent types a label and clicks Add', () => {
    render(<ScheduleOpenHouseModal {...baseProps} />);
    navigateToStep4();

    const input = screen.getByPlaceholderText('Add a custom task...');
    fireEvent.change(input, { target: { value: 'Brew fresh coffee' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));

    expect(screen.getByText('Brew fresh coffee')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('adds a custom task when Enter is pressed in the input', () => {
    render(<ScheduleOpenHouseModal {...baseProps} />);
    navigateToStep4();

    const input = screen.getByPlaceholderText('Add a custom task...');
    fireEvent.change(input, { target: { value: 'Unlock side gate' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('Unlock side gate')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('removes a task when the trash button is clicked', () => {
    render(<ScheduleOpenHouseModal {...baseProps} />);
    navigateToStep4();

    expect(screen.getByText('Set up refreshments')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove Set up refreshments' }));
    expect(screen.queryByText('Set up refreshments')).not.toBeInTheDocument();
    // other items remain
    expect(screen.getByText('Print marketing materials')).toBeInTheDocument();
  });

  it('pre-loads the saved checklist when editing an open house', () => {
    const record: OpenHouseRecord = {
      id: 'oh-edit',
      property_id: 'prop-1',
      property_title: 'Test Home',
      agent_id: 'agent-1',
      scheduled_at: '2026-04-10T10:00:00.000Z',
      end_at: '2026-04-10T12:00:00.000Z',
      max_attendees: null,
      description: null,
      status: 'scheduled',
      cancel_reason: null,
      rescheduled_at: null,
      rescheduled_reason: null,
      preparation_checklist: [
        { task: 'Custom saved task A', completed: true },
        { task: 'Custom saved task B', completed: false },
      ],
      marketing_options: [],
      created_at: '2026-04-01T08:00:00.000Z',
    };

    render(<ScheduleOpenHouseModal {...baseProps} openHouseId="oh-edit" openHouseRecord={record} />);
    navigateToStep4();

    expect(screen.getByText('Custom saved task A')).toBeInTheDocument();
    expect(screen.getByText('Custom saved task B')).toBeInTheDocument();
    // Default items should NOT be rendered since saved checklist is provided
    expect(screen.queryByText('Print marketing materials')).not.toBeInTheDocument();
  });

  it('falls back to default checklist when saved checklist is empty', () => {
    const record: OpenHouseRecord = {
      id: 'oh-edit',
      property_id: 'prop-1',
      property_title: 'Test Home',
      agent_id: 'agent-1',
      scheduled_at: '2026-04-10T10:00:00.000Z',
      end_at: '2026-04-10T12:00:00.000Z',
      max_attendees: null,
      description: null,
      status: 'scheduled',
      cancel_reason: null,
      rescheduled_at: null,
      rescheduled_reason: null,
      preparation_checklist: [],
      marketing_options: [],
      created_at: '2026-04-01T08:00:00.000Z',
    };

    render(<ScheduleOpenHouseModal {...baseProps} openHouseId="oh-edit" openHouseRecord={record} />);
    navigateToStep4();

    expect(screen.getByText('Print marketing materials')).toBeInTheDocument();
  });
});
