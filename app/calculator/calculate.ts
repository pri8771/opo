export type WorkflowAssumptions = {
  runs: number;
  manualMinutes: number;
  assistedMinutes: number;
  exceptionRate: number;
  exceptionMinutes: number;
  hourlyValue: number;
  toolCost: number;
};

export type WorkflowRoi = {
  manualHours: number;
  operatingHours: number;
  hoursReturned: number;
  netValue: number;
  annualValue: number;
  breakEvenRuns: number | null;
  timeReturn: number;
  signal: string;
  signalDetail: string;
};

export function calculateWorkflowRoi(values: WorkflowAssumptions): WorkflowRoi {
  const manualHours = (values.runs * values.manualMinutes) / 60;
  const assistedHours = (values.runs * values.assistedMinutes) / 60;
  const exceptionHours =
    (values.runs * (values.exceptionRate / 100) * values.exceptionMinutes) / 60;
  const operatingHours = assistedHours + exceptionHours;
  const hoursReturned = manualHours - operatingHours;
  const grossValue = hoursReturned * values.hourlyValue;
  const netValue = grossValue - values.toolCost;
  const annualValue = netValue * 12;
  const valuePerRun =
    ((values.manualMinutes -
      values.assistedMinutes -
      (values.exceptionRate / 100) * values.exceptionMinutes) /
      60) *
    values.hourlyValue;
  const breakEvenRuns = valuePerRun > 0 ? values.toolCost / valuePerRun : null;
  const timeReturn = manualHours > 0 ? (hoursReturned / manualHours) * 100 : 0;

  let signal = 'Worth a controlled pilot';
  let signalDetail =
    'The assumptions return value, but verify them with real runs before scaling.';
  if (hoursReturned <= 0) {
    signal = 'No time gain yet';
    signalDetail =
      'Oversight and recovery consume at least as much time as the manual workflow.';
  } else if (netValue <= 0) {
    signal = 'Cost exceeds returned time';
    signalDetail =
      'Reduce tool cost, increase useful volume, or simplify the workflow before buying.';
  } else if (values.exceptionRate >= 25) {
    signal = 'Promising, but fragile';
    signalDetail =
      'The exception rate is high enough to make recovery the first design problem.';
  } else if (netValue >= Math.max(values.toolCost * 2, 250) && hoursReturned >= 5) {
    signal = 'Strong candidate';
    signalDetail =
      'The estimated return supports a bounded pilot with verification and recovery checks.';
  }

  return {
    manualHours,
    operatingHours,
    hoursReturned,
    netValue,
    annualValue,
    breakEvenRuns,
    timeReturn,
    signal,
    signalDetail,
  };
}
