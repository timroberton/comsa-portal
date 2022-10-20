
export enum UIColor {
    Blue,
    Green,
    Gray,
    Red,
    Orange,
    LightGray,
    Purple,
}

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

type UIButtonProps = {
    label: string | React.ReactNode,
    icon?: (props: React.ComponentProps<'svg'>) => JSX.Element,
    onClick?: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
    color?: UIColor,
    size?: UIButtonSize,
    type?: UIButtonType,
    form?: string,
    marginLeft?: boolean,
    marginRight?: boolean,
    disabled?: boolean,
};

function btnColor(v?: UIColor): string {
    switch (v) {
        case UIColor.Blue:
            return "ui-btn-blue";
        case UIColor.Green:
            return "ui-btn-green";
        case UIColor.Red:
            return "ui-btn-red";
        case UIColor.Orange:
            return "ui-btn-orange";
        case UIColor.Gray:
            return "ui-btn-gray";
        case UIColor.Purple:
            return "ui-btn-purple";
        case UIColor.LightGray:
            return "ui-btn-lightgray";
        default:
            return btnColor(UIColor.LightGray);
    }
}

export enum UIButtonSize {
    Small = "small",
    Medium = "medium",
    Large = "large",
}

export enum UIButtonType {
    Submit = "submit",
}


function btnSizing(v?: UIButtonSize): string {
    switch (v) {
        case UIButtonSize.Small:
            return "ui-btn-small";
        case UIButtonSize.Medium:
            return "ui-btn-medium";
        case UIButtonSize.Large:
            return "ui-btn-large";
        default:
            return btnSizing(UIButtonSize.Medium);
    }
}

function iconSizing(v?: UIButtonSize): string {
    switch (v) {
        case UIButtonSize.Small:
            return "-ml-0.5 mr-2 h-4 w-4";
        case UIButtonSize.Medium:
            return "-ml-1 mr-2 h-5 w-5";
        case UIButtonSize.Large:
            return "-ml-1 mr-3 h-5 w-5";
        default:
            return iconSizing(UIButtonSize.Medium);
    }
}

export const UIButton: React.FC<UIButtonProps> = (p) => {
    const c = `${p.disabled ? "pointer-events-none" : ""} ${btnSizing(p.size)} ${btnColor(p.color)} ${p.marginLeft ? "ui-margin-left" : "ml-0"} ${p.marginRight ? "ui-margin-right" : "mr-0"}`.replace(/\s+/g, ' ').trim();
    return <button
        className={c}
        type={p.type || "button"}
        form={p.form}
        onClick={p.onClick}
        disabled={p.disabled}
    >
        {p.icon
            ? <><p.icon className={iconSizing(p.size)} /> {p.label}</>
            : p.label
        }
    </button>;
};

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

type UIIconButtonProps = {
    icon: (props: React.ComponentProps<'svg'>) => JSX.Element,
    onClick?: (evt: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void,
    color?: UIColor,
    size?: UIButtonSize,
    marginLeft?: boolean,
    marginRight?: boolean,
};

function iconbtnSizing(v?: UIButtonSize): string {
    switch (v) {
        case UIButtonSize.Small:
            return "ui-iconbtn-small";
        case UIButtonSize.Medium:
            return "ui-iconbtn-medium";
        case UIButtonSize.Large:
            return "ui-iconbtn-large";
        default:
            return iconbtnSizing(UIButtonSize.Medium);
    }
}

function iconbtnDims(v?: UIButtonSize): string {
    switch (v) {
        case UIButtonSize.Small:
            return "1rem";
        case UIButtonSize.Medium:
            return "1.25rem";
        case UIButtonSize.Large:
            return "1.5rem";
        default:
            return iconbtnDims(UIButtonSize.Medium);
    }
}

export const UIIconButton: React.FC<UIIconButtonProps> = (p) => {
    const c = `${iconbtnSizing(p.size)} ${btnColor(p.color)} ${p.marginLeft ? "ui-margin-left" : "ml-0"} ${p.marginRight ? "ui-margin-right" : "mr-0"}`.replace(/\s+/g, ' ').trim();
    return <button
        className={c}
        type="button"
        onClick={p.onClick}
    >
        <p.icon className="" style={{ height: iconbtnDims(p.size), width: iconbtnDims(p.size) }} />
    </button>;
};

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

type UISelectProps = {
    value: string | number,
    onChange: (val: string | number) => void,
    options: { value: string | number, text: string }[],
    marginLeft?: boolean,
    marginRight?: boolean,
    fluid?: boolean,
    disabled?: boolean,
    purple?: boolean,
};

export const UISelect: React.FC<UISelectProps> = (p) => {
    const c = `${p.purple ? "ui-select-purple" : "ui-select"} ${p.marginLeft ? "ui-margin-left" : "ml-0"} ${p.marginRight ? "ui-margin-right" : "mr-0"}`;
    return <select
        className={c}
        value={p.value}
        onChange={e => p.onChange(e.target.value)}
        disabled={p.disabled}
    >
        {p.options.map(a => {
            return <option key={a.value} value={a.value}>{a.text}</option>;
        })}
    </select>;
};

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

type UIInputProps = {
    value: string,
    type?: UIInputType,
    onChange: (val: string) => void,
    autoFocus?: boolean,
    rightAlign?: boolean,
    marginLeft?: boolean,
    marginRight?: boolean,
    disabled?: boolean,
    purple?: boolean,
};

export enum UIInputType {
    text = "text",
    email = "email",
    password = "password",
    number = "number",
}

export const UIInput: React.FC<UIInputProps> = (p) => {
    const c = `${p.purple ? "ui-input-purple" : "ui-input"} ${p.marginLeft ? "ui-margin-left" : "ml-0"} ${p.marginRight ? "ui-margin-right" : "mr-0"}`;
    return <input
        className={c}
        type={p.type || UIInputType.text}
        value={p.value}
        onChange={e => p.onChange(e.target.value)}
        autoFocus={p.autoFocus}
        disabled={p.disabled}
    />;
};

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

type UICheckboxProps = {
    rootId: string,
    label: string,
    checked: boolean,
    onChange: (checked: boolean) => void,
    radio?: boolean,
    inline?: boolean,
};

export const UICheckbox: React.FC<UICheckboxProps> = (p) => {
    const c = `${p.inline ? "inline-flex mr-6" : "flex"} items-center align-bottom justify-start`;
    return <div
        className={c}
    >
        <input
            id={p.rootId}
            type={p.radio ? "radio" : "checkbox"}
            className={p.radio ? "ui-radio-icon" : "ui-checkbox-icon"}
            checked={p.checked}
            onChange={e => p.onChange(e.target.checked)}
        />
        <label
            htmlFor={p.rootId}
            className="ui-checkbox-label"
        >{p.label}</label>
    </div>;
};

///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////

export type SpinnerProps = {
    size?: number,
}

export const Spinner: React.FC<SpinnerProps> = (p) => {
    return <svg className={`inline-block ${getHWStr(p.size)} animate-spin text-green-600`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>;
}

function getHWStr(size?: number): string {
    switch (size) {
        case undefined:
            return "w-12 h-12";
        case 6:
            return "w-6 h-6";
        case 8:
            return "w-8 h-8";
        case 10:
            return "w-10 h-10";
        case 12:
            return "w-12 h-12";
        case 16:
            return "w-16 h-16";
        case 24:
            return "w-24 h-24";
        default:
            return "w-6 h-6";
    }
}