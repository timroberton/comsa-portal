import { useClientRect } from '../hooks/use_client_rect';
import AceEditor from 'react-ace';
import "ace-builds/src-noconflict/mode-r";
import "ace-builds/src-noconflict/mode-stata";
import "ace-builds/src-noconflict/theme-xcode";

type AnalysisCodeEditorProps = {
    value: string,
    onChange: (v: string) => void,
    canEdit: boolean,
    isStata: boolean,
};

const AnalysisCodeEditor: React.FC<AnalysisCodeEditorProps> = (p) => {

    const { rect, ref } = useClientRect();

    return <div className="w-full h-full" ref={ref}>
        {(rect && rect.width && rect.height) &&
            <AceEditor
                mode={p.isStata ? "stata" : "r"}
                theme="xcode"
                name="CODE_PANE_EDITOR_1"
                value={p.value}
                onChange={p.canEdit ? p.onChange : undefined}
                width={rect.width + "px"}
                height={rect.height + "px"}
                fontSize={13}
                highlightActiveLine={false}
                showPrintMargin={false}
                showGutter={true}
                setOptions={{
                    enableBasicAutocompletion: false,
                    enableLiveAutocompletion: false,
                    enableSnippets: false,
                    showLineNumbers: true,
                    tabSize: 4,
                    fontFamily: "Roboto Mono",
                }}
                readOnly={!p.canEdit}
            />
        }
    </div>;

};

export default AnalysisCodeEditor;