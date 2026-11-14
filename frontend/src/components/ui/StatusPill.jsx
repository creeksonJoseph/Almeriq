import Pill from "./Pill";

const statusMap = {
  available: { variant: "gold", label: "Available" },
  reserved: { variant: "gold", label: "Reserved" },
  unavailable: { variant: "white", label: "Unavailable" },
  pending: { variant: "white", label: "Pending" },
};

export default function StatusPill({ status, label, className = "", ...props }) {
  const key = (status || "").toLowerCase();
  const mapped = statusMap[key] || { variant: "white", label: label || status || "Unknown" };
  return (
    <Pill variant={mapped.variant} className={className} {...props}>
      {label || mapped.label}
    </Pill>
  );
}