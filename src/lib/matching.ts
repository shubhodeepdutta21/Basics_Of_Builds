// Single source of truth for "how ready is the user to build this project?"
// Pure functions: no React, no network, no side effects.

export type Requirement = {
  componentId: string;
  requiredQuantity: number;
  isOptional: boolean;
};

// One row per requirement (used by the detail page's Bill of Materials table)
export type RequirementStatus = {
  componentId: string;
  name: string;
  requiredQuantity: number;
  isOptional: boolean;
  has: number;
  missing: number;       // how many more the user needs (0 if sufficient)
  isSufficient: boolean; // has >= requiredQuantity
};

// A required part the user is short on (used by the discovery card)
export type MissingPart = {
  name: string;
  needed: number;
  has: number;
};

export type MatchResult = {
  matchPercentage: number;      // 0-100, based on REQUIRED parts only
  statuses: RequirementStatus[]; // every requirement, optional included
  missingParts: MissingPart[];   // required parts only
};

export function computeMatch(
  requirements: Requirement[],
  getQuantity: (componentId: string) => number,
  nameOf: (componentId: string) => string
): MatchResult {
  // Build a status row for every requirement
  const statuses: RequirementStatus[] = requirements.map((req) => {
    const id = String(req.componentId);
    const has = getQuantity(id);
    const isSufficient = has >= req.requiredQuantity;
    return {
      componentId: id,
      name: nameOf(id),
      requiredQuantity: req.requiredQuantity,
      isOptional: req.isOptional,
      has,
      missing: isSufficient ? 0 : req.requiredQuantity - has,
      isSufficient,
    };
  });

  // Only required parts affect the score
  const required = statuses.filter((s) => !s.isOptional);
  const matched = required.filter((s) => s.isSufficient).length;

  const matchPercentage =
    required.length === 0 ? 100 : Math.round((matched / required.length) * 100);

  const missingParts: MissingPart[] = required
    .filter((s) => !s.isSufficient)
    .map((s) => ({ name: s.name, needed: s.requiredQuantity, has: s.has }));

  return { matchPercentage, statuses, missingParts };
}