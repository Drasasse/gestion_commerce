import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text');
    
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-gray-300');
    // Le type par défaut n'est pas explicitement défini dans le composant
  });

  it('renders with different types', () => {
    const { rerender } = render(<Input type="email" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'email');

    rerender(<Input type="password" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveAttribute('type', 'number');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Input inputSize="sm" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('h-9', 'text-sm');

    rerender(<Input inputSize="lg" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('h-11', 'text-lg');
  });

  it('shows error state', () => {
    render(<Input error="This field is required" data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveClass('border-red-500');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows success variant', () => {
    render(<Input variant="success" data-testid="input" />);
    const input = screen.getByTestId('input');
    
    expect(input).toHaveClass('border-green-500');
  });

  it('can be disabled', () => {
    render(<Input disabled placeholder="Disabled input" />);
    const input = screen.getByPlaceholderText('Disabled input');

    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed');
  });

  it('handles value changes', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    render(<Input onChange={handleChange} placeholder="Type here" />);
    const input = screen.getByPlaceholderText('Type here');
    
    await user.type(input, 'Hello');
    
    expect(handleChange).toHaveBeenCalledTimes(5); // Une fois par caractère
    expect(input).toHaveValue('Hello');
  });

  it('handles focus and blur events', async () => {
    const user = userEvent.setup();
    const handleFocus = vi.fn();
    const handleBlur = vi.fn();
    
    render(
      <Input 
        onFocus={handleFocus} 
        onBlur={handleBlur} 
        placeholder="Focus test" 
      />
    );
    const input = screen.getByPlaceholderText('Focus test');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('renders with left icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<Input leftIcon={<TestIcon />} placeholder="Input with icon" />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Input with icon')).toBeInTheDocument();
  });

  it('renders with right icon', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    render(<Input rightIcon={<TestIcon />} placeholder="Input with icon" />);
    
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Input with icon')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Input label="Test Label" placeholder="Input" />);
    
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('renders with required indicator', () => {
    render(<Input label="Required Field" required placeholder="Input" />);
    
    expect(screen.getByText('Required Field')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('renders with helper text', () => {
    render(<Input helperText="This is helper text" placeholder="Input" />);
    
    expect(screen.getByText('This is helper text')).toBeInTheDocument();
    expect(screen.getByText('This is helper text')).toHaveClass('text-sm', 'text-gray-500');
  });

  it('renders with error message', () => {
    render(<Input error="This field is required" placeholder="Input" />);
    
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('This field is required')).toHaveClass('text-sm', 'text-red-600');
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" data-testid="input" />);
    expect(screen.getByTestId('input')).toHaveClass('custom-input');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<Input ref={ref} placeholder="Ref input" />);
    
    expect(ref).toHaveBeenCalled();
  });

  it('supports controlled input', async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();
    
    const { rerender } = render(
      <Input value="initial" onChange={handleChange} placeholder="Controlled" />
    );
    
    const input = screen.getByPlaceholderText('Controlled');
    expect(input).toHaveValue('initial');
    
    await user.clear(input);
    await user.type(input, 'new value');
    
    // Vérifier que onChange a été appelé
    expect(handleChange).toHaveBeenCalled();
    
    // Simuler la mise à jour de la valeur par le parent
    rerender(
      <Input value="new value" onChange={handleChange} placeholder="Controlled" />
    );
    
    expect(input).toHaveValue('new value');
  });

  it('handles keyboard events', async () => {
    const user = userEvent.setup();
    const handleKeyDown = vi.fn();
    const handleKeyUp = vi.fn();
    
    render(
      <Input 
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder="Keyboard test" 
      />
    );
    const input = screen.getByPlaceholderText('Keyboard test');
    
    await user.type(input, 'a');
    
    expect(handleKeyDown).toHaveBeenCalled();
    expect(handleKeyUp).toHaveBeenCalled();
  });

  it('adjusts padding for icons', () => {
    const TestIcon = () => <span data-testid="test-icon">Icon</span>;
    
    const { rerender } = render(
      <Input leftIcon={<TestIcon />} placeholder="Left icon" data-testid="input" />
    );
    expect(screen.getByTestId('input')).toHaveClass('pl-10');
    
    rerender(
      <Input rightIcon={<TestIcon />} placeholder="Right icon" data-testid="input" />
    );
    expect(screen.getByTestId('input')).toHaveClass('pr-10');
  });
});