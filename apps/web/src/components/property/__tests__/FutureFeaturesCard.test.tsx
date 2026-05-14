import React from 'react';
import { render, screen } from '@testing-library/react';
import FutureFeaturesCard from '../FutureFeaturesCard';

describe('FutureFeaturesCard', () => {
  const defaultProps = {
    title: '3D Virtual Walkthrough',
    description: 'Immersive 3D tours for remote viewing.',
    icon: <span data-testid="mock-icon">icon</span>,
  };

  it('renders the title', () => {
    render(<FutureFeaturesCard {...defaultProps} />);
    expect(screen.getByText('3D Virtual Walkthrough')).toBeInTheDocument();
  });

  it('renders the description', () => {
    render(<FutureFeaturesCard {...defaultProps} />);
    expect(screen.getByText('Immersive 3D tours for remote viewing.')).toBeInTheDocument();
  });

  it('renders the icon', () => {
    render(<FutureFeaturesCard {...defaultProps} />);
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders Coming Soon badge', () => {
    render(<FutureFeaturesCard {...defaultProps} />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('has a dashed border style', () => {
    const { container } = render(<FutureFeaturesCard {...defaultProps} />);
    const card = container.firstChild as HTMLElement;
    expect(card.className).toMatch(/dashed/);
  });
});
