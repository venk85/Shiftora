import { createFileRoute } from "@tanstack/react-router";
import { shiftoraApi, type LearningModule, type LearningModuleTargeting, type LearningUnit } from "@/lib/shiftora-api";
import { Card, PageHeader, Chip, Btn, SectionLabel } from "@/components/shiftora/primitives";
import { IconBook, IconChevronDown, IconChevronUp, IconPencil, IconPlus, IconTrash, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/platform/content")({ component: PlatformContent });

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["English", "Tamil", "Hindi", "Tamil + Hindi", "English + Tamil + Hindi", "Mixed"];
const BOARDS = ["Any", "CBSE", "ICSE", "Tamil Nadu State Board", "IB", "IGCSE"];
const UNIT_TYPES = ["reading", "video", "activity", "quiz", "external"] as const;

function PlatformContent() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [moduleSheet, setModuleSheet] = useState<LearningModule | "new" | null>(null);
  const [unitSheet, setUnitSheet] = useState<{ moduleId: string; unit?: LearningUnit } | null>(null);

  const load = () => {
    setError("");
    void shiftoraApi.platformContentModules().then(setModules).catch((e) => setError((e as Error).message));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <PageHeader title="Platform content" subtitle="Reusable learning modules available to all school admins."
        right={<Btn size="sm" onClick={() => setModuleSheet("new")}><IconPlus className="size-4" /> New module</Btn>} />
      {error && <Card className="mb-4"><div className="text-[13px] text-[color:var(--er)]">{error}</div></Card>}

      <div className="space-y-3">
        {modules.map((m) => (
          <Card key={m.id}>
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-md grid place-items-center shrink-0"
                style={{ background: "var(--bl)", color: "var(--bt)" }}><IconBook className="size-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[13.5px]">{m.title}</span>
                  <Chip tone={m.status === "published" ? "teal" : "gold"} className="text-[10px]">{m.status}</Chip>
                  {m.mandatory && <Chip tone="red" className="text-[10px]">Required</Chip>}
                </div>
                <div className="text-[11px] text-text-muted mt-0.5">{m.level} · {m.language} · {m.estimatedMinutes}min</div>
                <div className="text-[11px] text-text-muted mt-0.5">{m.description}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setModuleSheet(m)} className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-text">
                  <IconPencil className="size-3.5" />
                </button>
                <button disabled={saving} onClick={async () => {
                  if (!confirm(`Delete "${m.title}"?`)) return;
                  setSaving(true);
                  try { await shiftoraApi.platformDeleteModule(m.id); load(); }
                  catch (e) { setError((e as Error).message); }
                  finally { setSaving(false); }
                }} className="p-1.5 rounded hover:bg-surface-2 text-text-muted hover:text-[color:var(--er)]">
                  <IconTrash className="size-3.5" />
                </button>
                <button onClick={() => setExpandedId(expandedId === m.id ? null : m.id)}
                  className="p-1.5 rounded hover:bg-surface-2 text-text-muted">
                  {expandedId === m.id ? <IconChevronUp className="size-3.5" /> : <IconChevronDown className="size-3.5" />}
                </button>
              </div>
            </div>

            {expandedId === m.id && (
              <div className="mt-4 border-t border-border pt-3">
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel>Units ({m.units.length})</SectionLabel>
                  <Btn size="sm" onClick={() => setUnitSheet({ moduleId: m.id })}><IconPlus className="size-3.5" /> Add unit</Btn>
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
                      <button onClick={() => setUnitSheet({ moduleId: m.id, unit: u })} className="p-1 text-text-muted hover:text-text"><IconPencil className="size-3" /></button>
                      <button onClick={async () => {
                        if (!confirm(`Delete "${u.title}"?`)) return;
                        setSaving(true);
                        try { await shiftoraApi.platformDeleteUnit(u.id); load(); }
                        catch (e) { setError((e as Error).message); }
                        finally { setSaving(false); }
                      }} className="p-1 text-text-muted hover:text-[color:var(--er)]"><IconTrash className="size-3" /></button>
                    </div>
                  ))}
                  {!m.units.length && <div className="text-[12px] text-text-muted">No units yet.</div>}
                </div>
              </div>
            )}
          </Card>
        ))}
        {!modules.length && !error && (
          <Card><div className="text-[13px] text-text-muted">No platform modules yet. Create the first one.</div></Card>
        )}
      </div>

      {moduleSheet && (
        <PlatformModuleSheet
          module={moduleSheet === "new" ? null : moduleSheet}
          onClose={() => setModuleSheet(null)}
          onSaved={() => { setModuleSheet(null); load(); }}
        />
      )}
      {unitSheet && (
        <PlatformUnitSheet
          moduleId={unitSheet.moduleId}
          unit={unitSheet.unit}
          onClose={() => setUnitSheet(null)}
          onSaved={() => { setUnitSheet(null); load(); }}
        />
      )}
    </div>
  );
}

function PlatformModuleSheet({ module, onClose, onSaved }:
  { module: LearningModule | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(module?.title ?? "");
  const [description, setDescription] = useState(module?.description ?? "");
  const [level, setLevel] = useState(module?.level ?? "Beginner");
  const [language, setLanguage] = useState(module?.language ?? "English");
  const [minutes, setMinutes] = useState(module?.estimatedMinutes ?? 30);
  const [sortOrder, setSortOrder] = useState(module?.sortOrder ?? 10);
  const [status, setStatus] = useState(module?.status ?? "draft");
  const [mandatory, setMandatory] = useState(module?.mandatory ?? false);
  const [board, setBoard] = useState(String((module?.targeting as LearningModuleTargeting | undefined)?.board ?? "Any"));
  const [grade, setGrade] = useState(String((module?.targeting as LearningModuleTargeting | undefined)?.grade ?? "Any"));
  const [minR, setMinR] = useState((module?.targeting as LearningModuleTargeting | undefined)?.minReadiness ?? 0);
  const [maxR, setMaxR] = useState((module?.targeting as LearningModuleTargeting | undefined)?.maxReadiness ?? 100);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const body = { title, description, level, language, estimatedMinutes: minutes, status, mandatory, sortOrder,
        targeting: { board, grade, minReadiness: minR, maxReadiness: maxR } };
      if (module) await shiftoraApi.platformUpdateModule(module.id, body);
      else await shiftoraApi.platformCreateModule(body);
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <SheetOverlay onClose={onClose} title={module ? "Edit platform module" : "New platform module"}>
      {error && <div className="text-[12px] text-[color:var(--er)] mb-3">{error}</div>}
      <div className="space-y-3">
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
        <Field label="Description"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Level"><select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <Field label="Language"><select value={language} onChange={(e) => setLanguage(e.target.value)} className={inputCls}>{LANGUAGES.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <Field label="Est. minutes"><input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Sort order"><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} /></Field>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={status === "published"} onChange={(e) => setStatus(e.target.checked ? "published" : "draft")} /> Published</label>
          <label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /> Required by default</label>
        </div>
        <SectionLabel>Default targeting (school admins can override)</SectionLabel>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Board"><select value={board} onChange={(e) => setBoard(e.target.value)} className={inputCls}>{BOARDS.map((b) => <option key={b}>{b}</option>)}</select></Field>
          <Field label="Grade"><input value={grade} onChange={(e) => setGrade(e.target.value)} className={inputCls} placeholder="Any" /></Field>
          <Field label={`Min readiness: ${minR}%`}><input type="range" min={0} max={100} step={5} value={minR} onChange={(e) => setMinR(Number(e.target.value))} className="w-full" /></Field>
          <Field label={`Max readiness: ${maxR}%`}><input type="range" min={0} max={100} step={5} value={maxR} onChange={(e) => setMaxR(Number(e.target.value))} className="w-full" /></Field>
        </div>
      </div>
      <div className="flex gap-2 mt-5 justify-end">
        <Btn size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : module ? "Save changes" : "Create"}</Btn>
      </div>
    </SheetOverlay>
  );
}

function PlatformUnitSheet({ moduleId, unit, onClose, onSaved }:
  { moduleId: string; unit?: LearningUnit; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(unit?.title ?? "");
  const [type, setType] = useState(unit?.type ?? "reading");
  const [minutes, setMinutes] = useState(unit?.estimatedMinutes ?? 10);
  const [sortOrder, setSortOrder] = useState(unit?.sortOrder ?? 1);
  const [summary, setSummary] = useState(String(unit?.content?.summary ?? ""));
  const [body, setBody] = useState(String(unit?.content?.body ?? ""));
  const [videoUrl, setVideoUrl] = useState(String(unit?.content?.videoUrl ?? ""));
  const [activity, setActivity] = useState(String(unit?.content?.activity ?? ""));
  const [question, setQuestion] = useState(String(unit?.content?.question ?? ""));
  const [expectedAnswer, setExpectedAnswer] = useState(String(unit?.content?.answer ?? ""));
  const [extTitle, setExtTitle] = useState(String((unit?.content?.externalResources as {title:string;url:string;source?:string}[])?.[0]?.title ?? ""));
  const [extUrl, setExtUrl] = useState(String((unit?.content?.externalResources as {title:string;url:string;source?:string}[])?.[0]?.url ?? ""));
  const [extSource, setExtSource] = useState(String((unit?.content?.externalResources as {title:string;url:string;source?:string}[])?.[0]?.source ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!title.trim()) { setError("Title is required"); return; }
    setSaving(true); setError("");
    try {
      const content: Record<string, unknown> = {};
      if (summary) content.summary = summary;
      if (body) content.body = body;
      if (videoUrl) content.videoUrl = videoUrl;
      if (activity) content.activity = activity;
      if (question) content.question = question;
      if (expectedAnswer) content.answer = expectedAnswer;
      if (extUrl) content.externalResources = [{ title: extTitle || extUrl, url: extUrl, source: extSource || undefined }];
      const payload = { title, type, estimatedMinutes: minutes, sortOrder, content };
      if (unit) await shiftoraApi.platformUpdateUnit(unit.id, payload);
      else await shiftoraApi.platformAddUnit(moduleId, payload);
      onSaved();
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <SheetOverlay onClose={onClose} title={unit ? "Edit unit" : "Add unit"}>
      {error && <div className="text-[12px] text-[color:var(--er)] mb-3">{error}</div>}
      <div className="space-y-3">
        <Field label="Title"><input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Type"><select value={type} onChange={(e) => setType(e.target.value)} className={inputCls}>{UNIT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Minutes"><input type="number" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} className={inputCls} /></Field>
          <Field label="Order"><input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} className={inputCls} /></Field>
        </div>
        {type !== "video" && <Field label="Summary"><textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={2} className={inputCls} placeholder="Brief description" /></Field>}
        {type === "reading" && <Field label="Body"><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={6} className={inputCls} placeholder="Full content (markdown supported)" /></Field>}
        {type === "video" && <Field label="YouTube URL"><input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputCls} placeholder="https://www.youtube.com/watch?v=..." /></Field>}
        {type === "activity" && <Field label="Instructions"><textarea value={activity} onChange={(e) => setActivity(e.target.value)} rows={5} className={inputCls} /></Field>}
        {type === "quiz" && <>
          <Field label="Question"><textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2} className={inputCls} /></Field>
          <Field label="Expected answer"><textarea value={expectedAnswer} onChange={(e) => setExpectedAnswer(e.target.value)} rows={2} className={inputCls} /></Field>
        </>}
        {type === "external" && <>
          <Field label="Display title"><input value={extTitle} onChange={(e) => setExtTitle(e.target.value)} className={inputCls} /></Field>
          <Field label="URL"><input value={extUrl} onChange={(e) => setExtUrl(e.target.value)} className={inputCls} placeholder="https://..." /></Field>
          <Field label="Source label"><input value={extSource} onChange={(e) => setExtSource(e.target.value)} className={inputCls} placeholder="DIKSHA, YouTube, NCERT…" /></Field>
        </>}
      </div>
      <div className="flex gap-2 mt-5 justify-end">
        <Btn size="sm" onClick={onClose}>Cancel</Btn>
        <Btn size="sm" onClick={save} disabled={saving}>{saving ? "Saving…" : unit ? "Save" : "Add unit"}</Btn>
      </div>
    </SheetOverlay>
  );
}

function SheetOverlay({ children, onClose, title, subtitle }:
  { children: React.ReactNode; onClose: () => void; title: string; subtitle?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end" style={{ background: "rgba(0,0,0,0.35)" }} onClick={onClose}>
      <div className="relative w-full max-w-md bg-surface h-full overflow-y-auto p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
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
