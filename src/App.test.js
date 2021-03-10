import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/Your clipboard will be automatically destroyed on first read./i);
  expect(linkElement).toBeInTheDocument();
});
