import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateWorkflowRoi, type WorkflowAssumptions } from '../app/calculator/calculate.ts';

const defaults: WorkflowAssumptions = {
  runs: 80,
  manualMinutes: 12,
  assistedMinutes: 3,
  exceptionRate: 10,
  exceptionMinutes: 10,
  hourlyValue: 60,
  toolCost: 49,
};

test('calculates the default scenario', () => {
  const result = calculateWorkflowRoi(defaults);
  assert.equal(result.manualHours, 16);
  assert.ok(Math.abs(result.operatingHours - 5.3333333333) < 0.000001);
  assert.ok(Math.abs(result.hoursReturned - 10.6666666667) < 0.000001);
  assert.ok(Math.abs(result.netValue - 591) < 0.000001);
  assert.ok(Math.abs((result.breakEvenRuns ?? 0) - 6.125) < 0.000001);
  assert.equal(result.signal, 'Strong candidate');
});

test('rejects a scenario with no time gain', () => {
  const result = calculateWorkflowRoi({
    ...defaults,
    manualMinutes: 5,
    assistedMinutes: 6,
    exceptionRate: 0,
  });
  assert.ok(result.hoursReturned < 0);
  assert.equal(result.breakEvenRuns, null);
  assert.equal(result.signal, 'No time gain yet');
});

test('puts high exception load ahead of an attractive headline return', () => {
  const result = calculateWorkflowRoi({
    ...defaults,
    runs: 100,
    manualMinutes: 20,
    assistedMinutes: 2,
    exceptionRate: 30,
    exceptionMinutes: 10,
    toolCost: 50,
  });
  assert.ok(result.netValue > 0);
  assert.equal(result.signal, 'Promising, but fragile');
});

test('detects when tool cost exceeds returned time', () => {
  const result = calculateWorkflowRoi({
    ...defaults,
    runs: 2,
    manualMinutes: 10,
    assistedMinutes: 1,
    exceptionRate: 0,
    toolCost: 100,
  });
  assert.ok(result.hoursReturned > 0);
  assert.ok(result.netValue < 0);
  assert.equal(result.signal, 'Cost exceeds returned time');
});
