import type { IndustryKey } from "./shiftora-config";

type AdminVocabulary = {
  adminOverviewTitle: string;
  configTitle: string;
  configSubtitle: string;
  completionNav: string;
  contextMetric: string;
  contextSingular: string;
  contextPlural: string;
  defaultContextName: string;
  defaultResponsibility: string;
  gradeLabel: string;
  gradeOptions: string[];
  learnerPlural: string;
  learnerSingular: string;
  onboardingSubtitle: string;
  onboardingTitle: string;
  peopleNav: string;
  primaryContext: string;
  readinessNav: string;
  schoolLabel: string;
  sectionLabel: string;
  sectionOptions: string[];
  subjectLabel: string;
  subjectOptions: string[];
};

const VOCABULARY: Record<IndustryKey, AdminVocabulary> = {
  edu: {
    adminOverviewTitle: "School admin overview",
    configTitle: "School configuration",
    configSubtitle: "School identity, role labels and academic groups are saved through the backend.",
    completionNav: "Workshop & certificates",
    contextMetric: "Teaching contexts",
    contextSingular: "teaching context",
    contextPlural: "teaching contexts",
    defaultContextName: "School",
    defaultResponsibility: "Subject Teacher",
    gradeLabel: "Grade",
    gradeOptions: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
    learnerPlural: "Teachers",
    learnerSingular: "Teacher",
    onboardingSubtitle: "Invite teachers and map their grade, section and subject responsibilities.",
    onboardingTitle: "Teacher onboarding",
    peopleNav: "Teachers",
    primaryContext: "Primary teaching context",
    readinessNav: "Readiness checks",
    schoolLabel: "School name",
    sectionLabel: "Section",
    sectionOptions: ["A", "B", "C", "D"],
    subjectLabel: "Subject",
    subjectOptions: ["Mathematics", "EVS", "Science", "English", "Tamil", "Social Science", "General"],
  },
  bfsi: {
    adminOverviewTitle: "Branch admin overview",
    configTitle: "Branch configuration",
    configSubtitle: "Branch identity, role labels and business teams are saved through the backend.",
    completionNav: "Workshop & certificates",
    contextMetric: "Work contexts",
    contextSingular: "work context",
    contextPlural: "work contexts",
    defaultContextName: "Branch / unit",
    defaultResponsibility: "Relationship Manager",
    gradeLabel: "Business line",
    gradeOptions: ["Retail Banking", "SME Lending", "Wealth Management", "Customer Ops", "Risk", "Compliance"],
    learnerPlural: "Employees",
    learnerSingular: "Employee",
    onboardingSubtitle: "Invite employees and map their branch, team and process responsibilities.",
    onboardingTitle: "Employee onboarding",
    peopleNav: "Employees",
    primaryContext: "Primary work context",
    readinessNav: "Readiness checks",
    schoolLabel: "Branch / unit",
    sectionLabel: "Team / desk",
    sectionOptions: ["RM Desk", "Service Desk", "Ops Team", "Risk Desk", "Compliance Desk"],
    subjectLabel: "Process / product",
    subjectOptions: ["Loan Advisory", "Account Opening", "KYC Review", "Customer Email", "Risk Review", "Compliance Response"],
  },
  gcc: {
    adminOverviewTitle: "Unit admin overview",
    configTitle: "Unit configuration",
    configSubtitle: "Unit identity, role labels and delivery teams are saved through the backend.",
    completionNav: "Workshop & certificates",
    contextMetric: "Delivery contexts",
    contextSingular: "delivery context",
    contextPlural: "delivery contexts",
    defaultContextName: "Delivery unit",
    defaultResponsibility: "Developer",
    gradeLabel: "Pod / squad",
    gradeOptions: ["Platform Pod", "Data Pod", "QA Pod", "DevOps Pod", "Product Pod", "Design Pod"],
    learnerPlural: "Employees",
    learnerSingular: "Employee",
    onboardingSubtitle: "Invite employees and map their pod, sprint and technology responsibilities.",
    onboardingTitle: "Employee onboarding",
    peopleNav: "Employees",
    primaryContext: "Primary delivery context",
    readinessNav: "Readiness checks",
    schoolLabel: "Unit / account",
    sectionLabel: "Sprint / team",
    sectionOptions: ["Sprint 12", "Sprint 13", "Platform Team", "QA Team", "SRE Team"],
    subjectLabel: "Workstream",
    subjectOptions: ["Java Services", "React UI", "Test Automation", "Cloud Operations", "Requirement Analysis", "Code Review"],
  },
  health: {
    adminOverviewTitle: "Department admin overview",
    configTitle: "Department configuration",
    configSubtitle: "Department identity, role labels and clinical groups are saved through the backend.",
    completionNav: "Workshop & certificates",
    contextMetric: "Clinical contexts",
    contextSingular: "clinical context",
    contextPlural: "clinical contexts",
    defaultContextName: "Hospital / facility",
    defaultResponsibility: "Clinician",
    gradeLabel: "Department",
    gradeOptions: ["Cardiology", "Oncology", "Emergency", "Nursing", "Pharmacy", "Clinical Ops"],
    learnerPlural: "Clinicians",
    learnerSingular: "Clinician",
    onboardingSubtitle: "Invite clinicians and map their department, ward and documentation responsibilities.",
    onboardingTitle: "Clinician onboarding",
    peopleNav: "Clinicians",
    primaryContext: "Primary clinical context",
    readinessNav: "Readiness checks",
    schoolLabel: "Hospital / facility",
    sectionLabel: "Ward / shift",
    sectionOptions: ["Ward A", "Ward B", "Morning", "Evening", "Emergency Desk"],
    subjectLabel: "Workflow",
    subjectOptions: ["Discharge Summary", "Patient Education", "Protocol Card", "Clinical Handoff", "Medication Review"],
  },
};

export function adminVocabulary(industry: IndustryKey): AdminVocabulary {
  return VOCABULARY[industry] ?? VOCABULARY.edu;
}
