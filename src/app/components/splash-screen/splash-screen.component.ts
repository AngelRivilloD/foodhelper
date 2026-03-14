import { Component, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-splash-screen',
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.css']
})
export class SplashScreenComponent implements AfterViewInit, OnDestroy {
  @Output() splashComplete = new EventEmitter<void>();
  @ViewChild('logoCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  fadeOut = false;
  showLoadingBar = false;
  private animationId: number | null = null;
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  ngAfterViewInit(): void {
    document.fonts.ready.then(() => {
      this.animateLogo();
    });
  }

  ngOnDestroy(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
    }
    this.timeouts.forEach(t => clearTimeout(t));
  }

  private animateLogo(): void {
    const canvas = this.canvasRef.nativeElement;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d')!;
    const fontSize = 40;
    const darkColor = '#222222';
    const accentColor = '#b68f5e';
    const nutriFont = `600 ${fontSize}px Urbanist`;
    const guudFont = `700 ${fontSize}px Urbanist`;

    // Measure all pieces
    const mCtx = document.createElement('canvas').getContext('2d')!;

    mCtx.font = nutriFont;
    const nutriWidth = mCtx.measureText('nutri').width;
    const iAscent = mCtx.measureText('nutri').actualBoundingBoxAscent;

    mCtx.font = guudFont;
    const gWidth = mCtx.measureText('g').width;
    const uWidth = mCtx.measureText('u').width;
    const dWidth = mCtx.measureText('d').width;
    const gMetrics = mCtx.measureText('g');
    const gDescent = gMetrics.actualBoundingBoxDescent;

    const ascent = Math.max(iAscent, gMetrics.actualBoundingBoxAscent);
    const descent = gDescent;
    const padding = 8;
    const canvasHeight = Math.ceil(ascent + descent) + padding;
    const baseline = Math.ceil(ascent) + padding / 2;

    // Positions — gap tightens kerning between Urbanist glyphs
    const gap = 1;
    const gX = nutriWidth;
    const u1X = gX + gWidth - gap;
    const u2X = u1X + uWidth - gap;
    const dX = u2X + uWidth - gap;

    // Stretch to exactly the width of two u's so the snap is seamless
    const twoUWidth = (u2X + uWidth) - u1X; // from u1 start to u2 end
    const maxScale = twoUWidth / uWidth;
    const finalWidth = dX + dWidth + 4;
    const maxWidth = finalWidth + 10;

    // Center offset: shift all drawing so final text is centered in the canvas
    const offsetX = (maxWidth - finalWidth) / 2;

    // Set canvas CSS size (logical pixels)
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    // Set canvas buffer size (physical pixels) for sharp rendering
    canvas.width = Math.ceil(maxWidth * dpr);
    canvas.height = Math.ceil(canvasHeight * dpr);

    // Scale context to match DPR
    ctx.scale(dpr, dpr);

    // Pre-render "u" to offscreen canvas for slice-based stretching
    // This preserves stroke width during the stretch animation
    const offCanvas = document.createElement('canvas');
    const offCtx = offCanvas.getContext('2d')!;
    offCanvas.width = Math.ceil(uWidth * dpr);
    offCanvas.height = Math.ceil(canvasHeight * dpr);
    offCtx.scale(dpr, dpr);
    offCtx.font = guudFont;
    offCtx.fillStyle = accentColor;
    offCtx.textBaseline = 'alphabetic';
    offCtx.fillText('u', 0, baseline);

    // 3-slice proportions: left stroke | bottom curve | right stroke
    const sliceLeftW = Math.ceil(uWidth * 0.33 * dpr);
    const sliceRightW = Math.ceil(uWidth * 0.33 * dpr);
    const sliceMiddleW = offCanvas.width - sliceLeftW - sliceRightW;
    const sliceLeftLogical = sliceLeftW / dpr;
    const sliceRightLogical = sliceRightW / dpr;

    // Timeline
    const revealSpeed = 350;
    const revealStart = 400;

    const uRevealTime = revealStart + (u1X / revealSpeed) * 1000;
    const stretchDelay = 100;
    const stretchDuration = 300;
    const stretchStart = uRevealTime + stretchDelay;
    const stretchEnd = stretchStart + stretchDuration;
    const dRevealTime = stretchEnd + 40;
    const dRevealDuration = 280;

    const letters = [
      { text: 'nutri', x: offsetX, font: nutriFont, color: darkColor },
      { text: 'g', x: gX + offsetX, font: guudFont, color: accentColor },
    ];

    // Offset u/d positions for centered drawing
    const u1Xo = u1X + offsetX;
    const u2Xo = u2X + offsetX;
    const dXo = dX + offsetX;

    const startTime = performance.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

    // Schedule loading bar and fade out
    const animEndTime = stretchEnd + dRevealDuration + 100;
    this.timeouts.push(setTimeout(() => { this.showLoadingBar = true; }, animEndTime));
    this.timeouts.push(setTimeout(() => { this.fadeOut = true; }, animEndTime + 800));
    this.timeouts.push(setTimeout(() => { this.splashComplete.emit(); }, animEndTime + 1400));

    const render = (now: number) => {
      const elapsed = now - startTime;
      ctx.clearRect(0, 0, maxWidth, canvasHeight);

      const revealElapsed = Math.max(0, elapsed - revealStart);
      const revealX = (revealElapsed / 1000) * revealSpeed + offsetX;

      // Draw "nutri" and "g"
      for (const letter of letters) {
        ctx.font = letter.font;
        const lw = ctx.measureText(letter.text).width;
        const letterRight = letter.x + lw;

        if (revealX <= letter.x) continue;

        ctx.save();
        const clipRight = Math.min(revealX, letterRight);
        ctx.beginPath();
        ctx.rect(letter.x, 0, clipRight - letter.x, canvasHeight);
        ctx.clip();
        ctx.fillStyle = letter.color;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(letter.text, letter.x, baseline);
        ctx.restore();
      }

      // U zone (using offset positions)
      if (elapsed < stretchStart) {
        if (revealX > u1Xo) {
          ctx.save();
          const clipRight = Math.min(revealX, u1Xo + uWidth);
          ctx.beginPath();
          ctx.rect(u1Xo, 0, clipRight - u1Xo, canvasHeight);
          ctx.clip();
          ctx.font = guudFont;
          ctx.fillStyle = accentColor;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('u', u1Xo, baseline);
          ctx.restore();
        }
      } else if (elapsed < stretchEnd) {
        // 3-slice stretch: left stroke + stretched middle + right stroke
        const t = easeInOut((elapsed - stretchStart) / stretchDuration);
        const currentWidth = uWidth + (twoUWidth - uWidth) * t;
        const middleLogical = currentWidth - sliceLeftLogical - sliceRightLogical;

        // Left slice (fixed width)
        ctx.drawImage(offCanvas,
          0, 0, sliceLeftW, offCanvas.height,
          u1Xo, 0, sliceLeftLogical, canvasHeight);
        // Middle slice (stretched)
        ctx.drawImage(offCanvas,
          sliceLeftW, 0, sliceMiddleW, offCanvas.height,
          u1Xo + sliceLeftLogical, 0, middleLogical, canvasHeight);
        // Right slice (fixed width)
        ctx.drawImage(offCanvas,
          offCanvas.width - sliceRightW, 0, sliceRightW, offCanvas.height,
          u1Xo + sliceLeftLogical + middleLogical, 0, sliceRightLogical, canvasHeight);
      } else {
        ctx.font = guudFont;
        ctx.fillStyle = accentColor;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('u', u1Xo, baseline);
        ctx.fillText('u', u2Xo, baseline);

        const dElapsed = elapsed - dRevealTime;
        if (dElapsed > 0) {
          const dT = Math.min(dElapsed / dRevealDuration, 1);
          ctx.save();
          ctx.beginPath();
          ctx.rect(dXo, 0, dWidth * easeOut(dT), canvasHeight);
          ctx.clip();
          ctx.fillText('d', dXo, baseline);
          ctx.restore();
        }
      }

      if (elapsed < animEndTime) {
        this.animationId = requestAnimationFrame(render);
      }
    };

    this.animationId = requestAnimationFrame(render);
  }
}
