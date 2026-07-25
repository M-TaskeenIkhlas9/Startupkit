/* Shared Mermaid setup for every page in platform-architecture v2.
   Loaded after the mermaid CDN script. Themed to the StartupKit palette. */
mermaid.initialize({
  startOnLoad: true,
  securityLevel: "loose",
  theme: "base",
  themeVariables: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "14px",
    primaryColor: "#E1F5EE",
    primaryBorderColor: "#0F6E56",
    primaryTextColor: "#0f1720",
    lineColor: "#7c8698",
    secondaryColor: "#EEF0F6",
    tertiaryColor: "#ffffff",
    // sequence diagram
    actorBkg: "#E5EFFC",
    actorBorder: "#1D5FBF",
    actorTextColor: "#0B2A55",
    signalColor: "#334",
    signalTextColor: "#243",
    labelBoxBkgColor: "#FBEEDA",
    labelBoxBorderColor: "#B4740E",
    noteBkgColor: "#FBEEDA",
    noteBorderColor: "#B4740E",
    noteTextColor: "#402A05",
  },
  flowchart: { curve: "basis", htmlLabels: true, nodeSpacing: 45, rankSpacing: 55, padding: 8 },
  sequence: { showSequenceNumbers: true, actorMargin: 42, boxMargin: 8, mirrorActors: false, wrap: true, width: 165 },
});

/* Reusable classDef block to paste at the end of any flowchart:
   see PALETTE comment below — kept here as documentation only. */
/* PALETTE (fill / stroke):
   client   #E5EFFC / #1D5FBF   — UI, browser, pages
   core     #E1F5EE / #0F6E56   — app services / company core
   data     #E2F3F4 / #0E7C86   — Postgres, tables, data stores
   ai       #ECEBFB / #4338CA   — LLM / generation
   admin    #EEE7FC / #6B3FD6   — auth / RBAC / internal
   advisor  #FBEEDA / #B4740E   — external read-only
   ext      #FBEAE0 / #C24A1E   — external providers / third parties
   neutral  #EEF0F6 / #9aa3b2   — infra / misc
*/
