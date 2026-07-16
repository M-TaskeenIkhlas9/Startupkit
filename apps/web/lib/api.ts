import type {
  AskResponse,
  Attribution,
  BrandHealth,
  BrandState,
  ChannelMatrix,
  ChatReply,
  CoachTip,
  CaseStudy,
  ContentPlanDraft,
  Deliverability,
  Discovery,
  GtmGuardrail,
  GtmDoc,
  GtmDraft,
  GtmHealth,
  GtmState,
  MotionRead,
  PricingRead,
  PeopleState,
  CompanyRisk,
  CompanySnapshot,
  ComplianceItem,
  PlayMatch,
  GenerateResult,
  SubmitResult,
  GuardrailAction,
  GuardrailResult,
  HealthScore,
  ChatTurn,
  IdeaChatResponse,
  Journey,
  Recommendation,
  IdeaValidationAnswers,
  IntakeRequest,
  NextAction,
  ValidationResult,
  WorkflowDef,
  WorkflowView,
} from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return (await res.json()) as T;
}

export async function validateIdea(answers: IdeaValidationAnswers): Promise<ValidationResult> {
  const res = await fetch(`${BASE}/api/validate-idea`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(answers),
  });
  return json(res);
}

export async function ideaChat(body: {
  problem: string;
  customer: string;
  solution: string;
  facts: Record<string, string>;
  messages: ChatTurn[];
  user_message: string;
}): Promise<IdeaChatResponse> {
  const res = await fetch(`${BASE}/api/idea-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json(res);
}

export async function createCompany(req: IntakeRequest): Promise<{ company_id: string }> {
  const res = await fetch(`${BASE}/api/companies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  return json(res);
}

export async function getCompany(id: string): Promise<CompanySnapshot> {
  return json(await fetch(`${BASE}/api/companies/${id}`, { cache: "no-store" }));
}

export async function getHealth(id: string): Promise<HealthScore> {
  return json(await fetch(`${BASE}/api/companies/${id}/health`, { cache: "no-store" }));
}

export async function getNextActions(id: string): Promise<NextAction[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/next`, { cache: "no-store" }));
}

export async function getCompliance(id: string): Promise<ComplianceItem[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/compliance`, { cache: "no-store" }));
}

export async function getRisks(id: string): Promise<CompanyRisk[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/risks`, { cache: "no-store" }));
}

export async function getRecommendations(id: string): Promise<Recommendation[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/recommendations`, { cache: "no-store" }));
}

export async function getJourney(id: string): Promise<Journey> {
  return json(await fetch(`${BASE}/api/companies/${id}/journey`, { cache: "no-store" }));
}

export async function getCaseStudies(id: string): Promise<CaseStudy[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/case-studies`, { cache: "no-store" }));
}

async function post<T>(id: string, path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE}/api/companies/${id}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json<T>(res);
}

export const addMilestone = (id: string, body: object) =>
  post<CompanySnapshot>(id, "milestones", body);
export const connectIntegration = (id: string, body: object) =>
  post<CompanySnapshot>(id, "integrations", body);
export const addNote = (id: string, body: object) => post<CompanySnapshot>(id, "notes", body);
export const addEvidence = (id: string, body: object) =>
  post<CompanySnapshot>(id, "evidence", body);
export const setFounderProfile = (id: string, body: object) =>
  post<CompanySnapshot>(id, "founder-profile", body);

export const saveAssessment = (id: string, phase: number, answers: Record<string, string>) =>
  post<CompanySnapshot>(id, "assessment", { phase, answers });

export async function askCofounder(id: string, question: string): Promise<AskResponse> {
  const res = await fetch(`${BASE}/api/companies/${id}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question }),
  });
  return json(res);
}

export async function checkGuardrail(
  id: string,
  action: GuardrailAction,
): Promise<GuardrailResult> {
  const res = await fetch(`${BASE}/api/companies/${id}/guardrail/${action}`, { method: "POST" });
  return json(res);
}

export async function getCompanyWorkflows(id: string): Promise<WorkflowView[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/workflows`, { cache: "no-store" }));
}

export async function getWorkflowCatalog(): Promise<WorkflowDef[]> {
  return json(await fetch(`${BASE}/api/workflows`, { cache: "no-store" }));
}

export async function completePhase(
  id: string,
  code: string,
  phaseN: number,
): Promise<WorkflowView> {
  const res = await fetch(
    `${BASE}/api/companies/${id}/workflows/${code}/phases/${phaseN}/complete`,
    { method: "POST" },
  );
  return json(res);
}

export async function generatePhase(
  id: string,
  code: string,
  phaseN: number,
): Promise<GenerateResult> {
  const res = await fetch(
    `${BASE}/api/companies/${id}/workflows/${code}/phases/${phaseN}/generate`,
    { method: "POST" },
  );
  return json(res);
}

export async function fillDocument(
  id: string,
  body: { workflow_code: string; phase_n: number; doc_name: string; fields: Record<string, string> },
): Promise<SubmitResult> {
  const res = await fetch(`${BASE}/api/companies/${id}/documents/fill`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json(res);
}

export async function uploadDocument(
  id: string,
  body: {
    workflow_code: string;
    phase_n: number;
    doc_name: string;
    filename: string;
    content_base64: string;
  },
): Promise<SubmitResult> {
  const res = await fetch(`${BASE}/api/companies/${id}/documents/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return json(res);
}

// --- W5 · Brand & Product Foundation -----------------------------------------------------------

export async function getBrandPlays(id: string): Promise<PlayMatch[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/brand/plays`));
}

export async function generateBrand(id: string, playId: string): Promise<BrandState> {
  const res = await fetch(`${BASE}/api/companies/${id}/brand/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ play_id: playId }),
  });
  return json(res);
}

export async function saveBrand(id: string, state: BrandState): Promise<CompanySnapshot> {
  const res = await fetch(`${BASE}/api/companies/${id}/brand`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  return json(res);
}

export async function getBrandHealth(id: string): Promise<BrandHealth> {
  return json(await fetch(`${BASE}/api/companies/${id}/brand/health`));
}

/** W5 production layer — public URLs served by the API (real files / a hosted page). */
export const brandWordmarkUrl = (id: string) => `${BASE}/api/companies/${id}/brand/wordmark.svg`;
export const brandFaviconUrl = (id: string) => `${BASE}/api/companies/${id}/brand/favicon.svg`;
export const publishedSiteUrl = (id: string) => `${BASE}/site/${id}`;

export async function brandChat(
  id: string,
  message: string,
  history: string[],
): Promise<ChatReply> {
  const res = await fetch(`${BASE}/api/companies/${id}/brand/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return json(res);
}

// --- W7 · Go-To-Market ---------------------------------------------------------------------------

export async function getDeliverability(id: string, domain = ""): Promise<Deliverability> {
  const q = domain ? `?domain=${encodeURIComponent(domain)}` : "";
  return json(await fetch(`${BASE}/api/companies/${id}/gtm/deliverability${q}`, { cache: "no-store" }));
}

export async function generateContent(id: string): Promise<ContentPlanDraft> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm/content/generate`, { method: "POST" });
  return json(res);
}

/** Research what comparable companies charge and propose tiers. Does not persist. */
export async function researchPricing(id: string): Promise<PricingRead> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm/pricing`, { method: "POST" });
  return json(res);
}

/** Infer the motion signals from the Company Object — don't ask what we already know. */
export async function readMotion(id: string): Promise<MotionRead> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm/motion`, { method: "POST" });
  return json(res);
}

/** Research the market from the ICP and propose real accounts. Does not persist. */
export async function discoverAccounts(id: string, trigger = "funding"): Promise<Discovery> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm/discover?trigger=${trigger}`, {
    method: "POST",
  });
  return json(res);
}

export async function getGtmHealth(id: string): Promise<GtmHealth> {
  return json(await fetch(`${BASE}/api/companies/${id}/gtm/health`, { cache: "no-store" }));
}

/** Every channel ranked for this motion: 2 bets, the rest ignored with a reason. */
export async function getChannelMatrix(id: string, motion = ""): Promise<ChannelMatrix> {
  const q = motion ? `?motion=${encodeURIComponent(motion)}` : "";
  return json(await fetch(`${BASE}/api/companies/${id}/gtm/channels${q}`, { cache: "no-store" }));
}

/** The pipeline talks back — warnings computed from real account stages. */
export async function getGtmGuardrails(id: string): Promise<GtmGuardrail[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/gtm/guardrails`, { cache: "no-store" }));
}

/** Which trigger is producing conversations, computed from real stages. */
export async function getGtmAttribution(id: string): Promise<Attribution> {
  return json(await fetch(`${BASE}/api/companies/${id}/gtm/attribution`, { cache: "no-store" }));
}

/** GTM Q&A grounded in the founder's own pipeline numbers. */
export async function gtmChat(id: string, message: string, history: string[]): Promise<ChatReply> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history }),
  });
  return json(res);
}

export async function getGtmDocs(id: string): Promise<GtmDoc[]> {
  return json(await fetch(`${BASE}/api/companies/${id}/gtm/docs`, { cache: "no-store" }));
}

/** W7 orchestrates — it hands the decision to the tool that executes it. */
export const gtmExportUrl = (id: string, kind: string) =>
  `${BASE}/api/companies/${id}/gtm/export/${kind}.csv`;
export const gtmDocUrl = (id: string, key: string) =>
  `${BASE}/api/companies/${id}/gtm/docs/${key}.md`;

export async function generateGtm(id: string): Promise<GtmDraft> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm/generate`, { method: "POST" });
  return json(res);
}

export async function saveGtm(id: string, state: GtmState): Promise<CompanySnapshot> {
  const res = await fetch(`${BASE}/api/companies/${id}/gtm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  return json(res);
}

export async function savePeople(id: string, state: PeopleState): Promise<CompanySnapshot> {
  const res = await fetch(`${BASE}/api/companies/${id}/people`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(state),
  });
  return json(res);
}

export async function getBrandCoach(
  id: string,
  step: string,
  playId: string,
): Promise<CoachTip> {
  const res = await fetch(`${BASE}/api/companies/${id}/brand/coach`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ step, play_id: playId }),
  });
  return json(res);
}
