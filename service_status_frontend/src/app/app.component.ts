import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ApiService } from './core/services/api.service';
import { RealtimeService } from './core/services/realtime.service';
import { Subscription } from 'rxjs';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'service_status_frontend is being generated';
  private readonly api = inject(ApiService);
  private readonly realtime = inject(RealtimeService);
  private subs: Subscription[] = [];

  ngOnInit(): void {
    // Initialize realtime connection (will no-op if not configured)
    this.realtime.connect();

    // Example: subscribe to status stream (for side effects/logging)
    this.subs.push(this.realtime.status$.subscribe());
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.realtime.disconnect();
  }
}
