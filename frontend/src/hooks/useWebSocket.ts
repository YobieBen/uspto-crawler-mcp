/**
 * WebSocket Hook
 * 
 * Author: Yobie Benjamin
 * Version: 0.2
 * Date: July 28, 2025
 */

import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';

interface WebSocketOptions {
  onSearchProgress?: (progress: any) => void;
  onSearchComplete?: (results: any) => void;
  onSearchError?: (error: any) => void;
}

export function useWebSocket(url: string, options: WebSocketOptions) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url);
    
    socketRef.current.on('connect', () => {
      setConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    if (options.onSearchProgress) {
      socketRef.current.on('search:progress', options.onSearchProgress);
    }

    if (options.onSearchComplete) {
      socketRef.current.on('search:complete', options.onSearchComplete);
    }

    if (options.onSearchError) {
      socketRef.current.on('search:error', options.onSearchError);
    }

    return () => {
      socketRef.current?.disconnect();
    };
  }, [url]);

  return { socket: socketRef.current, connected };
}