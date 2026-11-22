import {
  Home, Lightbulb, BookOpen, CheckCircle2, Boxes, Scale, Settings,
  ShieldCheck, TrendingUp, UserRound, Building2, MessageSquare, Bell,
} from "lucide-react";

export const WORKSPACE_NAV = [
  { key: "overview", label: "Overview", path: "/dashboard", icon: Home },
  { key: "messages", label: "Messages", path: "/messages", icon: MessageSquare },
  { key: "alerts", label: "Alerts", path: "/alerts", icon: Bell },
];

export const FOUNDER_STUDIO_NAV = [
  { key: "ventures", label: "Saved Ventures", path: "/founder/ventures", icon: BookOpen },
  { key: "intake", label: "Share New Idea", path: "/founder/intake?mode=new", icon: Lightbulb },
  { key: "validation", label: "Idea Validation", path: "/founder/validation", icon: CheckCircle2 },
  { key: "product", label: "Product Development", path: "/founder/product", icon: Boxes },
  { key: "legal", label: "Legal & Setup", path: "/founder/legal", icon: Scale },
  { key: "hiring", label: "Hiring", path: "/jobs/manage", icon: Building2 },
  { key: "fundraising", label: "Fundraising", path: "/founder/pitches", icon: TrendingUp },
  { key: "experts", label: "Find Experts", path: "/founder/experts", icon: UserRound },
];

export const JOB_SEEKER_NAV = [
  { key: "jobseeker-dashboard", label: "Job Seeker Dashboard", path: "/job-seeker/dashboard", icon: Home },
  { key: "jobseeker-jobs", label: "Find Jobs", path: "/job-seeker/jobs", icon: Building2 },
  { key: "jobseeker-setup", label: "My Profile", path: "/job-seeker/setup", icon: Settings },
];

export const INVESTOR_NAV = [
  { key: "investor-dashboard", label: "Startup Discovery & Pipeline", path: "/dashboard", icon: TrendingUp },
  { key: "investor-profile", label: "Investor Profile", path: "/investor/profile", icon: UserRound },
];

export const EXPERT_NAV = [
  { key: "expert-dashboard", label: "Expert Dashboard", path: "/dashboard", icon: ShieldCheck },
  { key: "expert-profile", label: "Expert Profile", path: "/expert/profile", icon: UserRound },
];

export const PROVIDER_NAV = [
  { key: "provider-dashboard", label: "Provider Dashboard", path: "/provider/dashboard", icon: Home },
  { key: "provider-listings", label: "My Listings", path: "/provider/listings", icon: Boxes },
  { key: "provider-orders", label: "Orders", path: "/provider/orders", icon: Scale },
  { key: "provider-jobs", label: "Hiring", path: "/jobs/manage", icon: Building2 },
];
