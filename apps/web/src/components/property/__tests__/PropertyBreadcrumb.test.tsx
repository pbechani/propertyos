import React from 'react';
import { render, screen } from '@testing-library/react';
import PropertyBreadcrumb from '../PropertyBreadcrumb';

// Mock Link
jest.mock('@/lib/router-compat', () => ({
  Link: ({ children, to, ...rest }: { children: React.ReactNode; to: string; [k: string]: unknown }) => (
    <a href={to} {...rest}>{children}</a>
  ),
}));

describe('PropertyBreadcrumb', () => {
  const defaultProps = {
    propertyType: 'residential',
    city: 'Cape Town',
    region: 'Western Cape',
    title: 'Beautiful 3BR Home',
  };

  it('renders Home and Properties links', () => {
    render(<PropertyBreadcrumb {...defaultProps} />);
    const homeLink = screen.getByText('Home');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
    const propsLink = screen.getByText('Properties');
    expect(propsLink.closest('a')).toHaveAttribute('href', '/properties');
  });

  it('renders humanised property type as a link', () => {
    render(<PropertyBreadcrumb {...defaultProps} />);
    const typeLink = screen.getByText('Residential');
    expect(typeLink.closest('a')).toHaveAttribute('href', '/properties?type=residential');
  });

  it('renders region and city', () => {
    render(<PropertyBreadcrumb {...defaultProps} />);
    expect(screen.getByText('Western Cape')).toBeInTheDocument();
    expect(screen.getByText('Cape Town')).toBeInTheDocument();
  });

  it('renders the property title as plain text (not a link)', () => {
    render(<PropertyBreadcrumb {...defaultProps} />);
    const title = screen.getByText('Beautiful 3BR Home');
    expect(title.tagName).toBe('SPAN');
    expect(title.closest('a')).toBeNull();
  });

  it('omits city when same as region', () => {
    render(<PropertyBreadcrumb {...defaultProps} city="Western Cape" />);
    // Should only appear once
    const elements = screen.getAllByText('Western Cape');
    expect(elements).toHaveLength(1);
  });

  it('omits region when null', () => {
    render(<PropertyBreadcrumb {...defaultProps} region={null} />);
    expect(screen.queryByText('Western Cape')).not.toBeInTheDocument();
    expect(screen.getByText('Cape Town')).toBeInTheDocument();
  });

  it('omits city when null', () => {
    render(<PropertyBreadcrumb {...defaultProps} city={null} />);
    expect(screen.queryByText('Cape Town')).not.toBeInTheDocument();
    expect(screen.getByText('Western Cape')).toBeInTheDocument();
  });

  it('renders separator chevrons', () => {
    render(<PropertyBreadcrumb {...defaultProps} />);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    // Each crumb after the first should have a separator — check multiple
    expect(nav.querySelectorAll('svg').length).toBeGreaterThanOrEqual(3);
  });
});
