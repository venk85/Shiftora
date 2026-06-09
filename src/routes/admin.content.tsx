import { createFileRoute } from "@tanstack/react-router";
import { useActiveTenant } from "@/lib/shiftora-store";
import {
  shiftoraApi,
  type LearningModule,
  type LearningModuleTargeting,
  type LearningUnit,
  type TenantModuleAdoption,
} from "@/lib/shiftora-api";
import { Card, PageHeader, Chip, Btn, SectionLabel } from "@/components/shiftora/primitives";
import {
  IconBook,
  IconChevronDown,
  IconChevronUp,
  IconPlus,
  IconTrash,
  IconPencil,
  IconExternalLink,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/admin/content")({ component: Content });

const BOARDS = ["Any", "CBSE", "ICSE", "Tamil Nadu State Board", "IB", "IGCSE"];
const GRADES = ["Any", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Tamil", "Hindi", "Tamil + Hindi", "English + Tamil + Hindi", "Mixed"];
const UNIT_TYPES = ["reading", "video", "activity", "quiz", "external"] as const;

function targetingSummary(t: LearningModuleTargeting): string {
  const parts: string[] = [];
  if (t.board && t.board !== "Any") parts.push(String(t.board));
  if (t.grade && t.grade !== "Any") parts.push(Array.isArray(t.grade) ? (t.grade as string[]).join(", ") : String(t.grade));
  if (t.subject && t.subject !== "Any") parts.push(String(t.subject));
  const min = t.minReadiness ?? 0;
  const max = t.maxReadiness ?? 100;
  if (min > 0 || max < 100) parts.push(`Readiness ${min}–${max}%`);
  return parts.length ? parts.join(" · ") : "All teachers";
}

export function Content() {
  const tenant = useActiveTenant();
  const [tab, setTab] = useState<"catalog" | "path">("catalog");
  const [catalog, setCatalog] = useState<LearningModule[]>([]);
  const [myModules, setMyModules] = useState<LearningModule[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // sheet state
  const [adoptSheet, setAdoptSheet] = useState<LearningModule | null>(null);
  const [moduleSheet, setModuleSheet] = useState<LearningModule | "new" | null>(null);
  const [unitSheet, setUnitSheet] = useState<{ moduleId: string; unit?: LearningUnit } | null>(null);
  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

  const load = () => {
    setError("");
    void Promise.all([
      shiftoraApi.adminPlatformCatalog(tenant.id),
      shiftoraApi.adminLearningModules(tenant.id),
    ]).then(([cat, own]) => {
      setCatalog(cat);
      setMyModules(own);
    }).catch((e) => setError((e as Error).message));
  };

  useEffect(() => { load(); }, [tenant.id]);

  return (
    <div>
      <PageHeader title="Content library" subtitle="Manage self-study modules for your learners." />
      {error && <Card className="mb-4"><div className="text-[13px] text-[color:var(--er)]">{error}</div></Card>}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {(["catalog", "path"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-[13px] font-medium border-b-2 transition-colors"
            style={{ borderColor: tab === t ? "var(--bb)" : "transparent", color: tab === t ? "var(--bt)" : "var(--t2)" }}>
            {t === "catalog" ? "Platform Catalog" : "My Learning Path"}
          </button>
        ))}
      </div>

      {tab === "catalog" && (
        <CatalogTab catalog={catalog} onAdopt={(m) => setAdoptSheet(m)} />
      )}

      {tab === "path" && (
        <PathTab
          modules={myModules}
          expandedId={expandedModuleId}
          onToggleExpand={(id) => setExpandedModuleId(id === expandedModuleId ? null : id)}
          onCreateModule={() => setModuleSheet("new")}
          onEditModule={(m) => setModuleSheet(m)}
          onEditAdoption={(m) => setAdoptSheet(m)}
          onDeleteModule={async (m) => {
            if (!confirm(`Delete "${m.title}"?`)) return;
            setSaving(true);
            try {
              if (m.isPlatform) await shiftoraApi.adminRemoveAdoption(tenant.id, m.id);
              else await shiftoraApi.adminDeleteModule(tenant.id, m.id);
              load();
            } catch (e) { setError((e as Error).message); }
            finally { setSaving(false); }
          }}
          onAddUnit={(moduleId) => setUnitSheet({ moduleId })}
          onEditUnit={(moduleId, unit) => setUnitSheet({ moduleId, unit })}
          onDeleteUnit={async (unit) => {
            if (!confirm(`Delete unit "${unit.title}"?`)) return;
            setSaving(true);
            try { await shiftoraApi.adminDeleteUnit(unit.id); load(); }
            catch (e) { setError((e as Error).message); }
            finally { setSaving(false); }
          }}
          saving={saving}
        />
      )}

      {/* Adoption sheet */}
      {adoptSheet && (
        <AdoptionSheet
          module={adoptSheet}
          tenantId={tenant.id}
          onClose={() => setAdoptSheet(null)}
          onSaved={() => { setAdoptSheet(null); load(); }}
        />
      )}

      {/* Module create/edit sheet */}
      {moduleSheet && (
        <ModuleSheet
          module={moduleSheet === "new" ? null : moduleSheet}
          tenantId={tenant.id}
          onClose={() => setModuleSheet(null)}
          onSaved={() => { setModuleSheet(null); load(); }}
        />
      )}

      {/* Unit create/edit sheet */}
      {unitSheet && (
        <UnitSheet
          moduleId={unitSheet.moduleId}
          unit={unitSheet.unit}
          onClose={() => setUnitSheet(null)}
          onSaved={() => { setUnitSheet(null); load(); }}
        />
      )}
    </div>
  );
}

// ── Catalog tab ──────────────────────────────────────────────────────────────

function CatalogTab({ catalog, onAdopt }: { catalog: LearningModule[]; onAdopt: (m: LearningModule) => void }) {
  const [q, setQ] = useState("");
  const filtered = catalog.filter((m) => !q || m.title.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search platform modules…"
        className="w-full max-w-sm rounded-md border border-border bg-surface px-3 py-2 text-[13px] mb-4 outline-none focus:border-[color:var(--bb)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((m) => (
          <Card key={m.id} hover>
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-md grid place-items-center shrink-0" style={{ background: "var(--bl)", color: "var(--bt)" }}>
                <IconBook className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[13.5px]">{m.title}</span>
                  <Chip tone="violet" className="text-[10px]">Platform</Chip>
                  {m.locked && <Chip tone="teal" className="text-[10px]">Added</Chip>}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{m.level} · {m.language} · {m.units.length || "?"} units</div>
                <div className="text-[11px] text-text-muted mt-1">{m.description}</div>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              {m.locked
                ? <Btn size="sm" onClick={() => onAdopt(m)}>Edit targeting</Btn>
                : <Btn size="sm" onClick={() => onAdopt(m)}><IconPlus className="size-3.5" /> Add to my school</Btn>}
            </div>
          </Card>
        ))}
        {!filtered.length && <Card><div className="text-[13px] text-text-muted">No platform modules found.</div></Card>}
      </div>
    </div>
  );
}

// ── My Path tab ──────────────────────────────────────────────────────────────

function PathTab({ modules, expandedId, onToggleExpand, onCreateModule, onEditModule, onEditAdoption,
  onDeleteModule, onAddUnit, onEditUnit, onDeleteUnit, saving }:
  { modules: LearningModule[]; expandedId: string | null; onToggleExpand: (id: string) => void;
    onCreateModule: () => void; onEditModule: (m: LearningModule) => void; onEditAdoption: (m: LearningModule) => void;
    onDeleteModule: (m: LearningModule) => void; onAddUnit: (moduleId: string) => void;
    onEditUnit: (moduleId: string, unit: LearningUnit) => void; onDeleteUnit: (unit: LearningUnit) => void; saving: boolean }) {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Btn size="sm" onClick={onCreateModule}><IconPlus className="size-4" /> Create module</Btn>
      </div>
      <div className="space-y-3">
        {modules.map((m) => (
          <Card key={m.id}>
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-md grid place-items-center shrink-0 font-bold text-[13px]"
                style={{ background: "var(--bl)", color: "var(--bt)" }}>{m.sortOrder}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[13.5px]">{m.title}</span>
                  {m.isPlatform && <Chip tone="violet" className="text-[10px]">Platform</Chip>}
                  <Chip tone={m.status === "published" ? "teal" : "gold"} className="text-[10px]">{m.status}</Chip>
                  {m.mandatory && <Chip tone="red" className="text-[10px]">Required</Chip>}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{m.level} · {m.language}</div>
                <div className="text-[11px] text-text-muted mt-0.5">{targetingSummary(m.targeting)}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => m.isPlatform ? onEditAdoption(m) : onEditModule(m)}
                  className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text">
                  <IconPencil className="size-3.5" />
                </button>
                <button onClick={() => onDeleteModule(m)} disabled={saving}
                  className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-[color:var(--er)]">
                  <IconTrash className="size-3.5" />
                </button>
                <button onClick={() => onToggleExpand(m.id)}
                  className="p-1.5 rounded hover:bg-surface-2 text-text-muted">
                  {expandedId === m.id ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />}
                </button>
              </div>
            </div>

            {expandedId === m.id && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>Units</SectionLabel>
                  {!m.isPlatform && (
                    <Btn size="sm" onClick={() => onAddUnit(m.id)}><IconPlus className="size-3.5" /> Add unit</Btn>
                  )}
                </div>
                <div className="space-y-1.5">
                  {m.units.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-[12px]">
                      <span className="size-5 rounded grid place-items-center text-[10px] font-bold shrink-0"
                        style={{ background: "var(--s3)", color: "var(--t2)" }}>{u.sortOrder}</span>
                      <Chip tone={u.type === "video" ? "blue" : u.type === "quiz" ? "violet" : u.type === "activity" ? "gold" : "muted"}
                        className="text-[10px] shrink-0">{u.type}</Chip>
                      <span className="flex-1 truncate">{u.title}</span>
                      <span className="text-text-muted shrink-0">{u.estimatedMinutes}m</span>
                      {!m.isPlatform && (
                        <>
                          <button onClick={() => onEditUnit(m.id, u)} className="p-1 text-text-muted hover:text-text"><IconPencil className="size-3" /></button>
                          <button onClick={() => onDeleteUnit(u)} className="p-1 text-text-muted hover:text-[color:var(--er)]"><IconTrash className="size-3" /></button>
                        </>
                      )}
                    </div>
                  ))}
                  {!m.units.length && <div className="text-[12px] text-text-muted">No units yet.</div>}
                </div>
              </div>
            )}
          </Card>
        ))}
        {!modules.length && <Card><div className="text-[13px] text-text-muted">No modules in your learning path. Browse the Platform Catalog to add some.</div></Card>}
      </div>
    </div>
  );
}

// ── Adoption sheet ────────────────────────────────────────────────────────────

function AdoptionSheet({ module, tenantId, onClose, onSaved }:
  { module: LearningModule; tenantId: string; onClose: () => void; onSaved: () => void }) {
  const existing = module.locked; // locked = already adopted in catalog
  const [board, setBoard] = useState<string>(String((module.targeting as LearningModuleTargeting).board ?? "Any"));
  const [grade, setGrade] = useState<string>(String((module.targeting as LearningModuleTargeting).grade ?? "Any"));
  const [subject, setSubject] = useState<string>(String((module.targeting as LearningModuleTargeting).subject ?? ""));
  const [minR, setMinR] = useState<number>((module.targeting as LearningModuleTargeting).minReadiness ?? 0);
  const [maxR, setMaxR] = useState<number>((module.targeting as LearningModuleTargeting).maxReadiness ?? 100);
  const [mandatory, setMandatory] = useState(module.mandatory);
  const [sortOrder, setSortOrder] = useState(module.sortOrder);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const body = { moduleId: module.id, mandatory, sortOrder, targeting: { board, grade, subject: subject || "Any", minReadiness: minR, maxReadiness: maxR } };
      if (existing) await shiftoraApi.adminUpdateAdoption(tenantId, module.id, body);
      else await shiftoraApi.adminAdoptModule(tenantId, body);
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <SheetOverlay onClose={onClose} title={existing ? "Edit targeting" : "Add to my school"} subtitle={module.title}>
      {error && <div className="text-[12px] text-[color:var(--er)] mb-3">{error}</div>}
      <TargetingFields board={board} setBoard={setBoard} grade={grade} setGrade={setGrade}
        subject={subject} setSubject={setSubject} minR={minR} setMinR={setMinR} maxR={maxR} setMaxR={setMaxR} />
      <div className="flex items-center gap-2 mt-3">
        <input type="checkbox" id="mand" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} className="rounded" />
        <label htmlFor="mand" className="text-[12px]">Required (mark as mandatory for matching teachers)</label>
      </div>
      <div className="mt-3">
        <label className="text-[11px] text-text-muted block mb-1">Sort order</label>
        <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-24 rounded border border-border bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-[color:var(--bb)]" />
      </div>
      <div className="flex gap-2 mt-5 justify-end">
        <Btn size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : existing ? "Save changes" : "Add to my school"}</Btn>
      </div>
    </SheetOverlay>
  );
}

// ── Module sheet ──────────────────────────────────────────────────────────────

function ModuleSheet({ module, tenantId, onClose, onSaved }:
  { module: LearningModule | null; tenantId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(module?.title ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [level, setLevel] = useState(module?.level ?? "Beginner");
  const [language, setLanguage] = useState(module?.language ?? "English");
  const [minutes, setMinutes] = useState(module?.estimatedMinutes ?? 30);
  const [sortOrder, setSortOrder] = useState(module?.sortOrder ?? 10);
  const [status, setStatus] = useState(module?.status ?? "draft");
  const [mandatory, setMandatory] = useState(module?.mandatory ?? false);
  const [board, setBoard] = useState<string>(String((module?.targeting as LearningModuleTargeting | undefined)?.board ?? "Any"));
  const [grade, setGrade] = useState<string>(String((module?.targeting as LearningModuleTargeting | undefined)?.grade ?? "Any"));
  const [subject, setSubject] = useState<string>(String((module?.targeting as LearningModuleTargeting | undefined)?.subject ?? ""));
  const [minR, setMinR] = useState<number>((module?.targeting as LearningModuleTargeting | undefined)?.minReadiness ?? 0);
  const [maxR, setMaxR] = useState<number>((module?.targeting as LearningModuleTargeting | undefined)?.maxReadiness ?? 100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const body = { title, description, level, language, estimatedMinutes: minutes, status, mandatory, sortOrder,
        targeting: { board, grade, subject: subject || "Any", minReadiness: minR, maxReadiness: maxR } };
      if (module) await shiftoraApi.adminUpdateModule(tenantId, module.id, body);
      else await shiftoraApi.adminCreateModule(tenantId, body);
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <SheetOverlay onClose={onClose} title={module ? "Edit module" : "Create module"} subtitle={module?.title}>
      {error && <div className="text-[12px] text-[color:var(--er)] mb-3">{error}</div>}
      <div className="space-y-3">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="e.g. AI Foundations" />
        </Field>
        <Field label="Description">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level">
            <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Language">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </Field>
          <Field label="Est. minutes">
            <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Sort order">
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input type="checkbox" id="pub" checked={status === "published"} onChange={(e) => setStatus(e.target.checked ? "published" : "draft")} />
            <label htmlFor="pub" className="text-[12px]">Published</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="mand2" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} />
            <label htmlFor="mand2" className="text-[12px]">Required</label>
          </div>
        </div>
        <SectionLabel>Audience targeting</SectionLabel>
        <TargetingFields board={board} setBoard={setBoard} grade={grade} setGrade={setGrade}
          subject={subject} setSubject={setSubject} minR={minR} setMinR={setMinR} maxR={maxR} setMaxR={setMaxR} />
      </div>
      <div className="flex gap-2 mt-5 justify-end">
        <Btn size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : module ? "Save changes" : "Create module"}</Btn>
      </div>
    </SheetOverlay>
  );
}

// ── Unit sheet ────────────────────────────────────────────────────────────────

function UnitSheet({ moduleId, unit, onClose, onSaved }:
  { moduleId: string; unit?: LearningUnit; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(unit?.title ?? "");
  const [type, setType] = useState<string>(unit?.type ?? "reading");
  const [minutes, setMinutes] = useState(unit?.estimatedMinutes ?? 10);
  const [sortOrder, setSortOrder] = useState(unit?.sortOrder ?? 1);
  const [summary, setSummary] = useState(String(unit?.content?.summary ?? ""));
  const [body, setBody] = useState(String(unit?.content?.body ?? ""));
  const [videoUrl, setVideoUrl] = useState(String(unit?.content?.videoUrl ?? ""));
  const [activity, setActivity] = useState(String(unit?.content?.activity ?? ""));
  const [question, setQuestion] = useState(String(unit?.content?.question ?? ""));
  const [answer, setAnswer] = useState(String(unit?.content?.answer ?? ""));
  const [extTitle, setExtTitle] = useState(String((unit?.content?.externalResources as {title:string;url:string;source?:string}[])?.[0]?.title ?? ""));
  const [extUrl, setExtUrl] = useState(String((unit?.content?.externalResources as {title:string;url:string;source?:string}[])?.[0]?.url ?? ""));
  const [extSource, setExtSource] = useState(String((unit?.content?.externalResources as {title:string;url:string;source?:string}[])?.[0]?.source ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const buildContent = () => {
    const content: Record<string, unknown> = {};
    if (summary) content.summary = summary;
    if (body) content.body = body;
    if (videoUrl) content.videoUrl = videoUrl;
    if (activity) content.activity = activity;
    if (question) content.question = question;
    if (answer) content.answer = answer;
    if (extUrl) content.externalResources = [{ title: extTitle || extUrl, url: extUrl, source: extSource || undefined }];
    return content;
  };

  const save = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true);
    setError("");
    try {
      const body2 = { title, type, estimatedMinutes: minutes, sortOrder, content: buildContent() };
      if (unit) await shiftoraApi.adminUpdateUnit(unit.id, body2);
      else await shiftoraApi.adminAddUnit(moduleId, body2);
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <SheetOverlay onClose={onClose} title={unit ? "Edit unit" : "Add unit"} subtitle={unit?.title}>
      {error && <div className="text-[12px] text-[color:var(--er)] mb-3">{error}</div>}
      <div className="space-y-3">
        <Field label="Title">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Unit title" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type">
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>
              {UNIT_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Minutes">
            <input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Order">
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} />
          </Field>
        </div>

        {(type === "reading" || type === "activity" || type === "quiz" || type === "external") && (
          <Field label="Summary">
            <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={inputCls} placeholder="One-line description shown before content" />
          </Field>
        )}
        {type === "reading" && (
          <Field label="Body text">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} className={inputCls} placeholder="Full article text (markdown supported)" />
          </Field>
        )}
        {type === "video" && (
          <Field label="YouTube URL">
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputCls} placeholder="https://www.youtube.com/watch?v=..." />
          </Field>
        )}
        {type === "activity" && (
          <Field label="Instructions">
            <textarea value={activity} onChange={(e) => setActivity(e.target.value)} rows={4} className={inputCls} placeholder="Step-by-step activity instructions" />
          </Field>
        )}
        {type === "quiz" && (
          <>
            <Field label="Question">
              <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} className={inputCls} />
            </Field>
            <Field label="Expected answer">
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={2} className={inputCls} />
            </Field>
          </>
        )}
        {type === "external" && (
          <>
            <Field label="Link title">
              <input value={extTitle} onChange={(e) => setExtTitle(e.target.value)} className={inputCls} placeholder="e.g. DIKSHA Tamil Nadu" />
            </Field>
            <Field label="URL">
              <input value={extUrl} onChange={(e) => setExtUrl(e.target.value)} className={inputCls} placeholder="https://..." />
            </Field>
            <Field label="Source label (optional)">
              <input value={extSource} onChange={(e) => setExtSource(e.target.value)} className={inputCls} placeholder="e.g. DIKSHA, YouTube, NCERT" />
            </Field>
          </>
        )}
      </div>
      <div className="flex gap-2 mt-5 justify-end">
        <Btn size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : unit ? "Save changes" : "Add unit"}</Btn>
      </div>
    </SheetOverlay>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function TargetingFields({ board, setBoard, grade, setGrade, subject, setSubject, minR, setMinR, maxR, setMaxR }:
  { board: string; setBoard: (v: string) => void; grade: string; setGrade: (v: string) => void;
    subject: string; setSubject: (v: string) => void; minR: number; setMinR: (v: number) => void;
    maxR: number; setMaxR: (v: number) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Field label="Board">
        <select value={board} onChange={(e) => setBoard(e.target.value)} className={inputCls}>
          {BOARDS.map((b) => <option key={b}>{b}</option>)}
        </select>
      </Field>
      <Field label="Grade">
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls}>
          {GRADES.map((g) => <option key={g}>{g}</option>)}
        </select>
      </Field>
      <Field label="Subject (blank = Any)">
        <input value={subject} onChange={(e) => setSubject(e.target.value)} className={inputCls} placeholder="Mathematics, Science…" />
      </Field>
      <div />
      <Field label={`Min readiness: ${minR}%`}>
        <input type="range" min={0} max={100} step={5} value={minR} onChange={(e) => setMinR(Number(e.target.value))} className="w-full" />
      </Field>
      <Field label={`Max readiness: ${maxR}%`}>
        <input type="range" min={0} max={100} step={5} value={maxR} onChange={(e) => setMaxR(Number(e.target.value))} className="w-full" />
      </Field>
    </div>
  );
}

function SheetOverlay({ children, onClose, title, subtitle }:
  { children: React.ReactNode; onClose: () => void; title: string; subtitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="relative w-full max-w-md bg-surface h-full overflow-y-auto p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="font-semibold text-[15px]">{title}</div>
            {subtitle && <div className="text-[12px] text-text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text"><IconX className="size-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-text-muted block mb-1">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded border border-border bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-[color:var(--bb)]";
