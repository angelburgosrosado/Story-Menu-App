import { useState, useEffect, useRef } from 'react';

export function useScrollReveal(options = {}) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<any>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, ...options });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) observer.unobserve(ref.current);
        };
    }, [options]);

    return [ref, isVisible];
}
