import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ContactPreferences from '../ContactPreferences';

describe('ContactPreferences', () => {
  const defaultProps = {
    preferredContactMethod: '',
    bestContactTime: '',
    onContactMethodChange: jest.fn(),
    onContactTimeChange: jest.fn(),
  };

  afterEach(() => jest.clearAllMocks());

  it('renders two select elements', () => {
    render(<ContactPreferences {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);
  });

  it('displays contact method label', () => {
    render(<ContactPreferences {...defaultProps} />);
    expect(screen.getByText(/Preferred contact/i)).toBeInTheDocument();
  });

  it('displays best time label', () => {
    render(<ContactPreferences {...defaultProps} />);
    expect(screen.getByText(/Best time/i)).toBeInTheDocument();
  });

  it('calls onContactMethodChange when method select changes', () => {
    render(<ContactPreferences {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'whatsapp' } });
    expect(defaultProps.onContactMethodChange).toHaveBeenCalledWith('whatsapp');
  });

  it('calls onContactTimeChange when time select changes', () => {
    render(<ContactPreferences {...defaultProps} />);
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[1], { target: { value: 'morning' } });
    expect(defaultProps.onContactTimeChange).toHaveBeenCalledWith('morning');
  });

  it('disables both selects when disabled prop is true', () => {
    render(<ContactPreferences {...defaultProps} disabled />);
    const selects = screen.getAllByRole('combobox');
    selects.forEach((sel) => expect(sel).toBeDisabled());
  });

  it('renders correct options for contact method', () => {
    render(<ContactPreferences {...defaultProps} />);
    expect(screen.getByText('Phone call')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('WhatsApp')).toBeInTheDocument();
  });
});
