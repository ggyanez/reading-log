import { logout } from "@/app/actions";
import { StepPicker, SyncButton } from "@/components/SettingsPanel";
import { getSettings } from "@/lib/data";
import { formatDateTime } from "@/lib/time";

export default async function AjustesPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Ajustes</h1>

      <Section
        title="Notion"
        description={
          settings.lastSyncAt
            ? `Última sincronización: ${formatDateTime(settings.lastSyncAt)}`
            : "Todavía no se sincronizó."
        }
      >
        <SyncButton />
      </Section>

      <Section title="Paso del selector" description="Cuántos minutos suma o resta cada toque.">
        <StepPicker value={settings.stepMinutes} />
      </Section>

      <Section title="Tus datos" description="Todas las sesiones en un CSV.">
        <a
          href="/api/export"
          download
          className="block w-full rounded-2xl border border-line py-3 text-center text-sm font-medium"
        >
          Exportar CSV
        </a>
      </Section>

      <form action={logout}>
        <button type="submit" className="w-full py-3 text-sm font-medium text-danger">
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-line bg-surface px-5 py-4">
      <h2 className="font-medium">{title}</h2>
      <p className="mt-0.5 mb-3 text-sm text-muted">{description}</p>
      {children}
    </section>
  );
}
