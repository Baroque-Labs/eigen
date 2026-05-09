// Hand-rehearsed sequence — values are illustrative, not a live simulation.
// Each tick is a snapshot of all five slots; "unborn" rows render as a
// collapsed placeholder, "retired" rows render dimmed.

export type AllocatorStatus =
  | "unborn"
  | "active"
  | "leading"
  | "retired"
  | "new";

export type AllocatorSlot = {
  label: string;
  s: number;
  f: number;
  alloc: number;
  status: AllocatorStatus;
  parent?: string;
};

export type AllocatorTick = {
  round: number;
  message: string;
  slots: [
    AllocatorSlot,
    AllocatorSlot,
    AllocatorSlot,
    AllocatorSlot,
    AllocatorSlot,
  ];
};

const unborn: AllocatorSlot = {
  label: "",
  s: 0,
  f: 0,
  alloc: 0,
  status: "unborn",
};

export const ALLOCATOR_SCENARIO: AllocatorTick[] = [
  {
    round: 0,
    message: "Cold start. Three variants. Equal allocation.",
    slots: [
      { label: "V₁", s: 0, f: 0, alloc: 0.33, status: "active" },
      { label: "V₂", s: 0, f: 0, alloc: 0.33, status: "active" },
      { label: "V₃", s: 0, f: 0, alloc: 0.34, status: "active" },
      unborn,
      unborn,
    ],
  },
  {
    round: 1,
    message: "First sends in. Posteriors begin to separate.",
    slots: [
      { label: "V₁", s: 8, f: 24, alloc: 0.31, status: "active" },
      { label: "V₂", s: 12, f: 18, alloc: 0.42, status: "active" },
      { label: "V₃", s: 4, f: 28, alloc: 0.27, status: "active" },
      unborn,
      unborn,
    ],
  },
  {
    round: 2,
    message: "V₂ pulling ahead. Allocation tracks the posterior.",
    slots: [
      { label: "V₁", s: 15, f: 50, alloc: 0.25, status: "active" },
      { label: "V₂", s: 32, f: 38, alloc: 0.55, status: "leading" },
      { label: "V₃", s: 6, f: 60, alloc: 0.20, status: "active" },
      unborn,
      unborn,
    ],
  },
  {
    round: 3,
    message: "V₃'s posterior is collapsing. Retiring the laggard, spawning V₄ from V₂.",
    slots: [
      { label: "V₁", s: 22, f: 78, alloc: 0.18, status: "active" },
      { label: "V₂", s: 60, f: 60, alloc: 0.62, status: "leading" },
      { label: "V₃", s: 7, f: 95, alloc: 0, status: "retired" },
      { label: "V₄", s: 0, f: 0, alloc: 0.20, status: "new", parent: "V₂" },
      unborn,
    ],
  },
  {
    round: 4,
    message: "V₄ is exploring. Early returns outpace its parent.",
    slots: [
      { label: "V₁", s: 28, f: 102, alloc: 0.14, status: "active" },
      { label: "V₂", s: 88, f: 84, alloc: 0.40, status: "active" },
      { label: "V₃", s: 7, f: 95, alloc: 0, status: "retired" },
      { label: "V₄", s: 22, f: 24, alloc: 0.46, status: "leading", parent: "V₂" },
      unborn,
    ],
  },
  {
    round: 5,
    message: "V₄ confirmed best. V₁ retired. V₅ spawned. The loop continues.",
    slots: [
      { label: "V₁", s: 31, f: 124, alloc: 0, status: "retired" },
      { label: "V₂", s: 110, f: 110, alloc: 0.28, status: "active" },
      { label: "V₃", s: 7, f: 95, alloc: 0, status: "retired" },
      { label: "V₄", s: 50, f: 44, alloc: 0.55, status: "leading", parent: "V₂" },
      { label: "V₅", s: 0, f: 0, alloc: 0.17, status: "new", parent: "V₄" },
    ],
  },
];
