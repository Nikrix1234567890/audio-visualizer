import { LegalPage } from "@/components/LegalPage";
import { ANONYMOUS_FILE_DAYS } from "@/lib/cleanup";
import { BRAND } from "../../../../remotion/brand";

export const metadata = { title: "Privacy" };

/**
 * What the app does with personal data. The facts below describe what the
 * code really does (keep them in step with it); the legal framing - legal
 * bases, rights, retention, processors' contracts - still has to be
 * written and checked.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <section>
        <h2>Who is responsible</h2>
        <p>[Name and contact of the controller - see the imprint]</p>
      </section>

      <section>
        <h2>What is stored when you use {BRAND.name} without an account</h2>
        <ul>
          <li>
            Files you load into the editor for rendering (your track, pictures,
            3D models) and the videos rendered from them. They are deleted
            automatically after {ANONYMOUS_FILE_DAYS} days.
          </li>
          <li>
            In your own browser only: the editor layout and the mute setting
            (local storage). Nothing of that is sent to the server.
          </li>
          <li>
            Your IP address is used for a short time, in memory, to limit how
            often one visitor can upload, render or try to log in.
          </li>
        </ul>
      </section>

      <section>
        <h2>What is stored when you create an account</h2>
        <ul>
          <li>Your email address and, if you enter one, your name.</li>
          <li>
            Your password, only as a one-way hash (bcrypt) - it cannot be read
            by anyone, including us.
          </li>
          <li>
            Your projects, your own templates, your uploaded files and your
            rendered videos, until you delete them or your account.
          </li>
          <li>Your plan (Free or Premium).</li>
        </ul>
        <p>
          You can delete your account, with everything listed here, on the
          account page at any time.
        </p>
      </section>

      <section>
        <h2>Cookies</h2>
        <p>
          One cookie is set when you log in: it keeps you logged in. A second
          short-lived one protects the login form against forged requests.
          Both are necessary for the service; there are no tracking or
          advertising cookies and no analytics.
        </p>
      </section>

      <section>
        <h2>Services of other companies</h2>
        <ul>
          <li>
            Payments: Stripe. When you buy Premium you enter your payment
            details on a page run by Stripe; we receive a customer number and
            the state of your subscription, never your card details.
            [Contract, address and privacy policy of Stripe]
          </li>
          <li>
            Mail: Resend delivers the mails for confirming your address and
            resetting your password and receives your address for that.
            [Contract, address and privacy policy of Resend]
          </li>
          <li>Hosting: [name and location of the hosting company]</li>
        </ul>
      </section>

      <section>
        <h2>Legal bases, retention, your rights</h2>
        <p>
          [To be written: the legal basis for each kind of processing, how
          long data is kept, the rights to access, correction, deletion,
          restriction, portability and objection, and the right to complain
          to the data protection authority]
        </p>
      </section>
    </LegalPage>
  );
}
