import { useLocation } from "react-router-dom";
import { Card, Skeleton, SkeletonText } from "./index";

function HeaderSkeleton({ wide = true }) {
  return (
    <header className="space-y-3">
      <Skeleton className="h-3 w-32" />
      <Skeleton className={`h-9 ${wide ? "w-2/3 max-w-xl" : "w-1/2 max-w-md"}`} />
      <Skeleton className="h-4 w-full max-w-2xl" />
    </header>
  );
}

function MetricSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="space-y-3 p-4">
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-7 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </Card>
      ))}
    </div>
  );
}

function GridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="space-y-4 p-4">
          <Skeleton className="aspect-[16/9] w-full" />
          <Skeleton className="h-5 w-2/3" />
          <SkeletonText lines={2} />
          <Skeleton className="h-5 w-1/3" />
          <div className="flex gap-2 border-t border-border pt-3">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 flex-1" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton({ rows = 6 }) {
  return (
    <Card className="space-y-4 p-4">
      <div className="flex gap-4 border-b border-border pb-3">
        {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-3 flex-1" />)}
      </div>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
          {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-3 flex-1" />)}
        </div>
      ))}
    </Card>
  );
}

function FormSkeleton() {
  return (
    <Card className="max-w-3xl space-y-5 p-5">
      <Skeleton className="h-6 w-1/3" />
      {[0, 1, 2, 3].map((item) => (
        <div key={item} className="space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton className="h-11 w-36 rounded-xl" />
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <>
      <MetricSkeleton count={4} />
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="space-y-4 p-5 xl:col-span-2">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-48 w-full" />
        </Card>
        <Card className="space-y-4 p-5">
          <Skeleton className="h-5 w-1/2" />
          <SkeletonText lines={6} />
        </Card>
      </div>
      <TableSkeleton rows={4} />
    </>
  );
}

function InboxSkeleton() {
  return (
    <div className="grid min-h-[32rem] grid-cols-1 overflow-hidden rounded-2xl border border-border md:grid-cols-[18rem_1fr]">
      <div className="space-y-3 border-b border-border p-4 md:border-b-0 md:border-r">
        <Skeleton className="h-9 w-full rounded-xl" />
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex gap-3 py-2">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-3 w-2/3" /><Skeleton className="h-3 w-full" /></div>
          </div>
        ))}
      </div>
      <div className="flex flex-col justify-between p-4">
        <div className="space-y-4"><Skeleton className="h-12 w-full" /><Skeleton className="ml-auto h-12 w-2/3" /><Skeleton className="h-12 w-1/2" /></div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}

/**
 * Route-aware loading placeholder. Each variant mirrors the page structure
 * rather than replacing the workspace with a centered spinner.
 */
export default function RouteSkeleton({ variant }) {
  const { pathname } = useLocation();
  const routeVariant = variant || (
    /marketplace|\/search/.test(pathname) ? "marketplace" :
    /messages/.test(pathname) ? "inbox" :
    /orders|alerts|applications|waitlist/.test(pathname) ? "table" :
    /dashboard|investor/.test(pathname) ? "dashboard" :
    /setup|profile|checkout|intake|edit|new/.test(pathname) ? "form" :
    /listings|ventures|experts|jobs/.test(pathname) ? "grid" : "default"
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8" aria-busy="true" aria-label="Loading page">
      <HeaderSkeleton wide={routeVariant !== "form"} />
      {routeVariant === "dashboard" && <DashboardSkeleton />}
      {routeVariant === "marketplace" && (
        <>
          <MetricSkeleton count={3} />
          <div className="flex gap-2 overflow-hidden">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-9 w-28 shrink-0" />)}</div>
          <GridSkeleton count={6} />
        </>
      )}
      {routeVariant === "grid" && <><Skeleton className="h-11 w-full max-w-xl rounded-xl" /><GridSkeleton count={6} /></>}
      {routeVariant === "table" && <><MetricSkeleton count={3} /><TableSkeleton /></>}
      {routeVariant === "form" && <FormSkeleton />}
      {routeVariant === "inbox" && <InboxSkeleton />}
      {routeVariant === "default" && <><MetricSkeleton count={3} /><Card className="space-y-4 p-5"><Skeleton className="h-5 w-1/3" /><SkeletonText lines={4} /></Card><GridSkeleton count={3} /></>}
    </div>
  );
}
