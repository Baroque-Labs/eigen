// Registry of all Inngest functions. New functions get added here and
// the serve handler picks them up automatically.
//
// v1 functions to land here: per-recipient send, attribution close-out
// cron, significance/retire cron, posterior snapshot cron, variant
// spawn job. None of them have a place to fire from yet — campaign
// launch wiring comes after the bandit pipeline lands in phase 5.

import { helloWorld } from "./hello";

export const functions = [helloWorld];
