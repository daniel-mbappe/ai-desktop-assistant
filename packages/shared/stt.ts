export type SttMessage =
  | { type: "partial"; text: string }
  | { type: "final"; text: string }
  | { type: "flush"; text: string };

export type SttCommand =
  | { type: "chunk"; data: Buffer | ArrayBuffer }
  | { type: "flush" };
