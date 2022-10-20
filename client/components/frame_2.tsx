type Frame2Props = {
    filterControls: React.ReactNode,
};

export const Frame2: React.FC<Frame2Props> = (p) => {
    return <div className="flex w-full h-full space-x-2 xl:space-x-4">
        <div className="sticky w-48 h-full bg-white xl:w-64 top-6">
            {p.filterControls}
        </div>
        <ul className="flex-1 w-0 h-full px-6 py-2 overflow-hidden bg-white">
            {p.children}
        </ul>
    </div>;
};
