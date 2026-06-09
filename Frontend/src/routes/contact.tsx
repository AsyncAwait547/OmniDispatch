import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { PageShell, Panel } from "@/components/page-shell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — OmniDispatch" },
      {
        name: "description",
        content:
          "Request a briefing with the OmniDispatch operations team. Scoped to regulated infrastructure operators.",
      },
      { property: "og:title", content: "Contact — OmniDispatch" },
      {
        property: "og:description",
        content: "Request a briefing. Operators only.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <PageShell
      kicker="05 / SECURE CHANNEL"
      title="Open a briefing request."
      intro="OmniDispatch is sold direct to infrastructure operators and their integrators. Submissions are reviewed by our deployments team within one business day."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Panel label="REQUEST FORM" accent>
            {submitted ? (
              <div className="py-12 text-center">
                <div className="text-signal font-mono text-xs tracking-widest mb-3">
                  ● TRANSMISSION ACK
                </div>
                <div className="text-frost text-xl font-medium">
                  Briefing request received.
                </div>
                <p className="mt-3 text-frost/60 text-sm">
                  Operator-channel response within 24h.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="space-y-5"
              >
                {[
                  { label: "OPERATOR NAME", name: "name", type: "text" },
                  { label: "ORGANISATION", name: "org", type: "text" },
                  { label: "SECURE EMAIL", name: "email", type: "email" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-[10px] font-mono tracking-widest text-frost/40 mb-2">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      name={f.name}
                      required
                      className="w-full bg-black/50 border border-frost/10 rounded-lg px-4 py-3 text-frost text-sm font-mono focus:outline-none focus:border-signal/60 transition-colors"
                    />
                  </div>
                ))}
                <div>
                  <label className="block text-[10px] font-mono tracking-widest text-frost/40 mb-2">
                    INCIDENT VOLUME / SCOPE
                  </label>
                  <textarea
                    rows={4}
                    required
                    className="w-full bg-black/50 border border-frost/10 rounded-lg px-4 py-3 text-frost text-sm font-mono focus:outline-none focus:border-signal/60 transition-colors resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="group bg-signal rounded-full pl-5 pr-1.5 py-1.5 flex items-center gap-2 hover:gap-3 transition-all text-black font-medium text-sm"
                >
                  <span>Transmit Request</span>
                  <span className="bg-black rounded-full w-9 h-9 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </span>
                </button>
              </form>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel label="DIRECT">
            <div className="font-mono text-xs space-y-2 text-frost/70">
              <div>ops@omnidispatch.io</div>
              <div className="text-frost/40">PGP: 9F2A 71C4 88EB 0512</div>
            </div>
          </Panel>
          <Panel label="OPERATIONS HQ">
            <div className="font-mono text-xs text-frost/70 leading-relaxed">
              Tower B, Level 14
              <br />
              Energiveien 12
              <br />
              0207 Oslo, NO
            </div>
          </Panel>
          <Panel label="STATUS">
            <div className="font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-frost/40">CONTROL PLANE</span>
                <span className="text-signal animate-pulse">● ONLINE</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
