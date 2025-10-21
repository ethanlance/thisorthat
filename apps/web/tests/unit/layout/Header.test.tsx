import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Header from '@/components/layout/Header';

describe('Header Component', () => {
  it('renders the ThisOrThat logo', () => {
    render(<Header />);
    expect(screen.getByText('ThisOrThat')).toBeInTheDocument();
  });

  it('renders navigation links', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Polls')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('renders mobile menu button', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<Header />);
    const menuButton = screen.getByLabelText('Toggle menu');
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
  });
});
