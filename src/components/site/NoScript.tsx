/**
 * Without scripts nothing would ever play the reveal animations, so
 * whatever they hold back at the start is shown as it is.
 */
export function NoScript() {
  return (
    <noscript>
      <style>{`.site [style*="opacity:0"]{opacity:1!important;transform:none!important}`}</style>
    </noscript>
  );
}
