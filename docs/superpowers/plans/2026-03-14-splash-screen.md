# Splash Screen Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated splash screen that shows the "nutriguud" logo with a stretch-split animation when the app loads.

**Architecture:** A new `SplashScreenComponent` overlays the app content with a canvas-based logo animation. `AppComponent` manages splash visibility via a boolean flag, hiding it when the animation completes. The animation logic runs entirely in the canvas using `requestAnimationFrame`.

**Tech Stack:** Angular 16 (NgModule pattern), Canvas API, CSS animations, Google Fonts (Urbanist)

**Spec:** `docs/superpowers/specs/2026-03-14-splash-screen-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/app/components/splash-screen/splash-screen.component.ts` | Canvas animation logic, font loading, retina support, emits `splashComplete` |
| Create | `src/app/components/splash-screen/splash-screen.component.html` | Canvas element + loading bar markup |
| Create | `src/app/components/splash-screen/splash-screen.component.css` | Overlay positioning, loading bar styles, fade-out animation |
| Modify | `src/app/app.module.ts` | Register `SplashScreenComponent` in declarations |
| Modify | `src/app/app.component.ts` | Add `showSplash` flag, handler for `splashComplete` |
| Modify | `src/app/app.component.html` | Add `<app-splash-screen>` overlay |
| — | `src/app/app.component.css` | No changes needed (splash uses `position: fixed`) |

---

## Task 1: Create SplashScreenComponent — Template & Styles

**Files:**
- Create: `src/app/components/splash-screen/splash-screen.component.html`
- Create: `src/app/components/splash-screen/splash-screen.component.css`

- [ ] **Step 1: Create the HTML template**

```html
<!-- src/app/components/splash-screen/splash-screen.component.html -->
<div class="splash-overlay" [class.fade-out]="fadeOut">
  <canvas #logoCanvas></canvas>
  <div class="loading-bar" [class.visible]="showLoadingBar">
    <div class="loading-bar-fill" [class.animate]="showLoadingBar"></div>
  </div>
</div>
```

- [ ] **Step 2: Create the CSS**

```css
/* src/app/components/splash-screen/splash-screen.component.css */
:host * {
  transition: none;
}

.splash-overlay {
  position: fixed;
  inset: 0;
  background: #FAFAF8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  opacity: 1;
}

.splash-overlay.fade-out {
  animation: splashFadeOut 0.5s ease-in forwards;
}

@keyframes splashFadeOut {
  0% { opacity: 1; }
  100% { opacity: 0; pointer-events: none; }
}

.loading-bar {
  width: 40px;
  height: 3px;
  background: #EDE8E0;
  border-radius: 2px;
  margin-top: 40px;
  overflow: hidden;
  opacity: 0;
}

.loading-bar.visible {
  animation: barAppear 0.3s ease-out forwards;
}

@keyframes barAppear {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-bar-fill {
  height: 100%;
  width: 0%;
  background: #b68f5e;
  border-radius: 2px;
}

.loading-bar-fill.animate {
  animation: loadFill 0.6s ease-in-out forwards;
  animation-delay: 0.2s;
}

@keyframes loadFill {
  to { width: 100%; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/components/splash-screen/splash-screen.component.html src/app/components/splash-screen/splash-screen.component.css
git commit -m "feat(splash): add splash screen template and styles"
```

---

## Task 2: Create SplashScreenComponent — TypeScript

**Files:**
- Create: `src/app/components/splash-screen/splash-screen.component.ts`

- [ ] **Step 1: Create the component with full animation logic**

```typescript
// src/app/components/splash-screen/splash-screen.component.ts
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

    // Positions
    const gap = 1;
    const gX = nutriWidth;
    const u1X = gX + gWidth - gap;
    const u2X = u1X + uWidth - gap;
    const dX = u2X + uWidth - gap;

    const maxScale = 2.8;
    const maxWidth = u1X + uWidth * maxScale + dWidth + 10;

    // Set canvas CSS size (logical pixels)
    canvas.style.width = maxWidth + 'px';
    canvas.style.height = canvasHeight + 'px';

    // Set canvas buffer size (physical pixels) for sharp rendering
    canvas.width = Math.ceil(maxWidth * dpr);
    canvas.height = Math.ceil(canvasHeight * dpr);

    // Scale context to match DPR
    ctx.scale(dpr, dpr);

    // Timeline
    const revealSpeed = 350;
    const revealStart = 400;

    const uRevealTime = revealStart + (u1X / revealSpeed) * 1000;
    const stretchDelay = 100;
    const stretchDuration = 450;
    const stretchStart = uRevealTime + stretchDelay;
    const stretchEnd = stretchStart + stretchDuration;
    const dRevealTime = stretchEnd + 40;
    const dRevealDuration = 100;

    const letters = [
      { text: 'nutri', x: 0, font: nutriFont, color: darkColor },
      { text: 'g', x: gX, font: guudFont, color: accentColor },
    ];

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
      const revealX = (revealElapsed / 1000) * revealSpeed;

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

      // U zone
      if (elapsed < stretchStart) {
        if (revealX > u1X) {
          ctx.save();
          const clipRight = Math.min(revealX, u1X + uWidth);
          ctx.beginPath();
          ctx.rect(u1X, 0, clipRight - u1X, canvasHeight);
          ctx.clip();
          ctx.font = guudFont;
          ctx.fillStyle = accentColor;
          ctx.textBaseline = 'alphabetic';
          ctx.fillText('u', u1X, baseline);
          ctx.restore();
        }
      } else if (elapsed < stretchEnd) {
        const t = easeInOut((elapsed - stretchStart) / stretchDuration);
        const currentScale = 1 + (maxScale - 1) * t;
        ctx.save();
        ctx.font = guudFont;
        ctx.fillStyle = accentColor;
        ctx.textBaseline = 'alphabetic';
        ctx.translate(u1X, baseline);
        ctx.scale(currentScale, 1);
        ctx.fillText('u', 0, 0);
        ctx.restore();
      } else {
        ctx.font = guudFont;
        ctx.fillStyle = accentColor;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText('u', u1X, baseline);
        ctx.fillText('u', u2X, baseline);

        const dElapsed = elapsed - dRevealTime;
        if (dElapsed > 0) {
          const dT = Math.min(dElapsed / dRevealDuration, 1);
          ctx.save();
          ctx.beginPath();
          ctx.rect(dX, 0, dWidth * easeOut(dT), canvasHeight);
          ctx.clip();
          ctx.fillText('d', dX, baseline);
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
```

- [ ] **Step 2: Commit**

Note: Build will not pass yet — component is not registered in the module until Task 3.

```bash
git add src/app/components/splash-screen/splash-screen.component.ts
git commit -m "feat(splash): add splash screen animation logic"
```

---

## Task 3: Register Component & Integrate into AppComponent

**Files:**
- Modify: `src/app/app.module.ts`
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`

- [ ] **Step 1: Register in AppModule**

In `src/app/app.module.ts`, add the import and declaration:

```typescript
// Add import at top:
import { SplashScreenComponent } from './components/splash-screen/splash-screen.component';

// Add to declarations array:
declarations: [
  AppComponent,
  TargetSetterComponent,
  MealCalculatorComponent,
  HamburgerMenuComponent,
  ProfileSelectorComponent,
  VoiceInputComponent,
  DailyProgressComponent,
  CelebrationComponent,
  AddFoodModalComponent,
  SplashScreenComponent  // <-- add this
],
```

- [ ] **Step 2: Add showSplash flag to AppComponent**

In `src/app/app.component.ts`, add:

```typescript
// Add property after existing properties:
showSplash = true;

// Add method:
onSplashComplete(): void {
  this.showSplash = false;
}
```

- [ ] **Step 3: Add splash to AppComponent template**

In `src/app/app.component.html`, add this line right **before** the closing `</div>` of `.app-container` (after the `</nav>` tag, line 38):

```html
<app-splash-screen *ngIf="showSplash" (splashComplete)="onSplashComplete()"></app-splash-screen>
```

Do NOT modify any existing markup — only append this single line.

- [ ] **Step 4: Build and verify**

Run: `cd /Users/angelrivillo/Projects/foodhelper && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && npx ng build --configuration=development 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 5: Serve and manually test**

Run: `cd /Users/angelrivillo/Projects/foodhelper && export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && npx ng serve --open`

Verify:
1. Splash overlay appears with `#FAFAF8` background
2. "nutriguud" logo animates left-to-right
3. "u" stretches and splits into "uu"
4. Loading bar appears and fills
5. Splash fades out revealing the app
6. Text is crisp (not blurry) on retina screens

- [ ] **Step 6: Commit**

```bash
git add src/app/app.module.ts src/app/app.component.ts src/app/app.component.html
git commit -m "feat(splash): integrate splash screen into app shell"
```
