import { render, screen } from '@testing-library/react';
import PropertyVerificationChecklist from '../PropertyVerificationChecklist';

jest.mock('lucide-react', () => ({
  CheckCircle2: ({ className }: { className?: string }) => <span data-testid="check-icon" className={className} />,
  Clock: ({ className }: { className?: string }) => <span data-testid="clock-icon" className={className} />,
  XCircle: ({ className }: { className?: string }) => <span data-testid="x-icon" className={className} />,
  AlertTriangle: ({ className }: { className?: string }) => <span data-testid="alert-icon" className={className} />,
  Shield: ({ className }: { className?: string }) => <span data-testid="shield-icon" className={className} />,
}));

describe('PropertyVerificationChecklist', () => {
  it('renders the checklist title', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="unverified"
        propertyType="residential"
      />,
    );
    expect(screen.getByText('Verification Checklist')).toBeInTheDocument();
  });

  it('shows core documents for all property types', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="unverified"
        propertyType="residential"
      />,
    );
    expect(screen.getByText('Title Deed')).toBeInTheDocument();
    expect(screen.getByText('Rates Clearance')).toBeInTheDocument();
    expect(screen.getByText('Identity Verification')).toBeInTheDocument();
  });

  it('shows residential-specific compliance documents', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="unverified"
        propertyType="residential"
      />,
    );
    expect(screen.getByText('Electrical Compliance (COC)')).toBeInTheDocument();
    expect(screen.getByText('Plumbing Compliance')).toBeInTheDocument();
    expect(screen.getByText('Gas Compliance')).toBeInTheDocument();
  });

  it('shows land-specific documents', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="unverified"
        propertyType="land"
      />,
    );
    expect(screen.getByText('Survey / SG Diagram')).toBeInTheDocument();
    expect(screen.getByText('Zoning Certificate')).toBeInTheDocument();
    // Should not have residential-specific docs
    expect(screen.queryByText('Electrical Compliance (COC)')).not.toBeInTheDocument();
  });

  it('shows commercial-specific documents', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="unverified"
        propertyType="commercial"
      />,
    );
    expect(screen.getByText('Zoning Certificate')).toBeInTheDocument();
    expect(screen.getByText('Occupancy Certificate')).toBeInTheDocument();
  });

  it('marks all documents as verified when status is verified', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="verified"
        propertyType="residential"
      />,
    );
    // All 6 docs should show "Verified"
    const verifiedLabels = screen.getAllByText('Verified');
    expect(verifiedLabels.length).toBe(6);
  });

  it('shows progress bar counter', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="pending"
        propertyType="land"
      />,
    );
    // land = 5 docs, pending = 3 core docs as pending (not "verified")
    expect(screen.getByText('0/5')).toBeInTheDocument();
  });

  it('shows verified date when provided', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="verified"
        verifiedAt="2025-06-15T10:00:00Z"
        propertyType="residential"
      />,
    );
    expect(screen.getByText(/Last verified/)).toBeInTheDocument();
  });

  it('does not show verified date when null', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="unverified"
        verifiedAt={null}
        propertyType="residential"
      />,
    );
    expect(screen.queryByText(/Last verified/)).not.toBeInTheDocument();
  });

  it('shows flagged status for all documents when overall status is flagged', () => {
    render(
      <PropertyVerificationChecklist
        overallStatus="flagged"
        propertyType="residential"
      />,
    );
    // Title Deed should show "Flagged"
    const flaggedLabels = screen.getAllByText('Flagged');
    expect(flaggedLabels.length).toBeGreaterThan(0);
  });
});
