import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ChevronRight, Check, X, CreditCard, Smartphone, Lock, Shield, ArrowRight, ArrowLeft } from "lucide-react";
import { Button, Card, Skeleton, SkeletonText } from "../../components/ui";
import { getDealApi, signDealApi } from "../../lib/api";

const STEPS = [
  { id: "payment", label: "1. Payment", short: "Pay" },
  { id: "amount", label: "2. Amount", short: "Amt" },
  { id: "confirm", label: "3. Confirm", short: "Confirm" },
  { id: "sign", label: "4. Sign", short: "Sign" },
  { id: "complete", label: "5. Complete", short: "Done" },
];

const PAYMENT_METHODS = [
  { id: "visa", name: "Visa", icon: CreditCard, details: "Demo selection only — no charge", default: true },
  { id: "mastercard", name: "Mastercard", icon: CreditCard, details: "Demo selection only — no charge" },
  { id: "paypal", name: "PayPal", icon: CreditCard, details: "Demo selection only — no charge" },
  { id: "mpesa", name: "M-Pesa", icon: Smartphone, details: "Demo selection only — no charge" },
];

export default function CheckoutPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [deal, setDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [signature, setSignature] = useState("");
    const [, setCanvasRef] = useState(null);

  const paymentForm = useForm({ defaultValues: { method: "visa" } });
  const amountForm = useForm({ defaultValues: { amount: "0.00" } });
  const watchMethod = paymentForm.watch("method");
  const watchAmount = amountForm.watch("amount");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const dealRes = await getDealApi(orderId);
        const loadedDeal = dealRes.data || dealRes.deal || dealRes;
        setDeal(loadedDeal);
        amountForm.setValue("amount", String(loadedDeal.amount ?? "0.00"));
        paymentForm.setValue("method", loadedDeal.payment_method || "visa");
      } catch (e) {
        setLoadError(e.response?.data?.detail || e.message || "Unable to load this deal.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderId, amountForm, paymentForm]);

  const handleNext = () => {
    setActionError("");
    if (currentStep === 1) {
      const parsedAmount = Number(watchAmount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || Math.round(parsedAmount * 100) !== Math.round(Number(deal?.amount || 0) * 100)) {
        setActionError("The amount is fixed by the marketplace listing and cannot be changed.");
        return;
      }
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleComplete = async () => {
    setActionLoading(true);
    setActionError("");
    try {
      const amount = Number(watchAmount);
      if (!deal?.id || !signature) throw new Error("A deal and signature are required to complete checkout.");
      if (!Number.isFinite(amount) || amount <= 0) throw new Error("Enter an amount greater than zero.");
      const updatedDeal = await signDealApi(deal.id, signature, { payment_method: watchMethod, amount });
      setDeal(previous => ({ ...previous, ...(updatedDeal.data || updatedDeal.deal || updatedDeal) }));
      setCurrentStep(STEPS.length - 1);
    } catch (e) {
      setActionError(e.response?.data?.detail || e.message || "Unable to save the deal.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatAmount = (val) => {
    const num = Number(String(val ?? "0").replace(/,/g, "")) || 0;
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-6">
          <div className="h-2 flex gap-1.5 mb-6">
            {STEPS.map((_, i) => <div key={i} className="flex-1 h-1.5 rounded-full bg-border" />)}
          </div>
          <SkeletonText lines={4} />
          <Skeleton className="h-20 w-full rounded-xl mb-4" />
          <SkeletonText lines={3} />
        </div>
      </div>
    );
  }

  if (loadError || !deal) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <p role="alert" className="text-sm text-red-300">{loadError || "This deal could not be found."}</p>
        <Button onClick={() => navigate("/marketplace")}>Back to marketplace</Button>
      </div>
    );
  }

  const providerName = deal?.provider_name || "Infrastructure provider";
  const assetName = deal?.asset_name || "Selected infrastructure listing";

  return (
    <div className="min-h-screen bg-bg/80 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-6">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col max-h-[94vh] md:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Mobile Drag Bar */}
        <div className="w-full flex md:hidden items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-border"></div>
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-surface-2 border border-border/40 flex items-center justify-center font-sans font-bold text-sm text-gold shrink-0">
                {providerName.slice(0,2).toUpperCase()}
              </div>
              <div className="flex items-center gap-2 truncate">
                <span className="font-serif text-base font-semibold text-text truncate">Order from {providerName}</span>
                <span className="text-gold shrink-0" aria-label="Verified">✓</span>
              </div>
            </div>
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg text-white/60 hover:text-text hover:bg-surface-2 transition-colors ml-2 shrink-0" aria-label="Close dialog">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full flex items-center gap-1.5 pt-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${i < currentStep ? "bg-gold" : i === currentStep ? "bg-gold" : "bg-surface-2"}`} />
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex items-center justify-between text-white/60">
            <div className="hidden md:grid grid-cols-5 w-full text-center text-label-caps text-[10px] tracking-widest">
              {STEPS.map((step, i) => (
                <span key={step.id} className={`${i <= currentStep ? "text-gold font-bold" : "text-white/60"}`}>{step.label}</span>
              ))}
            </div>
            <div className="md:hidden text-label-caps text-gold font-bold">
              Step {currentStep + 1} of {STEPS.length} — {STEPS[currentStep].label.split(". ")[1]}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {actionError && <div role="alert" className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">{actionError}</div>}
          {/* Step 1: Payment Method */}
          {currentStep === 0 && (
            <PaymentStep
              methods={PAYMENT_METHODS}
              selectedMethod={watchMethod}
              onSelect={method => paymentForm.setValue("method", method)}
              onNext={handleNext}
              loading={actionLoading}
            />
          )}

          {/* Step 2: Amount */}
          {currentStep === 1 && (
            <AmountStep
              amount={deal.amount}
              onBack={handleBack}
              onNext={handleNext}
              loading={actionLoading}
              formatAmount={formatAmount}
            />
          )}

          {/* Step 3: Confirm */}
          {currentStep === 2 && (
            <ConfirmStep
              providerName={providerName}
              assetName={assetName}
              paymentMethod={PAYMENT_METHODS.find(m => m.id === watchMethod) || PAYMENT_METHODS[0]}
              amount={watchAmount}
              formatAmount={formatAmount}
              onBack={handleBack}
              onNext={handleNext}
              loading={actionLoading}
            />
          )}

          {/* Step 4: Sign */}
          {currentStep === 3 && (
            <SignStep
              canvasRef={setCanvasRef}
              signature={signature}
              onSignatureChange={setSignature}
              onBack={handleBack}
              onNext={handleComplete}
              loading={actionLoading}
            />
          )}

          {/* Step 5: Complete */}
          {currentStep === 4 && (
            <CompleteStep
              orderId={deal?.order_id || orderId}
              providerName={providerName}
              amount={watchAmount}
              formatAmount={formatAmount}
              onDone={() => navigate("/marketplace")}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function PaymentStep({ methods, selectedMethod, onSelect, onNext, loading }) {
  return (
    <div className="space-y-6" id="step-frame-1">
      <div className="flex items-center justify-between">
        <span className="text-label-caps text-white/60 tracking-widest">CHOOSE PAYMENT METHOD</span>
        <span className="flex items-center gap-1 text-xs font-mono text-gold"><span className="w-1.5 h-1.5 rounded-full bg-gold"></span> SIMULATION</span>
      </div>
      <div className="grid grid-cols-2 gap-3.5">
        {methods.map(method => (
          <label
            key={method.id}
            className={`group relative flex flex-col p-4 rounded-xl border transition-all cursor-pointer ${
              selectedMethod === method.id
                ? "bg-gold/10 border-2 border-gold"
                : "bg-surface-2 border-border hover:border-gold/50"
            }`}
          >
            <input type="radio" name="payment_method" value={method.id} checked={selectedMethod === method.id} onChange={() => onSelect(method.id)} className="sr-only" />
            <div className="flex items-center justify-between w-full mb-3">
              <method.icon className={`text-2xl ${selectedMethod === method.id ? "text-gold" : "text-white/60"}`} />
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${selectedMethod === method.id ? "bg-gold text-bg" : "bg-surface-2 text-white/60"}`}>✓</span>
            </div>
            <span className="font-serif text-base font-semibold text-text">{method.name}</span>
            <span className={`text-label-caps text-[10px] mt-0.5 ${selectedMethod === method.id ? "text-gold" : "text-white/60"}`}>{method.details}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-2 p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono text-white/60">
        <Lock className="w-4 h-4 text-gold" />
        <span>Demo only. No real payment details are requested or stored.</span>
      </div>
      <Button className="w-full h-12" onClick={onNext} disabled={loading}>
        <span>Continue</span>
        <ArrowRight className="w-4 h-4" />
      </Button>
    </div>
  );
}

function AmountStep({ amount, onBack, onNext, loading, formatAmount }) {
  return (
    <div className="space-y-6" id="step-frame-2">
      <div className="flex items-center justify-between">
        <span className="text-label-caps text-white/60 tracking-widest">LISTING PRICE</span>
        <span className="text-label-caps text-gold">FIXED AMOUNT</span>
      </div>
      <div className="rounded-xl border-2 border-gold bg-surface-2 px-5 py-6 text-center">
        <p className="font-mono text-3xl font-bold text-gold">${formatAmount(amount)}</p>
        <p className="mt-2 text-xs text-white/50">Monthly lease amount set by the provider's listing</p>
      </div>
      <div className="rounded-xl border border-border bg-surface-2 p-4 flex items-start gap-3">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
        <div className="flex flex-col gap-1">
          <span className="font-serif text-sm font-semibold text-text">Simulated checkout</span>
          <p className="text-xs font-mono leading-relaxed text-white/70">
            The listing price cannot be changed here. No funds are collected or held; the payment method and signature are recorded for this demo deal only.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="ghost" className="h-12" onClick={onBack} disabled={loading}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Back
        </Button>
        <Button className="h-12" onClick={onNext} disabled={loading}>
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function ConfirmStep({ providerName, assetName, paymentMethod, amount, formatAmount, onBack, onNext, loading }) {
  return (
    <div className="space-y-6" id="step-frame-3">
      <div className="flex items-center justify-between">
        <span className="text-label-caps text-white/60 tracking-widest">CONFIRM LEASE AGREEMENT</span>
        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/30 text-label-caps text-[10px]"><Lock className="w-3 h-3" /> SIMULATED DEAL</span>
      </div>
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between pb-3 border-b border-border">
          <span className="text-label-caps text-white/60">RECIPIENT PROVIDER</span>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1.5 font-serif text-sm text-text">
              {providerName} <span className="text-gold">✓</span>
            </div>
            <div className="text-xs font-mono text-white/60">Provider details are available on the listing</div>
          </div>
        </div>
        <div className="flex items-start justify-between pb-3 border-b border-border">
          <span className="text-label-caps text-white/60">ALLOCATED ASSET</span>
          <div className="text-right">
            <div className="font-mono text-sm text-text">{assetName}</div>
            <div className="text-xs font-mono text-gold">Requested infrastructure allocation</div>
          </div>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-label-caps text-white/60">PAYMENT METHOD</span>
          <div className="flex items-center gap-2 font-mono text-sm text-text">
            <paymentMethod.icon className="w-4 h-4 text-gold" />
            <span>{paymentMethod.name} {paymentMethod.details}</span>
          </div>
        </div>
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <span className="text-label-caps text-white/60">LEASE DURATION</span>
          <span className="font-mono text-sm text-text">30-Day Renewable Term</span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-label-caps text-white/60">SIMULATED DEAL AMOUNT</span>
            <div className="text-xs font-mono text-gold">No payment is processed in this demo</div>
          </div>
          <div className="font-serif text-2xl font-bold text-gold">
            ${formatAmount(amount)} <span className="text-label-caps text-white/60">USD</span>
          </div>
        </div>
      </Card>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono text-white/60">
        <Shield className="w-4 h-4 text-gold" />
        <span>The selected terms will be recorded on the deal. No escrow contract is deployed by this demo. <code className="text-text"></code></span>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="ghost" className="h-12" onClick={onBack} disabled={loading}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button className="h-12" onClick={onNext} disabled={loading}>
          Confirm Deal <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function SignStep({ canvasRef, signature, onSignatureChange, onBack, onNext, loading }) {
  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    canvas.onmousemove = (e) => {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.strokeStyle = "#C9A15A";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
    };
    canvas.onmouseup = () => {
      canvas.onmousemove = null;
      onSignatureChange(canvas.toDataURL());
    };
  };

  return (
    <div className="space-y-6" id="step-frame-4">
      <div className="flex items-center justify-between">
        <span className="text-label-caps text-white/60 tracking-widest">SIGN DEAL — DRAW YOUR SIGNATURE</span>
        <span className="text-label-caps text-gold">SIGNATURE RECORD</span>
      </div>
      <div className="relative w-full h-44 rounded-xl bg-bg border-2 border-dashed border-border flex flex-col justify-between p-4 overflow-hidden group">
        <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
          <ChevronRight className="w-20 h-20 text-gold rotate-45" />
        </div>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full touch-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={{ cursor: "crosshair" }}
        />
        <div className="relative z-10 flex items-center justify-between w-full">
          <span className="text-label-caps text-[10px] text-white/60 tracking-wider">DEAL SIGNATORY</span>
          <span className="text-label-caps text-[10px] text-gold font-mono">SIGNATURE PREVIEW</span>
        </div>
        <div className="relative z-10 flex items-center justify-between w-full pt-2">
          <Button variant="ghost" size="sm" onClick={() => { const canvas = canvasRef.current; if (canvas) { canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); onSignatureChange(""); } }}>
            Clear
          </Button>
          <span className="text-label-caps text-[10px] text-white/60">Sign within the area above</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button variant="ghost" className="h-12" onClick={onBack} disabled={loading}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button className="h-12" onClick={onNext} disabled={loading || !signature}>
          Complete <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function CompleteStep({ orderId, providerName, amount, formatAmount, onDone }) {
  return (
    <div className="space-y-6 text-center py-4" id="step-frame-5">
      <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-gold" />
      </div>
      <h2 className="font-serif text-2xl font-semibold text-text">Deal details saved</h2>
      <p className="text-white/70">Your demo deal record and signature have been saved. The provider still needs to review and confirm the order. No payment has been collected.</p>
      <Card className="p-4 text-left">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-white/60">Order ID</span><span className="font-mono text-text">{orderId}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Provider</span><span className="font-medium text-text">{providerName}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Amount</span><span className="font-mono text-gold">${formatAmount(amount)}</span></div>
          <div className="flex justify-between"><span className="text-white/60">Payment status</span><span className="font-mono text-gold">simulated</span></div>
        </div>
      </Card>
      <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-gold/30 text-gold text-sm">
        <Shield className="w-5 h-5 shrink-0" />
        <span>This demo records the deal in the application database. Payment processing and escrow integration are not connected.</span>
      </div>
      <Button className="w-full h-12" onClick={onDone}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Return to marketplace
      </Button>
    </div>
  );
}