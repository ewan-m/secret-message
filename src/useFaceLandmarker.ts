import {
  FaceLandmarker,
  FaceLandmarkerResult,
  FilesetResolver,
} from "@mediapipe/tasks-vision";
import { useEffect, useRef } from "react";
import { baseUrl } from "./baseUrl";

export const useFaceLandmarker = () => {
  const faceLandmarker = useRef<FaceLandmarker | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vision = useRef<any | null>(null);

  useEffect(() => {
    if (vision.current !== null) {
      return;
    }
    (async () => {
      vision.current = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      faceLandmarker.current = await FaceLandmarker.createFromOptions(
        vision.current,
        {
          baseOptions: {
            modelAssetPath: `${baseUrl}/face_landmarker.task`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          outputFaceBlendshapes: true,
        }
      );
    })();
  }, []);

  return faceLandmarker;
};

const facialExpressions = [
  "_neutral",
  "browDownLeft",
  "browDownRight",
  "browInnerUp",
  "browOuterUpLeft",
  "browOuterUpRight",
  "cheekPuff",
  "cheekSquintLeft",
  "cheekSquintRight",
  "eyeBlinkLeft",
  "eyeBlinkRight",
  "eyeLookDownLeft",
  "eyeLookDownRight",
  "eyeLookInLeft",
  "eyeLookInRight",
  "eyeLookOutLeft",
  "eyeLookOutRight",
  "eyeLookUpLeft",
  "eyeLookUpRight",
  "eyeSquintLeft",
  "eyeSquintRight",
  "eyeWideLeft",
  "eyeWideRight",
  "jawForward",
  "jawLeft",
  "jawOpen",
  "jawRight",
  "mouthClose",
  "mouthDimpleLeft",
  "mouthDimpleRight",
  "mouthFrownLeft",
  "mouthFrownRight",
  "mouthFunnel",
  "mouthLeft",
  "mouthLowerDownLeft",
  "mouthLowerDownRight",
  "mouthPressLeft",
  "mouthPressRight",
  "mouthPucker",
  "mouthRight",
  "mouthRollLower",
  "mouthRollUpper",
  "mouthShrugLower",
  "mouthShrugUpper",
  "mouthSmileLeft",
  "mouthSmileRight",
  "mouthStretchLeft",
  "mouthStretchRight",
  "mouthUpperUpLeft",
  "mouthUpperUpRight",
  "noseSneerLeft",
  "noseSneerRight",
] as const;
export type FaceExpression = (typeof facialExpressions)[number];

const getScore = (
  result: FaceLandmarkerResult,
  expression: FaceExpression
): number => {
  return (
    result.faceBlendshapes[0].categories.find(
      (cat) => cat.categoryName === expression
    )?.score ?? 0
  );
};

export const getMostLikelyExpression = (
  result: FaceLandmarkerResult
): FaceExpression => {
  if (result.faceBlendshapes?.[0]?.categories.length > 0) {
    const blinkLeftScore = getScore(result, "eyeBlinkLeft");
    const blinkRightScore = getScore(result, "eyeBlinkRight");
    const eyeSquintRight = getScore(result, "eyeSquintRight");
    const eyeSquintLeft = getScore(result, "eyeSquintLeft");
    const jawOpenScore = getScore(result, "jawOpen");

    if (
      blinkLeftScore > 0.5 &&
      eyeSquintLeft > 0.7 &&
      blinkRightScore < 0.4 &&
      eyeSquintRight < 0.5
    ) {
      return "eyeBlinkLeft";
    } else if (
      blinkRightScore > 0.5 &&
      eyeSquintRight > 0.6 &&
      blinkLeftScore < 0.5 &&
      eyeSquintLeft < 0.6
    ) {
      return "eyeBlinkRight";
    } else if (jawOpenScore > 0.5) {
      return "jawOpen";
    }
  }

  return "_neutral";
};
