import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  formatter?: (value: unknown, row: unknown) => string;
}

export interface SortEvent {
  column: string;
  direction: 'asc' | 'desc';
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss']
})
export class DataTableComponent implements OnChanges {
  @Input() columns: TableColumn[] = [];
  @Input() data: Record<string, unknown>[] = [];
  @Input() loading = false;
  @Input() emptyMessage = 'No data available.';
  @Input() pageSize = 10;

  @Output() rowClick = new EventEmitter<Record<string, unknown>>();
  @Output() sortChange = new EventEmitter<SortEvent>();

  currentPage = 1;
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  pagedData: Record<string, unknown>[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['pageSize']) {
      this.currentPage = 1;
      this.updatePage();
    }
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.data.length / this.pageSize));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  updatePage(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    this.pagedData = this.data.slice(start, start + this.pageSize);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
  }

  onSort(col: TableColumn): void {
    if (!col.sortable) return;
    if (this.sortColumn === col.key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = col.key;
      this.sortDirection = 'asc';
    }
    this.sortChange.emit({ column: this.sortColumn, direction: this.sortDirection });
  }

  getCellValue(row: Record<string, unknown>, col: TableColumn): string {
    const value = row[col.key];
    if (col.formatter) return col.formatter(value, row);
    return value != null ? String(value) : '';
  }

  onRowClick(row: Record<string, unknown>): void {
    this.rowClick.emit(row);
  }
}
