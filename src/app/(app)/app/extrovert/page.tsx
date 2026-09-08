import { redirect } from "next/navigation";
import { routes } from "@/config/routes";

export default function ExtrovertPremiumRedirect() {
  redirect(routes.premium);
}
