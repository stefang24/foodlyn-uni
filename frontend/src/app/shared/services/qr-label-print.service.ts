import { inject, Injectable } from '@angular/core';
import { FileUploadService } from './file-upload.service';
import { NotifyService } from './notify.service';
import { RestaurantDTO } from '../models/restaurantDTO.model';
import { RestaurantTableDTO } from '../models/tableDTO.model';

@Injectable({ providedIn: 'root' })
export class QrLabelPrintService {
    private readonly fileUpload = inject(FileUploadService);
    private readonly messageService = inject(NotifyService);

    print(restaurant: RestaurantDTO, tables: RestaurantTableDTO[]): void {
        const printable = tables.filter((t) => t.isActive);
        if (printable.length === 0) {
            this.messageService.add({
                severity: 'info',
                summary: 'No tables',
                detail: 'There are no active tables to print.',
                life: 2500,
            });
            return;
        }

        const win = window.open('', '_blank');
        if (!win) {
            this.messageService.add({
                severity: 'error',
                summary: 'Popup blocked',
                detail: 'Allow popups for this site to print QR labels.',
                life: 3000,
            });
            return;
        }

        win.document.open();
        win.document.write(this.buildHtml(restaurant, printable));
        win.document.close();
    }

    private qrLink(token: string): string {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `${origin}/t/${token}`;
    }

    private qrImageUrl(token: string, size: number): string {
        const target = encodeURIComponent(this.qrLink(token));
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${target}`;
    }

    private escapeHtml(s: string): string {
        return s.replace(/[&<>"']/g, (c) =>
            c === '&' ? '&amp;'
            : c === '<' ? '&lt;'
            : c === '>' ? '&gt;'
            : c === '"' ? '&quot;'
            : '&#39;',
        );
    }

    private buildHtml(restaurant: RestaurantDTO, printable: RestaurantTableDTO[]): string {
        const esc = (s: string) => this.escapeHtml(s);
        const restaurantName = esc(restaurant.name);
        const logoUrl = this.fileUpload.resolveUrl(restaurant.logoUrl);
        const logoHtml = logoUrl
            ? `<img class="logo" src="${esc(logoUrl)}" alt="" />`
            : `<div class="logo placeholder">${esc(restaurantName.charAt(0).toUpperCase())}</div>`;

        const cards = printable
            .map((t) => {
                const caption = t.label ? esc(t.label).toUpperCase() : `TABLE NO ${t.number}`;
                const qr = this.qrImageUrl(t.qrToken, 600);
                return `
        <div class="label-card">
            <div class="card-top">
                <div class="brand">
                    ${logoHtml}
                    <span class="brand-name">${restaurantName}</span>
                </div>
                <div class="table-num">${t.number}</div>
                <div class="table-caption">${caption}</div>
                <div class="qr-box">
                    <img class="qr" src="${qr}" alt="QR" />
                </div>
            </div>
            <div class="card-bottom">
                <div class="cta">Scan to order</div>
                <div class="foodlyn">foodlyn.app</div>
            </div>
        </div>`;
            })
            .join('');

        return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>QR labels — ${restaurantName}</title>
<style>
    * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    html, body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Arial, sans-serif; background: #e5e7eb; }
    .toolbar {
        position: sticky; top: 0; z-index: 10;
        display: flex; gap: 12px; align-items: center; justify-content: center;
        padding: 14px; background: #ffffff; border-bottom: 1px solid #d1d5db;
    }
    .toolbar button {
        font-size: 15px; font-weight: 700; padding: 10px 22px; border-radius: 10px;
        border: none; cursor: pointer;
    }
    .toolbar .print { background: rgb(125,7,7); color: #fff; }
    .toolbar .close { background: #e5e7eb; color: #111827; }
    .toolbar span { color: #6b7280; font-size: 13px; }

    .sheet {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12mm;
        padding: 12mm;
        max-width: 210mm;
        margin: 0 auto;
    }

    .label-card {
        width: 100%;
        aspect-ratio: 61 / 85;
        border-radius: 22px;
        overflow: hidden;
        background: #0a0303;
        box-shadow: 0 8px 24px rgba(0,0,0,0.18);
        display: flex;
        flex-direction: column;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .card-top {
        position: relative;
        flex: 1;
        background:
            radial-gradient(circle at 50% 42%, rgba(180,20,20,0.55), transparent 55%),
            linear-gradient(160deg, #7d0707 0%, #5a0505 45%, #2a0202 100%);
        padding: 20px 20px 26px;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .brand {
        align-self: flex-start;
        display: flex; align-items: center; gap: 9px;
        color: #fff;
    }
    .logo {
        width: 30px; height: 30px; border-radius: 8px; object-fit: contain;
        background: #fff; padding: 2px;
    }
    .logo.placeholder {
        display: flex; align-items: center; justify-content: center;
        font-weight: 800; color: rgb(125,7,7); font-size: 16px;
    }
    .brand-name { font-size: 20px; font-weight: 700; font-style: italic; letter-spacing: 0.3px; }

    .table-num {
        position: absolute; top: 16px; right: 20px;
        font-size: 46px; font-weight: 800; color: #fff; line-height: 1;
    }
    .table-caption {
        margin-top: 14px;
        font-size: 12px; letter-spacing: 4px; font-weight: 700;
        color: rgba(255,255,255,0.42);
        text-transform: uppercase;
    }
    .qr-box {
        margin-top: 16px;
        background: #fff;
        border-radius: 18px;
        padding: 16px;
        box-shadow: 0 10px 26px rgba(0,0,0,0.3);
    }
    .qr { display: block; width: 200px; height: 200px; }

    .card-bottom {
        background: #0a0303;
        padding: 18px 16px 22px;
        text-align: center;
    }
    .cta { color: #fff; font-size: 19px; font-weight: 700; }
    .foodlyn {
        margin-top: 6px;
        color: rgba(180,60,60,0.85);
        font-size: 13px; letter-spacing: 3px;
        font-family: 'Courier New', monospace;
    }

    @media print {
        html, body { background: #fff; }
        .toolbar { display: none; }
        .sheet { padding: 8mm; gap: 8mm; }
        .label-card { box-shadow: none; }
    }
</style>
</head>
<body>
    <div class="toolbar">
        <button class="print" onclick="window.print()">Print / Save PDF</button>
        <button class="close" onclick="window.close()">Close</button>
        <span>${printable.length} label(s) &middot; ${restaurantName}</span>
    </div>
    <div class="sheet">${cards}</div>
</body>
</html>`;
    }
}
