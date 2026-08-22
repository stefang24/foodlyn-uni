import { Injectable, signal } from '@angular/core';

interface VoiceOptions {
    startFreq: number;
    endFreq?: number;
    delayMs: number;
    durationMs: number;
    type?: OscillatorType;
    volume?: number;
    filterFreq?: number;
    filterQ?: number;
    attackMs?: number;
}

const MUTE_KEY = 'foodlyn_sound_muted';

@Injectable({ providedIn: 'root' })
export class SoundService {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private readonly _muted = signal<boolean>(this.readMuted());

    readonly muted = this._muted.asReadonly();

    toggleMute(): void {
        this.setMuted(!this._muted());
    }

    setMuted(value: boolean): void {
        this._muted.set(value);
        try {
            localStorage.setItem(MUTE_KEY, value ? '1' : '0');
        } catch {
        }
    }

    playNewOrder(): void {
        this.play([
            { startFreq: 392, delayMs: 0, durationMs: 320, type: 'triangle', volume: 0.22, filterFreq: 1600 },
            { startFreq: 196, delayMs: 0, durationMs: 320, type: 'sine', volume: 0.14, filterFreq: 900 },
            { startFreq: 523, delayMs: 190, durationMs: 420, type: 'triangle', volume: 0.22, filterFreq: 1800 },
            { startFreq: 262, delayMs: 190, durationMs: 420, type: 'sine', volume: 0.14, filterFreq: 1000 },
        ]);
    }

    playOrderToPrepare(): void {
        this.play([
            { startFreq: 220, endFreq: 520, delayMs: 0, durationMs: 380, type: 'sine', volume: 0.24, filterFreq: 1500 },
            { startFreq: 660, endFreq: 1560, delayMs: 0, durationMs: 380, type: 'sine', volume: 0.06, filterFreq: 2200, filterQ: 0.5 },
            { startFreq: 330, delayMs: 240, durationMs: 360, type: 'triangle', volume: 0.16, filterFreq: 1400 },
        ]);
    }

    playWaiterCall(): void {
        this.play([
            { startFreq: 698, delayMs: 0, durationMs: 380, type: 'triangle', volume: 0.22, filterFreq: 2000 },
            { startFreq: 349, delayMs: 0, durationMs: 380, type: 'sine', volume: 0.12, filterFreq: 1000 },
            { startFreq: 587, delayMs: 280, durationMs: 520, type: 'triangle', volume: 0.22, filterFreq: 1900 },
            { startFreq: 294, delayMs: 280, durationMs: 520, type: 'sine', volume: 0.12, filterFreq: 900 },
        ]);
    }

    playOrderReady(): void {
        this.play([
            { startFreq: 523, delayMs: 0, durationMs: 450, type: 'triangle', volume: 0.22, filterFreq: 2000 },
            { startFreq: 262, delayMs: 0, durationMs: 450, type: 'sine', volume: 0.12, filterFreq: 900 },
            { startFreq: 659, delayMs: 200, durationMs: 500, type: 'triangle', volume: 0.22, filterFreq: 2200 },
            { startFreq: 330, delayMs: 200, durationMs: 500, type: 'sine', volume: 0.12, filterFreq: 1000 },
            { startFreq: 784, delayMs: 400, durationMs: 700, type: 'triangle', volume: 0.22, filterFreq: 2400 },
            { startFreq: 392, delayMs: 400, durationMs: 700, type: 'sine', volume: 0.12, filterFreq: 1100 },
        ]);
    }

    playCustomerStatusUpdate(status: string): boolean {
        switch (status) {
            case 'Approved':
                this.playCustomerApproved();
                return true;
            case 'Preparing':
                this.playCustomerPreparing();
                return true;
            case 'Ready':
                this.playCustomerReady();
                return true;
            case 'Served':
                this.playCustomerServed();
                return true;
            default:
                return false;
        }
    }

    private playCustomerApproved(): void {
        this.play([
            { startFreq: 880, endFreq: 220, delayMs: 0, durationMs: 280, type: 'sine', volume: 0.22, filterFreq: 1400, attackMs: 8 },
            { startFreq: 80, endFreq: 55, delayMs: 50, durationMs: 360, type: 'sine', volume: 0.30, filterFreq: 220, attackMs: 6 },
            { startFreq: 1320, endFreq: 660, delayMs: 0, durationMs: 260, type: 'triangle', volume: 0.06, filterFreq: 2400, attackMs: 6 },
        ]);
    }

    private playCustomerPreparing(): void {
        this.play([
            { startFreq: 200, endFreq: 720, delayMs: 0, durationMs: 360, type: 'sine', volume: 0.22, filterFreq: 1800, attackMs: 14 },
            { startFreq: 55, endFreq: 130, delayMs: 0, durationMs: 380, type: 'sine', volume: 0.28, filterFreq: 250, attackMs: 12 },
            { startFreq: 880, endFreq: 1760, delayMs: 40, durationMs: 320, type: 'triangle', volume: 0.05, filterFreq: 2600 },
        ]);
    }

    private playCustomerReady(): void {
        this.play([
            { startFreq: 880, delayMs: 0, durationMs: 520, type: 'triangle', volume: 0.20, filterFreq: 2400, attackMs: 10 },
            { startFreq: 110, delayMs: 0, durationMs: 560, type: 'sine', volume: 0.26, filterFreq: 300, attackMs: 8 },
            { startFreq: 1320, delayMs: 260, durationMs: 640, type: 'triangle', volume: 0.18, filterFreq: 2800, attackMs: 10 },
            { startFreq: 65, delayMs: 60, durationMs: 780, type: 'sine', volume: 0.24, filterFreq: 220, attackMs: 8 },
            { startFreq: 440, delayMs: 0, durationMs: 520, type: 'sine', volume: 0.10, filterFreq: 1500 },
        ]);
    }

    private playCustomerServed(): void {
        this.play([
            { startFreq: 784, delayMs: 0, durationMs: 380, type: 'triangle', volume: 0.20, filterFreq: 2200, attackMs: 10 },
            { startFreq: 659, delayMs: 180, durationMs: 380, type: 'triangle', volume: 0.20, filterFreq: 2100, attackMs: 10 },
            { startFreq: 523, delayMs: 360, durationMs: 640, type: 'triangle', volume: 0.20, filterFreq: 2000, attackMs: 10 },
            { startFreq: 130, delayMs: 0, durationMs: 720, type: 'sine', volume: 0.22, filterFreq: 300, attackMs: 8 },
            { startFreq: 65, delayMs: 200, durationMs: 700, type: 'sine', volume: 0.20, filterFreq: 220, attackMs: 8 },
        ]);
    }

    private play(voices: VoiceOptions[]): void {
        if (this._muted()) return;
        const ctx = this.ensureContext();
        if (!ctx) return;
        for (const v of voices) {
            this.playVoice(ctx, v);
        }
    }

    private playVoice(ctx: AudioContext, opts: VoiceOptions): void {
        const osc = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();

        osc.type = opts.type ?? 'sine';

        const t0 = ctx.currentTime + opts.delayMs / 1000;
        const t1 = t0 + opts.durationMs / 1000;

        osc.frequency.setValueAtTime(opts.startFreq, t0);
        if (opts.endFreq !== undefined && opts.endFreq !== opts.startFreq) {
            osc.frequency.exponentialRampToValueAtTime(opts.endFreq, t1);
        }

        filter.type = 'lowpass';
        filter.frequency.value = opts.filterFreq ?? 2000;
        filter.Q.value = opts.filterQ ?? 0.7;

        const vol = opts.volume ?? 0.18;
        const attackS = (opts.attackMs ?? 18) / 1000;
        const attackEnd = t0 + attackS;

        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(vol, attackEnd);
        gain.gain.exponentialRampToValueAtTime(0.0001, t1);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain ?? ctx.destination);

        osc.start(t0);
        osc.stop(t1 + 0.05);
    }

    private ensureContext(): AudioContext | null {
        try {
            if (!this.ctx) {
                const Ctor =
                    window.AudioContext ??
                    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                if (!Ctor) return null;
                this.ctx = new Ctor();
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.9;
                this.masterGain.connect(this.ctx.destination);
            }
            if (this.ctx.state === 'suspended') {
                void this.ctx.resume();
            }
            return this.ctx;
        } catch {
            return null;
        }
    }

    private readMuted(): boolean {
        try {
            return localStorage.getItem(MUTE_KEY) === '1';
        } catch {
            return false;
        }
    }
}
