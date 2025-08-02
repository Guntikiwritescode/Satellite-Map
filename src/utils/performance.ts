// Performance optimization utilities

/**
 * Throttle function to limit function calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return (...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

/**
 * Debounce function to delay function calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Chunk array into smaller batches for processing
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Async batch processor with yield control
 */
export const processBatch = async <T, R>(
  items: T[],
  processor: (item: T) => R | Promise<R>,
  batchSize = 50,
  delay = 0
): Promise<R[]> => {
  const results: R[] = [];
  const chunks = chunkArray(items, batchSize);

  for (const chunk of chunks) {
    const batchResults = await Promise.all(chunk.map(processor));
    results.push(...batchResults);
    
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
};

/**
 * Memory-efficient object pool for reusing objects
 */
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void, initialSize = 10) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

/**
 * Check if device has limited performance capabilities
 */
export const isLowPerformanceDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  
  // Check for slow connection
  if (connection && connection.effectiveType) {
    if (['slow-2g', '2g'].includes(connection.effectiveType)) {
      return true;
    }
  }

  // Check for limited memory
  if ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 4) {
    return true;
  }

  // Check CPU cores
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
    return true;
  }

  return false;
};

/**
 * Adaptive performance settings based on device capabilities
 */
export const getPerformanceSettings = () => {
  const isLowPerf = isLowPerformanceDevice();
  
  return {
    maxSatellites: isLowPerf ? 250 : 500,
    updateInterval: isLowPerf ? 20000 : 15000, // ms
    batchSize: isLowPerf ? 25 : 50,
    enableAnimations: !isLowPerf,
    preloadComponents: !isLowPerf
  };
};