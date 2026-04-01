import type * as React from "react";

declare module "mdx/types.js" {
  export import JSX = React.JSX;
}

declare module "*.mdx" {
  const Component: React.ComponentType<Record<string, unknown>>;

  export default Component;
}
