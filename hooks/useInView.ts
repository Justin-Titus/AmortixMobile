import { useEffect, useState, RefObject } from 'react';
import { View, Dimensions } from 'react-native';

/**
 * Custom hook to detect when a React Native View enters the viewport.
 * Uses measureInWindow polling which is self-contained and clears as soon as the element is visible.
 *
 * @param ref RefObject pointing to the View to measure
 * @param threshold Fraction (0 to 1) of the component that must be visible to trigger
 * @returns boolean indicating if the view is in viewport
 */
export function useInView(ref: RefObject<View | null>, threshold = 0.05) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (isInView) return;

    let intervalId: NodeJS.Timeout;
    let isActive = true;

    const checkVisibility = () => {
      if (!ref.current || !isActive) return;

      ref.current.measureInWindow((x, y, width, height) => {
        if (!isActive) return;

        // If layout is not yet complete (dimensions are 0 or negative), ignore this check
        if (width <= 0 || height <= 0) return;

        const { height: windowHeight } = Dimensions.get('window');

        // Calculate overlap with viewport vertically
        const visibleHeight = Math.max(
          0,
          Math.min(y + height, windowHeight) - Math.max(y, 0)
        );
        const percentageVisible = visibleHeight / height;

        if (percentageVisible >= threshold) {
          setIsInView(true);
          clearInterval(intervalId);
        }
      });
    };

    // First check after a short timeout to let initial layout settle
    const timeoutId = setTimeout(checkVisibility, 100);

    // Poll periodically to catch scroll updates
    intervalId = setInterval(checkVisibility, 250);

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [ref, isInView, threshold]);

  return isInView;
}
