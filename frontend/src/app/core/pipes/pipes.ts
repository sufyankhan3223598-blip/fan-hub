import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

export function assetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${environment.assetOrigin}${path.startsWith('/') ? '' : '/'}${path}`;
}

@Pipe({ name: 'asset', standalone: true })
export class AssetPipe implements PipeTransform {
  transform(path?: string | null): string { return assetUrl(path); }
}

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value?: string | Date | null): string {
    if (!value) return '';
    const d = typeof value === 'string' ? new Date(value.endsWith('Z') || value.includes('+') ? value : value + 'Z') : value;
    const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 45) return 'just now';
    const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
    const dd = Math.round(h / 24); if (dd < 30) return `${dd}d ago`;
    const mo = Math.round(dd / 30); if (mo < 12) return `${mo}mo ago`;
    return `${Math.round(mo / 12)}y ago`;
  }
}

@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(sec?: number | null): string {
    if (!sec || sec < 0) return '0:00';
    const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
    return m >= 60 ? `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
  }
}

@Pipe({ name: 'compact', standalone: true })
export class CompactNumberPipe implements PipeTransform {
  transform(n?: number | null): string {
    if (n === null || n === undefined) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n);
  }
}

@Pipe({ name: 'richAssets', standalone: true })
export class RichAssetsPipe implements PipeTransform {
  transform(html?: string | null): string {
    if (!html) return '';
    return html.replace(/(src|href)="\/(media|uploads)\//g, `$1="${environment.assetOrigin}/$2/`);
  }
}

@Pipe({ name: 'initials', standalone: true })
export class InitialsPipe implements PipeTransform {
  transform(name?: string | null): string {
    return (name ?? '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase();
  }
}
