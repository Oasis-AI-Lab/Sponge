export const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function link(path: string): string {
  return `${base}${path}`;
}
