import { Suspense } from "react";
import { ResetForm } from "@/components/PasswordResetForms";

export default function ResetPage() {
  return (
    <Suspense fallback={null}>
      <ResetForm />
    </Suspense>
  );
}
