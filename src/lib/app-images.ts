import quotation from "@/assets/quotation.jpg";
import sic from "@/assets/sic.jpg";
import client from "@/assets/client.jpg";
import password from "@/assets/password.jpg";
import expiry from "@/assets/expiry.jpg";
import store from "@/assets/store.jpg";
import documents from "@/assets/documents.jpg";
import invoice from "@/assets/invoice.jpg";

/** Pictures bundled with the site. dbo.apps.image stores one of these keys, or a full image URL. */
export const bundledImages: Record<string, string> = {
  quotation,
  sic,
  client,
  password,
  expiry,
  store,
  documents,
  invoice,
};

/** Resolves dbo.apps.image to something an <img src> can use, or undefined for no picture. */
export function resolveAppImage(image: string): string | undefined {
  if (!image) return undefined;
  if (/^https?:\/\//i.test(image)) return image;
  return bundledImages[image];
}
