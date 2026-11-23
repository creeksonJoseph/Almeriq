import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Button from "./Button";
import StatusPill from "./StatusPill";
import Pill from "./Pill";
import Card from "./Card";
import Input from "./Input";
import Textarea from "./Textarea";
import Select from "./Select";

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


describe("Shared form controls", () => {
  it("uses the canonical dark input class", () => {
    render(<Input aria-label="Email" />);
    expect(screen.getByRole("textbox", { name: /email/i })).toHaveClass("alq-input");
  });

  it("uses the canonical dark textarea class", () => {
    render(<Textarea aria-label="Biography" />);
    expect(screen.getByRole("textbox", { name: /biography/i })).toHaveClass("alq-textarea");
  });

  it("uses the canonical dark select class", () => {
    render(<Select aria-label="Country"><option value="ke">Kenya</option></Select>);
    expect(screen.getByRole("combobox", { name: /country/i })).toHaveClass("alq-select");
  });
});
