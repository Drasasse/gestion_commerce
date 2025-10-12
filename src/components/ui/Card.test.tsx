import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default props', () => {
      render(<Card data-testid="card">Card Content</Card>);
      const card = screen.getByTestId('card');
      
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('bg-white', 'border', 'border-gray-200');
      expect(screen.getByText('Card Content')).toBeInTheDocument();
    });

    it('renders with different variants', () => {
    const { rerender } = render(<Card variant="elevated" data-testid="card">Elevated card</Card>);
    expect(screen.getByTestId('card')).toHaveClass('shadow-md');

    rerender(<Card variant="outlined" data-testid="card">Outlined card</Card>);
    expect(screen.getByTestId('card')).toHaveClass('border-gray-300');

    rerender(<Card variant="filled" data-testid="card">Filled card</Card>);
    expect(screen.getByTestId('card')).toHaveClass('bg-gray-50');
  });

    it('renders with different padding', () => {
    const { rerender } = render(<Card padding="sm" data-testid="card">Small padding</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-4');

    rerender(<Card padding="lg" data-testid="card">Large padding</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-8');

    rerender(<Card padding="none" data-testid="card">No padding</Card>);
    expect(screen.getByTestId('card')).not.toHaveClass('p-4', 'p-6', 'p-8');
  });

    it('applies hover effects when specified', () => {
    render(<Card hover data-testid="card">Hoverable card</Card>);
    expect(screen.getByTestId('card')).toHaveClass('hover:shadow-lg', 'cursor-pointer');
  });

    it('applies custom className', () => {
      render(<Card className="custom-class" data-testid="card">Content</Card>);
      expect(screen.getByTestId('card')).toHaveClass('custom-class');
    });
  });

  describe('CardHeader', () => {
    it('renders correctly', () => {
      render(<CardHeader data-testid="header">Header Content</CardHeader>);
      const header = screen.getByTestId('header');
      
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5');
      expect(screen.getByText('Header Content')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Content</CardHeader>);
      expect(screen.getByTestId('header')).toHaveClass('custom-header');
    });
  });

  describe('CardTitle', () => {
    it('renders as h3 by default', () => {
      render(<CardTitle>Card Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-xl', 'font-semibold', 'leading-none', 'tracking-tight');
      expect(title).toHaveTextContent('Card Title');
    });

    it('applies custom className', () => {
      render(<CardTitle className="custom-title">Title</CardTitle>);
      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveClass('custom-title');
    });
  });

  describe('CardDescription', () => {
    it('renders correctly', () => {
      render(<CardDescription data-testid="description">Card Description</CardDescription>);
      const description = screen.getByTestId('description');
      
      expect(description).toBeInTheDocument();
      expect(description).toHaveClass('text-sm', 'text-gray-600');
      expect(description).toHaveTextContent('Card Description');
    });

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="description">Description</CardDescription>);
      expect(screen.getByTestId('description')).toHaveClass('custom-desc');
    });
  });

  describe('CardContent', () => {
    it('renders correctly', () => {
      render(<CardContent data-testid="content">Card Content</CardContent>);
      const content = screen.getByTestId('content');
      
      expect(content).toBeInTheDocument();
      expect(content).toHaveClass('pt-0');
      expect(content).toHaveTextContent('Card Content');
    });

    it('applies custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>);
      expect(screen.getByTestId('content')).toHaveClass('custom-content');
    });
  });

  describe('Complete Card Structure', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test Content</p>
          </CardContent>
        </Card>
      );

      expect(screen.getByTestId('complete-card')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Test Title');
      expect(screen.getByText('Test Description')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });
});