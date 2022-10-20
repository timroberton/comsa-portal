import { useRef } from 'react';

interface IModalProps {
	cancel: () => void,
	minWidth?: number,
}

export const Modal: React.FunctionComponent<IModalProps> = (p) => {

	let sourceDn = useRef<EventTarget | undefined>(undefined);
	let sourceUp = useRef<EventTarget | undefined>(undefined);

	return <div
		className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto text-svggray"
		style={{ background: "rgba(0,0,0,0.6)" }}
		onMouseDown={e => sourceDn.current = e.target}
		onMouseUp={e => sourceUp.current = e.target}
		onClick={e => {
			if (sourceDn.current === sourceUp.current && sourceUp.current === e.target) {
				p.cancel();
			}
		}}
	>
		<div
			className="relative px-6 py-6 bg-white ui-form-rounded"
			style={{ maxWidth: p.minWidth ? undefined : 600, width: p.minWidth }}
			onClick={e => e.stopPropagation()}
		>
			{p.children}
		</div>
	</div>;

};

type ModalErrorMessageProps = {
	msg: string | React.ReactNode,
}

export const ModalErrorMessage: React.FC<ModalErrorMessageProps> = (p) => {
	if (!p.msg) {
		return null;
	}
	return <div className="px-4 py-2 mt-4 text-red-500 bg-red-200 rounded">{p.msg}</div>;
}

export const ModalActions: React.FC<{}> = (p) => {
	return <div className="flex mt-4">{p.children}</div>;
}

