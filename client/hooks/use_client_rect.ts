import { useCallback, useEffect, useState } from "react";

export function useClientRect() {
    const [rect, setRect] = useState<ClientRect | null>(null);
    const [div, setDiv] = useState<HTMLDivElement | null>(null);

    const ref = useCallback((div: HTMLDivElement) => {
        if (div !== null) {
            setRect(div.getBoundingClientRect());
            setDiv(div);
        }
    }, []);

    useEffect(() => {
        function resize() {
            if (div !== null) {
                setRect(div.getBoundingClientRect());
            }
        }
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, [div]);

    return { rect, ref };
}
