import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

vi.mock("../../lib/api", () => ({
  getDealApi: vi.fn(),
  signDealApi: vi.fn(),
}));

import * as api from "../../lib/api";
import CheckoutPage from "./CheckoutPage.jsx";

const getDealApi = vi.mocked(api.getDealApi);
const signDealApi = vi.mocked(api.signDealApi);

const DEAL = {
  id: "deal-1",
  order_id: "order-1",
  provider_name: "Acme Infrastructure",
  asset_name: "CAT 336 Excavator",
  amount: "1500.00",
  payment_method: "visa",
};

const renderCheckout = (orderId = "order-1") =>
  render(
    <MemoryRouter initialEntries={ [`/checkout/${orderId}` ]}>
      <Routes>
        <Route path="/checkout/:orderId" element={<CheckoutPage />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.resetAllMocks();
  getDealApi.mockResolvedValue(DEAL);
  signDealApi.mockResolvedValue({});
});

const advanceToSign = async () => {
  await waitFor(() => expect(screen.getByText(/choose payment method/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/continue/i));
  await waitFor(() => expect(screen.getByText(/\$1,500.00/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/continue/i));
  await waitFor(() => expect(screen.getByText(/confirm lease agreement/i)).toBeInTheDocument());
  fireEvent.click(screen.getByText(/confirm deal/i));
  await waitFor(() => expect(screen.getByText(/sign deal/i)).toBeInTheDocument());
};

describe("CheckoutPage deal flow", () => {
  it("loads a deal and renders the payment step", async () => {
    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText(/acme infrastructure/i)).toBeInTheDocument();
      expect(getDealApi).toHaveBeenCalledWith("order-1");
    });
    expect(screen.getByText(/choose payment method/i)).toBeInTheDocument();
  });

  it("shows an error when the deal cannot be loaded", async () => {
    getDealApi.mockRejectedValue(new Error("Unable to load this deal."));

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText(/unable to load this deal/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/back to marketplace/i)).toBeInTheDocument();
  });

  it("advances through checkout steps to the sign step", async () => {
    renderCheckout();

    await advanceToSign();
    const complete = screen.getByRole("button", { name: /complete/i });
    expect(complete).toBeDisabled();
  });

  it("requires a signature before completing the deal", async () => {
    renderCheckout();

    await advanceToSign();
    expect(screen.getByRole("button", { name: /complete/i })).toBeDisabled();
    expect(signDealApi).not.toHaveBeenCalled();
  });
});
