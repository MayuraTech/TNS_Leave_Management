import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="unauthorized-container">
      <h1>403 - Access Denied</h1>
      <p>You do not have permission to view this page.</p>
      <a routerLink="/leave">Go to Dashboard</a>
    </div>
  `,
  styles: [`
    .unauthorized-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
      text-align: center;
    }
  `]
})
export class UnauthorizedComponent {}
