import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import StickyCtaBar from '../StickyCtaBar';

// Minimal IntersectionObserver mock
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    MockIntersectionObserver.instances.push(this);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
  static instances: MockIntersectionObserver[] = [];
  /** Helper to trigger an intersection change in tests */
  static trigger(isIntersecting: boolean) {
    const instance = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    if (instance) {
      act(() => {
        instance.callback(
          [{ isIntersecting } as IntersectionObserverEntry],
          instance as unknown as IntersectionObserver,
        );
      });
    }
  }
}

beforeEach(() => {
  MockIntersectionObserver.instances = [];
  Object.defineProperty(window, 'IntersectionObserver', {
    value: MockIntersectionObserver,
    writable: true,
  });
});

describe('StickyCtaBar', () => {
  const heroRef = { current: document.createElement('div') };
  const defaultProps = {
    heroRef,
    propertyTitle: 'Beautiful Home',
    price: 'R 1,500,000',
    isSaved: false,
    onContactAgent: jest.fn(),
    onScheduleViewing: jest.fn(),
    onToggleSave: jest.fn(),
  };

  it('renders with translate-y-full initially (hidden)', () => {
    render(<StickyCtaBar {...defaultProps} />);
    const bar = screen.getByTestId('sticky-cta-bar');
    expect(bar.className).toContain('translate-y-full');
  });

  it('shows bar when hero scrolls out of view', () => {
    render(<StickyCtaBar {...defaultProps} />);
    MockIntersectionObserver.trigger(false);
    const bar = screen.getByTestId('sticky-cta-bar');
    expect(bar.className).toContain('translate-y-0');
  });

  it('hides bar when hero is back in view', () => {
    render(<StickyCtaBar {...defaultProps} />);
    MockIntersectionObserver.trigger(false);
    MockIntersectionObserver.trigger(true);
    const bar = screen.getByTestId('sticky-cta-bar');
    expect(bar.className).toContain('translate-y-full');
  });

  it('fires onContactAgent', () => {
    render(<StickyCtaBar {...defaultProps} />);
    MockIntersectionObserver.trigger(false);
    fireEvent.click(screen.getByText('Contact Agent'));
    expect(defaultProps.onContactAgent).toHaveBeenCalled();
  });

  it('fires onScheduleViewing', () => {
    render(<StickyCtaBar {...defaultProps} />);
    MockIntersectionObserver.trigger(false);
    fireEvent.click(screen.getByText('Schedule Viewing'));
    expect(defaultProps.onScheduleViewing).toHaveBeenCalled();
  });

  it('fires onToggleSave', () => {
    render(<StickyCtaBar {...defaultProps} />);
    MockIntersectionObserver.trigger(false);
    fireEvent.click(screen.getByText('Save'));
    expect(defaultProps.onToggleSave).toHaveBeenCalled();
  });

  it('shows "Saved" when isSaved is true', () => {
    render(<StickyCtaBar {...defaultProps} isSaved={true} />);
    MockIntersectionObserver.trigger(false);
    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('disables buttons when disabled prop is true', () => {
    render(<StickyCtaBar {...defaultProps} disabled={true} />);
    MockIntersectionObserver.trigger(false);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((b) => expect(b).toBeDisabled());
  });
});
