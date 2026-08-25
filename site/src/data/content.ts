export type StatusLevel = "stable" | "proposal" | "draft";

export interface ContentItem {
  name: string;
  body: string;
}

export interface ContentBlock {
  title: string;
  body?: string;
  items?: ContentItem[];
}

export interface ContentPageData {
  positioning: string;
  status: { label: string; level: StatusLevel };
  blocks: ContentBlock[];
  links: { label: string; href: string }[];
}
