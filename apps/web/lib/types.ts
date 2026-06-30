export type Stage =
  | "pre-founder"
  | "discovery"
  | "problem-solution-fit"
  | "mvp-build"
  | "first-revenue"
  | "pmf"
  | "pre-seed"
  | "series-a";

export interface FounderIntake {
  name: string;
  email: string;
  role: string;
  equity_pct: number;
  vesting?: string;
}

export interface IntakeRequest {
  company_name: string;
  owner_email: string;
  one_liner: string;
  industry: string;
  stage: Stage;
  jurisdiction: "US" | "PK";
  entity_type: "c-corp" | "llc";
  formation_status: "idea" | "forming" | "formed";
  website?: string | null;
  ein?: string | null;
  target_round?: string | null;
  target_amount_usd?: number | null;
  founders: FounderIntake[];
  facts?: Record<string, string>;
  founder_name?: string | null;
  founder_background?: string | null;
  founder_goals?: string | null;
  founder_motivation?: string | null;
  risk_tolerance?: "conservative" | "balanced" | "aggressive" | null;
  founder_experience?: "first-time" | "some-experience" | "serial" | null;
  time_commitment?: "exploring" | "part-time" | "full-time" | null;
}

export interface FounderView {
  founder_id: string;
  name: string;
  email: string;
  role: string;
  equity_pct: number;
  vesting: string;
}

export interface FounderProfile {
  name: string;
  role: string;
  background: string;
  goals: string;
  motivation: string;
  risk_tolerance: string;
  experience: string;
  time_commitment: string;
  completed: boolean;
}

export interface Milestone {
  milestone_id: string;
  title: string;
  category: string;
  occurred_on: string;
  note: string;
}

export interface Integration {
  integration_id: string;
  provider: string;
  capability: string;
  status: string;
}

export interface InputNote {
  note_id: string;
  kind: string;
  text: string;
  created_at: string;
}

export interface Evidence {
  evidence_id: string;
  name: string;
  kind: string;
  ref: string;
  note: string;
  added_at: string;
}

export interface DomainView {
  domain: string;
  status: "empty" | "partial" | "complete";
  fields: Record<string, string>;
}

export interface CompanySnapshot {
  company_id: string;
  name: string;
  owner_email: string;
  one_liner: string;
  industry: string;
  stage: string;
  jurisdiction: string;
  entity_type: string;
  formation_status: string;
  website?: string | null;
  team_size: number;
  target_round?: string | null;
  target_amount_usd?: number | null;
  ein?: string | null;
  problem: string;
  customer: string;
  solution: string;
  readiness_score: number;
  documents: DocumentRecord[];
  submitted_documents: Record<string, SubmittedDoc>;
  founder_profile: FounderProfile;
  milestones: Milestone[];
  integrations: Integration[];
  notes: InputNote[];
  evidence: Evidence[];
  assessments: Record<string, Record<string, string>>;
  facts: Record<string, string>;
  founders: FounderView[];
  domains: DomainView[];
  intake_complete: boolean;
  version: number;
}

export interface DimensionScore {
  dimension: string;
  score: number;
  weight: number;
  contribution: number;
}

export interface HealthScore {
  overall: number;
  status: "strong" | "healthy" | "moderate" | "at-risk" | "critical";
  dimensions: DimensionScore[];
}

export interface NextAction {
  title: string;
  why: string;
  workflow: string;
  priority: number;
}

export interface AdvisorAction {
  title: string;
  workflow: string;
}

export interface Answer {
  intent: string;
  headline: string;
  detail: string;
  facts: string[];
  actions: AdvisorAction[];
}

export interface AskResponse {
  answer: Answer;
  suggested: string[];
}

export interface Prereq {
  label: string;
  met: boolean;
  required: boolean;
  fix: string;
}

export type GuardrailAction =
  | "hire-employee"
  | "raise-round"
  | "issue-equity"
  | "open-banking"
  | "sign-customer";

export interface GuardrailResult {
  action: string;
  verdict: "safe" | "caution" | "blocked";
  headline: string;
  prerequisites: Prereq[];
}

export interface CompanyRisk {
  id: string;
  severity: "critical" | "high" | "medium" | "info";
  title: string;
  detail: string;
  mitigation: string;
  workflow: string;
}

export interface JourneyNode {
  id: string;
  label: string;
  kind: "validate" | "build" | "formalize" | "scale";
  status: "done" | "current" | "next" | "future";
  summary: string;
  your_status: string;
  next_action: string;
  winner_move: string;
  workflow: string;
  case_study_id: string;
}

export interface Journey {
  nodes: JourneyNode[];
  current_index: number;
  headline: string;
  next_action: string;
}

export interface Recommendation {
  id: string;
  title: string;
  why_it_matters: string;
  reasoning: string;
  steps: string[];
  resources: string[];
  priority: number;
  deadline?: string | null;
  expected_outcome: string;
  workflow: string;
  case_study_id: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  outcome: "failure" | "success";
  category: string;
  story: string;
  lesson: string;
  action: string;
  workflow: string;
}

export interface ComplianceItem {
  id: string;
  title: string;
  authority: string;
  category: string;
  due_date: string;
  frequency: string;
  status: "overdue" | "due-soon" | "upcoming" | "done";
  severity: "critical" | "standard";
  note: string;
}

export interface IdeaValidationAnswers {
  problem: string;
  customer: string;
  solution: string;
  customer_conversations: "none" | "1-5" | "5-20" | "20+";
  problem_evidence: "assumption" | "some-signal" | "strong-evidence";
  willingness_to_pay: "no-signal" | "interest" | "verbal-commit" | "loi-or-paying";
  market_size: "niche" | "growing" | "large" | "massive";
  differentiation: "me-too" | "some-edge" | "strong-moat";
  founder_market_fit: "exploring" | "some-domain" | "deep-expertise";
  mvp_status: "none" | "building" | "shipped";
  revenue_status: "none" | "pilots" | "paying";
  team: "solo" | "cofounders";
  goal: "lifestyle" | "vc-scale";
  commitment: "exploring" | "part-time" | "full-time";
}

export interface Signal {
  label: string;
  score: number;
  note: string;
}

export interface Risk {
  level: "high" | "medium" | "info";
  title: string;
  detail: string;
}

export interface IdeaAssessment {
  detected_stage: string;
  readiness_score: number;
  verdict: "promising" | "needs-validation" | "early";
  signals: Signal[];
  risks: Risk[];
  recommendation: { action: "validate-more" | "form-now"; headline: string; detail: string };
}

export interface IdeaReasoning {
  verdict: "strong-go" | "promising" | "needs-work" | "pivot";
  headline: string;
  reasoning: string;
  strengths: string[];
  concerns: string[];
  improvements: string[];
  should_proceed: boolean;
  source: "ai" | "engine";
}

export interface ValidationResult {
  assessment: IdeaAssessment;
  reasoning: IdeaReasoning;
}

export interface ChatTurn {
  role: "user" | "cofounder";
  content: string;
}

export interface ChatExample {
  company: string;
  takeaway: string;
}

export interface ChatSource {
  title: string;
  url: string;
}

export interface IdeaChatResponse {
  reply: string;
  facts: Record<string, string>;
  question: string;
  next_steps: string[];
  examples: ChatExample[];
  sources: ChatSource[];
  riskiest_assumption: string;
  refined_problem: string;
  refined_solution: string;
  ready: boolean;
  concluded: boolean;
  verdict: string;
}

export interface DocField {
  key: string;
  label: string;
  placeholder: string;
  kind: "text" | "textarea" | "date" | "number" | "money";
  prefill: string;
}

export interface DocumentDef {
  name: string;
  required: boolean;
  critical: boolean;
  note: string;
  fields: DocField[];
  template: string;
  guidance: string;
}

export interface SubmittedDoc {
  doc_key: string;
  workflow_code: string;
  phase_n: number;
  doc_name: string;
  method: "filled" | "uploaded";
  fields: Record<string, string>;
  filename: string;
}

export interface SubmitResult {
  workflow: WorkflowView;
  submitted: string[];
}

export type Actor = "startupkit" | "provider" | "founder";
export type Mode = "automated" | "assisted" | "manual";

export interface Phase {
  n: number;
  name: string;
  summary: string;
  actor: Actor;
  mode: Mode;
  cta: string;
  documents: DocumentDef[];
}

export interface WorkflowDef {
  code: string;
  slug: string;
  name: string;
  goal: string;
  color: string;
  depends_on: string[];
  unlocks: string[];
  phases: Phase[];
}

export type WorkflowStatus = "locked" | "available" | "in-progress" | "complete";

export interface WorkflowView {
  definition: WorkflowDef;
  status: WorkflowStatus;
  progress_pct: number;
  completed_phases: number[];
  blocked_reason: string;
}

export interface GeneratedDocument {
  doc_id: string;
  doc_type: string;
  workflow_code: string;
  phase_n: number;
  version: number;
  status: string;
  body: string;
  issues: string[];
}

export type DocumentRecord = GeneratedDocument;

export interface GenerateResult {
  documents: GeneratedDocument[];
  workflow: WorkflowView;
}
