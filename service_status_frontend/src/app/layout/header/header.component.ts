import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

/**
 * HeaderComponent displays a top bar with a simple user menu including logout.
 * It is intentionally minimal and does not require a complex dropdown library.
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  menuOpen = signal(false);

  // PUBLIC_INTERFACE
  /** Toggle the simple user dropdown menu. */
  toggleMenu() {
    this.menuOpen.set(!this.menuOpen());
  }

  // PUBLIC_INTERFACE
  /** Perform logout using AuthService and navigate to login. */
  logout() {
    this.auth.logout();
    this.menuOpen.set(false);
    this.router.navigateByUrl('/login');
  }
}
