import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";
import StatusPill from "./StatusPill";
import Pill from "./Pill";
import Card from "./Card";

describe("Button", () => {
  it("renders children and calls onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    const btn = screen.getByRole("button", { name: /click me/i });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies variant class", () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole("button", { name: /ghost/i })).toHaveClass("bg-transparent");
  });
});

describe("StatusPill", () => {
  it("renders gold for available status", () => {
    render(<StatusPill status="available" label="Ready" />);
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it("renders pending status", () => {
    render(<StatusPill status="pending" />);
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });
});

describe("Pill", () => {
  it("renders label text", () => {
    render(<Pill>Hot</Pill>);
    expect(screen.getByText(/hot/i)).toBeInTheDocument();
  });
});

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText(/card content/i)).toBeInTheDocument();
  });
});
