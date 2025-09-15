export interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface VocalModel {
  vocal: string;
  landmarks: NormalizedLandmark[];
}

export interface Results {
  multiHandLandmarks: NormalizedLandmark[][];
  multiHandedness: { label: string }[];
}

export interface StompMessage {
  body: string;
}

export interface StompError {
  message: string;
}

export interface StompClient {
  connect: (headers: object, callback: () => void, errorCallback?: (error: StompError) => void) => void;
  subscribe: (destination: string, callback: (message: StompMessage) => void) => void;
  send: (destination: string, headers: object, body: string) => void;
  disconnect: (callback: () => void) => void;
}

export interface MediaPipeHandsInstance {
  onResults: (callback: (results: Results) => void) => void;
  setOptions: (options: object) => void;
  send: (options: object) => Promise<void>;
  close: () => void;
}

declare global {
  interface Window {
    Hands: new (config: object) => MediaPipeHandsInstance;
    Camera: new (videoElement: HTMLVideoElement, config: object) => { start: () => void };
    drawConnectors: (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], connections: [number, number][], options: object) => void;
    drawLandmarks: (ctx: CanvasRenderingContext2D, landmarks: NormalizedLandmark[], options: object) => void;
    HAND_CONNECTIONS: [number, number][];
    SockJS: new (url: string) => WebSocket;
    Stomp: {
      over: (client: WebSocket) => StompClient;
    };
  }
}
