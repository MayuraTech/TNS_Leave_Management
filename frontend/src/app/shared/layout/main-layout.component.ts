import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../components/sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  template: `
    <div class="layout-container">
      <app-sidebar class="layout-sidebar"></app-sidebar>
      <main class="layout-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .layout-container {
      display: flex;
      min-height: 100vh;
      background: #F3F4F6;
    }

    .layout-sidebar {
      width: 0;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .layout-content {
      flex: 1;
      overflow-x: hidden;
    }

    @media (max-width: 768px) {
      .layout-container {
        flex-direction: column;
      }

      .layout-sidebar {
        width: 100%;
        height: auto;
        position: relative;
      }
    }
  `]
})
export class MainLayoutComponent {}
