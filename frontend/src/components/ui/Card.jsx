export default function Card({ as: Component = "div", className = "", children, ...props }) {
  return (
    <Component
      className={`bg-surface border border-[#2b2b31] rounded-2xl ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
