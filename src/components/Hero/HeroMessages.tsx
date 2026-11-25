'use client';

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentPropsWithoutRef,
  type PointerEvent,
} from 'react';
import clsx from 'clsx';
import { animate, type AnimationPlaybackControls } from 'motion/react';
import {
  FALLBACK_HERO_TIMING,
  getNextMessageIndex,
  parseCssDurationMs,
  resolveHeroPlaybackState,
  resolveScrambleGlyph,
  shouldPauseForPointerHover,
  tokenizeTextForScramble,
  type HeroMessage,
  type HeroMessageTiming,
  type TokenizedText,
} from './heroMessageScramble';
import styles from './HeroMessages.module.css';

export interface HeroMessagesProps extends ComponentPropsWithoutRef<'div'> {
  readonly messages: readonly HeroMessage[];
}

interface RotationState {
  readonly activeIndex: number;
  readonly transitionId: number;
}

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function subscribeDocumentVisibility(onStoreChange: () => void): () => void {
  if (typeof document === 'undefined') return () => {};
  document.addEventListener('visibilitychange', onStoreChange);
  return () => {
    document.removeEventListener('visibilitychange', onStoreChange);
  };
}

function getDocumentVisibleSnapshot(): boolean {
  if (typeof document === 'undefined') return true;
  return document.visibilityState !== 'hidden';
}

function getServerTrueSnapshot(): boolean {
  return true;
}

function subscribeReducedMotion(onStoreChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {};
  }
  const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', onStoreChange);
    return () => mediaQuery.removeEventListener('change', onStoreChange);
  }
  mediaQuery.addListener(onStoreChange);
  return () => mediaQuery.removeListener(onStoreChange);
}

function getReducedMotionSnapshot(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerFalseSnapshot(): boolean {
  return false;
}

function readHeroTimingFromCss(element: HTMLElement): HeroMessageTiming {
  const computed = getComputedStyle(element);
  const intervalMs = parseCssDurationMs(
    computed.getPropertyValue('--hero-message-interval'),
    FALLBACK_HERO_TIMING.intervalMs
  );
  const rawScrambleMs = parseCssDurationMs(
    computed.getPropertyValue('--hero-scramble-duration'),
    FALLBACK_HERO_TIMING.scrambleDurationMs
  );
  const scrambleDurationMs = Math.min(rawScrambleMs, Math.max(100, intervalMs - 100));
  const scrambleStepMs = Math.max(
    16,
    parseCssDurationMs(
      computed.getPropertyValue('--hero-scramble-step'),
      FALLBACK_HERO_TIMING.scrambleStepMs
    )
  );
  return { intervalMs, scrambleDurationMs, scrambleStepMs };
}

interface ScrambleLineProps {
  readonly tokenized: TokenizedText;
}

function ScrambleLine({ tokenized }: ScrambleLineProps) {
  return (
    <>
      {tokenized.runs.map((run, runIndex) => {
        if (run.type === 'space') {
          return <Fragment key={`sp-${runIndex}`}>{run.value}</Fragment>;
        }

        return (
          <span key={`wd-${runIndex}`} className={styles.word}>
            {run.glyphs.map((token, glyphIndex) => {
              if (!token.scrambleable) {
                return (
                  <Fragment key={`lit-${runIndex}-${glyphIndex}`}>
                    {token.grapheme}
                  </Fragment>
                );
              }

              return (
                <span
                  key={`gl-${token.slotIndex}`}
                  className={styles.glyphSlot}
                  data-glyph={token.grapheme}
                >
                  <span className={styles.glyphLive} data-glyph-live="true">
                    {token.grapheme}
                  </span>
                </span>
              );
            })}
          </span>
        );
      })}
    </>
  );
}

export function HeroMessages({
  messages,
  className,
  ...rest
}: HeroMessagesProps) {
  const messageCount = messages.length;

  const [rotation, setRotation] = useState<RotationState>({
    activeIndex: 0,
    transitionId: 0,
  });
  const [isHoverPaused, setIsHoverPaused] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(true);

  const isDocumentVisible = useSyncExternalStore(
    subscribeDocumentVisibility,
    getDocumentVisibleSnapshot,
    getServerTrueSnapshot
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getServerFalseSnapshot
  );

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const titleLineRef = useRef<HTMLParagraphElement>(null);
  const descriptionLineRef = useRef<HTMLParagraphElement>(null);
  const titleGlyphNodesRef = useRef<HTMLSpanElement[]>([]);
  const descriptionGlyphNodesRef = useRef<HTMLSpanElement[]>([]);

  const timingRef = useRef<HeroMessageTiming>(FALLBACK_HERO_TIMING);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<AnimationPlaybackControls | null>(null);
  const animationGenerationRef = useRef<number>(0);
  const lastTouchTimeRef = useRef<number>(Number.NEGATIVE_INFINITY);

  const safeIndex =
    messageCount > 0 ? ((rotation.activeIndex % messageCount) + messageCount) % messageCount : 0;
  const activeMessage = messages[safeIndex];

  const tokenizedMessages = useMemo(
    () =>
      messages.map((message) => ({
        id: message.id,
        title: tokenizeTextForScramble(message.title),
        description: tokenizeTextForScramble(message.description),
      })),
    [messages]
  );

  const activeTokenized = tokenizedMessages[safeIndex];

  const playback = resolveHeroPlaybackState({
    messageCount,
    isHoverPaused,
    isInView,
    isDocumentVisible,
    prefersReducedMotion,
  });

  const activeTokenizedRef = useRef(activeTokenized);
  const playbackRef = useRef(playback);
  useIsomorphicLayoutEffect(() => {
    activeTokenizedRef.current = activeTokenized;
    playbackRef.current = playback;
  }, [activeTokenized, playback]);

  const clearRotationTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const collectGlyphNodes = useCallback(() => {
    titleGlyphNodesRef.current = titleLineRef.current
      ? Array.from(
          titleLineRef.current.querySelectorAll<HTMLSpanElement>('[data-glyph-live="true"]')
        )
      : [];
    descriptionGlyphNodesRef.current = descriptionLineRef.current
      ? Array.from(
          descriptionLineRef.current.querySelectorAll<HTMLSpanElement>('[data-glyph-live="true"]')
        )
      : [];
  }, []);

  const settleExactText = useCallback(() => {
    const current = activeTokenizedRef.current;
    if (current) {
      if (
        titleGlyphNodesRef.current.length !== current.title.slots.length ||
        descriptionGlyphNodesRef.current.length !== current.description.slots.length
      ) {
        collectGlyphNodes();
      }

      for (let i = 0; i < current.title.slots.length; i += 1) {
        const node = titleGlyphNodesRef.current[i];
        if (!node) continue;
        const exact = current.title.slots[i];
        if (node.textContent !== exact) {
          node.textContent = exact;
        }
        delete node.dataset.resolved;
      }

      for (let i = 0; i < current.description.slots.length; i += 1) {
        const node = descriptionGlyphNodesRef.current[i];
        if (!node) continue;
        const exact = current.description.slots[i];
        if (node.textContent !== exact) {
          node.textContent = exact;
        }
        delete node.dataset.resolved;
      }
    }

    const liveEl = liveRef.current;
    if (liveEl) {
      liveEl.dataset.scrambling = 'false';
    }
  }, [collectGlyphNodes]);

  const stopAndSettle = useCallback(() => {
    animationGenerationRef.current += 1;
    if (animationRef.current) {
      animationRef.current.stop();
      animationRef.current = null;
    }
    settleExactText();
  }, [settleExactText]);

  // Read semantic motion durations from CSS tokens once on mount
  useIsomorphicLayoutEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;
    timingRef.current = readHeroTimingFromCss(rootEl);
  }, []);

  // Observe whether the hero messages stage is within the viewport
  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const latest = entries[entries.length - 1];
        if (!latest) return;
        setIsInView(latest.isIntersecting);
        if (!latest.isIntersecting || !stageEl.matches(':hover')) {
          setIsHoverPaused((prev) => (prev && !stageEl.matches(':hover') ? false : prev));
        }
      },
      { threshold: 0 }
    );

    observer.observe(stageEl);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Clear stale hover state if the pointer moved away while the tab was hidden
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleVisibilityReconcile = () => {
      if (document.visibilityState === 'visible') {
        const stageEl = stageRef.current;
        if (!stageEl || !stageEl.matches(':hover')) {
          setIsHoverPaused(false);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityReconcile);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityReconcile);
    };
  }, []);

  // Immediately settle any in-progress scramble if reduced motion activates live
  useEffect(() => {
    if (prefersReducedMotion) {
      stopAndSettle();
    }
  }, [prefersReducedMotion, stopAndSettle]);

  // Drive exact 3500ms start-to-start rotation while active; suspend cleanly on hover/offscreen/hidden
  useEffect(() => {
    if (!playback.canRotate) {
      clearRotationTimer();
      stopAndSettle();
      return;
    }

    let cancelled = false;
    const { intervalMs } = timingRef.current;
    let nextDueAt = performance.now() + intervalMs;

    const scheduleNext = () => {
      clearRotationTimer();
      const delay = Math.max(0, nextDueAt - performance.now());
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        if (cancelled) return;

        const now = performance.now();
        setRotation((prev) => ({
          activeIndex: getNextMessageIndex(prev.activeIndex, messageCount),
          transitionId: prev.transitionId + 1,
        }));

        // Preserve start-to-start cadence while preventing catch-up bursts after OS/tab throttling
        nextDueAt =
          now - nextDueAt > intervalMs * 0.5 ? now + intervalMs : nextDueAt + intervalMs;
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      clearRotationTimer();
    };
  }, [playback.canRotate, messageCount, clearRotationTimer, stopAndSettle]);

  // Trigger Motion-driven scramble when activeIndex advances after mount
  useIsomorphicLayoutEffect(() => {
    collectGlyphNodes();

    if (rotation.transitionId === 0 || !activeTokenized) {
      return;
    }

    stopAndSettle();

    if (!playbackRef.current.shouldScramble) {
      return;
    }

    const liveEl = liveRef.current;
    if (!liveEl) return;

    const { scrambleDurationMs, scrambleStepMs } = timingRef.current;
    const generation = animationGenerationRef.current;
    const titleSlots = activeTokenized.title.slots;
    const descriptionSlots = activeTokenized.description.slots;
    const titleNodes = titleGlyphNodesRef.current;
    const descriptionNodes = descriptionGlyphNodesRef.current;
    const titleSeed = rotation.transitionId * 131 + safeIndex * 17 + 1;
    const descSeed = rotation.transitionId * 197 + safeIndex * 31 + 7;

    const applyFrame = (progress: number) => {
      if (animationGenerationRef.current !== generation) return;
      const step = Math.floor((progress * scrambleDurationMs) / scrambleStepMs);

      for (let i = 0; i < titleSlots.length; i += 1) {
        const node = titleNodes[i];
        if (!node) continue;
        const result = resolveScrambleGlyph({
          targetGrapheme: titleSlots[i],
          slotIndex: i,
          totalSlots: titleSlots.length,
          progress,
          step,
          seed: titleSeed,
        });
        if (node.textContent !== result.glyph) {
          node.textContent = result.glyph;
        }
        const resolvedFlag = result.resolved ? 'true' : 'false';
        if (node.dataset.resolved !== resolvedFlag) {
          node.dataset.resolved = resolvedFlag;
        }
      }

      for (let i = 0; i < descriptionSlots.length; i += 1) {
        const node = descriptionNodes[i];
        if (!node) continue;
        const result = resolveScrambleGlyph({
          targetGrapheme: descriptionSlots[i],
          slotIndex: i,
          totalSlots: descriptionSlots.length,
          progress,
          step,
          seed: descSeed,
        });
        if (node.textContent !== result.glyph) {
          node.textContent = result.glyph;
        }
        const resolvedFlag = result.resolved ? 'true' : 'false';
        if (node.dataset.resolved !== resolvedFlag) {
          node.dataset.resolved = resolvedFlag;
        }
      }
    };

    // Paint initial scrambled state synchronously before first frame to avoid resolved flash
    liveEl.dataset.scrambling = 'true';
    applyFrame(0);

    const controls = animate(0, 1, {
      duration: scrambleDurationMs / 1000,
      ease: 'linear',
      onUpdate: (latest) => {
        applyFrame(latest);
      },
      onComplete: () => {
        if (animationGenerationRef.current !== generation) return;
        animationRef.current = null;
        settleExactText();
      },
    });

    animationRef.current = controls;

    return () => {
      if (animationGenerationRef.current === generation) {
        animationGenerationRef.current += 1;
        controls.stop();
        if (animationRef.current === controls) {
          animationRef.current = null;
        }
      }
    };
  }, [
    rotation.transitionId,
    safeIndex,
    activeTokenized,
    collectGlyphNodes,
    stopAndSettle,
    settleExactText,
  ]);

  // Final cleanup on unmount / route transitions
  useEffect(() => {
    return () => {
      clearRotationTimer();
      animationGenerationRef.current += 1;
      animationRef.current?.stop();
      animationRef.current = null;
    };
  }, [clearRotationTimer]);

  const handleStagePointerDown = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      lastTouchTimeRef.current = performance.now();
      setIsHoverPaused(false);
    }
  }, []);

  const handleStagePointerEnter = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'touch') {
        lastTouchTimeRef.current = performance.now();
        return;
      }

      const timeSinceLastTouchMs = performance.now() - lastTouchTimeRef.current;
      if (
        !shouldPauseForPointerHover({
          pointerType: event.pointerType,
          timeSinceLastTouchMs,
        })
      ) {
        return;
      }

      clearRotationTimer();
      stopAndSettle();
      setIsHoverPaused(true);
    },
    [clearRotationTimer, stopAndSettle]
  );

  const handleStagePointerLeave = useCallback((event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') {
      lastTouchTimeRef.current = performance.now();
    }
    setIsHoverPaused(false);
  }, []);

  const handleStagePointerCancel = useCallback(() => {
    setIsHoverPaused(false);
  }, []);

  if (!activeMessage || !activeTokenized) {
    return null;
  }

  return (
    <div
      ref={rootRef}
      className={clsx(styles.messagesRoot, className)}
      data-hero-messages="true"
      data-message-index={safeIndex}
      data-playback={playback.status}
      data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
      {...rest}
    >
      {/* Complete accessible text for assistive technologies (never scrambled, no live spam) */}
      <div className={styles.srOnly} aria-live="off" data-hero-messages-accessible="true">
        <p>{activeMessage.title}</p>
        <p>{activeMessage.description}</p>
      </div>

      <div
        ref={stageRef}
        className={styles.messageStage}
        data-hero-message-stage="true"
        onPointerDown={handleStagePointerDown}
        onPointerEnter={handleStagePointerEnter}
        onPointerLeave={handleStagePointerLeave}
        onPointerCancel={handleStagePointerCancel}
      >
        {/* Hidden responsive measurement copies reserve the exact height of the tallest item */}
        {messages.map((message) => (
          <div
            key={`measure-${message.id}`}
            className={styles.measureCopy}
            aria-hidden="true"
            data-hero-message-measure="true"
          >
            <p className={styles.messageTitle}>{message.title}</p>
            <p className={styles.messageDescription}>{message.description}</p>
          </div>
        ))}

        {/* Visible decorative presentation layer (exact SSR first item, ref-driven scramble) */}
        <div
          ref={liveRef}
          key={activeMessage.id}
          className={styles.messageLive}
          aria-hidden="true"
          data-hero-message-live="true"
          data-scrambling="false"
        >
          <p
            ref={titleLineRef}
            className={styles.messageTitle}
            data-hero-message-title="true"
          >
            <ScrambleLine tokenized={activeTokenized.title} />
          </p>
          <p
            ref={descriptionLineRef}
            className={styles.messageDescription}
            data-hero-message-description="true"
          >
            <ScrambleLine tokenized={activeTokenized.description} />
          </p>
        </div>
      </div>
    </div>
  );
}
