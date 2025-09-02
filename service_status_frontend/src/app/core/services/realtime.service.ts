import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ProcessInfo, ServiceSummary, UserInfo } from '../models';

/**
 * RealtimeService manages live updates via WebSocket or Server-Sent Events (SSE).
 * It exposes RxJS Observables that components can subscribe to for updates.
 *
 * This is a transport-agnostic skeleton:
 * - If environment.realtimeUrl starts with 'ws' => use WebSocket
 * - Otherwise, default to SSE (EventSource)
 */
@Injectable({
  providedIn: 'root',
})
export class RealtimeService {
  private connectionState$ = new BehaviorSubject<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');

  private serviceUpdates$ = new Subject<ServiceSummary>();
  private userUpdates$ = new Subject<UserInfo>();
  private processUpdates$ = new Subject<ProcessInfo>();

  private rawMessage$ = new Subject<unknown>();
  private es?: any;
  private ws?: any;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  private get realtimeUrl(): string {
    return environment.realtimeUrl?.replace(/\/+$/, '') || '';
  }

  // PUBLIC_INTERFACE
  /** Observable for connection state changes. */
  get status$(): Observable<'disconnected' | 'connecting' | 'connected' | 'error'> {
    return this.connectionState$.asObservable();
  }

  // PUBLIC_INTERFACE
  /** Stream of service summary updates. */
  get services$(): Observable<ServiceSummary> {
    return this.serviceUpdates$.asObservable();
  }

  // PUBLIC_INTERFACE
  /** Stream of user updates. */
  get users$(): Observable<UserInfo> {
    return this.userUpdates$.asObservable();
  }

  // PUBLIC_INTERFACE
  /** Stream of process updates. */
  get processes$(): Observable<ProcessInfo> {
    return this.processUpdates$.asObservable();
  }

  // PUBLIC_INTERFACE
  /** Raw message stream for advanced consumers. */
  get messages$(): Observable<unknown> {
    return this.rawMessage$.asObservable();
  }

  // PUBLIC_INTERFACE
  /** Connect to realtime backend (WebSocket preferred if URL starts with ws, else SSE). */
  connect(): void {
    if (!this.realtimeUrl) {
      console.warn('RealtimeService: realtimeUrl is not configured.');
      return;
    }
    if (this.connectionState$.value === 'connected' || this.connectionState$.value === 'connecting') {
      return;
    }

    this.connectionState$.next('connecting');

    if (this.realtimeUrl.startsWith('ws')) {
      this.connectWebSocket();
    } else {
      this.connectEventSource();
    }
  }

  // PUBLIC_INTERFACE
  /** Disconnect from realtime backend and cleanup resources. */
  disconnect(): void {
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onclose = null;
      this.ws.close();
      this.ws = undefined;
    }
    if (this.es) {
      this.es.close();
      this.es = undefined;
    }
    this.connectionState$.next('disconnected');
  }

  private connectWebSocket() {
    try {
      const url = this.realtimeUrlWithAuth();
      const WS: any = (globalThis as any).WebSocket;
      if (!WS) {
        console.warn('RealtimeService: WebSocket not available in this environment.');
        this.connectionState$.next('error');
        return;
      }

      this.ws = new WS(url);

      this.ws!.onopen = () => {
        this.connectionState$.next('connected');
      };

      this.ws!.onmessage = (evt: any) => {
        this.handleIncoming(evt?.data);
      };

      this.ws!.onerror = () => {
        this.connectionState$.next('error');
      };

      this.ws!.onclose = () => {
        this.connectionState$.next('disconnected');
      };
    } catch (e) {
      console.error('RealtimeService WebSocket error:', e);
      this.connectionState$.next('error');
    }
  }

  private connectEventSource() {
    try {
      const url = this.realtimeUrlWithAuth();
      const ES: any = (globalThis as any).EventSource;
      if (!ES) {
        console.warn('RealtimeService: EventSource not available in this environment.');
        this.connectionState$.next('error');
        return;
      }

      this.es = new ES(url, { withCredentials: true });

      this.es!.onopen = () => {
        this.connectionState$.next('connected');
      };

      this.es!.onerror = () => {
        // Some browsers call onerror for connection retries in SSE
        // We'll mark as error but keep underlying connection until closed.
        this.connectionState$.next('error');
      };

      this.es!.onmessage = (evt: any) => {
        this.handleIncoming(evt?.data);
      };
    } catch (e) {
      console.error('RealtimeService SSE error:', e);
      this.connectionState$.next('error');
    }
  }

  /**
   * Add bearer token as query parameter if available since EventSource does not support setting headers.
   * For WebSocket, query param is also a common approach.
   */
  private realtimeUrlWithAuth(): string {
    let token: string | null = null;
    try {
      const ls: any = (globalThis as any)?.localStorage;
      if (ls && typeof ls.getItem === 'function') {
        token = ls.getItem('auth_token');
      }
    } catch {
      // ignore
    }
    if (!token) return this.realtimeUrl;

    // Append token as query parameter
    const hasQuery = this.realtimeUrl.includes('?');
    return `${this.realtimeUrl}${hasQuery ? '&' : '?'}token=${encodeURIComponent(token)}`;
  }

  /**
   * Handle incoming messages, routing to the appropriate stream based on a 'type' field.
   * Expected payload format from backend:
   * { type: 'service' | 'user' | 'process', data: <object> }
   */
  private handleIncoming(raw: any) {
    try {
      const msg = typeof raw === 'string' ? JSON.parse(raw) : raw;
      this.rawMessage$.next(msg);

      const type = msg?.type;
      const data = msg?.data;

      switch (type) {
        case 'service':
          this.serviceUpdates$.next(data as ServiceSummary);
          break;
        case 'user':
          this.userUpdates$.next(data as UserInfo);
          break;
        case 'process':
          this.processUpdates$.next(data as ProcessInfo);
          break;
        default:
          // Unknown message type; forward to raw stream only
          break;
      }
    } catch (err) {
      console.warn('RealtimeService: failed to parse realtime message', err, raw);
      this.rawMessage$.next(raw);
    }
  }
}
