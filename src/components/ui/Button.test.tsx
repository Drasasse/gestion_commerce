import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders with default props', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button', { name: /test button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600'); // variant primary par défaut
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-100');

    rerender(<Button variant="success">Success</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-green-600');

    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9', 'px-3', 'text-sm');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-11', 'px-6', 'text-lg');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(screen.getByText('Loading Button')).toBeInTheDocument();
    // Vérifier la présence du spinner
    expect(button.querySelector('svg')).toBeInTheDocument();
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button');

    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
  });

  it('renders with left icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(
      <Button leftIcon={<TestIcon />}>
        Button with Icon
      </Button>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Button with Icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(
      <Button rightIcon={<TestIcon />}>
        Button with Icon
      </Button>
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByText('Button with Icon')).toBeInTheDocument();
  });

  it('renders as icon-only button', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(
      <Button size="icon" leftIcon={<TestIcon />} aria-label="Icon button" />
    );
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Icon button')).toBeInTheDocument();
  });

  it('renders with full width', () => {
    render(<Button fullWidth>Full Width Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('w-full');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button');
    
    expect(button).toHaveClass('custom-class');
  });

  it('prevents click when loading', () => {
    const handleClick = vi.fn();
    render(<Button loading onClick={handleClick}>Loading Button</Button>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('hides icons when loading', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(
      <Button loading leftIcon={<TestIcon />} rightIcon={<TestIcon />}>
        Loading Button
      </Button>
    );
    
    expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
  });
});