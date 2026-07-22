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
  brand?: BrandState;
  people?: PeopleState;
  gtm?: GtmState;
  ops?: OpsState;
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

// --- W5 · Brand & Product Foundation -----------------------------------------------------------

export interface PlayMatch {
  play_id: string;
  name: string;
  move: string;
  examples: string[];
  rationale: string;
  score: number;
}

export interface BrandCore {
  play_id: string;
  play_name: string;
  play_rationale: string;
  examples: string[];
  mission: string;
  vision: string;
  values: string[];
  icp: string;
  category: string;
  positioning: string;
  voice: string;
  tagline: string;
  pitch: string;
  pillars: string[];
  sources: string[];
  source: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
  role: string;
}

export interface VisualSystem {
  palette: ColorSwatch[];
  type_display: string;
  type_body: string;
  logo_direction: string;
}

export interface PresenceItem {
  kind: string;
  handle: string;
  status: string;
  detail: string;
}

export interface BrandState {
  core: BrandCore;
  visual: VisualSystem;
  presence: PresenceItem[];
  site_template: string;
  steps_done: string[];
  asset_edits: Record<string, string>;
}

export interface ChatReply {
  reply: string;
  source: string;
}

export interface HiringRole {
  id: string;
  title: string;
  dept: string;
  reports_to: string;
  priority: string;
  goal: string;
  why_not_founders: string;
  hours_lost: string;
  revenue_unlocked: string;
  hire_type: string;
  full_time: string;
  remote: string;
  budget: string;
  start_date: string;
}

export interface TeamMember {
  id: string;
  name: string;
  title: string;
}

export interface DocRecord {
  generated: boolean;
  text: string;
  status: string; // unsigned | signed
  delivery_mode: string; // "" | manual | auto
  reminder_hours: number;
  sent_confirm: string;
  uploaded_file: string;
}

export interface PayrollPacket {
  work_state: string;
  tax_form: string;
  i9: string;
  bank: string;
  deposit: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  start_date: string;
  docs: Record<string, DocRecord>;
  onboarding_link: string;
  onboarding_send_mode: string; // email | copy
  onboarding_sent: boolean;
  onboarding_complete: boolean;
  onboarding_confirm: string;
  payroll_packet: PayrollPacket | null;
  tier: string;
  access_granted: boolean;
  access_confirm: string;
}

export interface PeopleState {
  existing_team: TeamMember[];
  roles: HiringRole[];
  employees: Employee[];
  done_steps: number[];
}

// --- W7 · Go-To-Market -------------------------------------------------------------------------
// W5 produces the file; W7 produces the reply, the payment, and the evidence. W7 never re-stores
// the ICP/positioning/deck — those are read from the Brand Core as inherited context.

export interface GtmStrategy {
  motion: string; // outbound | plg | hybrid
  motion_rationale: string;
  objective: string; // first_customers | waitlist | launch | fundraise
  channels: string[];
  summary: string;
}

export interface PricingTier {
  name: string;
  price: string;
  unit: string;
  features: string[];
}

export interface Pricing {
  model: string; // freemium | flat | seat | usage | tiered
  tiers: PricingTier[];
  pilot: string;
  locked: boolean;
}

export interface TargetAccount {
  name: string;
  domain: string;
  size: string;
  trigger: string;
  stage: string; // prospect | contacted | replied | demo | pilot | won | lost
  owner: string; // who on YOUR side owns this
  contact: string; // the human at THEIR side
  email: string; // their address — you paste it; we don't enrich
  referred_by: string; // name of the existing customer who sent them, empty if not a referral
}

export interface Sequence {
  name: string;
  channel: string; // email | linkedin
  steps: string[];
  approved: boolean;
}

export interface Connection {
  kind: string; // crm | analytics | email | payments
  provider: string;
  status: string; // off | connected | verified
  detail: string;
}

export interface LostDeal {
  account: string;
  reason: string;
  note: string;
}

export interface PriceComp {
  name: string;
  price: string;
  note: string;
  url: string;
}

export interface PricingRead {
  comps: PriceComp[];
  tiers: PricingTier[];
  model: string;
  rationale: string;
  sources: string[];
  source: string;
  note: string;
}

export interface MotionSignal {
  value: string;
  evidence: string;
  known: boolean;
}

export interface MotionRead {
  acv: MotionSignal;
  self_serve: MotionSignal;
  committee: MotionSignal;
  motion: string;
  motion_why: string;
  source: string;
}

export interface Discovery {
  accounts: TargetAccount[];
  query: string;
  sources: string[];
  source: string; // engine | ai
  note: string;
}

export interface GtmDimension {
  name: string;
  score: number;
  hint: string;
}

export interface GtmHealth {
  score: number;
  label: string;
  dimensions: GtmDimension[];
}

export interface GtmDoc {
  key: string;
  name: string;
}

export interface Campaign {
  id: string;
  name: string;
  goal: string;
  channel: string; // outbound | content | launch | referral
  start: string;
  end: string;
  status: string; // draft | planning | active | done
  accounts: string[];
  sequence: string;
}

export interface Task {
  text: string;
  link: string;
  due: string;
  priority: string; // high | medium | low
  done: boolean;
}

export interface GtmDraft {
  strategy: GtmStrategy;
  triggers: string[];
  disqualifiers: string;
  sequences: Sequence[];
  objections: string[];
  campaigns: Campaign[];
  tasks: Task[];
  source: string; // engine | ai
}

export interface GtmInputs {
  acv: string;
  self_serve: string;
  committee: string;
  size_band: string;
  triggers: string[];
  disqualifiers: string;
  tier_counts: number[];
  wtp: number[]; // Van Westendorp: [too_cheap, bargain, expensive, too_expensive, n]
  capture_fields: string[];
  thanks: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  crm_model: string;
  payment_link: string; // the founder's own checkout URL — we never take the money
}

export interface DesignPartner {
  name: string;
  contact: string;
  email: string;
  stage: string; // identified | pitched | agreed | onboarded | feedback | reference | paying
  notes: string;
}

export interface ContentIdea {
  title: string;
  platform: string; // blog | linkedin | x
  week: number;
  done: boolean;
}

export interface DnsCheck {
  name: string;
  status: string; // pass | fail | unknown
  detail: string;
}

export interface Deliverability {
  domain: string;
  checks: DnsCheck[];
  ready: boolean;
  note: string;
  warmup: string[];
}

export interface ContentPlanDraft {
  ideas: ContentIdea[];
  source: string;
  note: string;
}

export interface Experiment {
  id: string;
  hypothesis: string;
  metric: string; // the ONE number that settles it
  result: string;
  status: string; // running | proved | disproved
  decision: string; // keep | kill | scale
}

export interface ChannelVerdict {
  channel: string;
  verdict: string; // bet | support | ignore
  why: string;
}

export interface ChannelMatrix {
  motion: string;
  verdicts: ChannelVerdict[];
  note: string;
}

export interface GtmGuardrail {
  severity: string; // stop | warn
  text: string;
  link: string; // the W7 module the warning opens
}

export interface TriggerStat {
  trigger: string;
  accounts: number;
  contacted: number;
  replied: number;
  won: number;
}

export interface Attribution {
  rows: TriggerStat[];
  best: string;
  note: string;
}

export interface OnboardingStep {
  label: string;
  done: boolean;
}

export interface CustomerRecord {
  account: string; // matches TargetAccount.name
  onboarding: OnboardingStep[];
  last_contact: string; // ISO date
  status: string; // active | churned — founder-set, never inferred
  notes: string;
}

export interface CustomerHealthItem {
  account: string;
  onboarding_pct: number;
  status: string; // active | churned
  days_since_contact: number | null;
  at_risk: boolean; // real, computed: active but no contact logged in 30+ days
  referred_by: string;
}

export interface ReferralStat {
  account: string;
  referred: string[];
}

export interface CustomerSuccessView {
  customers: CustomerHealthItem[];
  won_count: number;
  active_count: number;
  at_risk_count: number;
  churned_count: number;
  referred_count: number;
  referral_rate: number;
  top_referrers: ReferralStat[];
  onboarding_template: string[];
}

export interface GtmState {
  inputs: GtmInputs;
  strategy: GtmStrategy;
  pricing: Pricing;
  accounts: TargetAccount[];
  sequences: Sequence[];
  connections: Connection[];
  lost_deals: LostDeal[];
  campaigns: Campaign[];
  tasks: Task[];
  partners: DesignPartner[];
  content: ContentIdea[];
  experiments: Experiment[];
  customers: CustomerRecord[];
  steps_done: string[];
}

export interface BrandCase {
  brand: string;
  play_id: string;
  steps: string[];
  move: string;
  takeaway: string;
}

export interface CoachTip {
  step: string;
  headline: string;
  guidance: string;
  watch_out: string;
  cases: BrandCase[];
  source: string;
}

export interface BrandDimension {
  name: string;
  score: number;
  hint: string;
}

export interface BrandHealth {
  score: number;
  label: string;
  dimensions: BrandDimension[];
}

// --- W8 · Operations & Tooling -------------------------------------------------------------------

export interface Cadence {
  name: string;
  freq: string;
  kind: string; // weekly | monthly | quarterly
  day: string;
  time: string;
  mins: number;
  attendees: string;
  purpose: string;
  booked: boolean;
}

export interface DecisionRight {
  decision: string;
  owner: string;
  note: string;
}

export interface AreaOwner {
  area: string;
  owner: string;
}

export interface QuarterGoal {
  text: string;
  metric: string;
  code: string;
}

export interface Sop {
  id: string;
  title: string;
  why: string;
  status: string; // proposed | drafted | adopted
  owner: string;
  trigger: string;
  steps: string[];
  done_means: string;
  runs: number;
  last_run: string;
}

export interface OpsVendor {
  id: string;
  name: string;
  category: string;
  cost: string;
  renewal: string;
  owner: string;
  access: string;
  critical: boolean;
  source: string;
}

export interface OpsRisk {
  id: string;
  key: string;
  title: string;
  category: string;
  likelihood: number;
  impact: number;
  severity: string;
  evidence: string;
  mitigation: string;
  status: string; // open | mitigated | accepted | resolved
  workflow: string;
}

export interface Policy {
  id: string;
  name: string;
  summary: string;
  rules: string[];
  adopted: boolean;
  adopted_on: string;
  agreed_by: string;
}

export interface OpsReview {
  date: string;
  wins: string;
  priority: string;
}

export interface Initiative {
  id: string;
  title: string;
  owner: string;
  target: string;
  status: string; // planned | active | done | blocked
  note: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: string;
  owner: string;
  location: string;
  last_reviewed: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  assignee: string;
  cost: string;
  purchased: string;
  status: string; // active | retired
}

export interface Automation {
  id: string;
  name: string;
  trigger: string;
  action: string;
  tool: string;
  owner: string;
  status: string; // active | broken | retired
}

export interface OpsState {
  mission: string;
  stakes: string;
  cadences: Cadence[];
  decisions: DecisionRight[];
  owners: AreaOwner[];
  goals: QuarterGoal[];
  sops: Sop[];
  vendors: OpsVendor[];
  risks: OpsRisk[];
  policies: Policy[];
  reviews: OpsReview[];
  initiatives: Initiative[];
  knowledge: KnowledgeItem[];
  assets: Asset[];
  automations: Automation[];
  steps_done: string[];
  generated: boolean;
}
