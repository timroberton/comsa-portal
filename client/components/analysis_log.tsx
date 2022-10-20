import { useClientRect } from '../hooks/use_client_rect';
import { FixedSizeList } from 'react-window';
import { useRef, useEffect, MutableRefObject } from 'react';
//@ts-ignore
import colors from 'tailwindcss/colors';
import { LogCode } from '../types';

type AnalysisLogProps = {
    show: boolean,
    logCount: number, // This updates the virtualized window
    logAsStaticArrayRef: MutableRefObject<{ text: string, code: LogCode }[]>,
};

export const AnalysisLog: React.FC<AnalysisLogProps> = (p) => {

    const { rect, ref } = useClientRect();
    const listRef = useRef<FixedSizeList<string> | null>(null);
    const listBodyRef = useRef<HTMLDivElement>();
    const wasListAtBottom = useRef(true);

    useEffect(() => {
        if (p.logCount <= 1) {
            wasListAtBottom.current = true;
        }
        if (listRef.current && listBodyRef.current && wasListAtBottom.current && !isListAtBottom(listBodyRef.current)) {
            listRef.current.scrollToItem(p.logCount - 1);
        }
    }, [p.logCount]);

    function updateScrolledState() {
        requestAnimationFrame(() => { // Measure async, once the scroll has actually happened
            if (listBodyRef.current) {
                wasListAtBottom.current = isListAtBottom(listBodyRef.current);
            }
        });
    }

    return <div className="w-full h-full font-mono text-xs leading-none text-white whitespace-pre bg-gray-700 select-text" ref={ref} style={{
        opacity: p.show ? 1 : 0,
    }}>
        {(rect && rect.width && rect.height) &&
            <FixedSizeList
                width={rect.width}
                height={rect.height}
                itemCount={p.logCount}
                itemSize={20}
                ref={listRef}
                innerRef={listBodyRef}
                onScroll={updateScrolledState}
            >
                {({ index, style }) => {
                    const item = p.logAsStaticArrayRef.current[index];
                    return <div
                        key={index}
                        style={{
                            ...style,
                            lineHeight: "20px",
                            color: colorForCode(item.code),
                        }}
                        className="px-2 py-0 m-0 select-text"
                    >
                        {item.text}
                    </div>;
                }}
            </FixedSizeList>
        }
    </div>;

};

const _SCROLL_BOTTOM_MARGIN = 5;

function isListAtBottom(bodyRefElement: HTMLDivElement) {
    const listWindow = bodyRefElement.parentElement;
    if (!listWindow) {
        return true; // This means no rows, so we are effectively at the bottom
    } else {
        return (listWindow.scrollTop + _SCROLL_BOTTOM_MARGIN) >= (listWindow.scrollHeight - listWindow.offsetHeight);
    }
}
function colorForCode(code: LogCode): string {
    switch (code) {
        case LogCode.Out:
            return colors.white;
        case LogCode.Err:
            return colors.red[400];
        case LogCode.StatusUpdate:
            return colors.blue[300];
        case LogCode.Waiting:
            return colors.purple[300];
        default:
            return colors.white;
    }
}