export function cx(...values: Array<string | false | undefined | null>) {
  return values.filter(Boolean).join(" ");
}

export function cleanUrl(value: string) {
  const trimmed = (value || "").trim();
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function publicArtistFormLink() {
  if (typeof window === "undefined") return "/artist-booking";
  return `${window.location.origin}/artist-booking`;
}

export function publicVolunteerFormLink() {
  if (typeof window === "undefined") return "/volunteer-signup";
  return `${window.location.origin}/volunteer-signup`;
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dateSort(a?: string, b?: string) {
  return (a || "9999").localeCompare(b || "9999");
}
