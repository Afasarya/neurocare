export type StoppableMediaStream = Pick<MediaStream, "getTracks">;

export function stopMediaStream(stream: StoppableMediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

