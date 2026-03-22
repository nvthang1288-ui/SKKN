export interface AuthorInfo {
  name: string;
  dob: string;
  workplace: string;
  position: string;
  qualification: string;
  contribution: string;
}

export interface InitiativeData {
  title: string;
  author: AuthorInfo;
  recipient: string;
  investor: string;
  field: string;
  firstAppliedDate: string;
  desiredPages: number;
}

export interface InitiativeContent {
  necessity: string;
  purpose: string;
  scope: string;
  solutionsBefore: {
    name: string;
    content: string;
    pros: string;
    cons: string;
    causes: string;
  }[];
  solutionsAfter: {
    name: string;
    novelty: string;
    implementation: string;
    results: string;
  }[];
  confidentiality: string;
  conditions: string;
  economicBenefit: string;
  socialBenefit: string;
  externalEvaluation: string;
  comparisonTable: {
    criteria: string;
    before: string;
    after: string;
    note: string;
  }[];
}
