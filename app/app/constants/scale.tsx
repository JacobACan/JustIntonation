import { HALF_STEP, WHOLE_STEP } from "./intervals";

export enum Scale {
  major = "major",
  minor = "minor",
  harmonicMinor = "harmonicMinor",
  melodicMinor = "melodicMinor",
}

export const scaleToInterval = {
  [Scale.major]: [
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
  ],
  [Scale.minor]: [
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
  ],
  [Scale.harmonicMinor]: [
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP + HALF_STEP,
    HALF_STEP,
  ],
  [Scale.melodicMinor]: [
    WHOLE_STEP,
    HALF_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    WHOLE_STEP,
    HALF_STEP,
  ],
};
