import { vehicleFeedSchema } from "@bus-tracker/shared";

const samplePayload = vehicleFeedSchema.parse({
  updatedAt: new Date().toISOString(),
  vehicles: []
});

export const App = () => {
  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">Ireland Bus Tracking</p>
        <h1>Realtime bus tracking scaffold for Galway and beyond.</h1>
        <p className="lede">
          Shared schemas are already wired between the API and the web client.
        </p>
      </section>

      <section className="panel">
        <h2>Shared contract</h2>
        <pre>{JSON.stringify(samplePayload, null, 2)}</pre>
      </section>
    </main>
  );
};

