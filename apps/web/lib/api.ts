import type {
  AskResponse,
  CaseStudy,
  CompanyRisk,
  CompanySnapshot,
  ComplianceItem,
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
