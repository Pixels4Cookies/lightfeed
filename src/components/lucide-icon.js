const defaultIconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const renderIconNode = ([tag, attrs, children], key) => {
  const Tag = tag;
  return (
    <Tag key={key} {...attrs}>
      {children?.map((child, index) => renderIconNode(child, `${key}-${index}`))}
    </Tag>
  );
};

export default function LucideIcon({ icon, size = 16, className, ...props }) {
  if (!icon) {
    return null;
  }

  return (
    <svg
      {...defaultIconProps}
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      {icon.map((node, index) => renderIconNode(node, `node-${index}`))}
    </svg>
  );
}
