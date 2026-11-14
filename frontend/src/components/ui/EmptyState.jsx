import Card from "./Card";
import Button from "./Button";

export default function EmptyState({
  title = "Nothing here yet",
  description,
  actionLabel,
  onAction,
  icon: Icon,
  className = "",
}) {
  return (
    <Card className={`p-8 text-center flex flex-col items-center gap-3 ${className}`}>
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-2 text-white/60">
          <Icon size={22} />
        </div>
      ) : null}
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold text-text">{title}</h3>
        {description ? <p className="text-sm text-white/70 max-w-md">{description}</p> : null}
      </div>
      {actionLabel && onAction ? (
        <Button variant="primary" onClick={onAction} className="mt-2">
          {actionLabel}
        </Button>
      ) : null}
    </Card>
  );
}