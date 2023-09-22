import { FunctionComponent, useRef, useState } from "react";
import { useWebcamRef } from "./useWebcamRef";
import { useInterval } from "./useInterval";
import style from "./App.module.css";
import {
  FaceExpression,
  getMostLikelyExpression,
  useFaceLandmarker,
} from "./useFaceLandmarker";

const useRerender = () => {
  const [, setCount] = useState(0);

  return () => {
    setCount((count) => count + 1);
  };
};

export const mainColor = "#ef6fc7";

const CodeAttempt: FunctionComponent<{
  expression: FaceExpression;
}> = ({ expression }) => {
  if (expression === "eyeBlinkLeft") {
    return <p>😉</p>;
  } else if (expression === "eyeBlinkRight") {
    return <p style={{ transform: "scaleX(-1)" }}>😉</p>;
  } else if (expression === "jawOpen") {
    return <p>😛</p>;
  }
  return <p>🔒</p>;
};

export const App = () => {
  const faceLandmarker = useFaceLandmarker();
  const webcamRef = useWebcamRef();
  const rerender = useRerender();

  const [codeAttempt, setCodeAttempt] = useState<FaceExpression[]>([
    "_neutral",
    "_neutral",
    "_neutral",
  ]);

  const processStream = useRef<{
    lastProcessTime: number;
    state: "idle" | "inFlight";
    lastFace: FaceExpression;
  }>({
    lastProcessTime: 0,
    state: "idle",
    lastFace: "_neutral",
  });

  useInterval(() => {
    const video = webcamRef.current;
    const newTime = (video?.currentTime ?? 0) * 1000;

    if (
      faceLandmarker.current &&
      video &&
      newTime > 0 &&
      newTime !== processStream.current.lastProcessTime &&
      processStream.current.state === "idle"
    ) {
      processStream.current.state = "inFlight";
      const result = faceLandmarker.current.detectForVideo(video, newTime);
      rerender();

      const mostLikely = getMostLikelyExpression(result);
      console.log(mostLikely);

      if (
        mostLikely !== "_neutral" &&
        processStream.current.lastFace !== mostLikely
      ) {
        processStream.current = {
          state: "idle",
          lastProcessTime: newTime,
          lastFace: mostLikely,
        };
        setCodeAttempt((codes) => {
          if (codes[2] !== "_neutral") {
            return ["_neutral", "_neutral", "_neutral"];
          }
          if (codes[0] === "_neutral") {
            return [mostLikely, "_neutral", "_neutral"];
          } else if (codes[1] === "_neutral") {
            return [
              codes[0],
              codes[0] !== mostLikely ? mostLikely : "_neutral",
              "_neutral",
            ];
          } else if (codes[2] === "_neutral") {
            return [
              codes[0],
              codes[1],
              codes[1] !== mostLikely ? mostLikely : "_neutral",
            ];
          }
          return codes;
        });
      } else {
        processStream.current = {
          state: "idle",
          lastProcessTime: newTime,
          lastFace:
            mostLikely === "_neutral"
              ? "_neutral"
              : processStream.current.lastFace,
        };
      }
    }
  }, 2);

  const width = window.innerWidth;
  const height = window.innerHeight;

  return (
    <div className={style.container}>
      <video
        className={style.webcam}
        style={{
          width,
          height,
        }}
        ref={webcamRef}
        autoPlay
        muted
        playsInline
      ></video>
      <div className={style.code}>
        {codeAttempt.map((expression, index) => (
          <CodeAttempt key={`${expression} ${index}`} expression={expression} />
        ))}
      </div>
      <div className={style.info}>
        <p className={style.logo}>secret message v0.1</p>
      </div>
      {codeAttempt.join(",") ===
        ["eyeBlinkLeft", "eyeBlinkRight", "jawOpen"].join(",") && (
        <p className={style.winner}>❤️</p>
      )}
    </div>
  );
};
