export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

export interface PinchGesture {
  scale: number;
  center: { x: number; y: number };
  velocity: number;
}

export interface TouchGestureOptions {
  threshold?: number;
  velocity?: number;
  timeout?: number;
  preventDefault?: boolean;
}

export class TouchGestures {
  private static instance: TouchGestures;
  private touchStart: TouchPoint | null = null;
  private touchEnd: TouchPoint | null = null;
  private touchMove: TouchPoint | null = null;
  private lastTouch: TouchPoint | null = null;
  private gestureStartTime: number = 0;
  private isGestureActive: boolean = false;

  private constructor() {
    this.initializeTouchHandlers();
  }

  public static getInstance(): TouchGestures {
    if (!TouchGestures.instance) {
      TouchGestures.instance = new TouchGestures();
    }
    return TouchGestures.instance;
  }

  private initializeTouchHandlers() {
    if (typeof window === 'undefined') return;

    document.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
  }

  private handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.touchStart = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };
      this.gestureStartTime = Date.now();
      this.isGestureActive = true;
    }
  }

  private handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 1 && this.touchStart) {
      const touch = event.touches[0];
      this.touchMove = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    if (event.changedTouches.length === 1 && this.touchStart) {
      const touch = event.changedTouches[0];
      this.touchEnd = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      this.processGesture();
      this.resetGesture();
    }
  }

  private processGesture() {
    if (!this.touchStart || !this.touchEnd) return;

    const deltaX = this.touchEnd.x - this.touchStart.x;
    const deltaY = this.touchEnd.y - this.touchStart.y;
    const deltaTime = this.touchEnd.timestamp - this.touchStart.timestamp;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Determine gesture type
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.triggerSwipeEvent('right', distance, velocity);
      } else {
        this.triggerSwipeEvent('left', distance, velocity);
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.triggerSwipeEvent('down', distance, velocity);
      } else {
        this.triggerSwipeEvent('up', distance, velocity);
      }
    }

    // Check for tap
    if (distance < 10 && deltaTime < 300) {
      this.triggerTapEvent();
    }

    // Check for long press
    if (deltaTime > 500 && distance < 10) {
      this.triggerLongPressEvent();
    }
  }

  private triggerSwipeEvent(
    direction: 'left' | 'right' | 'up' | 'down',
    distance: number,
    velocity: number
  ) {
    const swipeEvent = new CustomEvent('swipe', {
      detail: {
        direction,
        distance,
        velocity,
        start: this.touchStart,
        end: this.touchEnd,
      },
    });
    document.dispatchEvent(swipeEvent);
  }

  private triggerTapEvent() {
    const tapEvent = new CustomEvent('tap', {
      detail: {
        x: this.touchStart?.x || 0,
        y: this.touchStart?.y || 0,
        timestamp: this.touchStart?.timestamp || 0,
      },
    });
    document.dispatchEvent(tapEvent);
  }

  private triggerLongPressEvent() {
    const longPressEvent = new CustomEvent('longpress', {
      detail: {
        x: this.touchStart?.x || 0,
        y: this.touchStart?.y || 0,
        timestamp: this.touchStart?.timestamp || 0,
        duration: this.touchEnd?.timestamp - this.touchStart?.timestamp || 0,
      },
    });
    document.dispatchEvent(longPressEvent);
  }

  private resetGesture() {
    this.touchStart = null;
    this.touchEnd = null;
    this.touchMove = null;
    this.isGestureActive = false;
  }

  public addSwipeListener(
    callback: (
      direction: 'left' | 'right' | 'up' | 'down',
      distance: number,
      velocity: number
    ) => void,
    options: TouchGestureOptions = {}
  ) {
    const { threshold = 50, velocity = 0.3 } = options;

    const listener = (event: CustomEvent) => {
      const { direction, distance, velocity: gestureVelocity } = event.detail;

      if (distance >= threshold && gestureVelocity >= velocity) {
        callback(direction, distance, gestureVelocity);
      }
    };

    document.addEventListener('swipe', listener as EventListener);

    return () => {
      document.removeEventListener('swipe', listener as EventListener);
    };
  }

  public addTapListener(
    callback: (x: number, y: number) => void,
    options: TouchGestureOptions = {}
  ) {
    const listener = (event: CustomEvent) => {
      const { x, y } = event.detail;
      callback(x, y);
    };

    document.addEventListener('tap', listener as EventListener);

    return () => {
      document.removeEventListener('tap', listener as EventListener);
    };
  }

  public addLongPressListener(
    callback: (x: number, y: number, duration: number) => void,
    options: TouchGestureOptions = {}
  ) {
    const listener = (event: CustomEvent) => {
      const { x, y, duration } = event.detail;
      callback(x, y, duration);
    };

    document.addEventListener('longpress', listener as EventListener);

    return () => {
      document.removeEventListener('longpress', listener as EventListener);
    };
  }

  public addPinchListener(
    callback: (scale: number, center: { x: number; y: number }) => void,
    options: TouchGestureOptions = {}
  ) {
    let initialDistance: number | null = null;
    let initialScale: number = 1;

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        initialDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = 1;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2 && initialDistance) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        const scale = currentDistance / initialDistance;
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        callback(scale, center);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }

  public addPullToRefreshListener(
    callback: () => void,
    options: TouchGestureOptions = {}
  ) {
    const { threshold = 100 } = options;
    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (event: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = event.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (isPulling) {
        currentY = event.touches[0].clientY;
        const pullDistance = currentY - startY;

        if (pullDistance > threshold) {
          callback();
          isPulling = false;
        }
      }
    };

    const handleTouchEnd = () => {
      isPulling = false;
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }

  public destroy() {
    // Remove all event listeners
    document.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
}
