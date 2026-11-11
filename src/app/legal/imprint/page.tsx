import { LegalPage } from "@/components/LegalPage";
import { BRAND } from "../../../../remotion/brand";

export const metadata = { title: `Imprint - ${BRAND.name}` };

/** Who runs the site. Every fact here has to be filled in by the owner. */
export default function ImprintPage() {
  return (
    <LegalPage title="Imprint">
      <section>
        <h2>Provider</h2>
        <p>
          [Full name or company name]
          <br />
          [Street and number]
          <br />
          [Postal code, city, country]
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Email: [address]
          <br />
          Phone: [number, if required]
        </p>
      </section>
      <section>
        <h2>Business details</h2>
        <p>
          [Legal form, commercial register number and court, VAT number,
          supervisory authority, chamber membership - whichever apply]
        </p>
      </section>
      <section>
        <h2>Responsible for the content</h2>
        <p>[Name and address of the responsible person]</p>
      </section>
    </LegalPage>
  );
}
