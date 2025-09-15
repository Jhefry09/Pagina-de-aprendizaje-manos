import React, { useState, useEffect, type ReactNode } from 'react';
import { type VocalModel, type NormalizedLandmark, type StompClient, type StompMessage, type StompError } from '../types';
import { VocalContext } from './VocalContext';

export const VocalContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vocalModels, setVocalModels] = useState<VocalModel[]>([]);

  useEffect(() => {
        let stompClient: StompClient | null = null;

    const setupWebSocket = () => {
      const socket = new window.SockJS('/vocales-websocket');
      stompClient = window.Stomp.over(socket);

      stompClient.connect({}, 
        () => {
          console.log('Connected to WebSocket');
          stompClient?.subscribe('/topic/vocales', (message: StompMessage) => {
            const data = JSON.parse(message.body);
            const formattedModels = data.map((item: { vocal: string; vectoresJson: string }) => ({
              vocal: item.vocal,
              landmarks: JSON.parse(item.vectoresJson).landmarks,
            }));
            setVocalModels(formattedModels);
            console.log('Base models loaded:', formattedModels);
          });

          stompClient?.send('/app/getVocales', {}, '');
        },
        (error: StompError) => {
          console.error('Error connecting to WebSocket:', error.message);
        }
      );
    };

    const intervalId = setInterval(() => {
      if (window.SockJS && window.Stomp) {
        clearInterval(intervalId);
        setupWebSocket();
      }
    }, 100);

    return () => {
      clearInterval(intervalId);
      if (stompClient) {
        stompClient.disconnect(() => {
          console.log('Disconnected from WebSocket');
        });
      }
    };
  }, []);

  const updateVocalModel = (vocal: string, landmarks: NormalizedLandmark[]) => {
    setVocalModels(prevModels => {
      const existingModelIndex = prevModels.findIndex(m => m.vocal === vocal);
      if (existingModelIndex > -1) {
        const newModels = [...prevModels];
        newModels[existingModelIndex] = { vocal, landmarks };
        return newModels;
      } else {
        return [...prevModels, { vocal, landmarks }];
      }
    });
  };

  return (
    <VocalContext.Provider value={{ vocalModels, updateVocalModel }}>
      {children}
    </VocalContext.Provider>
  );
};
