import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'appDateFormat', standalone: true })
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null, format = 'dd MMM yyyy'): string {
    if (!value) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
}
