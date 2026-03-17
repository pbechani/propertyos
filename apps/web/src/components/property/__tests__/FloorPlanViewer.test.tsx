import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FloorPlanViewer from '../FloorPlanViewer';

describe('FloorPlanViewer', () => {
  const mockFloorPlans = [
    { id: 'fp-1', url: '/floor1.png', thumbnail_url: '/floor1-thumb.png', display_order: 1 },
    { id: 'fp-2', url: '/floor2.png', thumbnail_url: null, display_order: 2 },
  ];

  it('renders nothing when floorPlans is empty', () => {
    const { container } = render(<FloorPlanViewer floorPlans={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the heading with count', () => {
    render(<FloorPlanViewer floorPlans={mockFloorPlans} />);
    expect(screen.getByText(/Floor Plans \(2\)/)).toBeInTheDocument();
  });

  it('renders thumbnail images when expanded', () => {
    render(<FloorPlanViewer floorPlans={mockFloorPlans} />);
    // Expand the accordion
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', '/floor1-thumb.png');
    // Falls back to main url when no thumbnail
    expect(images[1]).toHaveAttribute('src', '/floor2.png');
  });

  it('opens lightbox when a thumbnail is clicked', () => {
    render(<FloorPlanViewer floorPlans={mockFloorPlans} />);
    // Expand first
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);
    // Lightbox shows full-size image
    const allImages = screen.getAllByRole('img');
    const fullImage = allImages.find((img) => img.getAttribute('src') === '/floor1.png');
    expect(fullImage).toBeTruthy();
  });

  it('closes lightbox when close button is clicked', () => {
    render(<FloorPlanViewer floorPlans={mockFloorPlans} />);
    // Expand then open lightbox
    fireEvent.click(screen.getByRole('button', { expanded: false }));
    const images = screen.getAllByRole('img');
    fireEvent.click(images[0]);
    // Close lightbox
    const closeButton = screen.getByLabelText(/close/i);
    fireEvent.click(closeButton);
    // Lightbox should be gone – only thumbnail images remain (accordion still expanded)
    const remainingImages = screen.getAllByRole('img');
    expect(remainingImages).toHaveLength(2);
  });
});
