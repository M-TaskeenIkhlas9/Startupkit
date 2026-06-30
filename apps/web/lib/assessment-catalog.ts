// Auto-generated from Questoins/startupkit-phase*.html — the early-journey assessment.
// 5 phases (Pre-Founder -> First Revenue), 44 modules, 249 questions.

export interface AQuestion { id: string; n: string; q: string; opts: string[]; }
export interface AModule { title: string; obj: string; output: string; questions: AQuestion[]; }
export interface APhase { phase: number; name: string; modules: AModule[]; }

export const ASSESSMENT: APhase[] = [
  {
    "phase": 1,
    "name": "Pre-Founder Discovery & Assessment",
    "modules": [
      {
        "title": "Founder Profile",
        "obj": "Understand who the founder is and their current situation.",
        "output": "FounderProfile",
        "questions": [
          {
            "id": "p1.m0.q0",
            "n": "01",
            "q": "What is your full name?",
            "opts": []
          },
          {
            "id": "p1.m0.q1",
            "n": "02",
            "q": "What country are you currently living in?",
            "opts": []
          },
          {
            "id": "p1.m0.q2",
            "n": "03",
            "q": "Are you a US citizen?",
            "opts": []
          },
          {
            "id": "p1.m0.q3",
            "n": "04",
            "q": "Have you started a company before?",
            "opts": []
          },
          {
            "id": "p1.m0.q4",
            "n": "05",
            "q": "What is your age range?",
            "opts": [
              "Under 18",
              "18–24",
              "25–34",
              "35–44",
              "45+"
            ]
          },
          {
            "id": "p1.m0.q5",
            "n": "06",
            "q": "What is your highest level of education?",
            "opts": []
          },
          {
            "id": "p1.m0.q6",
            "n": "07",
            "q": "What is your current occupation?",
            "opts": []
          },
          {
            "id": "p1.m0.q7",
            "n": "08",
            "q": "What is your employment status?",
            "opts": [
              "Full-Time",
              "Part-Time",
              "Student",
              "Unemployed"
            ]
          },
          {
            "id": "p1.m0.q8",
            "n": "09",
            "q": "How many hours per week can you dedicate to your startup?",
            "opts": []
          }
        ]
      },
      {
        "title": "Founder Goals",
        "obj": "Understand the founder's motivation and desired outcome.",
        "output": "FounderGoalsProfile",
        "questions": [
          {
            "id": "p1.m1.q0",
            "n": "01",
            "q": "Why do you want to start a company?",
            "opts": [
              "Financial freedom",
              "Solve a problem",
              "Venture-backed startup",
              "Lifestyle business",
              "Other"
            ]
          },
          {
            "id": "p1.m1.q1",
            "n": "02",
            "q": "What outcome are you targeting?",
            "opts": [
              "Side income",
              "$10K/month",
              "Acquisition",
              "Venture-backed",
              "IPO-scale"
            ]
          },
          {
            "id": "p1.m1.q2",
            "n": "03",
            "q": "Are you planning to raise investment?",
            "opts": [
              "Yes",
              "No",
              "Unsure"
            ]
          },
          {
            "id": "p1.m1.q3",
            "n": "04",
            "q": "How important is rapid growth?",
            "opts": []
          },
          {
            "id": "p1.m1.q4",
            "n": "05",
            "q": "What is your startup timeline?",
            "opts": [
              "Exploring",
              "Within 6 months",
              "Within 1 year",
              "More than 1 year"
            ]
          }
        ]
      },
      {
        "title": "Skills Assessment",
        "obj": "Assess execution capability.",
        "output": "FounderSkillMatrix",
        "questions": [
          {
            "id": "p1.m2.q0",
            "n": "01",
            "q": "Are you technical?",
            "opts": []
          },
          {
            "id": "p1.m2.q1",
            "n": "02",
            "q": "Can you build software yourself?",
            "opts": []
          },
          {
            "id": "p1.m2.q2",
            "n": "03",
            "q": "Have you launched products before?",
            "opts": []
          },
          {
            "id": "p1.m2.q3",
            "n": "04",
            "q": "What industries do you know best?",
            "opts": []
          },
          {
            "id": "p1.m2.q4",
            "n": "05",
            "q": "What professional experience do you have?",
            "opts": []
          },
          {
            "id": "p1.m2.q5",
            "n": "06",
            "q": "What is your strongest skill?",
            "opts": []
          },
          {
            "id": "p1.m2.q6",
            "n": "07",
            "q": "What is your weakest skill?",
            "opts": []
          }
        ]
      },
      {
        "title": "Resource Assessment",
        "obj": "Determine available resources.",
        "output": "FounderResourceProfile",
        "questions": [
          {
            "id": "p1.m3.q0",
            "n": "01",
            "q": "How much startup capital do you currently have?",
            "opts": [
              "< $1,000",
              "$1,000–$5,000",
              "$5,000–$25,000",
              "> $25,000"
            ]
          },
          {
            "id": "p1.m3.q1",
            "n": "02",
            "q": "What monthly budget can you dedicate to the startup?",
            "opts": []
          },
          {
            "id": "p1.m3.q2",
            "n": "03",
            "q": "Do you already have customers?",
            "opts": []
          },
          {
            "id": "p1.m3.q3",
            "n": "04",
            "q": "Do you already have users?",
            "opts": []
          },
          {
            "id": "p1.m3.q4",
            "n": "05",
            "q": "Do you already have a team?",
            "opts": []
          },
          {
            "id": "p1.m3.q5",
            "n": "06",
            "q": "Do you already have a co-founder?",
            "opts": []
          },
          {
            "id": "p1.m3.q6",
            "n": "07",
            "q": "Do you have industry connections?",
            "opts": []
          },
          {
            "id": "p1.m3.q7",
            "n": "08",
            "q": "Have investors expressed interest?",
            "opts": []
          }
        ]
      },
      {
        "title": "Domain Expertise Discovery",
        "obj": "Discover areas where the founder has unfair advantages.",
        "output": "DomainExpertiseMap",
        "questions": [
          {
            "id": "p1.m4.q0",
            "n": "01",
            "q": "What industries do you know deeply?",
            "opts": []
          },
          {
            "id": "p1.m4.q1",
            "n": "02",
            "q": "Which industry have you worked in the longest?",
            "opts": []
          },
          {
            "id": "p1.m4.q2",
            "n": "03",
            "q": "What industry frustrates you most?",
            "opts": []
          },
          {
            "id": "p1.m4.q3",
            "n": "04",
            "q": "What recurring problems do you experience?",
            "opts": []
          },
          {
            "id": "p1.m4.q4",
            "n": "05",
            "q": "What tools do you use weekly?",
            "opts": []
          },
          {
            "id": "p1.m4.q5",
            "n": "06",
            "q": "What tasks waste the most time?",
            "opts": []
          },
          {
            "id": "p1.m4.q6",
            "n": "07",
            "q": "What frustrations do your colleagues face?",
            "opts": []
          },
          {
            "id": "p1.m4.q7",
            "n": "08",
            "q": "What workarounds do people commonly use?",
            "opts": []
          },
          {
            "id": "p1.m4.q8",
            "n": "09",
            "q": "What products do you complain about most?",
            "opts": []
          },
          {
            "id": "p1.m4.q9",
            "n": "10",
            "q": "What product would you replace immediately if you could?",
            "opts": []
          }
        ]
      },
      {
        "title": "Problem Discovery",
        "obj": "Identify startup opportunities. StartupKit collects up to five major problems — and runs every one through the same ten questions.",
        "output": "Per problem ×5",
        "questions": [
          {
            "id": "p1.m5.q0",
            "n": "01",
            "q": "Describe the problem.",
            "opts": []
          },
          {
            "id": "p1.m5.q1",
            "n": "02",
            "q": "How often does it occur?",
            "opts": [
              "Daily",
              "Weekly",
              "Monthly"
            ]
          },
          {
            "id": "p1.m5.q2",
            "n": "03",
            "q": "How painful is it?",
            "opts": []
          },
          {
            "id": "p1.m5.q3",
            "n": "04",
            "q": "Who experiences this problem?",
            "opts": []
          },
          {
            "id": "p1.m5.q4",
            "n": "05",
            "q": "Approximately how many people experience it?",
            "opts": []
          },
          {
            "id": "p1.m5.q5",
            "n": "06",
            "q": "How do people currently solve it?",
            "opts": []
          },
          {
            "id": "p1.m5.q6",
            "n": "07",
            "q": "Why are existing solutions inadequate?",
            "opts": []
          },
          {
            "id": "p1.m5.q7",
            "n": "08",
            "q": "Have you paid money trying to solve it?",
            "opts": []
          },
          {
            "id": "p1.m5.q8",
            "n": "09",
            "q": "Have others paid money to solve it?",
            "opts": []
          },
          {
            "id": "p1.m5.q9",
            "n": "10",
            "q": "What would happen if this problem disappeared?",
            "opts": []
          }
        ]
      },
      {
        "title": "Startup Idea Assessment",
        "obj": "Evaluate an existing startup idea — if the founder already has one.",
        "output": "Q1 — Do you already have a startup idea?",
        "questions": [
          {
            "id": "p1.m6.q0",
            "n": "02",
            "q": "Describe your startup in one sentence.",
            "opts": []
          },
          {
            "id": "p1.m6.q1",
            "n": "03",
            "q": "What problem does it solve?",
            "opts": []
          },
          {
            "id": "p1.m6.q2",
            "n": "04",
            "q": "Who is the customer?",
            "opts": []
          },
          {
            "id": "p1.m6.q3",
            "n": "05",
            "q": "Why does this problem matter now?",
            "opts": []
          },
          {
            "id": "p1.m6.q4",
            "n": "06",
            "q": "What alternatives currently exist?",
            "opts": []
          },
          {
            "id": "p1.m6.q5",
            "n": "07",
            "q": "Why is your solution better?",
            "opts": []
          },
          {
            "id": "p1.m6.q6",
            "n": "08",
            "q": "Why will customers switch?",
            "opts": []
          },
          {
            "id": "p1.m6.q7",
            "n": "09",
            "q": "Is this B2B or B2C?",
            "opts": [
              "B2B",
              "B2C"
            ]
          },
          {
            "id": "p1.m6.q8",
            "n": "10",
            "q": "Is this local or global?",
            "opts": [
              "Local",
              "Global"
            ]
          },
          {
            "id": "p1.m6.q9",
            "n": "11",
            "q": "How will the company make money?",
            "opts": []
          },
          {
            "id": "p1.m6.q10",
            "n": "12",
            "q": "What assumptions are you making?",
            "opts": []
          },
          {
            "id": "p1.m6.q11",
            "n": "13",
            "q": "What is the biggest risk?",
            "opts": []
          }
        ]
      },
      {
        "title": "Co-Founder Assessment",
        "obj": "Evaluate founder-team readiness.",
        "output": "Q1 — Do you have a co-founder?",
        "questions": [
          {
            "id": "p1.m7.q0",
            "n": "02",
            "q": "How long have you known them?",
            "opts": []
          },
          {
            "id": "p1.m7.q1",
            "n": "03",
            "q": "Have you worked together before?",
            "opts": []
          },
          {
            "id": "p1.m7.q2",
            "n": "04",
            "q": "What skills do they contribute?",
            "opts": []
          },
          {
            "id": "p1.m7.q3",
            "n": "05",
            "q": "Are responsibilities clearly defined?",
            "opts": []
          },
          {
            "id": "p1.m7.q4",
            "n": "06",
            "q": "Have you discussed equity?",
            "opts": []
          },
          {
            "id": "p1.m7.q5",
            "n": "07",
            "q": "Have you discussed vesting?",
            "opts": []
          },
          {
            "id": "p1.m7.q6",
            "n": "08",
            "q": "Have you discussed founder departure scenarios?",
            "opts": []
          },
          {
            "id": "p1.m7.q7",
            "n": "09",
            "q": "Have you discussed fundraising expectations?",
            "opts": []
          },
          {
            "id": "p1.m7.q8",
            "n": "10",
            "q": "Have you discussed commitment levels?",
            "opts": []
          }
        ]
      },
      {
        "title": "Startup Readiness Assessment",
        "obj": "Measure current startup maturity.",
        "output": "StartupReadinessAssessment",
        "questions": [
          {
            "id": "p1.m8.q0",
            "n": "01",
            "q": "Have you conducted customer interviews?",
            "opts": []
          },
          {
            "id": "p1.m8.q1",
            "n": "02",
            "q": "How many interviews?",
            "opts": []
          },
          {
            "id": "p1.m8.q2",
            "n": "03",
            "q": "Do you have evidence of demand?",
            "opts": []
          },
          {
            "id": "p1.m8.q3",
            "n": "04",
            "q": "Do you have Letters of Intent (LOIs)?",
            "opts": []
          },
          {
            "id": "p1.m8.q4",
            "n": "05",
            "q": "Do you have paying customers?",
            "opts": []
          },
          {
            "id": "p1.m8.q5",
            "n": "06",
            "q": "Do you have a prototype?",
            "opts": []
          },
          {
            "id": "p1.m8.q6",
            "n": "07",
            "q": "Do you have an MVP?",
            "opts": []
          },
          {
            "id": "p1.m8.q7",
            "n": "08",
            "q": "Do you have recurring revenue?",
            "opts": []
          }
        ]
      }
    ]
  },
  {
    "phase": 2,
    "name": "Customer Discovery",
    "modules": [
      {
        "title": "Customer Definition",
        "obj": "Identify exactly who experiences the problem.",
        "output": "IdealCustomerProfile",
        "questions": [
          {
            "id": "p2.m0.q0",
            "n": "01",
            "q": "Who experiences this problem?",
            "opts": []
          },
          {
            "id": "p2.m0.q1",
            "n": "02",
            "q": "What is their job title?",
            "opts": []
          },
          {
            "id": "p2.m0.q2",
            "n": "03",
            "q": "What industry are they in?",
            "opts": []
          },
          {
            "id": "p2.m0.q3",
            "n": "04",
            "q": "Are they individuals or businesses?",
            "opts": []
          },
          {
            "id": "p2.m0.q4",
            "n": "05",
            "q": "What company size are they from?",
            "opts": []
          },
          {
            "id": "p2.m0.q5",
            "n": "06",
            "q": "What country are they located in?",
            "opts": []
          },
          {
            "id": "p2.m0.q6",
            "n": "07",
            "q": "What does a typical day look like?",
            "opts": []
          },
          {
            "id": "p2.m0.q7",
            "n": "08",
            "q": "What are their responsibilities?",
            "opts": []
          },
          {
            "id": "p2.m0.q8",
            "n": "09",
            "q": "What metrics are they measured on?",
            "opts": []
          },
          {
            "id": "p2.m0.q9",
            "n": "10",
            "q": "What causes them stress?",
            "opts": []
          }
        ]
      },
      {
        "title": "Interview Planning",
        "obj": "Build a customer interview pipeline.",
        "output": "InterviewAcquisitionPlan",
        "questions": [
          {
            "id": "p2.m1.q0",
            "n": "01",
            "q": "Where can these customers be found?",
            "opts": []
          },
          {
            "id": "p2.m1.q1",
            "n": "02",
            "q": "How many potential interviewees do you know personally?",
            "opts": []
          },
          {
            "id": "p2.m1.q2",
            "n": "03",
            "q": "Which communities contain these users?",
            "opts": []
          },
          {
            "id": "p2.m1.q3",
            "n": "04",
            "q": "Which LinkedIn groups contain them?",
            "opts": []
          },
          {
            "id": "p2.m1.q4",
            "n": "05",
            "q": "Which Reddit communities contain them?",
            "opts": []
          },
          {
            "id": "p2.m1.q5",
            "n": "06",
            "q": "Which Facebook groups contain them?",
            "opts": []
          },
          {
            "id": "p2.m1.q6",
            "n": "07",
            "q": "Which forums contain them?",
            "opts": []
          },
          {
            "id": "p2.m1.q7",
            "n": "08",
            "q": "Can you access them through your network?",
            "opts": []
          }
        ]
      },
      {
        "title": "Interview Execution",
        "obj": "Collect real customer insights.",
        "output": "20–30 interviews.",
        "questions": [
          {
            "id": "p2.m2.q0",
            "n": "01",
            "q": "Tell me about your role.",
            "opts": []
          },
          {
            "id": "p2.m2.q1",
            "n": "02",
            "q": "What are your biggest challenges?",
            "opts": []
          },
          {
            "id": "p2.m2.q2",
            "n": "03",
            "q": "Walk me through the last time this problem happened.",
            "opts": []
          },
          {
            "id": "p2.m2.q3",
            "n": "04",
            "q": "How often does it happen?",
            "opts": []
          },
          {
            "id": "p2.m2.q4",
            "n": "05",
            "q": "Why is it frustrating?",
            "opts": []
          },
          {
            "id": "p2.m2.q5",
            "n": "06",
            "q": "What do you currently do to solve it?",
            "opts": []
          },
          {
            "id": "p2.m2.q6",
            "n": "07",
            "q": "What tools do you use?",
            "opts": []
          },
          {
            "id": "p2.m2.q7",
            "n": "08",
            "q": "What do you like about current solutions?",
            "opts": []
          },
          {
            "id": "p2.m2.q8",
            "n": "09",
            "q": "What do you dislike?",
            "opts": []
          },
          {
            "id": "p2.m2.q9",
            "n": "10",
            "q": "How much time does it cost?",
            "opts": []
          },
          {
            "id": "p2.m2.q10",
            "n": "11",
            "q": "How much money does it cost?",
            "opts": []
          },
          {
            "id": "p2.m2.q11",
            "n": "12",
            "q": "What happens if the problem isn't solved?",
            "opts": []
          }
        ]
      },
      {
        "title": "Problem Validation",
        "obj": "Determine whether the problem is real.",
        "output": "ValidatedProblemReport",
        "questions": [
          {
            "id": "p2.m3.q0",
            "n": "01",
            "q": "How many interviewees reported the problem?",
            "opts": []
          },
          {
            "id": "p2.m3.q1",
            "n": "02",
            "q": "How many reported it as severe?",
            "opts": []
          },
          {
            "id": "p2.m3.q2",
            "n": "03",
            "q": "How many actively pay to solve it?",
            "opts": []
          },
          {
            "id": "p2.m3.q3",
            "n": "04",
            "q": "How many use workarounds?",
            "opts": []
          },
          {
            "id": "p2.m3.q4",
            "n": "05",
            "q": "How many requested a better solution?",
            "opts": []
          }
        ]
      },
      {
        "title": "Existing Solution Analysis",
        "obj": "Understand current alternatives.",
        "output": "AlternativeSolutionsDatabase",
        "questions": [
          {
            "id": "p2.m4.q0",
            "n": "01",
            "q": "What products are customers currently using?",
            "opts": []
          },
          {
            "id": "p2.m4.q1",
            "n": "02",
            "q": "What manual workarounds exist?",
            "opts": []
          },
          {
            "id": "p2.m4.q2",
            "n": "03",
            "q": "What spreadsheets are being used?",
            "opts": []
          },
          {
            "id": "p2.m4.q3",
            "n": "04",
            "q": "What consultants are being hired?",
            "opts": []
          },
          {
            "id": "p2.m4.q4",
            "n": "05",
            "q": "What agencies are being hired?",
            "opts": []
          },
          {
            "id": "p2.m4.q5",
            "n": "06",
            "q": "What software tools are being used?",
            "opts": []
          }
        ]
      },
      {
        "title": "Market Opportunity Assessment",
        "obj": "Estimate opportunity size.",
        "output": "OpportunityAssessment",
        "questions": [
          {
            "id": "p2.m5.q0",
            "n": "01",
            "q": "How many potential customers exist?",
            "opts": []
          },
          {
            "id": "p2.m5.q1",
            "n": "02",
            "q": "How frequently does the problem occur?",
            "opts": []
          },
          {
            "id": "p2.m5.q2",
            "n": "03",
            "q": "What is the estimated willingness to pay?",
            "opts": []
          },
          {
            "id": "p2.m5.q3",
            "n": "04",
            "q": "What is the estimated annual market value?",
            "opts": []
          },
          {
            "id": "p2.m5.q4",
            "n": "05",
            "q": "Is the market growing?",
            "opts": []
          }
        ]
      },
      {
        "title": "Customer Commitment Signals",
        "obj": "Measure actual demand — the only validation that isn't just talk.",
        "output": "DemandValidationScore",
        "questions": [
          {
            "id": "p2.m6.q0",
            "n": "01",
            "q": "Would customers take another meeting?",
            "opts": []
          },
          {
            "id": "p2.m6.q1",
            "n": "02",
            "q": "Would customers join a waitlist?",
            "opts": []
          },
          {
            "id": "p2.m6.q2",
            "n": "03",
            "q": "Would customers pilot a solution?",
            "opts": []
          },
          {
            "id": "p2.m6.q3",
            "n": "04",
            "q": "Would customers sign an LOI?",
            "opts": []
          },
          {
            "id": "p2.m6.q4",
            "n": "05",
            "q": "Would customers pre-pay?",
            "opts": []
          }
        ]
      },
      {
        "title": "Discovery Analytics",
        "obj": "StartupKit rolls every signal into one automatic reading — the Customer Discovery Score.",
        "output": "CustomerDiscoveryScore",
        "questions": []
      }
    ]
  },
  {
    "phase": 3,
    "name": "Problem-Solution Fit",
    "modules": [
      {
        "title": "Solution Definition",
        "obj": "Clearly define the proposed solution.",
        "output": "SolutionDefinitionDocument",
        "questions": [
          {
            "id": "p3.m0.q0",
            "n": "01",
            "q": "What solution are you proposing?",
            "opts": []
          },
          {
            "id": "p3.m0.q1",
            "n": "02",
            "q": "What customer problem does it solve?",
            "opts": []
          },
          {
            "id": "p3.m0.q2",
            "n": "03",
            "q": "What is the primary outcome for the customer?",
            "opts": []
          },
          {
            "id": "p3.m0.q3",
            "n": "04",
            "q": "Why is this better than current alternatives?",
            "opts": []
          },
          {
            "id": "p3.m0.q4",
            "n": "05",
            "q": "What is unique about your approach?",
            "opts": []
          },
          {
            "id": "p3.m0.q5",
            "n": "06",
            "q": "What assumptions must be true for success?",
            "opts": []
          },
          {
            "id": "p3.m0.q6",
            "n": "07",
            "q": "What are the biggest risks?",
            "opts": []
          }
        ]
      },
      {
        "title": "Value Proposition",
        "obj": "Define customer value.",
        "output": "ValuePropositionCanvas",
        "questions": [
          {
            "id": "p3.m1.q0",
            "n": "01",
            "q": "What job is the customer hiring your product to do?",
            "opts": []
          },
          {
            "id": "p3.m1.q1",
            "n": "02",
            "q": "What time savings will it provide?",
            "opts": []
          },
          {
            "id": "p3.m1.q2",
            "n": "03",
            "q": "What cost savings will it provide?",
            "opts": []
          },
          {
            "id": "p3.m1.q3",
            "n": "04",
            "q": "What revenue increase could it create?",
            "opts": []
          },
          {
            "id": "p3.m1.q4",
            "n": "05",
            "q": "What risk reduction could it create?",
            "opts": []
          },
          {
            "id": "p3.m1.q5",
            "n": "06",
            "q": "What emotional benefit does it provide?",
            "opts": []
          },
          {
            "id": "p3.m1.q6",
            "n": "07",
            "q": "Why should customers switch?",
            "opts": []
          }
        ]
      },
      {
        "title": "Solution Testing Strategy",
        "obj": "Select the fastest validation method.",
        "output": "01",
        "questions": [
          {
            "id": "p3.m2.q0",
            "n": "01",
            "q": "Which validation method is most appropriate?",
            "opts": []
          },
          {
            "id": "p3.m2.q1",
            "n": "02",
            "q": "What assumptions are being tested?",
            "opts": []
          },
          {
            "id": "p3.m2.q2",
            "n": "03",
            "q": "What metric determines success?",
            "opts": []
          }
        ]
      },
      {
        "title": "Prototype Creation",
        "obj": "Create something customers can react to.",
        "output": "PrototypeSpecification",
        "questions": [
          {
            "id": "p3.m3.q0",
            "n": "01",
            "q": "What prototype will be created?",
            "opts": []
          },
          {
            "id": "p3.m3.q1",
            "n": "02",
            "q": "What customer workflow will it demonstrate?",
            "opts": []
          },
          {
            "id": "p3.m3.q2",
            "n": "03",
            "q": "What core value will it communicate?",
            "opts": []
          },
          {
            "id": "p3.m3.q3",
            "n": "04",
            "q": "What is intentionally excluded?",
            "opts": []
          }
        ]
      },
      {
        "title": "Customer Feedback Sessions",
        "obj": "Test solution reactions.",
        "output": "show the solution · observe reactions · record feedback.",
        "questions": [
          {
            "id": "p3.m4.q0",
            "n": "01",
            "q": "What did customers like?",
            "opts": []
          },
          {
            "id": "p3.m4.q1",
            "n": "02",
            "q": "What confused them?",
            "opts": []
          },
          {
            "id": "p3.m4.q2",
            "n": "03",
            "q": "What objections were raised?",
            "opts": []
          },
          {
            "id": "p3.m4.q3",
            "n": "04",
            "q": "What features were requested?",
            "opts": []
          },
          {
            "id": "p3.m4.q4",
            "n": "05",
            "q": "Would they use it?",
            "opts": []
          },
          {
            "id": "p3.m4.q5",
            "n": "06",
            "q": "Would they pay for it?",
            "opts": []
          },
          {
            "id": "p3.m4.q6",
            "n": "07",
            "q": "Would they recommend it?",
            "opts": []
          }
        ]
      },
      {
        "title": "Commitment Validation",
        "obj": "Measure real demand — the proof that outlives any compliment.",
        "output": "CommitmentScore",
        "questions": [
          {
            "id": "p3.m5.q0",
            "n": "01",
            "q": "How many customers joined a waitlist?",
            "opts": []
          },
          {
            "id": "p3.m5.q1",
            "n": "02",
            "q": "How many requested access?",
            "opts": []
          },
          {
            "id": "p3.m5.q2",
            "n": "03",
            "q": "How many agreed to pilot?",
            "opts": []
          },
          {
            "id": "p3.m5.q3",
            "n": "04",
            "q": "How many signed an LOI?",
            "opts": []
          },
          {
            "id": "p3.m5.q4",
            "n": "05",
            "q": "How many paid?",
            "opts": []
          }
        ]
      },
      {
        "title": "Pricing Discovery",
        "obj": "Determine willingness to pay.",
        "output": "PricingValidationReport",
        "questions": [
          {
            "id": "p3.m6.q0",
            "n": "01",
            "q": "How much does the problem currently cost?",
            "opts": []
          },
          {
            "id": "p3.m6.q1",
            "n": "02",
            "q": "What do customers currently spend?",
            "opts": []
          },
          {
            "id": "p3.m6.q2",
            "n": "03",
            "q": "What pricing model fits best?",
            "opts": [
              "Subscription",
              "Usage-based",
              "Transaction fee",
              "One-time purchase"
            ]
          },
          {
            "id": "p3.m6.q3",
            "n": "04",
            "q": "What price would customers expect?",
            "opts": []
          },
          {
            "id": "p3.m6.q4",
            "n": "05",
            "q": "At what price would they hesitate?",
            "opts": []
          },
          {
            "id": "p3.m6.q5",
            "n": "06",
            "q": "At what price would they refuse?",
            "opts": []
          }
        ]
      },
      {
        "title": "Pilot Customer Identification",
        "obj": "Find early adopters.",
        "output": "PilotCustomerList",
        "questions": [
          {
            "id": "p3.m7.q0",
            "n": "01",
            "q": "Which customers are most interested?",
            "opts": []
          },
          {
            "id": "p3.m7.q1",
            "n": "02",
            "q": "Which customers have highest urgency?",
            "opts": []
          },
          {
            "id": "p3.m7.q2",
            "n": "03",
            "q": "Which customers will tolerate imperfections?",
            "opts": []
          },
          {
            "id": "p3.m7.q3",
            "n": "04",
            "q": "Which customers can become references?",
            "opts": []
          }
        ]
      },
      {
        "title": "Problem-Solution Fit Score",
        "obj": "StartupKit combines six signals into one reading — the verdict on whether to build.",
        "output": "ProblemSolutionFitScore",
        "questions": []
      }
    ]
  },
  {
    "phase": 4,
    "name": "MVP Build",
    "modules": [
      {
        "title": "MVP Definition",
        "obj": "Clearly define what will — and will not — be built.",
        "output": "MVPScopeDocument",
        "questions": [
          {
            "id": "p4.m0.q0",
            "n": "01",
            "q": "What is the primary customer problem?",
            "opts": []
          },
          {
            "id": "p4.m0.q1",
            "n": "02",
            "q": "What is the single core value delivered?",
            "opts": []
          },
          {
            "id": "p4.m0.q2",
            "n": "03",
            "q": "What is the smallest product that delivers this value?",
            "opts": []
          },
          {
            "id": "p4.m0.q3",
            "n": "04",
            "q": "What features are absolutely required?",
            "opts": []
          },
          {
            "id": "p4.m0.q4",
            "n": "05",
            "q": "What features can wait?",
            "opts": []
          }
        ]
      },
      {
        "title": "User Journey Design",
        "obj": "Define how users move through the product.",
        "output": "MVPUserJourney",
        "questions": [
          {
            "id": "p4.m1.q0",
            "n": "01",
            "q": "How does a user discover the product?",
            "opts": []
          },
          {
            "id": "p4.m1.q1",
            "n": "02",
            "q": "What is the first screen they see?",
            "opts": []
          },
          {
            "id": "p4.m1.q2",
            "n": "03",
            "q": "What action creates value?",
            "opts": []
          },
          {
            "id": "p4.m1.q3",
            "n": "04",
            "q": "What is the activation event?",
            "opts": []
          },
          {
            "id": "p4.m1.q4",
            "n": "05",
            "q": "What is the desired outcome?",
            "opts": []
          }
        ]
      },
      {
        "title": "Product Requirements",
        "obj": "Convert ideas into buildable requirements.",
        "output": "PRD",
        "questions": [
          {
            "id": "p4.m2.q0",
            "n": "01",
            "q": "What problem does it solve?",
            "opts": []
          },
          {
            "id": "p4.m2.q1",
            "n": "02",
            "q": "Who uses it?",
            "opts": []
          },
          {
            "id": "p4.m2.q2",
            "n": "03",
            "q": "What triggers it?",
            "opts": []
          },
          {
            "id": "p4.m2.q3",
            "n": "04",
            "q": "What data is required?",
            "opts": []
          },
          {
            "id": "p4.m2.q4",
            "n": "05",
            "q": "What happens on success?",
            "opts": []
          },
          {
            "id": "p4.m2.q5",
            "n": "06",
            "q": "What happens on failure?",
            "opts": []
          }
        ]
      },
      {
        "title": "Technical Architecture",
        "obj": "Design the implementation architecture.",
        "output": "ArchitectureSpecification",
        "questions": [
          {
            "id": "p4.m3.q0",
            "n": "01",
            "q": "Is this Web, Mobile, or Both?",
            "opts": []
          },
          {
            "id": "p4.m3.q1",
            "n": "02",
            "q": "What frontend technology will be used?",
            "opts": []
          },
          {
            "id": "p4.m3.q2",
            "n": "03",
            "q": "What backend technology will be used?",
            "opts": []
          },
          {
            "id": "p4.m3.q3",
            "n": "04",
            "q": "What database is required?",
            "opts": []
          },
          {
            "id": "p4.m3.q4",
            "n": "05",
            "q": "What authentication method is required?",
            "opts": []
          },
          {
            "id": "p4.m3.q5",
            "n": "06",
            "q": "What integrations are needed?",
            "opts": []
          }
        ]
      },
      {
        "title": "Development Planning",
        "obj": "Break the MVP into development tasks.",
        "output": "DevelopmentRoadmap",
        "questions": [
          {
            "id": "p4.m4.q0",
            "n": "01",
            "q": "What modules exist?",
            "opts": []
          },
          {
            "id": "p4.m4.q1",
            "n": "02",
            "q": "What dependencies exist?",
            "opts": []
          },
          {
            "id": "p4.m4.q2",
            "n": "03",
            "q": "Which tasks can run in parallel?",
            "opts": []
          },
          {
            "id": "p4.m4.q3",
            "n": "04",
            "q": "Which tasks block others?",
            "opts": []
          }
        ]
      },
      {
        "title": "Analytics & Instrumentation",
        "obj": "Measure user behavior from day one.",
        "output": "AnalyticsSpecification",
        "questions": [
          {
            "id": "p4.m5.q0",
            "n": "01",
            "q": "What is the activation event?",
            "opts": []
          },
          {
            "id": "p4.m5.q1",
            "n": "02",
            "q": "What metric defines success?",
            "opts": []
          },
          {
            "id": "p4.m5.q2",
            "n": "03",
            "q": "What metric defines failure?",
            "opts": []
          }
        ]
      },
      {
        "title": "Internal QA",
        "obj": "Ensure the MVP works before launch.",
        "output": "QAReport",
        "questions": [
          {
            "id": "p4.m6.q0",
            "n": "01",
            "q": "Does every flow work?",
            "opts": []
          },
          {
            "id": "p4.m6.q1",
            "n": "02",
            "q": "Can users complete onboarding?",
            "opts": []
          },
          {
            "id": "p4.m6.q2",
            "n": "03",
            "q": "Are critical bugs fixed?",
            "opts": []
          }
        ]
      },
      {
        "title": "Launch Readiness",
        "obj": "Prepare the MVP for first users.",
        "output": "LaunchReadinessReport",
        "questions": []
      },
      {
        "title": "First User Acquisition",
        "obj": "Acquire the initial users.",
        "output": "LaunchCohort",
        "questions": [
          {
            "id": "p4.m8.q0",
            "n": "01",
            "q": "Who will be invited first?",
            "opts": []
          },
          {
            "id": "p4.m8.q1",
            "n": "02",
            "q": "How many users will be invited?",
            "opts": []
          },
          {
            "id": "p4.m8.q2",
            "n": "03",
            "q": "What feedback mechanism exists?",
            "opts": []
          }
        ]
      },
      {
        "title": "MVP Health Score",
        "obj": "StartupKit rolls product, stability, and early-usage signals into one reading.",
        "output": "MVPHealthScore",
        "questions": []
      }
    ]
  },
  {
    "phase": 5,
    "name": "First Revenue",
    "modules": [
      {
        "title": "Revenue Strategy",
        "obj": "Define how the business will make money.",
        "output": "RevenueModelDocument",
        "questions": [
          {
            "id": "p5.m0.q0",
            "n": "01",
            "q": "What is the business model?",
            "opts": [
              "Subscription",
              "Usage-based",
              "Marketplace",
              "Transaction Fee",
              "SaaS",
              "Services",
              "Hybrid"
            ]
          },
          {
            "id": "p5.m0.q1",
            "n": "02",
            "q": "What is the primary revenue stream?",
            "opts": []
          },
          {
            "id": "p5.m0.q2",
            "n": "03",
            "q": "Are there secondary revenue streams?",
            "opts": []
          },
          {
            "id": "p5.m0.q3",
            "n": "04",
            "q": "What pricing model is planned?",
            "opts": []
          },
          {
            "id": "p5.m0.q4",
            "n": "05",
            "q": "What payment frequency is planned?",
            "opts": []
          }
        ]
      },
      {
        "title": "Pricing Validation",
        "obj": "Confirm willingness to pay.",
        "output": "PricingValidationReport",
        "questions": [
          {
            "id": "p5.m1.q0",
            "n": "01",
            "q": "What price are customers paying for alternatives?",
            "opts": []
          },
          {
            "id": "p5.m1.q1",
            "n": "02",
            "q": "What is the minimum viable price?",
            "opts": []
          },
          {
            "id": "p5.m1.q2",
            "n": "03",
            "q": "What is the target price?",
            "opts": []
          },
          {
            "id": "p5.m1.q3",
            "n": "04",
            "q": "What is the premium price?",
            "opts": []
          },
          {
            "id": "p5.m1.q4",
            "n": "05",
            "q": "Have customers objected to pricing?",
            "opts": []
          },
          {
            "id": "p5.m1.q5",
            "n": "06",
            "q": "What pricing objections exist?",
            "opts": []
          },
          {
            "id": "p5.m1.q6",
            "n": "07",
            "q": "Which pricing tier performs best?",
            "opts": []
          }
        ]
      },
      {
        "title": "Payment Infrastructure",
        "obj": "Enable revenue collection.",
        "output": "PaymentInfrastructureReport",
        "questions": [
          {
            "id": "p5.m2.q0",
            "n": "01",
            "q": "Which payment processor will be used?",
            "opts": [
              "Stripe",
              "PayPal",
              "Paddle",
              "LemonSqueezy",
              "Other"
            ]
          },
          {
            "id": "p5.m2.q1",
            "n": "02",
            "q": "Which currencies will be supported?",
            "opts": []
          },
          {
            "id": "p5.m2.q2",
            "n": "03",
            "q": "Are subscriptions required?",
            "opts": []
          },
          {
            "id": "p5.m2.q3",
            "n": "04",
            "q": "Are invoices required?",
            "opts": []
          },
          {
            "id": "p5.m2.q4",
            "n": "05",
            "q": "Are refunds required?",
            "opts": []
          }
        ]
      },
      {
        "title": "Customer Acquisition",
        "obj": "Identify how customers are acquired.",
        "output": "AcquisitionChannelAnalysis",
        "questions": [
          {
            "id": "p5.m3.q0",
            "n": "01",
            "q": "Where did first users come from?",
            "opts": []
          },
          {
            "id": "p5.m3.q1",
            "n": "02",
            "q": "Which acquisition channel performs best?",
            "opts": []
          },
          {
            "id": "p5.m3.q2",
            "n": "03",
            "q": "What is the CAC?",
            "opts": []
          },
          {
            "id": "p5.m3.q3",
            "n": "04",
            "q": "What outreach process exists?",
            "opts": []
          },
          {
            "id": "p5.m3.q4",
            "n": "05",
            "q": "What referral opportunities exist?",
            "opts": []
          }
        ]
      },
      {
        "title": "Sales Process",
        "obj": "Create a repeatable sales motion.",
        "output": "FounderSalesProcess",
        "questions": [
          {
            "id": "p5.m4.q0",
            "n": "01",
            "q": "How does a prospect discover the product?",
            "opts": []
          },
          {
            "id": "p5.m4.q1",
            "n": "02",
            "q": "What happens after discovery?",
            "opts": []
          },
          {
            "id": "p5.m4.q2",
            "n": "03",
            "q": "What is the onboarding process?",
            "opts": []
          },
          {
            "id": "p5.m4.q3",
            "n": "04",
            "q": "What objections are common?",
            "opts": []
          },
          {
            "id": "p5.m4.q4",
            "n": "05",
            "q": "How are objections handled?",
            "opts": []
          },
          {
            "id": "p5.m4.q5",
            "n": "06",
            "q": "How long is the sales cycle?",
            "opts": []
          }
        ]
      },
      {
        "title": "Customer Conversion Analysis",
        "obj": "Understand why customers buy.",
        "output": "ConversionInsightsDatabase",
        "questions": [
          {
            "id": "p5.m5.q0",
            "n": "01",
            "q": "Why did they purchase?",
            "opts": []
          },
          {
            "id": "p5.m5.q1",
            "n": "02",
            "q": "What problem were they solving?",
            "opts": []
          },
          {
            "id": "p5.m5.q2",
            "n": "03",
            "q": "What alternatives were considered?",
            "opts": []
          },
          {
            "id": "p5.m5.q3",
            "n": "04",
            "q": "Why was the startup chosen?",
            "opts": []
          },
          {
            "id": "p5.m5.q4",
            "n": "05",
            "q": "What nearly prevented purchase?",
            "opts": []
          }
        ]
      },
      {
        "title": "Customer Success",
        "obj": "Ensure customers receive value.",
        "output": "CustomerSuccessReport",
        "questions": [
          {
            "id": "p5.m6.q0",
            "n": "01",
            "q": "Have customers achieved success?",
            "opts": []
          },
          {
            "id": "p5.m6.q1",
            "n": "02",
            "q": "Are customers actively using the product?",
            "opts": []
          },
          {
            "id": "p5.m6.q2",
            "n": "03",
            "q": "What support requests exist?",
            "opts": []
          },
          {
            "id": "p5.m6.q3",
            "n": "04",
            "q": "What onboarding issues exist?",
            "opts": []
          },
          {
            "id": "p5.m6.q4",
            "n": "05",
            "q": "What causes churn risk?",
            "opts": []
          }
        ]
      },
      {
        "title": "Revenue Analytics",
        "obj": "Track financial traction.",
        "output": "RevenueDashboard",
        "questions": [
          {
            "id": "p5.m7.q0",
            "n": "01",
            "q": "What is current MRR?",
            "opts": []
          },
          {
            "id": "p5.m7.q1",
            "n": "02",
            "q": "What is current ARR?",
            "opts": []
          },
          {
            "id": "p5.m7.q2",
            "n": "03",
            "q": "What is customer churn?",
            "opts": []
          },
          {
            "id": "p5.m7.q3",
            "n": "04",
            "q": "What is customer retention?",
            "opts": []
          }
        ]
      }
    ]
  }
];
