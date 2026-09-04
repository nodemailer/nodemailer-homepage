import MDXComponents from "@theme-original/MDXComponents";
import Tabs from "@theme/Tabs";
import TabItem from "@theme/TabItem";

// Registered globally so docs pages can use <Tabs> / <TabItem> without an
// import block in every file. Used mainly for the CommonJS / ESM code tabs.
export default {
  ...MDXComponents,
  Tabs,
  TabItem,
};
