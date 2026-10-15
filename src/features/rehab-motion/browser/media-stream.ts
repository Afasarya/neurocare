export type StoppableMotionStream = Pick<MediaStream, "getTracks">;

export function stopMotionStream(stream: StoppableMotionStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}
