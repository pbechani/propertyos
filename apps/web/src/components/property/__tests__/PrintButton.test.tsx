import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PrintButton from '../PrintButton';

describe('PrintButton', () => {
  it('renders a button with printer text', () => {
    render(<PrintButton />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('calls window.print when clicked', () => {
    const printSpy = jest.spyOn(window, 'print').mockImplementation(() => {});
    render(<PrintButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(printSpy).toHaveBeenCalledTimes(1);
    printSpy.mockRestore();
  });

  it('is disabled when disabled prop is true', () => {
    render(<PrintButton disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled by default', () => {
    render(<PrintButton />);
    expect(screen.getByRole('button')).not.toBeDisabled();
  });
});
