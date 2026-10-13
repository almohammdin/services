/* Adapted weight normalization and weighted summation from AgentATS TalentRubric.gs.
 * Copyright (c) 2026 AgentATS contributors. MIT License: LICENSE-AgentATS.txt.
 * Changed to require complete assessments and to leave the hiring decision to the reviewer.
 */
function hiringScore(criteria, scores = {}) {
  const totalWeight = criteria.reduce((sum, c) => sum + Math.max(0, Number(c.weight) || 0), 0);
  const weighted = criteria.filter(c => Number(c.weight) > 0);
  let composite = 0;
  let assessed = 0;
  const effectiveWeights = {};
  weighted.forEach(c => {
    const weight = totalWeight ? Number(c.weight) / totalWeight * 100 : 0;
    effectiveWeights[c.id] = weight;
    const score = Number(scores[c.id]);
    if (scores[c.id] !== '' && scores[c.id] != null && Number.isInteger(score) && score >= 1 && score <= 5) {
      assessed += 1;
      composite += weight * score / 5;
    }
  });
  const complete = totalWeight > 0 && weighted.length > 0 && assessed === weighted.length;
  return { score: complete ? Math.round(composite * 10) / 10 : null, assessed, total: weighted.length, complete, effectiveWeights };
}
