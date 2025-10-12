import { render, screen } from '@testing-library/react';
import { Badge, PaymentStatusBadge, StockLevelBadge } from './Badge';

describe('Badge', () => {
  it('renders with default props', () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText('Default Badge')).toBeInTheDocument();
    expect(screen.getByText('Default Badge')).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  it('renders different variants', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>);
    expect(screen.getByText('Primary')).toHaveClass('bg-blue-100', 'text-blue-800');

    rerender(<Badge variant="success">Success</Badge>);
    expect(screen.getByText('Success')).toHaveClass('bg-green-100', 'text-green-800');

    rerender(<Badge variant="warning">Warning</Badge>);
    expect(screen.getByText('Warning')).toHaveClass('bg-orange-100', 'text-orange-800');

    rerender(<Badge variant="danger">Danger</Badge>);
    expect(screen.getByText('Danger')).toHaveClass('bg-red-100', 'text-red-800');

    rerender(<Badge variant="info">Info</Badge>);
    expect(screen.getByText('Info')).toHaveClass('bg-cyan-100', 'text-cyan-800');

    rerender(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText('Outline')).toHaveClass('border-2', 'bg-transparent');

    rerender(<Badge variant="solid">Solid</Badge>);
    expect(screen.getByText('Solid')).toHaveClass('bg-gray-800', 'text-white');
  });

  it('renders different sizes', () => {
    const { rerender } = render(<Badge size="sm">Small</Badge>);
    expect(screen.getByText('Small')).toHaveClass('text-xs');

    rerender(<Badge size="md">Medium</Badge>);
    expect(screen.getByText('Medium')).toHaveClass('text-sm');

    rerender(<Badge size="lg">Large</Badge>);
    expect(screen.getByText('Large')).toHaveClass('text-base');
  });

  it('renders with dot indicator', () => {
    render(<Badge showDot>With Dot</Badge>);
    const badge = screen.getByText('With Dot');
    const dot = badge.querySelector('span[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('h-1.5', 'w-1.5', 'rounded-full', 'bg-gray-600');
  });

  it('applies custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>);
    expect(screen.getByText('Custom')).toHaveClass('custom-class');
  });

  it('renders as span element by default', () => {
    render(<Badge>Default Badge</Badge>);
    expect(screen.getByText('Default Badge').tagName).toBe('SPAN');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Badge ref={ref}>Ref Badge</Badge>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});

describe('PaymentStatusBadge', () => {
  it('renders paid status correctly', () => {
    render(<PaymentStatusBadge status="PAYE" />);
    expect(screen.getByText('Payé')).toBeInTheDocument();
    expect(screen.getByText('Payé')).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders unpaid status correctly', () => {
    render(<PaymentStatusBadge status="IMPAYE" />);
    expect(screen.getByText('Impayé')).toBeInTheDocument();
    expect(screen.getByText('Impayé')).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('renders partial status correctly', () => {
    render(<PaymentStatusBadge status="PARTIEL" />);
    expect(screen.getByText('Partiel')).toBeInTheDocument();
    expect(screen.getByText('Partiel')).toHaveClass('bg-orange-100', 'text-orange-800');
  });
});

describe('StockLevelBadge', () => {
  it('renders high stock level correctly', () => {
    render(<StockLevelBadge quantity={100} threshold={10} />);
    expect(screen.getByText('En stock')).toBeInTheDocument();
    expect(screen.getByText('En stock')).toHaveClass('bg-green-100', 'text-green-800');
  });

  it('renders low stock level correctly', () => {
    render(<StockLevelBadge quantity={5} threshold={10} />);
    expect(screen.getByText('Stock faible')).toBeInTheDocument();
    expect(screen.getByText('Stock faible')).toHaveClass('bg-orange-100', 'text-orange-800');
  });

  it('renders out of stock correctly', () => {
    render(<StockLevelBadge quantity={0} threshold={10} />);
    expect(screen.getByText('Rupture')).toBeInTheDocument();
    expect(screen.getByText('Rupture')).toHaveClass('bg-red-100', 'text-red-800');
  });
});