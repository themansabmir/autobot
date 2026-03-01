export const npsInputConstants = {
  defaultQuestion:
    "How likely are you to recommend us?",
  // Legacy: text labels removed — NPS uses startsAt/endsAt range only
  // defaultLowLabel: "Not at all likely",
  // defaultHighLabel: "Extremely likely",
  defaultButtonLabel: "Send",
  minScore: 0,
  maxScore: 10,
} as const;
