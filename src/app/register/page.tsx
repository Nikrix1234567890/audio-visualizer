import type { Metadata } from "next";
import { RegisterForm } from "@/components/site/RegisterForm";

export const metadata: Metadata = { title: "Create your account" };

export default function RegisterPage() {
  return <RegisterForm />;
}
