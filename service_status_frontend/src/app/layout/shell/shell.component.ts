import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

/**
 * ShellComponent composes the application layout for protected routes.
 * It includes a Sidebar for navigation, a Header with user menu/logout,
 * and a responsive content area where child routes are rendered.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  readonly auth = inject(AuthService);
}
