import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, X, Loader2, Save, Eye, MapPin, Building2, Server, Globe, Users } from "lucide-react";
import { Button, Input, Card, Stepper, Pill, Modal, Skeleton } from "../../components/ui";
import { getProviderProfileApi, updateProviderProfileApi, listCoverageRegionsApi, updateCoverageRegionsApi, createAssetApi } from "../../lib/api";

const COVERAGE_REGIONS = [
  "Africa",
  "North America",
  "Europe",
  "Asia-Pacific",
  "Latin America",
  "Middle East",
  "Global / no restriction",
];

const coverageToApi = {
  "Africa": "africa",
  "North America": "north_america",
  "Europe": "europe",
  "Asia-Pacific": "asia_pacific",
  "Latin America": "latin_america",
  "Middle East": "middle_east",
  "Global / no restriction": "global",
};
const coverageFromApi = Object.fromEntries(Object.entries(coverageToApi).map(([label, value]) => [value, label]));

const providerSchema = z.object({
  name: z.string().min(2, "Provider name is required"),
  location: z.string().min(2, "Location is required"),
  type: z.enum(["INDIVIDUAL", "COMPANY"]),
  about: z.string().max(500).optional(),
});

const physicalAssetSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.string().optional(),
  availability: z.string().optional(),
  rate: z.string().optional(),
});

const digitalAssetSchema = z.object({
  name: z.string().min(2, "Asset name is required"),
  category: z.string().min(1, "Category is required"),
  capacity: z.string().optional(),
  rate: z.string().optional(),
});

const coverageSchema = z.object({
  regions: z.array(z.string()).min(1, "Select at least one region"),
});

const preferencesSchema = z.object({
  engagement: z.string().max(500).optional(),
});

const STEPS = [
  { id: "info", label: "Provider Info", icon: Building2, schema: providerSchema },
  { id: "physical", label: "Physical Fleet", icon: MapPin, schema: physicalAssetSchema },
  { id: "digital", label: "Digital & Compute", icon: Server, schema: digitalAssetSchema },
  { id: "coverage", label: "Coverage Area", icon: Globe, schema: coverageSchema },
  { id: "preferences", label: "Engagement", icon: Users, schema: preferencesSchema },
];

export default function ProviderSetupPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  const methods = useForm({
    resolver: zodResolver(z.object({
      info: providerSchema,
      physicalAssets: z.array(physicalAssetSchema).default([]),
      digitalAssets: z.array(digitalAssetSchema).default([]),
      coverage: coverageSchema,
      preferences: preferencesSchema,
    })),
    defaultValues: {
      info: { name: "", location: "", type: "COMPANY", about: "" },
      physicalAssets: [],
      digitalAssets: [],
      coverage: { regions: [] },
      preferences: { engagement: "" },
    },
    mode: "onChange",
  });

  const { fields: physicalAssets, append: addPhysicalAsset, remove: removePhysicalAsset } = useFieldArray({ control: methods.control, name: "physicalAssets" });
  const { fields: digitalAssets, append: addDigitalAsset, remove: removeDigitalAsset } = useFieldArray({ control: methods.control, name: "digitalAssets" });
  const watchCoverage = methods.watch("coverage.regions");
  const watchInfo = methods.watch("info");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      try {
        const profile = await getProviderProfileApi();
        if (profile) {
          methods.setValue("info", {
            name: profile.company_name || profile.trading_name || "",
            location: profile.location || "",
            type: profile.provider_type || "COMPANY",
            about: profile.about || "",
          });
      if (profile.assets?.physical) {
        methods.setValue("physicalAssets", profile.assets.physical);
      }
      if (profile.assets?.digital) {
        methods.setValue("digitalAssets", profile.assets.digital);
      }
          const coverage = await listCoverageRegionsApi();
          methods.setValue("coverage.regions", (coverage.items || []).map(item => coverageFromApi[item.region] || item.region));
        }
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [methods, addPhysicalAsset, addDigitalAsset]);

  const nextStep = async () => {
    const step = STEPS[currentStep];
    let stepData;
    let schema = step.schema;
    if (step.id === "physical") {
      stepData = methods.getValues("physicalAssets");
      schema = z.array(physicalAssetSchema);
    } else if (step.id === "digital") {
      stepData = methods.getValues("digitalAssets");
      schema = z.array(digitalAssetSchema);
    } else {
      stepData = methods.getValues(step.id);
    }
    const result = schema.safeParse(stepData);
    if (!result.success) {
      if (step.id === "physical" || step.id === "digital") {
        // mark array errors generically
        methods.setError(step.id, { message: "Invalid assets" });
      } else {
        Object.entries(result.error.flatten().fieldErrors).forEach(([field, errors]) => {
          methods.setError(step.id + "." + field, { message: errors[0] });
        });
      }
      return;
    }
    if (currentStep < STEPS.length - 1) setCurrentStep(c => c + 1);
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const data = methods.getValues();
      await updateProviderProfileApi({
        company_name: data.info.name,
        provider_type: data.info.type,
        location: data.info.location,
        about: data.info.about,
      });
      await updateCoverageRegionsApi(data.coverage.regions.map(region => coverageToApi[region] || region));
    } catch (e) {
      console.error("Save failed", e);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    const allData = methods.getValues();
    const finalSchema = z.object({
      info: providerSchema,
      physicalAssets: z.array(physicalAssetSchema),
      digitalAssets: z.array(digitalAssetSchema),
      coverage: coverageSchema,
      preferences: preferencesSchema,
    });
    const result = finalSchema.safeParse(allData);
    if (!result.success) {
      return;
    }
    setSaving(true);
    try {
      await updateProviderProfileApi({
        company_name: allData.info.name,
        provider_type: allData.info.type,
        location: allData.info.location,
        about: allData.info.about,
      });
      await updateCoverageRegionsApi(allData.coverage.regions.map(region => coverageToApi[region] || region));
      await Promise.all([
        ...allData.physicalAssets.map(asset => createAssetApi({
          name: asset.name,
          category: asset.category,
          kind: "physical",
          quantity_capacity: asset.quantity ? Number(asset.quantity) : undefined,
          price_monthly: asset.rate ? Number(asset.rate) : undefined,
        })),
        ...allData.digitalAssets.map(asset => createAssetApi({
          name: asset.name,
          category: asset.category,
          kind: "digital",
          quantity_capacity: asset.capacity ? Number(asset.capacity) : undefined,
          price_monthly: asset.rate ? Number(asset.rate) : undefined,
        })),
      ]);
      navigate("/provider/dashboard");
    } catch (e) {
      console.error("Complete failed", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const step = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const stepValues = methods.getValues(step.id);

  return (
    <div className="min-h-screen bg-bg text-text font-sans antialiased">
      {/* Header */}
      <header className="w-full bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 xl:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 relative flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-8 h-8 text-gold drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="16,3 29,16 16,29 3,16" stroke="currentColor" fill="none" />
                <path d="M16 9 L11.5 21 M16 9 L20.5 21 M13 18 L19 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-serif font-bold text-base tracking-[0.14em] text-text">ALIMERIQ</span>
              <span className="text-[10px] tracking-widest text-white/60 uppercase font-sans -mt-1">Infrastructure Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide uppercase bg-surface-2 border border-border text-white/60">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse"></span>
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <Button variant="ghost" onClick={handleSaveDraft} disabled={saving} className="lg:hidden">
              <Save className="w-4 h-4" />
            </Button>
            <Button variant="ghost" onClick={handleSaveDraft} disabled={saving} className="bg-[#1a1b21] !border-0 text-xs text-white/60 hover:text-text px-2 py-1">
              Save Draft
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Bar (below xl) */}
      <div className="xl:hidden bg-surface-2/60 border-b border-border sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-white/60 font-medium mb-2">
            <span className="text-gold font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gold"></span>
              {step.label}
            </span>
            <span className="text-white/60 md:hidden">{currentStep + 1} / {STEPS.length}</span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 h-1.5 w-full">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-full rounded-full ${i <= currentStep ? "bg-gold" : "bg-surface-2 border border-border"}`} />
            ))}
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 md:px-6 xl:px-8 py-8 md:py-10">
        {/* Title */}
        <div className="max-w-[1200px] mx-auto mb-8 md:mb-10">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold mb-2 flex items-center gap-2">
            <span>Onboarding</span>
            <span className="text-white/40">/</span>
            <span className="text-white/60">Account Activation</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-text font-semibold tracking-tight">
            Infrastructure provider profile
          </h1>
          <p className="mt-2 text-sm sm:text-base text-white/60 max-w-3xl leading-relaxed">
            Startups are always looking for reliable infrastructure. List what you offer, physical or digital, and let the right customers find you.
          </p>
        </div>

        {/* Main Grid */}
        <div className="max-w-[1200px] mx-auto flex flex-col xl:flex-row items-start justify-center gap-8 lg:gap-10">
          {/* Left: Stepper (XL only) */}
          <aside className="hidden xl:block w-[240px] shrink-0 sticky top-24 self-start">
            <Card className="p-4">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-white/60 mb-4 pb-2 border-b border-border">
                Setup Progress
              </div>
              <nav className="space-y-3 relative" aria-label="Onboarding Progress">
                <div className="absolute left-3.5 top-3 bottom-4 w-px bg-border -z-0"></div>
                {STEPS.map((s, i) => {
                  const done = i < currentStep;
                  const active = i === currentStep;
                  return (
                    <a
                      key={s.id}
                      href={`#section-${i}`}
                      className="relative z-10 flex items-start gap-3 group"
                    >
                      <span className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ring-4 ring-bg shadow-sm transition-all ${
                        done ? "bg-gold text-bg" : active ? "bg-surface-2 border-2 border-gold text-gold" : "bg-surface-2 border border-border text-white/60"
                      }`}>
                        {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                      </span>
                      <div className="pt-0.5">
                        <span className={`text-xs block group-hover:text-text transition-colors ${done ? "text-gold font-semibold" : active ? "text-text font-semibold" : "text-white/60 font-medium"}`}>
                          {s.label}
                        </span>
                        <span className="text-[11px] text-white/40">
                          {i === 0 && "2 fields required"}
                          {i === 1 && `${physicalAssets.length} asset${physicalAssets.length !== 1 ? "s" : ""}`}
                          {i === 2 && `${digitalAssets.length} asset${digitalAssets.length !== 1 ? "s" : ""}`}
                          {i === 3 && `${watchCoverage.length} region${watchCoverage.length !== 1 ? "s" : ""}`}
                          {i === 4 && "Client criteria"}
                        </span>
                      </div>
                    </a>
                  );
                })}
              </nav>
              <div className="mt-6 pt-4 border-t border-border">
                <div className="text-[11px] text-white/40">
                  Need assistance? Contact our <a href="#" className="text-gold hover:underline">provider support</a> desk.
                </div>
              </div>
            </Card>
          </aside>

          {/* Center: Form */}
          <section className="w-full max-w-[640px] flex-1 space-y-8">
            <form onSubmit={e => { e.preventDefault(); isLastStep ? handleComplete() : nextStep(); }}>
              <Stepper steps={STEPS.map(s => s.label)} current={currentStep} className="mb-6" />

              {/* Step 1: Provider Info */}
              {currentStep === 0 && (
                <Card id="section-0" className="p-5 sm:p-6 lg:p-7">
                  <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-gold/10 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center">1</span>
                      <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-text">Provider Information</h2>
                    </div>
                    <span className="text-[11px] text-gold font-medium bg-gold/10 px-2 py-0.5 rounded border border-gold/30">Required</span>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <label htmlFor="provider-name" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                        Provider / Company Name <span className="text-gold">*</span>
                      </label>
                      <Input
                        id="provider-name"
                        placeholder="e.g. TerraBore Heavy Dynamics Inc."
                        error={methods.formState.errors.info?.name?.message}
                        {...methods.register("info.name")}
                      />
                    </div>
                    <div>
                      <label htmlFor="provider-location" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">
                        Location (City, Country) <span className="text-gold">*</span>
                      </label>
                      <Input
                        id="provider-location"
                        placeholder="e.g. Austin, United States"
                        error={methods.formState.errors.info?.location?.message}
                        {...methods.register("info.location")}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Provider Type</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          className={`tap-target px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            watchInfo.type === "INDIVIDUAL"
                              ? "border-2 border-gold bg-gold/10 text-gold-soft font-semibold shadow-sm"
                              : "border-border bg-surface-2 text-white/60 hover:border-gold/60"
                          }`}
                          onClick={() => methods.setValue("info.type", "INDIVIDUAL")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Individual
                        </button>
                        <button
                          type="button"
                          className={`tap-target px-4 py-2.5 rounded-lg border text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                            watchInfo.type === "COMPANY"
                              ? "border-2 border-gold bg-gold/10 text-gold-soft font-semibold shadow-sm"
                              : "border-border bg-surface-2 text-white/60 hover:border-gold/60"
                          }`}
                          onClick={() => methods.setValue("info.type", "COMPANY")}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Company
                          <svg className="w-3.5 h-3.5 text-gold ml-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="provider-about" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">About the Provider</label>
                      <textarea
                        id="provider-about"
                        rows="3"
                        placeholder="Tell startups about your fleet background, maintenance standards, and experience supporting high-growth tech ventures..."
                        className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                        {...methods.register("info.about")}
                      ></textarea>
                      <span className="text-[11px] text-white/40 block text-right mt-1">Recommended 100-300 characters</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Step 2: Physical Fleet */}
              {currentStep === 1 && (
                <Card id="section-1" className="p-5 sm:p-6 lg:p-7">
                  <div className="pb-3 border-b border-border/80 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-gold/10 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center">2</span>
                        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-text">Physical Infrastructure</h2>
                      </div>
                      <span className="text-[11px] text-white/60 font-medium">{physicalAssets.length} asset{physicalAssets.length !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="mt-2 text-xs text-white/60 leading-relaxed">Trucks, excavators, generators, containers, warehousing, and other physical assets.</p>
                  </div>

                  {physicalAssets.map((_, index) => (
                    <div key={index} className="bg-surface-2 border border-border rounded-xl p-4 sm:p-5 mb-4 relative hover:border-gold/40 transition-colors">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gold"></span>
                          <span className="text-xs font-semibold text-text uppercase tracking-wider">Physical asset {index + 1}</span>
                          <span className="text-[10px] text-gold bg-gold/10 border border-gold/30 px-2 py-0.5 rounded">Active Draft</span>
                        </div>
                        <button type="button" onClick={() => removePhysicalAsset(index)} className="text-xs text-gold hover:text-gold/80 font-medium transition-colors flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Asset Name</label>
                          <Input placeholder="e.g. Caterpillar 336 Next-Gen Excavator with GNSS" {...methods.register(`physicalAssets.${index}.name`)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Category</label>
                          <select {...methods.register(`physicalAssets.${index}.category`)} className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold tap-target">
                            <option value="">Select category</option>
                            <option>Heavy Earthmoving / Excavation</option>
                            <option>Commercial Logistics & Freight</option>
                            <option>Power & Microgrid Battery Storage</option>
                            <option>Industrial Warehousing</option>
                            <option>Robotics / Field Testbed</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Quantity / Capacity</label>
                          <Input placeholder="e.g. 3x 36-ton units (Yard Bay 12)" {...methods.register(`physicalAssets.${index}.quantity`)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Availability</label>
                          <Input placeholder="e.g. Immediate (Turnkey Dispatch)" {...methods.register(`physicalAssets.${index}.availability`)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Rate (Optional)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-white/60 text-sm">$</span>
                            <Input placeholder="e.g. 14,500 / month" className="pl-8" {...methods.register(`physicalAssets.${index}.rate`)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={() => addPhysicalAsset({ name: "", category: "", quantity: "", availability: "", rate: "" })} className="w-full tap-target border border-dashed border-border hover:border-gold text-white/60 hover:text-gold rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add physical asset
                  </button>
                </Card>
              )}

              {/* Step 3: Digital & Compute */}
              {currentStep === 2 && (
                <Card id="section-2" className="p-5 sm:p-6 lg:p-7">
                  <div className="pb-3 border-b border-border/80 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-gold/10 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center">3</span>
                        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-text">Digital Infrastructure</h2>
                      </div>
                      <span className="text-[11px] text-white/40">Optional</span>
                    </div>
                    <p className="mt-2 text-xs text-white/60 leading-relaxed">Servers, GPU clusters, satellites, ground station downlinks, fiber connectivity, cloud storage nodes, and software licenses.</p>
                  </div>

                  {digitalAssets.map((_, index) => (
                    <div key={index} className="bg-surface-2 border border-border rounded-xl p-4 sm:p-5 mb-4 relative hover:border-gold/40 transition-colors">
                      <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-gold"></span>
                          <span className="text-xs font-semibold text-text uppercase tracking-wider">Digital asset {index + 1}</span>
                        </div>
                        <button type="button" onClick={() => removeDigitalAsset(index)} className="text-xs text-gold hover:text-gold/80 font-medium transition-colors flex items-center gap-1">
                          <X className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Asset Name</label>
                          <Input placeholder="e.g. 64x NVIDIA H100 SXM5 SuperPOD Cluster" {...methods.register(`digitalAssets.${index}.name`)} />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Category</label>
                          <select {...methods.register(`digitalAssets.${index}.category`)} className="w-full bg-surface border border-border rounded-lg px-3.5 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold tap-target">
                            <option value="">Select category</option>
                            <option>High Performance AI Compute / GPUs</option>
                            <option>Orbital Satellite Downlink / Telemetry</option>
                            <option>Dedicated Dark Fiber & Bandwidth</option>
                            <option>Edge Micro-Datacenter Racks</option>
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Capacity / Specs</label>
                          <Input placeholder="e.g. 3.2 Tbps InfiniBand, 640GB VRAM, Tier-4 DC" {...methods.register(`digitalAssets.${index}.capacity`)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-1.5">Rate (Optional)</label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-2.5 text-white/60 text-sm">$</span>
                            <Input placeholder="e.g. 48,200 / month or $2.85 / GPU-hr" className="pl-8" {...methods.register(`digitalAssets.${index}.rate`)} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={() => addDigitalAsset({ name: "", category: "", capacity: "", rate: "" })} className="w-full tap-target border border-dashed border-border hover:border-gold text-white/60 hover:text-gold rounded-lg py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    Add digital asset
                  </button>
                </Card>
              )}

              {/* Step 4: Coverage Area */}
              {currentStep === 3 && (
                <Card id="section-3" className="p-5 sm:p-6 lg:p-7">
                  <div className="pb-3 border-b border-border/80 mb-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-md bg-gold/10 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center">4</span>
                        <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-text">Coverage Area</h2>
                      </div>
                      <span className="text-[11px] text-gold font-medium">{watchCoverage.length} Selected</span>
                    </div>
                    <p className="mt-2 text-xs text-white/60">Select geographic jurisdictions where you can dispatch machines, allocate data centers, or guarantee field maintenance.</p>
                  </div>
                  <div className="flex flex-wrap gap-2.5">
                    {COVERAGE_REGIONS.map(region => (
                      <button
                        key={region}
                        type="button"
                        onClick={() => {
                          const current = watchCoverage;
                          if (current.includes(region)) {
                            methods.setValue("coverage.regions", current.filter(r => r !== region));
                          } else {
                            methods.setValue("coverage.regions", [...current, region]);
                          }
                        }}
                        className={`tap-target px-4 py-2 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2 transition-all ${
                          watchCoverage.includes(region)
                            ? "border-2 border-gold bg-gold/10 text-gold-soft"
                            : "border border-border bg-surface-2 text-white/60 hover:text-text hover:border-gold/50"
                        }`}
                      >
                        {watchCoverage.includes(region) && (
                          <svg className="w-3.5 h-3.5 text-gold" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                        {region}
                      </button>
                    ))}
                  </div>
                </Card>
              )}

              {/* Step 5: Engagement Preference */}
              {currentStep === 4 && (
                <Card id="section-4" className="p-5 sm:p-6 lg:p-7">
                  <div className="pb-3 border-b border-border/80 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-gold/10 border border-gold/40 text-gold text-xs font-bold flex items-center justify-center">5</span>
                      <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-text">Engagement Preference</h2>
                    </div>
                    <p className="mt-2 text-xs text-white/60">Define the types of commercial lease agreements, startup stages, and operating covenants you prioritize.</p>
                  </div>
                  <div>
                    <label htmlFor="engagement-pref" className="block text-xs font-medium text-white/60 uppercase tracking-wider mb-2">Describe your ideal clients or deals</label>
                    <textarea
                      id="engagement-pref"
                      rows="4"
                      placeholder="Company size, industries, order size, contract length…"
                      className="w-full bg-surface-2 border border-border rounded-lg px-3.5 py-2.5 text-sm text-text placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                      {...methods.register("preferences.engagement")}
                    ></textarea>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-white/40">Suggested tags:</span>
                      <span className="text-[11px] bg-surface-2 border border-border px-2 py-0.5 rounded text-white/60">YC / Seed+ Startups</span>
                      <span className="text-[11px] bg-surface-2 border border-border px-2 py-0.5 rounded text-white/60">Min 3-Month Lease</span>
                      <span className="text-[11px] bg-surface-2 border border-border px-2 py-0.5 rounded text-white/60">Telemetry-Bonded Escrow</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
<Button type="button" variant="ghost" onClick={prevStep} disabled={currentStep === 0} className="min-w-[120px]">
  <ChevronLeft className="w-4 h-4" />
</Button>
                <div className="flex items-center gap-3">
<Button type="button" variant="ghost" onClick={handleSaveDraft} disabled={saving} className="bg-[#1a1b21] !border-0">
  Save Draft
</Button>
                  {isLastStep ? (
<Button type="submit" disabled={saving} className="min-w-[160px]">
  {saving ? "Publishing..." : "Complete Setup"}
</Button>
                  ) : (
<Button type="submit" disabled={methods.formState.isSubmitting} className="min-w-[160px]">
  Continue
</Button>
                  )}
                </div>
              </div>
            </form>
          </section>

          {/* Right: Live Preview (lg+) */}
          <aside className="hidden lg:block w-[320px] shrink-0 sticky top-24 self-start">
            <Card className="p-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-border/80 mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-widest text-gold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold"></span>
                  Live Preview
                </span>
                <span className="text-[10px] text-white/40 uppercase font-mono tracking-wider">1440px Model</span>
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">How founders will see you</h3>
              <p className="text-[11px] text-white/60 mb-4 italic">Preview updates as you type</p>
              <div className="bg-surface-2 border border-border rounded-xl p-4.5 space-y-4 hover:border-gold/50 transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-surface border border-gold/40 text-gold-soft font-serif font-bold text-lg flex items-center justify-center shrink-0 shadow-sm">
                    {watchInfo.name ? watchInfo.name.slice(0,2).toUpperCase() : "TB"}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-text truncate">{watchInfo.name || "Provider name"}</h4>
                      <svg className="w-3.5 h-3.5 text-gold shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold bg-gold/10 text-gold border border-gold/30">{watchInfo.type || "Company"}</span>
                      {watchInfo.location && <span className="text-xs text-white/60 truncate">{watchInfo.location}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/60 leading-relaxed line-clamp-2 border-t border-border/60 pt-3">
                  {watchInfo.about || "No provider description yet."}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-border/40">
                  <div className="bg-surface/80 p-2 rounded-lg border border-border">
                    <span className="text-white/40 block uppercase text-[9px] tracking-wider">Fleet Drafts</span>
                    <span className="font-semibold text-text font-serif text-sm">{physicalAssets.length} Physical / {digitalAssets.length} Digital</span>
                  </div>
                  <div className="bg-surface/80 p-2 rounded-lg border border-border">
                    <span className="text-white/40 block uppercase text-[9px] tracking-wider">Coverage</span>
                    <span className="font-semibold text-text font-serif text-sm">{watchCoverage.slice(0,2).join(", ") || "None"}{watchCoverage.length > 2 ? ` +${watchCoverage.length - 2}` : ""}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-white/60 bg-surface/50 px-2.5 py-1.5 rounded-lg border border-border">
                  <span className="text-white/60">Draft preview</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}