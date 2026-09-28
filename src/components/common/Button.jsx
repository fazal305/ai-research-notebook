import "./Button.css";

/**
 * Shared button primitive. Centralizing variants here means later
 * components never hardcode button colors/spacing directly in JSX.
 */
export function Button({
  variant = "secondary",
  size = "md",
  as: Component = "button",
  className = "",
  type = "button",
  ...props
}) {
  const classes = ["btn", `btn--${variant}`, `btn--${size}`, className]
    .filter(Boolean)
    .join(" ");
  const extra = Component === "button" ? { type } : {};
  return <Component className={classes} {...extra} {...props} />;
}
